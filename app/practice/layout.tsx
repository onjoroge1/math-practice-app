import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Practice",
  description: "Adaptive math practice with hints, explanations, and Vedic tricks.",
}

export default function PracticeLayout({ children }: { children: React.ReactNode }) {
  return children
}
