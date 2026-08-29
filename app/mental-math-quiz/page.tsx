"use client"

import MentalMathQuiz from "@/components/mental-math-quiz"

export default function MentalMathQuizPage() {
  return (
    <MentalMathQuiz
      config={{
        kind: "mental-math",
        title: "Mental Math Quiz",
        subject: "Mental Math",
        description: "Adding and subtracting in your head",
        accentColor: "green",
        icon: "🧠",
      }}
    />
  )
}
