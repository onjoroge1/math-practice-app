import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Quick Assessment",
  description: "A quick diagnostic to gauge your current math level before adaptive practice begins.",
}

export default function DiagnosticLayout({ children }: { children: React.ReactNode }) {
  return children
}
