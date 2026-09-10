/** Exact, reusable worked examples. No generated explanations or answer guessing. */
export interface ArithmeticStep {
  from: number
  amount: number
  to: number
  note: string
}

export interface ArithmeticExplanation {
  a: number
  b: number
  operation: "+" | "−"
  answer: number
  strategy: string
  steps: ArithmeticStep[]
}

export function explainArithmetic(question: string, expectedAnswer: number | string): ArithmeticExplanation | null {
  const match = question.match(/^\s*(\d+)\s*([+−-])\s*(\d+)\s*(?:=\s*\??)?\s*$/)
  if (!match) return null
  const a = Number(match[1])
  const b = Number(match[3])
  const adding = match[2] === "+"
  const answer = adding ? a + b : a - b
  if (a > 1000 || b > 1000 || answer < 0 || String(expectedAnswer).trim() === "" || answer !== Number(expectedAnswer)) return null
  const steps: ArithmeticStep[] = []
  let current = a
  const jump = (amount: number, note: string) => {
    const to = adding ? current + amount : current - amount
    steps.push({ from: current, amount, to, note })
    current = to
  }

  if (b === 0) {
    jump(0, "Zero means no change. Stay on the same number.")
  } else {
    const hundreds = Math.floor(b / 100) * 100
    const tens = Math.floor((b % 100) / 10) * 10
    let ones = b % 10
    if (hundreds) jump(hundreds, `${adding ? "Add" : "Take away"} the hundreds first.`)
    if (tens) jump(tens, `${adding ? "Add" : "Take away"} ${tens / 10} ${tens === 10 ? "ten" : "tens"}.`)
    const toTen = adding ? 10 - current % 10 : current % 10
    if (ones > toTen && toTen > 0 && toTen < 10) {
      jump(toTen, `Use ${toTen} of the ${ones} ones to ${adding ? "reach the next ten" : "land on a ten"}.`)
      ones -= toTen
    }
    if (ones) jump(ones, `${adding ? "Count forward" : "Count back"} ${ones} ${ones === 1 ? "one" : "ones"}${ones !== b % 10 ? " more" : ""}.`)
  }

  return {
    a, b, operation: adding ? "+" : "−", answer, steps,
    strategy: b === 0 ? "Zero keeps the number the same" : b >= 100 ? "Split into hundreds, tens, and ones" : b >= 10 ? "Split into tens and ones" : steps.length > 1 ? "Use a ten as a stepping stone" : adding ? "Count on" : "Count back",
  }
}

export interface TeachingQuestion {
  id: number
  question: string
  answer: number | string
}

export interface ArithmeticLesson {
  topic: string
  savedAt: number
  questions: TeachingQuestion[]
  answers: Record<number, string>
}

const key = (studentId: string) => `arithmetic:lessons:v1:${studentId}`

export function getArithmeticLessons(studentId: string): ArithmeticLesson[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key(studentId)) || "[]")
    if (!Array.isArray(value)) return []
    return value.filter((lesson): lesson is ArithmeticLesson => {
      if (!lesson || typeof lesson.topic !== "string" || typeof lesson.savedAt !== "number" || !Array.isArray(lesson.questions) || !lesson.answers || typeof lesson.answers !== "object") return false
      return lesson.questions.length > 0 && lesson.questions.every((q: TeachingQuestion) =>
        q && Number.isInteger(q.id) && typeof q.question === "string" &&
        (typeof q.answer === "number" || typeof q.answer === "string") && explainArithmetic(q.question, q.answer),
      ) && Object.values(lesson.answers).every((answer) => typeof answer === "string")
    })
  } catch {
    return []
  }
}

/** Keep the latest completed lesson per topic, separate for each selected child. */
export function saveArithmeticLesson(studentId: string, lesson: ArithmeticLesson): boolean {
  try {
    const questions = lesson.questions.filter((q) => explainArithmetic(q.question, q.answer))
    if (!questions.length) return false
    const next = [{ ...lesson, questions }, ...getArithmeticLessons(studentId).filter((l) => l.topic !== lesson.topic)].slice(0, 20)
    localStorage.setItem(key(studentId), JSON.stringify(next))
    return true
  } catch {
    return false
  }
}
