import prisma from "@/lib/database";
import { getSession } from "@/lib/get-session";
import { cookies } from "next/headers";
import { z } from "zod";

const BodySchema = z.object({
  name: z.string().min(2).max(60),
});

async function getActiveOrgId() {
  const cookieStore = await cookies();
  return cookieStore.get("active_org_id")?.value;
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const orgId = await getActiveOrgId();
  if (!orgId) return new Response("No active workspace", { status: 400 });

  try {
    const { name } = BodySchema.parse(await req.json());

    // only owner can rename
    const org = await prisma.organization.findFirst({
      where: { id: orgId, ownerId: session.user.id },
    });

    if (!org)
      return new Response("Not found or no permission", { status: 404 });

    const updated = await prisma.organization.update({
      where: { id: orgId },
      data: { name },
    });

    return Response.json({ org: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response("Invalid request body", { status: 400 });
    }
    throw error;
  }
}

export async function DELETE() {
  const session = await getSession();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const orgId = await getActiveOrgId();
  if (!orgId) return new Response("No active workspace", { status: 400 });

  // only owner can delete
  const org = await prisma.organization.findFirst({
    where: { id: orgId, ownerId: session.user.id },
  });

  if (!org) return new Response("Not found or no permission", { status: 404 });

  await prisma.organization.delete({
    where: { id: orgId },
  });

  // Re-point the active org cookie to another workspace (or clear it)
  const cookieStore = await cookies();
  const fallbackOrg = await prisma.organization.findFirst({
    where: { members: { some: { userId: session.user.id } } },
    orderBy: { createdAt: "desc" },
  });

  if (fallbackOrg) {
    cookieStore.set("active_org_id", fallbackOrg.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  } else {
    cookieStore.delete("active_org_id");
  }

  return Response.json({ success: true, activeOrg: fallbackOrg?.id ?? null });
}
