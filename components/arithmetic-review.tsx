"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { explainArithmetic, saveArithmeticLesson, type TeachingQuestion } from "@/lib/arithmetic-teaching"

export function ArithmeticReview({ topic, questions, answers, persist = true }: {
  topic: string
  questions: TeachingQuestion[]
  answers: Record<number, string>
  persist?: boolean
}) {
  const [filter, setFilter] = useState<"all" | "review">("review")
  const [index, setIndex] = useState(0)
  const [saved, setSaved] = useState<boolean | null>(null)
  const supported = questions.filter((q) => explainArithmetic(q.question, q.answer))
  const needsReview = supported.filter((q) => !answers[q.id]?.trim() || Number(answers[q.id]) !== Number(q.answer))
  const shown = filter === "review" && needsReview.length ? needsReview : supported
  const activeIndex = Math.min(index, Math.max(0, shown.length - 1))
  const question = shown[activeIndex]
  const example = question ? explainArithmetic(question.question, question.answer) : null

  useEffect(() => {
    if (!persist) return
    try {
      const studentId = localStorage.getItem("currentStudentId")
      setSaved(studentId ? saveArithmeticLesson(studentId, { topic, questions, answers, savedAt: Date.now() }) : false)
    } catch {
      setSaved(false)
    }
  }, [topic, questions, answers, persist])

  if (!question || !example) return null
  const userAnswer = answers[question.id]
  const isCorrect = Boolean(userAnswer?.trim()) && Number(userAnswer) === example.answer

  return (
    <section className="rounded-2xl border-2 border-indigo-200 bg-white p-4 sm:p-6 space-y-4 text-slate-800" aria-label="Learn how to solve it">
      <div>
        <h2 className="text-xl font-extrabold">🧠 Learn how to solve it</h2>
        <p className="text-sm text-slate-600">No timer. Take one small step at a time.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" aria-pressed={filter === "review"} onClick={() => { setFilter("review"); setIndex(0) }} className={`min-h-11 rounded-xl border px-3 text-sm font-bold ${filter === "review" ? "bg-indigo-100 border-indigo-400" : "border-slate-200"}`}>
          Needs practice ({needsReview.length})
        </button>
        <button type="button" aria-pressed={filter === "all"} onClick={() => { setFilter("all"); setIndex(0) }} className={`min-h-11 rounded-xl border px-3 text-sm font-bold ${filter === "all" ? "bg-indigo-100 border-indigo-400" : "border-slate-200"}`}>
          All examples ({supported.length})
        </button>
      </div>
      {needsReview.length === 0 && <p className="text-sm text-emerald-700">You got them all! Explore how your answers work.</p>}
      <div aria-live="polite" className="space-y-4">
        <div className="rounded-xl bg-indigo-50 p-4 text-center">
          <p className="text-sm font-semibold text-indigo-700">{example.strategy}</p>
          <p className="my-2 text-3xl font-black tabular-nums">{example.a} {example.operation} {example.b} = {example.answer}</p>
          <p className={`text-sm ${isCorrect ? "text-emerald-700" : "text-slate-600"}`}>
            {isCorrect ? "Your answer was correct." : userAnswer?.trim() ? `You answered ${userAnswer}. Let’s work it out together.` : "You didn’t reach this one. Let’s try it together."}
          </p>
        </div>
        {Math.max(example.a, example.answer) <= 20 && Math.max(example.a, example.answer) > 0 && <div className="rounded-xl border border-slate-200 p-3">
          <p className="mb-2 text-sm font-semibold">{example.operation === "+" ? "Blue = start. Orange = add." : "Cross out the ones we take away."}</p>
          <div className="flex flex-wrap justify-center gap-3" role="img" aria-label={example.operation === "+" ? `${example.a} blue counters plus ${example.b} orange counters makes ${example.answer}.` : `${example.a} counters with ${example.b} crossed out leaves ${example.answer}.`}>
            {Array.from({ length: Math.ceil(Math.max(example.a, example.answer) / 10) }, (_, group) => <div key={group} className="grid grid-cols-5 gap-1 rounded-lg border-2 border-slate-300 p-1" aria-hidden="true">
              {Array.from({ length: 10 }, (_, cell) => {
                const position = group * 10 + cell
                const filled = position < (example.operation === "+" ? example.answer : example.a)
                const removed = example.operation === "−" && filled && position >= example.answer
                return <span key={cell} className={`flex h-6 w-6 items-center justify-center rounded-full border text-sm font-bold ${!filled ? "border-slate-200" : removed ? "border-rose-300 bg-rose-100 text-rose-800" : example.operation === "+" && position >= example.a ? "border-orange-600 bg-orange-400" : "border-sky-700 bg-sky-500"}`}>{removed ? "×" : ""}</span>
              })}
            </div>)}
          </div>
        </div>}
        <p className="font-semibold">Start at <span className="rounded-lg bg-sky-100 px-2 py-1">{example.a}</span>.</p>
        <ol className="space-y-3">
          {example.steps.map((step, stepIndex) => (
            <li key={stepIndex} className="rounded-xl border border-sky-200 bg-sky-50 p-3">
              <p className="text-sm font-semibold"><span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-700 text-white">{stepIndex + 1}</span>{step.note}</p>
              <div className="mt-2 flex items-center justify-center gap-3 text-xl font-bold tabular-nums" aria-label={`${step.from} ${example.operation} ${step.amount} equals ${step.to}`}>
                <span className="rounded-xl bg-white px-3 py-2">{step.from}</span>
                <span className="flex flex-col items-center text-sky-800"><span className="text-base">{example.operation}{step.amount}</span><span aria-hidden="true">→</span></span>
                <span className="rounded-xl bg-emerald-100 px-3 py-2">{step.to}</span>
              </div>
            </li>
          ))}
        </ol>
        <p className="rounded-xl bg-emerald-50 p-3 text-center font-bold text-emerald-800">{example.operation === "+" ? "We land on" : "We have"} {example.answer}{example.operation === "−" ? " left" : ""}!</p>
      </div>
      <div className="flex items-center justify-between gap-2">
        <button type="button" disabled={activeIndex === 0} onClick={() => setIndex(activeIndex - 1)} className="min-h-11 rounded-xl border px-3 font-semibold disabled:opacity-40">Previous example</button>
        <span className="text-xs text-slate-500">{activeIndex + 1}/{shown.length}</span>
        <button type="button" disabled={activeIndex === shown.length - 1} onClick={() => setIndex(activeIndex + 1)} className="min-h-11 rounded-xl bg-indigo-600 px-3 font-semibold text-white disabled:opacity-40">Next example</button>
      </div>
      {persist && <p role="status" className="text-sm text-slate-600">
        {saved === true ? "Saved on this device for next time. " : saved === false ? "This review could not be saved on this device. " : "Saving your review… "}
        <Link href="/todays-practice" className="mr-3 font-semibold text-indigo-700 underline">Today’s practice</Link>
        <Link href="/learning-notebook" className="font-semibold text-indigo-700 underline">My learning notebook</Link>
      </p>}
    </section>
  )
}
