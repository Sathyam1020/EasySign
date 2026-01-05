// app/api/documents/[id]/signers/[signerId]/route.ts
import prisma from "@/lib/database";
import { getSession } from "@/lib/get-session";
import { NextRequest, NextResponse } from "next/server";

// PATCH update signer
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; signerId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: documentId, signerId } = await params;
    const body = await req.json();

    // Verify document access
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { org: true },
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

    // Verify signer belongs to this document
    const signer = await prisma.signer.findUnique({
      where: { id: signerId },
    });

    if (!signer || signer.documentId !== documentId) {
      return NextResponse.json({ error: "Signer not found" }, { status: 404 });
    }

    // Only allow updates if signer is in draft mode
    if (signer.status !== "draft") {
      return NextResponse.json(
        {
          error: "Cannot modify signer after document is finalized",
        },
        { status: 400 }
      );
    }

    // Check for email change conflicts
    if (body.email && body.email.toLowerCase() !== signer.email) {
      const existingSigner = await prisma.signer.findFirst({
        where: {
          documentId,
          email: body.email.toLowerCase(),
          NOT: { id: signerId },
        },
      });

      if (existingSigner) {
        return NextResponse.json(
          {
            error: "A signer with this email already exists for this document",
          },
          { status: 400 }
        );
      }
    }

    // Update the signer
    const updatedSigner = await prisma.signer.update({
      where: { id: signerId },
      data: {
        ...(body.email && { email: body.email.toLowerCase() }),
        ...(body.name && { name: body.name }),
        ...(body.order !== undefined && { order: body.order }),
      },
      include: {
        signatureFields: {
          select: { id: true },
        },
      },
    });

    return NextResponse.json({
      id: updatedSigner.id,
      documentId: updatedSigner.documentId,
      email: updatedSigner.email,
      name: updatedSigner.name,
      order: updatedSigner.order,
      status: updatedSigner.status,
      signingToken: updatedSigner.signingToken,
      fieldCount: updatedSigner.signatureFields.length,
      createdAt: updatedSigner.createdAt,
      updatedAt: updatedSigner.updatedAt,
    });
  } catch (error) {
    console.error("Error updating signer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE signer
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; signerId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: documentId, signerId } = await params;

    // Verify document access
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { org: true },
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

    // Verify signer belongs to this document
    const signer = await prisma.signer.findUnique({
      where: { id: signerId },
    });

    if (!signer || signer.documentId !== documentId) {
      return NextResponse.json({ error: "Signer not found" }, { status: 404 });
    }

    console.log(
      `[DELETE Signer] Signer found. ID: ${signerId}, Status: ${signer.status}`
    );

    // Only allow deletion if signer is in draft mode
    if (signer.status !== "draft") {
      console.log(
        `[DELETE Signer] Cannot delete - signer status is "${signer.status}", not "draft"`
      );
      return NextResponse.json(
        {
          error: "Cannot delete signer from finalized documents",
        },
        { status: 400 }
      );
    }

    console.log(
      `[DELETE Signer] Deleting signature fields for signer ${signerId}`
    );
    // Delete all signature fields for this signer (cascade)
    await prisma.signatureField.deleteMany({
      where: { signerId },
    });

    console.log(`[DELETE Signer] Deleting signer ${signerId}`);
    // Delete the signer
    await prisma.signer.delete({
      where: { id: signerId },
    });

    console.log(`[DELETE Signer] Successfully deleted signer ${signerId}`);

    // Log the action
    await prisma.auditLog.create({
      data: {
        documentId,
        action: `signer_deleted`,
        actorEmail: session.user.email || "unknown",
        ipAddress: req.headers.get("x-forwarded-for") || undefined,
        userAgent: req.headers.get("user-agent") || undefined,
      },
    });

    return NextResponse.json(
      { message: "Signer deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting signer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
