import { buildQuestion, type Operation, type QuizQuestion } from "@/lib/adaptive-quiz"

export type Grade2Operation = "addition" | "subtraction" | "multiplication" | "division"

export const GRADE2_TEST_QUESTION_COUNT = 50
export const GRADE2_TEST_SECONDS = 3 * 60

export interface Grade2OperationConfig {
  operation: Operation
  title: string
  subject: string
  directions: string
  icon: string
  accent: "blue" | "green" | "purple" | "orange"
}

export const GRADE2_OPERATION_CONFIG: Record<Grade2Operation, Grade2OperationConfig> = {
  addition: {
    operation: "+",
    title: "Addition Test",
    subject: "Addition facts to 20",
    directions: "Add each pair of numbers using any mental math strategy you choose.",
    icon: "➕",
    accent: "blue",
  },
  subtraction: {
    operation: "-",
    title: "Subtraction Test",
    subject: "Subtraction facts to 20",
    directions: "Subtract each pair of numbers using any mental math strategy you choose.",
    icon: "➖",
    accent: "green",
  },
  multiplication: {
    operation: "×",
    title: "Multiplication Test",
    subject: "2, 5, and 10 times tables",
    directions: "Multiply using the 2, 5, and 10 times tables you have practiced.",
    icon: "✖️",
    accent: "purple",
  },
  division: {
    operation: "÷",
    title: "Division Test",
    subject: "Division by 2, 5, and 10",
    directions: "Share each number into equal groups. Every problem has a whole-number answer.",
    icon: "➗",
    accent: "orange",
  },
}

function buildQuestionPool(kind: Grade2Operation): QuizQuestion[] {
  const questions: QuizQuestion[] = []
  const add = (a: number, operation: Operation, b: number) => {
    questions.push(buildQuestion(questions.length, a, operation, b))
  }

  if (kind === "addition") {
    for (let a = 1; a <= 19; a += 1) {
      for (let b = 1; a + b <= 20; b += 1) add(a, "+", b)
    }
  } else if (kind === "subtraction") {
    for (let a = 2; a <= 20; a += 1) {
      for (let b = 1; b <= a; b += 1) add(a, "-", b)
    }
  } else if (kind === "multiplication") {
    for (const table of [2, 5, 10]) {
      for (let factor = 1; factor <= 10; factor += 1) add(table, "×", factor)
    }
  } else {
    for (const divisor of [2, 5, 10]) {
      for (let quotient = 1; quotient <= 10; quotient += 1) add(divisor * quotient, "÷", divisor)
    }
  }

  return questions
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const shuffled = [...items]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }
  return shuffled
}

/**
 * Builds a fresh worksheet from Grade 2-safe facts. Multiplication and division
 * intentionally repeat some facts because their 2/5/10 fact pool is smaller
 * than the 50-question assessment used by the supplied worksheet.
 */
export function generateGrade2Test(
  kind: Grade2Operation,
  questionCount = GRADE2_TEST_QUESTION_COUNT,
  random: () => number = Math.random,
): QuizQuestion[] {
  const pool = buildQuestionPool(kind)
  const selected: QuizQuestion[] = []

  while (selected.length < questionCount) {
    for (const question of shuffle(pool, random)) {
      selected.push({ ...question, id: selected.length })
      if (selected.length === questionCount) break
    }
  }

  return selected
}

export function getGrade2Rubric(score: number): 1 | 2 | 3 {
  if (score >= 40) return 3
  if (score >= 35) return 2
  return 1
}

export function scoreGrade2Test(questions: QuizQuestion[], answers: string[]) {
  const answered = answers.filter((answer) => answer !== "").length
  const correct = questions.reduce((total, question, index) => {
    const answer = answers[index]
    return total + (answer !== "" && Number(answer) === question.answer ? 1 : 0)
  }, 0)

  return {
    correct,
    answered,
    accuracy: questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0,
    rubric: getGrade2Rubric(correct),
  }
}
