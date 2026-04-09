"use client"

import DrillPage, { type DrillQuestion } from "@/components/drill-page"

function generateQuestions(): DrillQuestion[] {
  return Array.from({ length: 50 }, (_, i) => {
    const a = Math.floor(Math.random() * 10) + 2
    const b = Math.floor(Math.random() * 10) + 2
    return { id: i, question: `${a} × ${b} =`, answer: a * b }
  })
}

export default function Grade3MultiplicationDrillPage() {
  return (
    <DrillPage config={{
      title: "Multiplication Speed Drill",
      description: "50 times tables problems",
      subject: "Grade 3 • Multiplication",
      accentColor: "purple",
      mode: "sequential",
      generateQuestions,
    }} />
  )
}
