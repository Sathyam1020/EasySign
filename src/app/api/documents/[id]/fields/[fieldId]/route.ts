// app/api/documents/[id]/fields/[fieldId]/route.ts
import prisma from "@/lib/database";
import { getSession } from "@/lib/get-session";
import { NextRequest, NextResponse } from "next/server";

// PATCH update signature field
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, fieldId } = await params;
    const documentId = id;
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

    // Verify field belongs to this document
    const field = await prisma.signatureField.findUnique({
      where: { id: fieldId },
    });

    if (!field || field.documentId !== documentId) {
      return NextResponse.json({ error: "Field not found" }, { status: 404 });
    }

    console.log(
      `[PATCH Field] Updating field ${fieldId} in document ${documentId}`
    );

    // Only allow updates if signer is still in draft mode
    const signer = await prisma.signer.findUnique({
      where: { id: field.signerId },
    });

    console.log(
      `[PATCH Field] Signer ${field.signerId} status: ${signer?.status}`
    );

    if (signer?.status !== "draft") {
      console.log(
        `[PATCH Field] Cannot update - signer status is "${signer?.status}", not "draft"`
      );
      return NextResponse.json(
        {
          error: "Cannot modify fields after document is finalized",
        },
        { status: 400 }
      );
    }

    console.log(
      `[PATCH Field] Proceeding with update. Body:`,
      JSON.stringify(body)
    );

    // Update the field (allow position, size, and styling updates)
    const updatedField = await prisma.signatureField.update({
      where: { id: fieldId },
      data: {
        ...(body.xPosition !== undefined && { xPosition: body.xPosition }),
        ...(body.yPosition !== undefined && { yPosition: body.yPosition }),
        ...(body.width !== undefined && { width: body.width }),
        ...(body.height !== undefined && { height: body.height }),
        ...(body.pageNumber !== undefined && { pageNumber: body.pageNumber }),
        ...(body.fontSize !== undefined && { fontSize: body.fontSize }),
        ...(body.fontFamily !== undefined && { fontFamily: body.fontFamily }),
        ...(body.color !== undefined && { color: body.color }),
        ...(body.alignment !== undefined && { alignment: body.alignment }),
        ...(body.placeholder !== undefined && {
          placeholder: body.placeholder,
        }),
        ...(body.required !== undefined && { required: body.required }),
      },
      include: {
        signer: {
          select: {
            id: true,
            email: true,
            name: true,
            status: true,
          },
        },
      },
    });

    console.log(`[PATCH Field] Successfully updated field ${fieldId}`);
    console.log(`[PATCH Field] Updated values:`, {
      xPosition: updatedField.xPosition,
      yPosition: updatedField.yPosition,
      width: updatedField.width,
      height: updatedField.height,
    });

    return NextResponse.json(updatedField);
  } catch (error) {
    console.error("Error updating field:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE signature field
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, fieldId } = await params;
    const documentId = id;

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

    // Verify field belongs to this document
    const field = await prisma.signatureField.findUnique({
      where: { id: fieldId },
    });

    if (!field || field.documentId !== documentId) {
      return NextResponse.json({ error: "Field not found" }, { status: 404 });
    }

    // Only allow deletion if signer is still in draft mode
    const signer = await prisma.signer.findUnique({
      where: { id: field.signerId },
    });

    if (signer?.status !== "draft") {
      return NextResponse.json(
        {
          error: "Cannot delete fields after document is finalized",
        },
        { status: 400 }
      );
    }

    // Delete the field
    await prisma.signatureField.delete({
      where: { id: fieldId },
    });

    return NextResponse.json(
      { message: "Field deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting field:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
