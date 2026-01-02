import prisma from "@/lib/database";
import { cookies } from "next/headers";
import { getSession } from "@/lib/get-session";

export async function GET() {
  const session = await getSession();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const cookieStore = await cookies();
  const activeOrg = cookieStore.get("active_org_id")?.value;

  if (!activeOrg) {
    return Response.json({ documents: [] });
  }

  const documents = await prisma.document.findMany({
    where: { orgId: activeOrg },
    select: {
      id: true,
      fileName: true,
      fileSize: true,
      status: true,
      createdAt: true,
      trackingToken: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ documents });
}
