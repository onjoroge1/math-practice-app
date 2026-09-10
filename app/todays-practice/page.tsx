"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArithmeticReview } from "@/components/arithmetic-review"
import { IowaExplanation } from "@/components/iowa-explanation"
import { getIowaUnit, stimulusFor } from "@/lib/iowa-grade5"
import { syncIowaProgress } from "@/lib/iowa-sync"
import { localDate, readDailyPractice, buildDailyPractice, saveDailyPractice, getPracticeQuestion, isPracticeCorrect, answerDailyQuestion, dailyScore, type DailyPractice, type PracticeRef } from "@/lib/todays-practice"

function WorkedExample({ reference, answer }: { reference: PracticeRef; answer: string }) {
  if (reference.kind === "arithmetic") return <ArithmeticReview topic="Today’s worked example" questions={[reference.question]} answers={{ [reference.question.id]: answer }} persist={false} />
  const unit = getIowaUnit(reference.unitId)!
  return <IowaExplanation unit={unit} question={unit.questions.find((q) => q.number === reference.number)!} showPrompt />
}

export default function TodaysPracticePage() {
  const [state, setState] = useState<DailyPractice | null>(null)
  const [name, setName] = useState("")
  const [ready, setReady] = useState(false)
  const [saved, setSaved] = useState(true)
  const [answer, setAnswer] = useState("")
  const [syncNote, setSyncNote] = useState("")
  const stateRef = useRef<DailyPractice | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const id = localStorage.getItem("currentStudentId")
        const grade = Number(localStorage.getItem("currentStudentGrade"))
        if (!id || ![2, 5].includes(grade)) return
        setName(localStorage.getItem("currentStudentName") || "Your")
        const date = localDate()
        let current = readDailyPractice(id, date)
        if (!current && grade === 5) {
          // A slow network must not prevent starting from the local saved history.
          let timer: ReturnType<typeof setTimeout> | undefined
          const result = await Promise.race([
            syncIowaProgress(id),
            new Promise<null>((resolve) => { timer = setTimeout(() => resolve(null), 5000) }),
          ])
          clearTimeout(timer)
          if (!cancelled && (!result || result.status !== "synced")) setSyncNote("Using the Iowa history available on this device. Visit Iowa scores to retry syncing.")
        }
        current ??= buildDailyPractice(id, grade, date)
        if (!cancelled) {
          stateRef.current = current
          setState(current)
          setSaved(saveDailyPractice(current))
        }
      } catch {
        if (!cancelled) setSyncNote("We couldn’t open your saved profile. Choose your profile and try again.")
      } finally {
        if (!cancelled) setReady(true)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [])

  const update = (next: DailyPractice) => {
    stateRef.current = next
    setState(next)
    setSaved(saveDailyPractice(next))
    setAnswer("")
    requestAnimationFrame(() => { heading.current?.focus(); heading.current?.scrollIntoView({ behavior: "smooth", block: "start" }) })
  }
  if (!ready) return <main className="p-10 text-center">Preparing five small steps…</main>
  if (!state) return <main className="p-10 text-center space-y-4"><h1 className="text-2xl font-bold">Choose your profile first</h1><p>{syncNote}</p><Link href="/" className="text-indigo-700 underline">Choose Amir or Aden</Link></main>
  const item = state.items[state.index]
  const question = getPracticeQuestion(item.retry)
  const iowaUnit = item.retry.kind === "iowa" ? getIowaUnit(item.retry.unitId) : undefined
  const iowaQuestion = item.retry.kind === "iowa" ? iowaUnit?.questions.find((q) => q.number === (item.retry.kind === "iowa" ? item.retry.number : -1)) : undefined
  const passage = iowaUnit && iowaQuestion ? stimulusFor(iowaUnit, iowaQuestion) : null
  const correct = isPracticeCorrect(item.retry, state.answers[state.index] ?? "")
  const sameQuestion = item.source.kind === "iowa" && item.retry.kind === "iowa" && item.source.number === item.retry.number && item.source.unitId === item.retry.unitId

  return <main className="min-h-screen bg-gradient-to-br from-sky-50 via-indigo-50 to-amber-50 px-4 py-8 text-slate-900">
    <div className="mx-auto max-w-2xl space-y-5">
      <Link href="/topic-select" className="font-semibold text-indigo-700 underline">← Back to topics</Link>
      <header className="space-y-2">
        <p className="text-sm font-bold text-indigo-700">☀️ {name} · {state.date}</p>
        <h1 ref={heading} tabIndex={-1} className="text-3xl font-black outline-none">Today’s practice</h1>
        <p className="text-slate-600">Learn → try it yourself → see the steps. No timer.</p>
      </header>
      <div className="flex gap-2" aria-label={`${Object.keys(state.answers).length} of ${state.items.length} questions answered`}>
        {state.items.map((_, i) => <span key={i} className={`h-3 flex-1 rounded-full ${state.answers[i] !== undefined ? "bg-emerald-500" : i === state.index ? "bg-indigo-500" : "bg-slate-200"}`} />)}
      </div>
      <p role="status" className={`text-sm ${saved ? "text-slate-600" : "text-rose-700"}`}>
        {saved ? "Progress saved on this device. You can leave and return." : "Progress could not be saved. Keep this page open."}
        {!saved && <button className="ml-2 underline" onClick={() => setSaved(saveDailyPractice(state))}>Retry saving</button>}
      </p>
      {syncNote && <p className="text-sm text-amber-800">{syncNote} <Link href="/iowa" className="underline">Iowa scores</Link></p>}
      {state.phase === "complete" ? <section className="space-y-5 rounded-2xl border border-emerald-200 bg-white p-6 text-center">
        <div className="text-5xl" aria-hidden="true">🌟</div>
        <h2 className="text-2xl font-black">Today’s practice is complete!</h2>
        <p className="text-xl">{dailyScore(state)} of {state.items.length} independent checks correct</p>
        <p className="text-sm text-slate-600">These checks follow worked examples. They are separate from your test scores.</p>
        <div className="space-y-3 text-left">{state.items.map((entry, i) => <details key={i} className="rounded-xl border p-3"><summary className="cursor-pointer font-semibold">{isPracticeCorrect(entry.retry, state.answers[i]) ? "✓" : "↻"} Question {i + 1}: review the steps</summary><div className="mt-3"><WorkedExample reference={entry.retry} answer={state.answers[i]} /></div></details>)}</div>
        <Link href="/topic-select" className="inline-block rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white">Back to topics</Link>
      </section> : <>
        <div className="flex items-center justify-between gap-2"><p className="font-bold">Step {state.index + 1} of {state.items.length}</p><span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-bold text-indigo-800">{state.phase === "learn" ? "1 · Learn" : state.phase === "try" ? "2 · Try" : "3 · Review"}</span></div>
        {state.phase === "learn" && <>
          <p className="text-sm text-slate-600">{item.reason}</p>
          <WorkedExample reference={item.source} answer={item.sourceAnswer} />
          <button className="min-h-12 w-full rounded-xl bg-indigo-600 p-3 font-bold text-white" onClick={() => update({ ...state, phase: "try" })}>I’ve read the steps — let me try</button>
        </>}
        {state.phase === "try" && <form className="space-y-4 rounded-2xl bg-white p-6 shadow-sm" onSubmit={(event) => {
          event.preventDefault()
          const current = stateRef.current
          if (current) update(answerDailyQuestion(current, answer))
        }}>
          <h2 className="text-xl font-bold">{sameQuestion ? "Try the question again without the steps" : "Your turn — a different question"}</h2>
          {passage && <div className="rounded-xl bg-slate-50 p-4"><h3 className="font-semibold">{passage.title}</h3><p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{passage.body}</p></div>}
          <p className="text-xl font-bold">{question.stem}</p>
          {question.choices ? <fieldset className="space-y-2"><legend className="mb-2 text-sm">Choose your answer</legend>{question.choices.map((choice) => <label key={choice.label} className={`flex min-h-12 cursor-pointer gap-3 rounded-xl border-2 p-3 ${answer === choice.label ? "border-indigo-500 bg-indigo-50" : "border-slate-200"}`}><input type="radio" name="answer" value={choice.label} checked={answer === choice.label} onChange={() => setAnswer(choice.label)} required /><span>{choice.label}. {choice.text}</span></label>)}</fieldset> : <label className="block font-semibold">Your answer<input className="mt-2 block min-h-12 w-full rounded-xl border-2 border-indigo-200 p-3 text-2xl" inputMode="numeric" pattern="[0-9]+" value={answer} onChange={(event) => setAnswer(event.target.value)} required autoComplete="off" /></label>}
          <button type="submit" disabled={!answer.trim()} className="min-h-12 w-full rounded-xl bg-indigo-600 p-3 font-bold text-white disabled:opacity-40">Check my answer</button>
        </form>}
        {state.phase === "feedback" && <>
          <p className={`rounded-xl p-4 text-lg font-bold ${correct ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}`}>{correct ? "✓ You worked it out!" : "Let’s look at the steps together."}</p>
          <p className="text-sm">Your answer: {state.answers[state.index]}</p>
          <WorkedExample reference={item.retry} answer={state.answers[state.index]} />
          <button className="min-h-12 w-full rounded-xl bg-indigo-600 p-3 font-bold text-white" onClick={() => update(state.index === state.items.length - 1 ? { ...state, phase: "complete" } : { ...state, index: state.index + 1, phase: "learn" })}>{state.index === state.items.length - 1 ? "Finish today’s practice" : "Next small step"}</button>
        </>}
      </>}
    </div>
  </main>
}
