// app/api/documents/[id]/view-url/route.ts
import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getSession } from "@/lib/get-session";
import prisma from "@/lib/database";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ← params is now a Promise!
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ← MUST await params
  const { id: documentId } = await params;

  if (!documentId) {
    return NextResponse.json({ error: "Invalid document ID" }, { status: 400 });
  }

  try {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Basic access control
    if (document.createdBy !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Extract key from fileUrl
    const key = document.fileUrl.split(".amazonaws.com/")[1];
    if (!key) {
      return NextResponse.json({ error: "Invalid file URL" }, { status: 500 });
    }

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      ResponseContentType: "application/pdf",
      ResponseContentDisposition: `inline; filename="${encodeURIComponent(document.fileName)}"`,
    });

    const viewUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour

    return NextResponse.json({ viewUrl });
  } catch (error) {
    console.error("Presigned GET error:", error);
    return NextResponse.json({ error: "Failed to generate view URL" }, { status: 500 });
  }
}