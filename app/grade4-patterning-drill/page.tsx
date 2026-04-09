"use client"

import DrillPage, { type DrillQuestion } from "@/components/drill-page"

const FIXED_PATTERNS: Array<{ question: string; answer: number }> = [
  { question: "3, 6, 12, 24, ?", answer: 48 },
  { question: "100, 90, 80, 70, ?", answer: 60 },
  { question: "2, 6, 18, 54, ?", answer: 162 },
  { question: "81, 27, 9, 3, ?", answer: 1 },
  { question: "1, 4, 9, 16, ?", answer: 25 },
  { question: "64, 32, 16, 8, ?", answer: 4 },
  { question: "7, 14, 21, 28, ?", answer: 35 },
  { question: "Solve: x + 18 = 47", answer: 29 },
  { question: "Solve: x − 15 = 23", answer: 38 },
  { question: "Solve: 4x = 36", answer: 9 },
  { question: "Solve: 5x = 45", answer: 9 },
  { question: "Solve: 6x = 42", answer: 7 },
]

function generateQuestions(): DrillQuestion[] {
  const dynamic = Array.from({ length: 38 }, (_, i) => {
    const rule = [2, 3, 4, 5, 6][Math.floor(Math.random() * 5)]
    const input = Math.floor(Math.random() * 12) + 3
    return { id: i + 12, question: `Rule ×${rule}: input ${input} → output?`, answer: input * rule }
  })
  return [...FIXED_PATTERNS.map((q, i) => ({ ...q, id: i })), ...dynamic].slice(0, 50)
}

export default function Grade4PatterningDrill() {
  return (
    <DrillPage
      config={{
        title: "Grade 4: Patterning & Algebra",
        description: "Number patterns, input-output tables, and solving for x — 50 questions!",
        subject: "Grade 4 • Patterning & Algebra",
        accentColor: "purple",
        mode: "sequential",
        generateQuestions,
      }}
    />
  )
}
