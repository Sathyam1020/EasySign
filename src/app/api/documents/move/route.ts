import prisma from "@/lib/database";
import { getSession } from "@/lib/get-session";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { documentIds, targetOrgId } = await req.json();

    if (!targetOrgId || typeof targetOrgId !== "string") {
      return NextResponse.json(
        { error: "targetOrgId is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json(
        { error: "documentIds must be a non-empty array" },
        { status: 400 }
      );
    }

    // Ensure user can access the target organization
    const targetOrg = await prisma.organization.findFirst({
      where: {
        id: targetOrgId,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } },
        ],
      },
      select: { id: true },
    });

    if (!targetOrg) {
      return NextResponse.json(
        { error: "You do not have access to that workspace" },
        { status: 403 }
      );
    }

    // Fetch documents the user can move
    const accessibleDocuments = await prisma.document.findMany({
      where: {
        id: { in: documentIds },
        OR: [
          { createdBy: session.user.id },
          { org: { ownerId: session.user.id } },
          { org: { members: { some: { userId: session.user.id } } } },
        ],
      },
      select: { id: true, orgId: true },
    });

    if (accessibleDocuments.length !== documentIds.length) {
      return NextResponse.json(
        { error: "One or more documents are not accessible" },
        { status: 404 }
      );
    }

    // Move documents in a transaction
    await prisma.$transaction(
      accessibleDocuments.map((doc) =>
        prisma.document.update({
          where: { id: doc.id },
          data: { orgId: targetOrgId },
        })
      )
    );

    return NextResponse.json({
      success: true,
      moved: accessibleDocuments.length,
      targetOrgId,
    });
  } catch (error) {
    console.error("Move documents error:", error);
    return NextResponse.json(
      { error: "Failed to move documents" },
      { status: 500 }
    );
  }
}
