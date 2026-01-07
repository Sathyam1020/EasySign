// app/api/documents/[id]/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/database";
import { getSession } from "@/lib/get-session";
import { Resend } from "resend";

type SendMode = "initial" | "stage";

function getBaseUrl(req: NextRequest) {
  return (
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    req.headers.get("origin") ||
    "http://localhost:3000"
  );
}

function getFromAddress() {
  const from = process.env.RESEND_FROM || process.env.EMAIL_FROM;
  // Fallback to Resend's test domain (must be verified in Resend dashboard)
  return from || "EasySign <onboarding@resend.dev>";
}

function buildSigningLink(baseUrl: string, token: string) {
  // Adjust to your actual signing route when implemented
  // e.g. `${baseUrl}/sign/${token}` or `${baseUrl}/sign?token=${token}`
  return `${baseUrl}/sign/${token}`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "RESEND_API_KEY not configured" },
        { status: 500 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: documentId } = await params;
    const body = await req.json().catch(() => ({}));
    const mode: SendMode = body?.mode === "stage" ? "stage" : "initial";

    // Fetch document + org membership for authorization
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        org: true,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Authorization: member of org or creator
    const orgMember = await prisma.organizationMember.findUnique({
      where: {
        orgId_userId: { orgId: document.orgId, userId: session.user.id },
      },
    });
    if (!orgMember && document.createdBy !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Load signers
    const signers = await prisma.signer.findMany({
      where: { documentId },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });

    if (signers.length === 0) {
      return NextResponse.json(
        { error: "No signers added to this document" },
        { status: 400 }
      );
    }

    // Determine ordering behavior
    const allZeroOrder = signers.every((s) => (s.order ?? 0) === 0);
    const hasAnyOrder = !allZeroOrder;

    let recipients = signers;
    if (hasAnyOrder) {
      // Send to the current stage only: lowest order value among pending signers
      const minOrder = Math.min(
        ...signers.filter((s) => s.status !== "signed").map((s) => s.order ?? 0)
      );
      recipients = signers.filter(
        (s) => (s.order ?? 0) === minOrder && s.status !== "signed"
      );
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "No eligible recipients to send at this stage" },
        { status: 400 }
      );
    }

    const baseUrl = getBaseUrl(req);
    const from = getFromAddress();

    // Prepare and send emails (one per recipient for personalization)
    const results = await Promise.all(
      recipients.map(async (signer) => {
        const url = buildSigningLink(baseUrl, signer.signingToken);
        const subject = document.subject || "Please sign the document";
        const previewText = document.message || "You've been invited to sign";

        // Basic HTML content; replace with a React template if desired
        const html = `
          <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#111">
            <h2>Hi ${signer.name || signer.email},</h2>
            <p>You have been invited to sign the document <strong>${
              document.fileName
            }</strong>.</p>
            ${document.message ? `<p>${document.message}</p>` : ""}
            <p>
              <a href="${url}" style="display:inline-block;background:#111;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Review & Sign</a>
            </p>
            <p style="font-size:12px;color:#666">If the button doesn't work, copy and paste this link into your browser:<br />
              <span style="word-break:break-all">${url}</span>
            </p>
          </div>
        `;

        const { data, error } = await resend.emails.send({
          from,
          to: signer.email,
          subject,
          html,
          // Optionally include custom headers/metadata
        });

        return { signerId: signer.id, email: signer.email, data, error };
      })
    );

    const failed = results.filter((r) => r.error);
    if (failed.length > 0) {
      // Log failures but still return partial success
      console.error(
        "Email send failures:",
        failed.map((f) => f.error)
      );
    }

    // If initial send from draft, move document to pending
    if (document.status === "draft") {
      await prisma.document.update({
        where: { id: documentId },
        data: { status: "pending" },
      });
    }

    // Record audit log
    await prisma.auditLog.create({
      data: {
        documentId,
        action: hasAnyOrder ? "send_invitations_stage" : "send_invitations_all",
        actorEmail: session.user.email || "unknown",
        ipAddress: req.headers.get("x-forwarded-for") || undefined,
        userAgent: req.headers.get("user-agent") || undefined,
      },
    });

    return NextResponse.json({
      sent: results.length - failed.length,
      failed: failed.map((f) => ({ email: f.email, error: f.error })),
      mode,
      ordering: hasAnyOrder ? "ordered" : "parallel",
    });
  } catch (error) {
    console.error("Error sending invitations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
