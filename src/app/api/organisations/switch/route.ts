import { cookies } from "next/headers";

export async function POST(req: Request) {
  const { orgId } = await req.json();
  console.log("SWITCH ORG REQUEST:", orgId);

  if (!orgId || typeof orgId !== "string") {
    console.warn("IGNORED INVALID SWITCH:", orgId);
    return new Response("Invalid org id", { status: 400 });
  }
  
  const cookieStore = await cookies();
  cookieStore.set("active_org_id", orgId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return Response.json({ ok: true });
}
