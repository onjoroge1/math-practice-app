"use client"

import DrillPage, { type DrillQuestion } from "@/components/drill-page"

function generateQuestions(): DrillQuestion[] {
  return Array.from({ length: 50 }, (_, i) => {
    const a = Math.floor(Math.random() * 11) + 2
    const b = Math.floor(Math.random() * 11) + 2
    return { id: i, question: `${a} × ${b} =`, answer: a * b }
  })
}

export default function MultiplicationDrillPage() {
  return (
    <DrillPage config={{
      title: "Multiplication Blitz",
      description: "50 multiplication facts, times tables 2–12",
      subject: "Grade 4 • Multiplication",
      accentColor: "indigo",
      mode: "grid",
      generateQuestions,
    }} />
  )
}
