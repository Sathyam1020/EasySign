import { getSession } from "@/lib/get-session"

export async function GET() {
  const session = await getSession()
  return Response.json({ session })
}