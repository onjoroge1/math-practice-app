import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: "admin" | "parent"
      image?: string | null
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: "admin" | "parent"
  }
}
