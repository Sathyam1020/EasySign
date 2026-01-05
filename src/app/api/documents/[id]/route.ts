import prisma from "@/lib/database";
import { cookies } from "next/headers";
import { getSession } from "@/lib/get-session";
import { s3 } from "@/lib/s3";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { z } from "zod";

async function getActiveOrgId() {
  const cookieStore = await cookies();
  return cookieStore.get("active_org_id")?.value;
}

const RenameSchema = z.object({
  fileName: z.string().min(1).max(255),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const activeOrg = await getActiveOrgId();
  const { id } = await params;
  const doc = await prisma.document.findFirst({
    where: {
      id: id,
      orgId: activeOrg,
    },
    select: {
      id: true,
      fileName: true,
      fileSize: true,
      status: true,
      createdAt: true,
      fileUrl: true,
    },
  });

  if (!doc) return new Response("Not found", { status: 404 });

  return Response.json(doc);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const activeOrg = await getActiveOrgId();
  if (!activeOrg) {
    return new Response("No active organization", { status: 400 });
  }

  try {
    const body = await req.json();
    const { fileName } = RenameSchema.parse(body);

    // ← MUST await params here
    const { id } = await params;

    if (!id) {
      return new Response("Invalid document ID", { status: 400 });
    }

    // Now safely use id
    const existing = await prisma.document.findFirst({
      where: {
        id,
        orgId: activeOrg,
        OR: [
          { createdBy: session.user.id },
          { org: { ownerId: session.user.id } },
          { org: { members: { some: { userId: session.user.id } } } },
        ],
      },
    });

    if (!existing) {
      return new Response("Document not found or access denied", {
        status: 404,
      });
    }

    const updated = await prisma.document.update({
      where: { id },
      data: { fileName },
    });

    return Response.json({ document: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ errors: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.error("Document rename error:", error);
    return new Response("Failed to rename document", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const activeOrg = await getActiveOrgId();
  if (!activeOrg)
    return new Response("No active organization", { status: 400 });

  const { id } = await params;

  const doc = await prisma.document.findFirst({
    where: {
      id: id,
      orgId: activeOrg,
      OR: [
        { createdBy: session.user.id },
        { org: { ownerId: session.user.id } },
        { org: { members: { some: { userId: session.user.id } } } },
      ],
    },
  });

  if (!doc) return new Response("Not found", { status: 404 });

  const bucket = process.env.AWS_S3_BUCKET;
  const key = (() => {
    try {
      const url = new URL(doc.fileUrl);
      return url.pathname.startsWith("/")
        ? url.pathname.slice(1)
        : url.pathname;
    } catch (e) {
      console.error("Failed to parse fileUrl", e);
      return null;
    }
  })();

  if (bucket && key) {
    try {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      );
    } catch (e) {
      console.error("Failed to delete S3 object", e);
      // Continue to delete DB record even if S3 delete fails
    }
  }

  await prisma.document.delete({ where: { id: doc.id } });

  return Response.json({ success: true });
}
