"use client"

import DrillPage, { type DrillQuestion } from "@/components/drill-page"

const FIXED: Array<{ question: string; answer: number }> = [
  { question: "3 feet to inches?", answer: 36 },
  { question: "2 yards to feet?", answer: 6 },
  { question: "5 feet to inches?", answer: 60 },
  { question: "24 inches to feet?", answer: 2 },
  { question: "How many cups in 2 pints?", answer: 4 },
  { question: "How many pints in 1 gallon?", answer: 8 },
  { question: "How many ounces in 2 pounds?", answer: 32 },
  { question: "4 quarts to gallons?", answer: 1 },
]

function generateQuestions(): DrillQuestion[] {
  const dynamic = Array.from({ length: 42 }, (_, i) => {
    const t = i % 2
    if (t === 0) {
      const l = Math.floor(Math.random() * 10) + 5
      const w = Math.floor(Math.random() * 8) + 3
      return { id: i + 8, question: `Perimeter rect ${l}×${w} cm?`, answer: 2 * (l + w) }
    }
    const l = Math.floor(Math.random() * 12) + 4
    const w = Math.floor(Math.random() * 10) + 3
    return { id: i + 8, question: `Area rect ${l}×${w} cm?`, answer: l * w }
  })
  return [...FIXED.map((q, i) => ({ ...q, id: i })), ...dynamic].slice(0, 50)
}

export default function Grade4MeasurementDataDrill() {
  return (
    <DrillPage
      config={{
        title: "Grade 4: Measurement & Data",
        description: "Unit conversions, perimeter, area, and data — 50 questions in 5 minutes!",
        subject: "Grade 4 • Measurement & Data",
        accentColor: "emerald",
        mode: "sequential",
        generateQuestions,
      }}
    />
  )
}
