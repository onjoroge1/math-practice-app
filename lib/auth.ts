import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import {
  FAMILY_ADMIN_ID,
  FAMILY_ADMIN_NAME,
  verifyAdminCredentials,
} from "./admin-auth"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (typeof credentials?.username !== "string") return null
        if (typeof credentials?.password !== "string") return null
        if (!verifyAdminCredentials(credentials.username, credentials.password)) return null

        return {
          id: FAMILY_ADMIN_ID,
          email: "admin@math-practice.local",
          name: FAMILY_ADMIN_NAME,
          role: "admin",
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
        session.user.role = token.role === "admin" ? "admin" : "parent"
      }
      return session
    },
  },
  session: { strategy: "jwt" },
})
