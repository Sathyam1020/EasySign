// app/api/documents/upload-url/route.ts
import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getSession } from "@/lib/get-session";
import { cookies } from "next/headers";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileName, fileSize, fileType } = await req.json();
    if (!fileName || !fileType || !fileSize) {
      return NextResponse.json({ error: "Missing file info" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const activeOrgId = cookieStore.get("active_org_id")?.value;
    if (!activeOrgId) {
      return NextResponse.json(
        { error: "No active organization" },
        { status: 400 }
      );
    }

    const rawFileName = fileName;
    const safeFileName = encodeURIComponent(rawFileName);
    // Generate unique S3 key
    const key = `documents/${activeOrgId}/${
      session.user.id
    }/${Date.now()}-${safeFileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      ContentType: fileType,
      Metadata: {
        uploadedBy: session.user.id,
        orgId: activeOrgId,
        fileSize: fileSize.toString(),
      },
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 600 }); // 10 min

    const fileUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return NextResponse.json({
      success: true,
      uploadUrl,
      key,
      fileUrl,
      activeOrgId,
    });
  } catch (error) {
    console.error("Presigned URL error:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
