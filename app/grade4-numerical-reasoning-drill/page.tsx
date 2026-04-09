"use client"

import DrillPage, { type DrillQuestion } from "@/components/drill-page"

function generateQuestions(): DrillQuestion[] {
  const pools = [
    () => {
      const a = Math.floor(Math.random() * 5000) + 2000
      const b = Math.floor(Math.random() * 4000) + 1000
      return { question: `${a} + ${b} =`, answer: a + b }
    },
    () => {
      const a = Math.floor(Math.random() * 6000) + 3000
      const b = Math.floor(Math.random() * 2000) + 1000
      return { question: `${a} − ${b} =`, answer: a - b }
    },
    () => {
      const a = Math.floor(Math.random() * 40) + 10
      const b = Math.floor(Math.random() * 9) + 2
      return { question: `${a} × ${b} =`, answer: a * b }
    },
    () => {
      const d = Math.floor(Math.random() * 11) + 2
      const q = Math.floor(Math.random() * 15) + 5
      return { question: `${d * q} ÷ ${d} =`, answer: q }
    },
  ]
  return Array.from({ length: 50 }, (_, i) => ({
    ...pools[Math.floor(Math.random() * pools.length)](),
    id: i,
  }))
}

export default function Grade4NumericalReasoningDrill() {
  return (
    <DrillPage
      config={{
        title: "Grade 4: Numerical Reasoning",
        description: "Multi-digit addition, subtraction, multiplication, and division — 50 problems!",
        subject: "Grade 4 • Numerical Reasoning",
        accentColor: "blue",
        mode: "grid",
        generateQuestions,
      }}
    />
  )
}
