// app/api/documents/[id]/signers/route.ts
import prisma from "@/lib/database";
import { getSession } from "@/lib/get-session";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

// GET all signers for a document
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

    // Get all signers for this document with their fields count
    const signers = await prisma.signer.findMany({
      where: { documentId: id },
      include: {
        signatureFields: {
          select: { id: true },
        },
      },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });

    // Format response with field counts
    const signersWithFieldCount = signers.map((signer) => ({
      ...signer,
      fieldCount: signer.signatureFields.length,
      signatureFields: undefined,
    }));

    return NextResponse.json(signersWithFieldCount);
  } catch (error) {
    console.error("Error fetching signers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST create new signer
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const { email, name, order } = body;

    // Validate required fields - also check they're not just whitespace
    if (!email?.trim() || !name?.trim()) {
      return NextResponse.json(
        { error: "Email and name are required and cannot be empty" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Verify document exists and user has access
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

    // Check if document is still in draft (signers can only be added to draft documents)
    const existingSigners = await prisma.signer.findMany({
      where: { id },
    });

    const hasPendingOrSignedSigners = existingSigners.some(
      (s) => s.status !== "draft"
    );

    if (hasPendingOrSignedSigners) {
      return NextResponse.json(
        {
          error:
            "Cannot add signers to finalized documents. Create a new draft document.",
        },
        { status: 400 }
      );
    }

    // Check if signer with same email already exists
    const existingSigner = await prisma.signer.findFirst({
      where: {
        documentId: id,
        email: email.toLowerCase(),
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

    // Create the signer with unique signing token
    const signingToken = randomUUID();
    const signer = await prisma.signer.create({
      data: {
        documentId: id,
        email: email.toLowerCase(),
        name,
        order: order ?? 0,
        status: "draft",
        signingToken,
      },
      include: {
        signatureFields: {
          select: { id: true },
        },
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        documentId: id,
        action: `signer_added`,
        actorEmail: session.user.email || "unknown",
        ipAddress: req.headers.get("x-forwarded-for") || undefined,
        userAgent: req.headers.get("user-agent") || undefined,
      },
    });

    return NextResponse.json(
      {
        id: signer.id,
        documentId: signer.documentId,
        email: signer.email,
        name: signer.name,
        order: signer.order,
        status: signer.status,
        signingToken: signer.signingToken,
        fieldCount: signer.signatureFields.length,
        createdAt: signer.createdAt,
        updatedAt: signer.updatedAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating signer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
