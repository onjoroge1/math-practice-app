import { stimulusFor, type IowaQuestion, type IowaUnit } from "@/lib/iowa-grade5"

export function IowaExplanation({ unit, question, showPrompt = false }: { unit: IowaUnit; question: IowaQuestion; showPrompt?: boolean }) {
  const passage = stimulusFor(unit, question)
  return <section aria-label="Step-by-step explanation" className="space-y-3 rounded-xl border border-sky-200 bg-sky-50 p-4 text-slate-800">
    <h3 className="font-bold">🧠 How to work it out</h3>
    {showPrompt && <p className="font-semibold">{question.stem}</p>}
    {passage && <details className="rounded-lg bg-white p-3" open>
      <summary className="cursor-pointer font-semibold">{passage.title || "Read the sentence"}</summary>
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{passage.body}</p>
    </details>}
    {question.retired && <p className="text-sm text-amber-800">This older question has ambiguous wording and is no longer used in new practice. Your original score is preserved.</p>}
    <ol className="space-y-2">
      {question.explanation?.steps.map((step, i) => <li key={i} className="flex gap-3 rounded-lg bg-white p-3 text-sm leading-relaxed">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 font-bold text-white">{i + 1}</span><span>{step}</span>
      </li>)}
    </ol>
    <p className="rounded-lg bg-emerald-100 p-3 font-semibold text-emerald-900">Answer: {question.answer}. {question.choices.find((choice) => choice.label === question.answer)?.text}</p>
  </section>
}
