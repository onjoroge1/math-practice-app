"use client"

import DrillPage, { type DrillQuestion } from "@/components/drill-page"

function generateQuestions(): DrillQuestion[] {
  return Array.from({ length: 50 }, (_, i) => {
    const max = i < 25 ? 20 : 100
    const a = Math.floor(Math.random() * max) + 1
    const b = Math.floor(Math.random() * max) + 1
    return { id: i, question: `${a} + ${b} =`, answer: a + b }
  })
}

export default function Grade2AdditionDrillPage() {
  return (
    <DrillPage config={{
      title: "Addition Speed Drill",
      description: "50 addition problems within 100",
      subject: "Grade 2 • Addition",
      accentColor: "green",
      mode: "sequential",
      generateQuestions,
    }} />
  )
}
