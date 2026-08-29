"use client"

import MentalMathQuiz from "@/components/mental-math-quiz"

export default function TimesTablesQuizPage() {
  return (
    <MentalMathQuiz
      config={{
        kind: "multiplication",
        title: "Times Tables Quiz",
        subject: "Multiplication",
        description: "Pick your tables — or mix them up",
        accentColor: "purple",
        icon: "✖️",
      }}
    />
  )
}
