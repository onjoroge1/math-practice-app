"use client"

import DrillPage, { type DrillQuestion } from "@/components/drill-page"

function generateQuestions(): DrillQuestion[] {
  return Array.from({ length: 50 }, (_, i) => {
    const isAdd = Math.random() > 0.5
    if (isAdd) {
      const a = Math.floor(Math.random() * 10)
      const b = Math.floor(Math.random() * 10)
      return { id: i, question: `${a} + ${b} =`, answer: a + b }
    }
    const a = Math.floor(Math.random() * 10)
    const b = Math.floor(Math.random() * (a + 1))
    return { id: i, question: `${a} - ${b} =`, answer: a - b }
  })
}

export default function TimedDrillPage() {
  return (
    <DrillPage config={{
      title: "Addition & Subtraction Blitz",
      description: "50 single-digit addition and subtraction problems",
      subject: "Grade 1 • Addition & Subtraction",
      accentColor: "indigo",
      mode: "grid",
      generateQuestions,
    }} />
  )
}
