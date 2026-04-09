"use client"

import DrillPage, { type DrillQuestion } from "@/components/drill-page"

const FIXED: Array<{ question: string; answer: number }> = [
  { question: "Sides on a pentagon?", answer: 5 },
  { question: "Sides on a hexagon?", answer: 6 },
  { question: "Vertices on a cube?", answer: 8 },
  { question: "Edges on a cube?", answer: 12 },
  { question: "Right angles in a square?", answer: 4 },
  { question: "Degrees in a right angle?", answer: 90 },
  { question: "Degrees in a straight line?", answer: 180 },
  { question: "Sum of angles in a triangle?", answer: 180 },
  { question: "Lines of symmetry in a square?", answer: 4 },
  { question: "Triangle 60°+80° — third angle?", answer: 40 },
  { question: "Triangle 90°+45° — third angle?", answer: 45 },
]

function generateQuestions(): DrillQuestion[] {
  const dynamic = Array.from({ length: 39 }, (_, i) => {
    const t = i % 2
    if (t === 0) {
      const s = Math.floor(Math.random() * 8) + 4
      return { id: i + 11, question: `Perimeter of square, side ${s} cm?`, answer: s * 4 }
    }
    const l = Math.floor(Math.random() * 10) + 5
    const w = Math.floor(Math.random() * 8) + 3
    return { id: i + 11, question: `Area of rectangle ${l}×${w}?`, answer: l * w }
  })
  return [...FIXED.map((q, i) => ({ ...q, id: i })), ...dynamic].slice(0, 50)
}

export default function Grade4GeometricSpatialDrill() {
  return (
    <DrillPage
      config={{
        title: "Grade 4: Geometric & Spatial Reasoning",
        description: "Shapes, angles, symmetry, perimeter, and area — 50 questions in 5 minutes!",
        subject: "Grade 4 • Geometry & Spatial",
        accentColor: "cyan",
        mode: "sequential",
        generateQuestions,
      }}
    />
  )
}
