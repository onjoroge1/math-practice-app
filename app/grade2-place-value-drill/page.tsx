"use client"

import DrillPage, { type DrillQuestion } from "@/components/drill-page"

const rnd = (lo: number, hi: number) => Math.floor(Math.random() * (hi - lo + 1)) + lo

function generateQuestions(): DrillQuestion[] {
  return Array.from({ length: 50 }, (_, i) => {
    const n = rnd(105, 850)
    switch (i % 4) {
      case 0:
        return { id: i, question: `10 more than ${n} =`, answer: n + 10 }
      case 1:
        return { id: i, question: `10 less than ${n} =`, answer: n - 10 }
      case 2:
        return { id: i, question: `100 more than ${n} =`, answer: n + 100 }
      default:
        return { id: i, question: `100 less than ${n} =`, answer: n - 100 }
    }
  })
}

export default function Grade2PlaceValueDrillPage() {
  return (
    <DrillPage
      config={{
        title: "Place Value Power",
        description: "50 problems: 10 and 100 more or less, to 1000",
        subject: "Grade 2 • Place Value",
        accentColor: "cyan",
        mode: "grid",
        generateQuestions,
      }}
    />
  )
}
