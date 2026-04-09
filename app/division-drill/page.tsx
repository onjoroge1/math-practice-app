"use client"

import DrillPage, { type DrillQuestion } from "@/components/drill-page"

function generateQuestions(): DrillQuestion[] {
  return Array.from({ length: 50 }, (_, i) => {
    const divisor = Math.floor(Math.random() * 11) + 2
    const quotient = Math.floor(Math.random() * 11) + 2
    return { id: i, question: `${divisor * quotient} ÷ ${divisor} =`, answer: quotient }
  })
}

export default function DivisionDrillPage() {
  return (
    <DrillPage config={{
      title: "Division Blitz",
      description: "50 division facts with whole number answers",
      subject: "Grade 4 • Division",
      accentColor: "purple",
      mode: "grid",
      generateQuestions,
    }} />
  )
}
