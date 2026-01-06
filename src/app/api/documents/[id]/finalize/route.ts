// app/api/documents/[id]/finalize/route.ts
import prisma from "@/lib/database";
import { getSession } from "@/lib/get-session";
import { NextRequest, NextResponse } from "next/server";

// POST finalize document (move signers from draft to pending)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: documentId } = await params;

    // Verify document exists and user has access
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        org: true,
        signers: true,
        signatureFields: true,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const orgMember = await prisma.organizationMember.findUnique({
      where: {
        orgId_userId: {
          orgId: document.orgId,
          userId: session.user.id,
        },
      },
    });

    if (!orgMember && document.createdBy !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate that there are signers
    if (document.signers.length === 0) {
      return NextResponse.json(
        { error: "Document must have at least one signer" },
        { status: 400 }
      );
    }

    // Validate that each signer has at least one field
    for (const signer of document.signers) {
      const signerFields = document.signatureFields.filter(
        (f) => f.signerId === signer.id
      );
      if (signerFields.length === 0) {
        return NextResponse.json(
          {
            error: `Signer "${signer.name}" has no signature fields assigned`,
          },
          { status: 400 }
        );
      }
    }

    // Update document from draft to pending
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        status: "pending",
      },
    });

    // Log the finalization
    await prisma.auditLog.create({
      data: {
        documentId,
        action: "document_finalized",
        actorEmail: session.user.email || "unknown",
        ipAddress: req.headers.get("x-forwarded-for") || undefined,
        userAgent: req.headers.get("user-agent") || undefined,
      },
    });

    return NextResponse.json(
      {
        message: "Document finalized successfully",
        document: updatedDocument,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error finalizing document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
