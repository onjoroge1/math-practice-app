"use client"

import DrillPage, { type DrillQuestion } from "@/components/drill-page"

const STEPS = [2, 5, 10]
const rnd = (lo: number, hi: number) => Math.floor(Math.random() * (hi - lo + 1)) + lo

function generateQuestions(): DrillQuestion[] {
  return Array.from({ length: 50 }, (_, i) => {
    const k = STEPS[Math.floor(Math.random() * STEPS.length)]
    const start = rnd(1, 10) * k
    const seq = [start, start + k, start + 2 * k]
    return { id: i, question: `What comes next? ${seq.join(", ")}, __`, answer: start + 3 * k }
  })
}

export default function Grade2SkipCountingDrillPage() {
  return (
    <DrillPage
      config={{
        title: "Skip Counting Sprint",
        description: "50 patterns: count by 2s, 5s, and 10s",
        subject: "Grade 2 • Skip Counting",
        accentColor: "orange",
        mode: "grid",
        generateQuestions,
      }}
    />
  )
}
