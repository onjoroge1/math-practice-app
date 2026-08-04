"use client"

import DrillPage, { type DrillQuestion } from "@/components/drill-page"

const rnd = (lo: number, hi: number) => Math.floor(Math.random() * (hi - lo + 1)) + lo

function generateQuestions(): DrillQuestion[] {
  return Array.from({ length: 50 }, (_, i) => {
    const ai = rnd(15, 98) // 1.5–9.8
    let bi = rnd(10, ai - 1) // always less than ai, so subtraction stays positive
    const add = Math.random() < 0.5
    let resI = add ? ai + bi : ai - bi
    // Avoid whole-number results so the typed answer (e.g. "4.2") is unambiguous.
    if (resI % 10 === 0) {
      bi -= 1
      resI = add ? ai + bi : ai - bi
    }
    return {
      id: i,
      question: `${(ai / 10).toFixed(1)} ${add ? "+" : "−"} ${(bi / 10).toFixed(1)} =`,
      answer: resI / 10,
    }
  })
}

export default function Grade5DecimalsDrillPage() {
  return (
    <DrillPage
      config={{
        title: "Decimal Dash",
        description: "50 decimal addition and subtraction problems",
        subject: "Grade 5 • Decimals",
        accentColor: "emerald",
        mode: "grid",
        generateQuestions,
      }}
    />
  )
}
