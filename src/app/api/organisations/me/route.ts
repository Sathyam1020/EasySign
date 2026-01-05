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
  const activeOrgFromCookie = cookieStore.get("active_org_id")?.value ?? null;
  const activeOrgExists =
    !!activeOrgFromCookie && orgs.some((org) => org.id === activeOrgFromCookie);

  let activeOrg = activeOrgFromCookie;

  // If the cookie is missing or points to a deleted workspace, pick a fallback
  if (!activeOrgExists) {
    activeOrg = orgs[0]?.id ?? null;

    if (activeOrg) {
      cookieStore.set("active_org_id", activeOrg, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
    } else {
      cookieStore.delete("active_org_id");
    }
  } else if (!activeOrg && orgs.length === 1) {
    // If no cookie exists but user only has one workspace, set it
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
