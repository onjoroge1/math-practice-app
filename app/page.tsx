"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PROFILES, type KidProfile } from "@/lib/profiles"
import { getOrCreateProfileStudentAction } from "@/lib/actions"

export default function HomePage() {
  const router = useRouter()
  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  const [error, setError] = useState("")

  async function pickProfile(profile: KidProfile) {
    if (loadingKey) return
    setLoadingKey(profile.key)
    setError("")

    try {
      const student = await getOrCreateProfileStudentAction(profile.key)

      if (!student) {
        setError("We couldn't load this profile. Check the connection and try again.")
        return
      }

      localStorage.setItem("currentStudentId", student.id)
      localStorage.setItem("currentStudentGrade", String(student.grade))
      localStorage.setItem("currentProfileKey", profile.key)
      localStorage.setItem("currentStudentName", student.name)

      router.push("/topic-select")
    } catch {
      setError("We couldn't load this profile. Check the connection and try again.")
    } finally {
      setLoadingKey(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full space-y-10">
        <div className="text-center space-y-3">
          <div className="text-6xl">🎓</div>
          <h1 className="text-4xl sm:text-5xl font-bold text-indigo-600">Math Practice</h1>
          <p className="text-xl text-slate-600">Who&apos;s practicing today?</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {PROFILES.map((profile) => {
            const isLoading = loadingKey === profile.key
            return (
              <Card
                key={profile.key}
                role="button"
                tabIndex={0}
                aria-label={`Practice as ${profile.name}, Grade ${profile.grade}`}
                onClick={() => pickProfile(profile)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    pickProfile(profile)
                  }
                }}
                className={`bg-gradient-to-br ${profile.cardClass} text-white border-0 p-10 rounded-3xl cursor-pointer shadow-lg
                  transition-all hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 ${profile.ringClass}
                  ${loadingKey && !isLoading ? "opacity-50" : ""}`}
              >
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="text-7xl">{profile.emoji}</div>
                  <h2 className="text-4xl font-bold">{profile.name}</h2>
                  <p className="text-lg opacity-90">Grade {profile.grade}</p>
                  {isLoading && <p className="text-sm opacity-80 animate-pulse">Getting things ready…</p>}
                </div>
              </Card>
            )
          })}
        </div>

        {error && (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-center text-red-700">
            {error}
          </div>
        )}

        <div className="text-center">
          <Link href="/parent">
            <Button
              variant="outline"
              className="px-8 py-6 text-base rounded-2xl border-2 border-slate-300 text-slate-600 hover:bg-white bg-transparent"
            >
              👨‍👩‍👦 Parent Portal
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
