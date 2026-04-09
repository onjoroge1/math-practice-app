"use client"

import DrillPage, { type DrillQuestion } from "@/components/drill-page"

function generateQuestions(): DrillQuestion[] {
  const pools = [
    () => { const d = Math.floor(Math.random()*4)+1; return { question:`${d} dimes = ? cents`, answer: d*10 } },
    () => { const n = Math.floor(Math.random()*4)+1; return { question:`${n} nickels = ? cents`, answer: n*5 } },
    () => { const p = Math.floor(Math.random()*9)+1; return { question:`${p} pennies = ? cents`, answer: p } },
    () => ({ question:`1 quarter = ? cents`, answer: 25 }),
    () => ({ question:`1 dime = ? cents`, answer: 10 }),
    () => ({ question:`1 nickel = ? cents`, answer: 5 }),
    () => { const h = Math.floor(Math.random()*12)+1; return { question:`Clock: ${h}:00 — what hour?`, answer: h } },
    () => { const a = Math.floor(Math.random()*5)+2; const b = a-1; return { question:`${a} cubes vs ${b} cubes — longer is?`, answer: a } },
  ]
  return Array.from({ length: 50 }, (_, i) => ({ ...pools[Math.floor(Math.random()*pools.length)](), id: i }))
}

export default function MeasurementDataDrillPage() {
  return (
    <DrillPage config={{
      title: "Measurement & Data Blitz",
      description: "50 time, money, and measurement problems",
      subject: "Grade 1 • Measurement & Data Reasoning",
      accentColor: "green",
      mode: "grid",
      generateQuestions,
    }} />
  )
}
