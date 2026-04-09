import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Choose Topics",
  description: "Select math topics and practice mode — adaptive practice or timed speed drills.",
}

export default function TopicSelectLayout({ children }: { children: React.ReactNode }) {
  return children
}
