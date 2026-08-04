"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { AVATARS } from "@/lib/mock-data"
import { createStudentAction } from "@/lib/actions"
import { trackOnboardingComplete } from "@/lib/analytics"
import type { Grade } from "@/lib/types"

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [name, setName] = useState("")
  const [grade, setGrade] = useState<Grade | null>(null)
  const [avatarId, setAvatarId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleComplete = async () => {
    if (!name || !grade || !avatarId || isSubmitting) return
    setIsSubmitting(true)

    try {
      const student = await createStudentAction(name, grade, avatarId)
      localStorage.setItem("currentStudentId", student.id)
      localStorage.setItem("currentStudentGrade", String(grade))
      trackOnboardingComplete(grade)
      router.push("/topic-select")
    } catch (err) {
      console.error("Failed to create student:", err)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8 bg-white/90 backdrop-blur shadow-2xl rounded-3xl">
        {/* Progress indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 w-16 rounded-full transition-all ${s <= step ? "bg-indigo-600" : "bg-slate-200"}`}
            />
          ))}
        </div>

        {/* Step 1: Name */}
        {step === 1 && (
          <div className="space-y-6 animate-bounce-in">
            <div className="text-center space-y-2">
              <div className="text-6xl mb-4">👋</div>
              <h2 className="text-3xl font-bold text-slate-800">Welcome! What&apos;s your name?</h2>
              <p className="text-slate-600">Let&apos;s get to know you!</p>
            </div>
            <div className="space-y-4">
              <Input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-xl p-6 rounded-xl border-2 focus:border-indigo-600"
                autoFocus
                maxLength={50}
              />
              <Button
                onClick={() => setStep(2)}
                disabled={!name.trim()}
                className="w-full py-6 text-lg bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                size="lg"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Grade */}
        {step === 2 && (
          <div className="space-y-6 animate-bounce-in">
            <div className="text-center space-y-2">
              <div className="text-6xl mb-4">📚</div>
              <h2 className="text-3xl font-bold text-slate-800">What grade are you in?</h2>
              <p className="text-slate-600">This helps us find the right problems for you</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5].map((g) => (
                <button
                  key={g}
                  onClick={() => setGrade(g as Grade)}
                  className={`p-8 rounded-2xl border-3 transition-all text-2xl font-bold ${
                    grade === g
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-lg scale-105"
                      : "bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:shadow-md"
                  }`}
                >
                  Grade {g}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setStep(1)} variant="outline" className="flex-1 py-6 text-lg rounded-xl" size="lg">
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!grade}
                className="flex-1 py-6 text-lg bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                size="lg"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Avatar */}
        {step === 3 && (
          <div className="space-y-6 animate-bounce-in">
            <div className="text-center space-y-2">
              <div className="text-6xl mb-4">🎨</div>
              <h2 className="text-3xl font-bold text-slate-800">Choose your avatar!</h2>
              <p className="text-slate-600">Pick your learning buddy</p>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {AVATARS.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => setAvatarId(avatar.id)}
                  className={`p-6 rounded-2xl border-3 transition-all hover:scale-110 ${
                    avatarId === avatar.id
                      ? "bg-indigo-600 border-indigo-600 shadow-lg scale-105"
                      : "bg-white border-slate-200 hover:border-indigo-300"
                  }`}
                >
                  <div className="text-5xl mb-2">{avatar.emoji}</div>
                  <div className={`text-xs font-medium ${avatarId === avatar.id ? "text-white" : "text-slate-600"}`}>
                    {avatar.name}
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setStep(2)} variant="outline" className="flex-1 py-6 text-lg rounded-xl" size="lg">
                Back
              </Button>
              <Button
                onClick={handleComplete}
                disabled={!avatarId || isSubmitting}
                className="flex-1 py-6 text-lg bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                size="lg"
              >
                {isSubmitting ? "Setting up..." : "Start Diagnostic"}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
