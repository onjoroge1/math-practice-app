import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Parent Dashboard",
  description: "View your child's math mastery, skills progress, streaks, and learning recommendations.",
}

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return children
}
