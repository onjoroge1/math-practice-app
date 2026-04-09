"use client"

import DrillPage, { type DrillQuestion } from "@/components/drill-page"

const SIDES: Record<string, number> = { triangle:3, square:4, rectangle:4, pentagon:5, hexagon:6 }
const SHAPES = Object.keys(SIDES)

function generateQuestions(): DrillQuestion[] {
  const pools = [
    () => { const s = SHAPES[Math.floor(Math.random()*SHAPES.length)]; return { question:`Sides on a ${s}?`, answer: SIDES[s] } },
    () => { const s = SHAPES[Math.floor(Math.random()*SHAPES.length)]; return { question:`Corners on a ${s}?`, answer: SIDES[s] } },
    () => { const side = Math.floor(Math.random()*5)+1; return { question:`Square side ${side}. Perimeter?`, answer: side*4 } },
    () => { const w = Math.floor(Math.random()*5)+1; const h = Math.floor(Math.random()*5)+1; return { question:`Rectangle ${w}×${h}. Perimeter?`, answer: 2*(w+h) } },
    () => ({ question:`Cube has how many faces?`, answer: 6 }),
    () => ({ question:`Sides on a hexagon?`, answer: 6 }),
    () => ({ question:`Sides on a pentagon?`, answer: 5 }),
  ]
  return Array.from({ length: 50 }, (_, i) => ({ ...pools[Math.floor(Math.random()*pools.length)](), id: i }))
}

export default function GeometricSpatialDrillPage() {
  return (
    <DrillPage config={{
      title: "Geometry & Spatial Blitz",
      description: "50 shapes, sides, corners, and perimeter problems",
      subject: "Grade 1 • Geometric & Spatial Reasoning",
      accentColor: "cyan",
      mode: "grid",
      generateQuestions,
    }} />
  )
}
