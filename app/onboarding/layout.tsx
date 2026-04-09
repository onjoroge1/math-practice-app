import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Get Started",
  description: "Create your student profile — enter your name, grade, and pick an avatar.",
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return children
}
