import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Parent Login",
  description: "Sign in to view your child's math learning progress and mastery dashboard.",
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
