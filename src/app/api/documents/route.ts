// app/api/documents/route.ts
import prisma from "@/lib/database";
import { getSession } from "@/lib/get-session";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    // 1. Auth check
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse request (from frontend after S3 upload)
    const { fileName, fileUrl, fileSize, key, activeOrgId } = await req.json();

    if (!fileName || !fileUrl || !fileSize || !key || !activeOrgId) {
      return NextResponse.json(
        { error: "Missing required fields: fileName, fileUrl, fileSize, key, activeOrgId" },
        { status: 400 }
      );
    }

    // 3. Verify active org exists (optional security)
    const org = await prisma.organization.findUnique({
      where: { id: activeOrgId },
    });
    if (!org || (org.ownerId !== session.user.id)) {
      return NextResponse.json({ error: "Invalid organization access" }, { status: 403 });
    }

    // 4. Create document (matches YOUR schema exactly)
    const document = await prisma.document.create({
      data: {
        orgId: activeOrgId,
        createdBy: session.user.id,
        fileName,
        fileUrl,
        fileSize,
        trackingToken: randomUUID(),
        status: "pending", 
      },
    });

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        fileName: document.fileName,
        fileUrl: document.fileUrl,
        status: document.status,
        fileSize: document.fileSize,
        createdAt: document.createdAt,
      },
    });
  } catch (error) {
    console.error("Document save error:", error);
    return NextResponse.json({ error: "Failed to save document" }, { status: 500 });
  }
}

// Bonus: GET documents list
export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cookieStore = await cookies();
    const activeOrgId = cookieStore.get("active_org_id")?.value;

    const whereClause: any = {
      OR: [
        { createdBy: session.user.id },
        { org: { members: { some: { userId: session.user.id } } } },
      ],
    };

    if (activeOrgId) {
      whereClause.orgId = activeOrgId;
    }

    const documents = await prisma.document.findMany({
      where: whereClause,
      select: {
        id: true,
        fileName: true,
        fileUrl: true,
        status: true,
        createdAt: true,
        fileSize: true,
        orgId: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}