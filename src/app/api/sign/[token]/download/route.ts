// app/api/sign/[token]/download/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/database";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Find signer by signing token
    const signer = await prisma.signer.findUnique({
      where: { signingToken: token },
      include: {
        document: true,
      },
    });

    if (!signer) {
      return NextResponse.json(
        { error: "Invalid signing link" },
        { status: 404 }
      );
    }

    // Generate presigned URL for download with attachment disposition
    const key = signer.document.fileUrl.split(".amazonaws.com/")[1];
    if (!key) {
      return NextResponse.json({ error: "Invalid file URL" }, { status: 500 });
    }

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      ResponseContentType: "application/pdf",
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(
        signer.document.fileName
      )}"`,
    });

    const downloadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    return NextResponse.json({ downloadUrl });
  } catch (error) {
    console.error("Error generating download URL:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
