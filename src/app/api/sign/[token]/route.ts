// app/api/sign/[token]/route.ts
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
        document: {
          include: {
            signatureFields: {
              where: { signerId: undefined }, // Will be filtered below
            },
          },
        },
      },
    });

    if (!signer) {
      return NextResponse.json(
        { error: "Invalid signing link" },
        { status: 404 }
      );
    }

    // Check if document is in pending status (ready for signing)
    if (signer.document.status !== "pending") {
      return NextResponse.json(
        { error: "This document is not available for signing" },
        { status: 400 }
      );
    }

    // Get signature fields for this specific signer
    const fields = await prisma.signatureField.findMany({
      where: {
        documentId: signer.documentId,
        signerId: signer.id,
      },
      orderBy: [{ pageNumber: "asc" }, { createdAt: "asc" }],
    });

    // Update signer status to 'seen' if still pending
    if (signer.status === "pending") {
      await prisma.signer.update({
        where: { id: signer.id },
        data: { status: "seen" },
      });

      // Log audit
      await prisma.auditLog.create({
        data: {
          documentId: signer.documentId,
          action: "document_viewed",
          actorEmail: signer.email,
          ipAddress: req.headers.get("x-forwarded-for") || undefined,
          userAgent: req.headers.get("user-agent") || undefined,
        },
      });
    }

    // Generate presigned URL for the PDF
    const key = signer.document.fileUrl.split(".amazonaws.com/")[1];
    if (!key) {
      return NextResponse.json({ error: "Invalid file URL" }, { status: 500 });
    }

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      ResponseContentType: "application/pdf",
      ResponseContentDisposition: `inline; filename="${encodeURIComponent(
        signer.document.fileName
      )}"`,
    });

    const viewUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return NextResponse.json({
      signer: {
        id: signer.id,
        name: signer.name,
        email: signer.email,
        status: signer.status === "pending" ? "seen" : signer.status,
      },
      document: {
        id: signer.document.id,
        fileName: signer.document.fileName,
        fileUrl: viewUrl,
        pageCount: signer.document.pageCount,
        subject: signer.document.subject,
        message: signer.document.message,
      },
      fields: fields.map((f) => ({
        id: f.id,
        pageNumber: f.pageNumber,
        x: f.xPosition,
        y: f.yPosition,
        width: f.width,
        height: f.height,
        fieldType: f.fieldType,
        fontSize: f.fontSize,
        value: f.value,
      })),
    });
  } catch (error) {
    console.error("Error fetching signing data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
