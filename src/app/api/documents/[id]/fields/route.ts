// app/api/documents/[id]/fields/route.ts
import prisma from "@/lib/database";
import { getSession } from "@/lib/get-session";
import { NextRequest, NextResponse } from "next/server";

// GET all fields for a document
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify user has access to this document
    const document = await prisma.document.findUnique({
      where: { id: id },
      include: { org: true },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Check if user is part of the organization
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

    // Get all fields for this document
    const fields = await prisma.signatureField.findMany({
      where: { documentId: id },
      include: {
        signer: {
          select: {
            id: true,
            email: true,
            name: true,
            status: true,
            order: true,
          },
        },
      },
      orderBy: [{ pageNumber: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(fields);
  } catch (error) {
    console.error("Error fetching fields:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST create new signature field
export async function POST(
  req: NextRequest,
   { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {id: documentId} = await  params; 
    const body = await req.json();

    const {
      signerId,
      pageNumber,
      xPosition,
      yPosition,
      width,
      height,
      fieldType,
      required,
      fontSize,
      fontFamily,
      color,
      alignment,
      placeholder,
    } = body;

    // Validate required fields
    if (
      !signerId ||
      pageNumber === undefined ||
      xPosition === undefined ||
      yPosition === undefined ||
      width === undefined ||
      height === undefined ||
      !fieldType
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify document exists and user has access
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
      return NextResponse.json({ error: "Invalid signer" }, { status: 400 });
    }

    // Create the signature field
    const field = await prisma.signatureField.create({
      data: {
        documentId,
        signerId,
        pageNumber,
        xPosition,
        yPosition,
        width,
        height,
        fieldType,
        required: required ?? true,
        fontSize: fontSize ?? 14,
        fontFamily: fontFamily ?? "Arial",
        color: color ?? "#000000",
        alignment: alignment ?? "left",
        placeholder: placeholder ?? undefined,
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

    return NextResponse.json(field, { status: 201 });
  } catch (error) {
    console.error("Error creating field:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
