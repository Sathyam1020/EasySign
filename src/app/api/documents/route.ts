// app/api/documents/route.ts
import prisma from "@/lib/database";
import { getSession } from "@/lib/get-session";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import z from "zod";

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
        {
          error:
            "Missing required fields: fileName, fileUrl, fileSize, key, activeOrgId",
        },
        { status: 400 }
      );
    }

    // 3. Verify active org exists (optional security)
    const org = await prisma.organization.findUnique({
      where: { id: activeOrgId },
    });
    if (!org || org.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Invalid organization access" },
        { status: 403 }
      );
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
        status: "draft",
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
    return NextResponse.json(
      { error: "Failed to save document" },
      { status: 500 }
    );
  }
}

// Validation schema
const searchSchema = z.object({
  query: z.string().optional().default(''),
  status: z.enum(['draft', 'pending', 'completed', 'all']).optional().default('all'),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'fileName']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export async function GET(request: NextRequest) {
  // Authorization check
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get active organization
    const cookieStore = await cookies();
    const activeOrgId = cookieStore.get("active_org_id")?.value;

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const rawParams = {
      query: searchParams.get('query') || undefined,
      status: searchParams.get('status') || undefined,
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined,
    };

    const validationResult = searchSchema.safeParse(rawParams);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid parameters',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const params = validationResult.data;

    // Build base where clause with authorization
    const whereClause: any = {
      OR: [
        { createdBy: session.user.id },
        { org: { members: { some: { userId: session.user.id } } } },
      ],
    };

    // Apply active organization filter
    if (activeOrgId) {
      whereClause.orgId = activeOrgId;
    }

    // Add search query filter
    if (params.query && params.query.trim() !== '') {
      whereClause.AND = [
        {
          OR: [
            { fileName: { contains: params.query, mode: 'insensitive' } },
            { subject: { contains: params.query, mode: 'insensitive' } },
            { message: { contains: params.query, mode: 'insensitive' } },
          ],
        },
      ];
    }

    // Add status filter
    if (params.status !== 'all') {
      whereClause.status = params.status;
    }

    // Calculate pagination
    const skip = (params.page - 1) * params.limit;

    // Execute queries in parallel
    const [documents, totalCount] = await Promise.all([
      prisma.document.findMany({
        where: whereClause,
        skip,
        take: params.limit,
        orderBy: {
          [params.sortBy]: params.sortOrder,
        },
        select: {
          id: true,
          fileName: true,
          fileUrl: true,
          fileSize: true,
          pageCount: true,
          status: true,
          subject: true,
          message: true,
          expiresAt: true,
          createdAt: true,
          updatedAt: true,
          orgId: true,
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          org: {
            select: {
              id: true,
              name: true,
            },
          },
          signers: {
            select: {
              id: true,
              email: true,
              name: true,
              status: true,
              signedAt: true,
              order: true,
            },
            orderBy: {
              order: 'asc',
            },
          },
          _count: {
            select: {
              signatureFields: true,
              audits: true,
            },
          },
        },
      }),
      prisma.document.count({ where: whereClause }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / params.limit);
    const hasNextPage = params.page < totalPages;
    const hasPreviousPage = params.page > 1;

    // Return response with pagination
    return NextResponse.json({
      documents,
      pagination: {
        currentPage: params.page,
        totalPages,
        totalCount,
        limit: params.limit,
        hasNextPage,
        hasPreviousPage,
      },
      filters: {
        query: params.query,
        status: params.status,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        activeOrgId,
      },
    });
  } catch (error) {
    console.error('Document fetch error:', error);

    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Invalid `prisma')) {
        return NextResponse.json(
          {
            error: 'Database query failed',
            message: 'Unable to fetch documents. Please try again.',
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch documents',
        message: 'An unexpected error occurred.',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}