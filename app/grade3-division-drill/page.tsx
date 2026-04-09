"use client"

import DrillPage, { type DrillQuestion } from "@/components/drill-page"

function generateQuestions(): DrillQuestion[] {
  return Array.from({ length: 50 }, (_, i) => {
    const divisor = Math.floor(Math.random() * 10) + 2
    const quotient = Math.floor(Math.random() * 10) + 2
    return { id: i, question: `${divisor * quotient} ÷ ${divisor} =`, answer: quotient }
  })
}

export default function Grade3DivisionDrillPage() {
  return (
    <DrillPage config={{
      title: "Division Speed Drill",
      description: "50 division facts with whole number answers",
      subject: "Grade 3 • Division",
      accentColor: "pink",
      mode: "sequential",
      generateQuestions,
    }} />
  )
}
