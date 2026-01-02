import prisma from "@/lib/database"
import { getSession } from "@/lib/get-session"
import { cookies } from "next/headers"
import { z } from "zod"

const BodySchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name is too long"),
})

export async function POST(req: Request) {
  try {
    const session = await getSession()

    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 })
    }

    const json = await req.json()
    const { name } = BodySchema.parse(json)

    // prevent existing duplicate workspace
    const duplicate = await prisma.organization.findFirst({
      where: {
        name,
        members: { some: { userId: session.user.id } },
      },
    })

    if (duplicate) {
      return new Response(
        "You already have a workspace with this name",
        { status: 409 }
      )
    }

    // create new org + membership
    const org = await prisma.organization.create({
      data: {
        name,
        ownerId: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: "admin",
          },
        },
      },
    })

    // remember active workspace
    const cookieStore = await cookies(); 

    cookieStore.set("active_org_id", org.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    })

    return Response.json({ org })
  } catch (err: any) {
    console.error("ORG CREATE ERROR:", err)

    if (err?.name === "ZodError") {
      return new Response(
        err.issues?.[0]?.message ?? "Invalid input",
        { status: 400 }
      )
    }

    return new Response("Something went wrong", { status: 500 })
  }
}
