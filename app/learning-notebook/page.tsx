"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { IowaSavedLessons } from "@/components/iowa-saved-lessons"
import { ArithmeticReview } from "@/components/arithmetic-review"
import { getArithmeticLessons, type ArithmeticLesson } from "@/lib/arithmetic-teaching"

export default function LearningNotebookPage() {
  const [lessons, setLessons] = useState<ArithmeticLesson[]>([])
  const [name, setName] = useState("")
  const [ready, setReady] = useState(false)
  const [selected, setSelected] = useState(0)
  useEffect(() => {
    try {
      const studentId = localStorage.getItem("currentStudentId")
      setName(localStorage.getItem("currentStudentName") || "My")
      if (studentId) setLessons(getArithmeticLessons(studentId))
    } catch {
      setLessons([])
    } finally {
      setReady(true)
    }
  }, [])
  const lesson = lessons[selected]
  return <main className="min-h-screen bg-gradient-to-br from-sky-50 to-indigo-50 p-4 py-8">
    <div className="mx-auto max-w-2xl space-y-5">
      <Link href="/topic-select" className="text-indigo-700 underline">Back to topics</Link>
      <h1 className="text-3xl font-black text-slate-900">📘 {name && name !== "My" ? `${name}’s` : "My"} learning notebook</h1>
      <p className="text-slate-600">Revisit your latest addition and subtraction lessons. Saved on this device.</p>
      <Link href="/todays-practice" className="block rounded-xl bg-indigo-600 p-4 font-bold text-white">☀️ Today’s practice — learn, then try</Link>
      <IowaSavedLessons />
      {!ready ? <p>Loading lessons…</p> : !lesson ? <div className="rounded-2xl bg-white p-6 text-slate-700">Finish an addition or subtraction test, speed drill, or mental math quiz. Your worked examples will appear here.</div> : <>
        <label className="block font-bold text-slate-800">Choose a lesson
          <select className="mt-2 block w-full rounded-xl border bg-white p-3 font-normal" value={selected} onChange={(event) => setSelected(Number(event.target.value))}>
            {lessons.map((item, index) => <option key={item.topic} value={index}>{item.topic} · {new Date(item.savedAt).toLocaleDateString()}</option>)}
          </select>
        </label>
        <ArithmeticReview key={lesson.topic} topic={lesson.topic} questions={lesson.questions} answers={lesson.answers} persist={false} />
      </>}
    </div>
  </main>
}
