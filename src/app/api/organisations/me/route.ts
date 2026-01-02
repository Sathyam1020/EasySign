import prisma from "@/lib/database";
import { getSession } from "@/lib/get-session";
import { cookies } from "next/headers";

export async function GET() {
  const session = await getSession();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const orgs = await prisma.organization.findMany({
    where: {
      members: { some: { userId: session.user.id } },
    },
    select: { id: true, name: true },
    orderBy: {
      createdAt: "desc",
    },
  });

  const cookieStore = await cookies();
  let activeOrg = cookieStore.get("active_org_id")?.value ?? null;

  // NEVER override if cookie already exists
  // ONLY set if user literally has exactly ONE org and no cookie yet
  if (!activeOrg && orgs.length === 1) {
    activeOrg = orgs[0].id;

    cookieStore.set("active_org_id", activeOrg, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }

  return Response.json({
    orgs,
    activeOrg,
  });
}
