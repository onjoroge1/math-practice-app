import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isAuth = Boolean(req.auth)

  if (pathname === "/parent" && !isAuth) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (pathname === "/signup") {
    return NextResponse.redirect(new URL(isAuth ? "/parent" : "/login", req.url))
  }

  if (pathname === "/login" && isAuth) {
    return NextResponse.redirect(new URL("/parent", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/parent", "/login", "/signup"],
}
