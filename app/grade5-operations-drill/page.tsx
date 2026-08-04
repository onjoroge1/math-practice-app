"use client"

import DrillPage, { type DrillQuestion } from "@/components/drill-page"

function generateQuestions(): DrillQuestion[] {
  return Array.from({ length: 50 }, (_, i) => {
    if (i % 2 === 0) {
      const a = Math.floor(Math.random() * 88) + 12 // 12–99
      const b = Math.floor(Math.random() * 10) + 3 // 3–12
      return { id: i, question: `${a} × ${b} =`, answer: a * b }
    }
    const d = Math.floor(Math.random() * 11) + 2 // divisor 2–12
    const q = Math.floor(Math.random() * 30) + 6 // quotient 6–35
    return { id: i, question: `${d * q} ÷ ${d} =`, answer: q }
  })
}

export default function Grade5OperationsDrillPage() {
  return (
    <DrillPage
      config={{
        title: "Operations Blitz",
        description: "50 multi-digit multiplication and division problems",
        subject: "Grade 5 • Operations",
        accentColor: "indigo",
        mode: "grid",
        generateQuestions,
      }}
    />
  )
}
