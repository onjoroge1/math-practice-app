import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const password = process.env.PARENT_ADMIN_PASSWORD
  const configured = Boolean(process.env.AUTH_SECRET && password && password.length >= 12)

  return NextResponse.json(
    { configured },
    { headers: { "Cache-Control": "no-store" } },
  )
}
