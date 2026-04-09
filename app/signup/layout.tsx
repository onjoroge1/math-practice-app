import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Create Parent Account",
  description: "Sign up to track your child's math practice progress, mastery levels, and learning streaks.",
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children
}
