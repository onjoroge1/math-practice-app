"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Clock, Sparkles } from "lucide-react"

const SPEED_DRILLS = [
  {
    title: "Easy (0–20)",
    description: "Single-digit addition & subtraction — build your foundation",
    emoji: "🟢",
    href: "/timed-drill",
    gradient: "from-green-500 to-emerald-600",
    bullet: "bg-green-500",
  },
  {
    title: "Medium (10–50)",
    description: "Two-digit numbers up to 50 — step it up!",
    emoji: "🟡",
    href: "/timed-drill-medium",
    gradient: "from-yellow-500 to-amber-600",
    bullet: "bg-yellow-500",
  },
  {
    title: "Hard (50–100)",
    description: "Two-digit numbers up to 100 — challenge mode!",
    emoji: "🔴",
    href: "/timed-drill-hard",
    gradient: "from-red-500 to-rose-600",
    bullet: "bg-red-500",
  },
  {
    title: "Word Problems",
    description: "30 story problems — read carefully and solve!",
    emoji: "📖",
    href: "/word-problems-drill",
    gradient: "from-cyan-500 to-blue-600",
    bullet: "bg-cyan-500",
  },
]

export default function Grade1ModeSelectPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-5xl mx-auto w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="text-6xl mb-4">🎯</div>
          <h1 className="text-4xl font-bold text-slate-800">Choose Your Practice Mode</h1>
          <p className="text-lg text-slate-600">Pick the way you want to practice today!</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-8 bg-white/90 backdrop-blur shadow-xl rounded-3xl hover:shadow-2xl transition-all hover:scale-105 cursor-pointer group">
            <button onClick={() => router.push("/practice")} className="w-full text-left">
              <div className="space-y-6">
                <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 mx-auto group-hover:scale-110 transition-transform">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold text-slate-800">Adaptive Practice</h2>
                  <p className="text-slate-600">
                    Smart practice that adapts to your level with hints, explanations, and Vedic math tricks!
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-700">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm">10 questions per session</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm">Hints available</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm">Learn Vedic math tricks</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm">Earn coins for correct answers</span>
                  </div>
                </div>
                <Button className="w-full py-6 text-lg bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl">
                  Start Adaptive Practice
                </Button>
              </div>
            </button>
          </Card>

          <Card className="p-8 bg-white/90 backdrop-blur shadow-xl rounded-3xl">
            <div className="space-y-6">
              <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 mx-auto">
                <Clock className="w-10 h-10 text-white" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-slate-800">Speed Drills</h2>
                <p className="text-slate-600">
                  Race against the clock! Pick your difficulty level.
                </p>
              </div>
              <div className="space-y-3">
                {SPEED_DRILLS.map((drill) => (
                  <button
                    key={drill.href}
                    onClick={() => router.push(drill.href)}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-200 hover:border-indigo-400 hover:shadow-md bg-white hover:bg-indigo-50/50 transition-all text-left group/drill"
                  >
                    <div className="text-3xl flex-shrink-0">{drill.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-800 group-hover/drill:text-indigo-700">{drill.title}</div>
                      <div className="text-sm text-slate-500">{drill.description}</div>
                    </div>
                    <div className="text-slate-400 group-hover/drill:text-indigo-500 text-xl">→</div>
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <div className="text-center">
          <Button variant="outline" onClick={() => router.push("/topic-select")} className="px-8 py-3 rounded-xl">
            ← Back to Topics
          </Button>
        </div>
      </div>
    </div>
  )
}
