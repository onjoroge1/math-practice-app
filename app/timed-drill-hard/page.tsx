"use client"

import DrillPage, { type DrillQuestion } from "@/components/drill-page"

function generateQuestions(): DrillQuestion[] {
  return Array.from({ length: 50 }, (_, i) => {
    const isAdd = Math.random() > 0.4
    if (isAdd) {
      const a = Math.floor(Math.random() * 50) + 50
      const b = Math.floor(Math.random() * (101 - a)) + 1
      return { id: i, question: `${a} + ${b} =`, answer: a + b }
    }
    const a = Math.floor(Math.random() * 50) + 50
    const b = Math.floor(Math.random() * (a - 49)) + 1
    return { id: i, question: `${a} - ${b} =`, answer: a - b }
  })
}

export default function TimedDrillHardPage() {
  return (
    <DrillPage config={{
      title: "Numbers 50–100 Blitz",
      description: "50 addition and subtraction problems with numbers between 50 and 100",
      subject: "Grade 1 • Addition & Subtraction (50–100)",
      accentColor: "purple",
      mode: "grid",
      generateQuestions,
    }} />
  )
}
