"use client"

import DrillPage, { type DrillQuestion } from "@/components/drill-page"

const DENOMS = [2, 3, 4, 5, 6, 8, 10]

// "n/d of W" problems whose answers are always whole numbers (W is a multiple of d),
// so they work with the numeric drill input.
function generateQuestions(): DrillQuestion[] {
  return Array.from({ length: 50 }, (_, i) => {
    const d = DENOMS[Math.floor(Math.random() * DENOMS.length)]
    const n = Math.floor(Math.random() * (d - 1)) + 1 // 1 .. d-1
    const k = Math.floor(Math.random() * 11) + 2 // 2 .. 12
    const whole = d * k
    return { id: i, question: `${n}/${d} of ${whole} =`, answer: n * k }
  })
}

export default function Grade5FractionsDrillPage() {
  return (
    <DrillPage
      config={{
        title: "Fraction Frenzy",
        description: "50 fraction-of-a-number problems",
        subject: "Grade 5 • Fractions",
        accentColor: "purple",
        mode: "grid",
        generateQuestions,
      }}
    />
  )
}
