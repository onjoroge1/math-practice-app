"use client"

import DrillPage, { type DrillQuestion } from "@/components/drill-page"

function generateQuestions(): DrillQuestion[] {
  const pools = [
    () => { const s = Math.floor(Math.random()*4)+1; const n = Math.floor(Math.random()*5)+1; return { question:`${n}, ${n+s}, ${n+s*2}, ${n+s*3}, ?`, answer: n+s*4 } },
    () => { const s = Math.floor(Math.random()*10)*2; return { question:`By 2s: ${s}, ${s+2}, ${s+4}, ?`, answer: s+6 } },
    () => { const s = Math.floor(Math.random()*10)*5; return { question:`By 5s: ${s}, ${s+5}, ${s+10}, ?`, answer: s+15 } },
    () => { const s = Math.floor(Math.random()*5)*10; return { question:`By 10s: ${s}, ${s+10}, ${s+20}, ?`, answer: s+30 } },
    () => { const n = Math.floor(Math.random()*8)+2; return { question:`? + ${n} = ${n*2}`, answer: n } },
  ]
  return Array.from({ length: 50 }, (_, i) => ({ ...pools[Math.floor(Math.random()*pools.length)](), id: i }))
}

export default function PatterningDrillPage() {
  return (
    <DrillPage config={{
      title: "Patterning & Algebra Blitz",
      description: "50 number patterns and skip counting problems",
      subject: "Grade 1 • Patterning & Algebraic Reasoning",
      accentColor: "purple",
      mode: "grid",
      generateQuestions,
    }} />
  )
}
