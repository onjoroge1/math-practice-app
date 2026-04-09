"use client"

import DrillPage, { type DrillQuestion } from "@/components/drill-page"

function generateQuestions(): DrillQuestion[] {
  const pools = [
    () => { const a = Math.floor(Math.random()*9)+1; const b = Math.floor(Math.random()*(10-a)); return { question:`${a} + ${b} = ?`, answer: a+b } },
    () => { const a = Math.floor(Math.random()*9)+1; const b = Math.floor(Math.random()*a); return { question:`${a} - ${b} = ?`, answer: a-b } },
    () => { const t = Math.floor(Math.random()*9)+1; const o = Math.floor(Math.random()*9); return { question:`${t} tens ${o} ones = ?`, answer: t*10+o } },
    () => { const n = Math.floor(Math.random()*8)+2; return { question:`${n} + ? = 10`, answer: 10-n } },
    () => { const a = Math.floor(Math.random()*5)+1; return { question:`Double ${a} = ?`, answer: a*2 } },
    () => { const a = Math.floor(Math.random()*9)+1; return { question:`Half of ${a*2} = ?`, answer: a } },
  ]
  return Array.from({ length: 50 }, (_, i) => ({ ...pools[Math.floor(Math.random()*pools.length)](), id: i }))
}

export default function NumericalReasoningDrillPage() {
  return (
    <DrillPage config={{
      title: "Numerical Reasoning Blitz",
      description: "50 number sense and reasoning problems",
      subject: "Grade 1 • Numerical Reasoning",
      accentColor: "orange",
      mode: "grid",
      generateQuestions,
    }} />
  )
}
