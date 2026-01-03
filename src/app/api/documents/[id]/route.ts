import prisma from "@/lib/database";
import { cookies } from "next/headers";
import { s3 } from "@/lib/s3";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const activeOrg = cookieStore.get("active_org_id")?.value;
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

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const cookieStore = await cookies();
  const activeOrg = cookieStore.get("active_org_id")?.value;

  const doc = await prisma.document.findFirst({
    where: { id: params.id, orgId: activeOrg },
  });

  if (!doc) return new Response("Not found", { status: 404 });

  await prisma.document.delete({ where: { id: params.id } });

  await s3.send(
    new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: doc.fileUrl,
    })
  );

  return Response.json({ ok: true });
}
