"use client"

import DrillPage, { type DrillQuestion } from "@/components/drill-page"

function generateQuestions(): DrillQuestion[] {
  return Array.from({ length: 50 }, (_, i) => {
    const isAdd = Math.random() > 0.4
    if (isAdd) {
      const a = Math.floor(Math.random() * 41) + 10
      const b = Math.floor(Math.random() * (51 - a)) + 1
      return { id: i, question: `${a} + ${b} =`, answer: a + b }
    }
    const a = Math.floor(Math.random() * 41) + 10
    const b = Math.floor(Math.random() * a) + 1
    return { id: i, question: `${a} - ${b} =`, answer: a - b }
  })
}

export default function TimedDrillMediumPage() {
  return (
    <DrillPage config={{
      title: "Numbers 10–50 Blitz",
      description: "50 addition and subtraction problems with numbers between 10 and 50",
      subject: "Grade 1 • Addition & Subtraction (10–50)",
      accentColor: "green",
      mode: "grid",
      generateQuestions,
    }} />
  )
}
