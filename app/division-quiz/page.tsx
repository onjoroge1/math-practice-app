"use client"

import MentalMathQuiz from "@/components/mental-math-quiz"

export default function DivisionQuizPage() {
  return (
    <MentalMathQuiz
      config={{
        kind: "division",
        title: "Division Quiz",
        subject: "Division",
        description: "Sharing into equal groups",
        accentColor: "orange",
        icon: "➗",
      }}
    />
  )
}
