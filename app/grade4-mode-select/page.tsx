"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sparkles, X, Divide } from "lucide-react"

export default function Grade4ModeSelectPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-6xl mx-auto w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="text-6xl mb-4">🎯</div>
          <h1 className="text-4xl font-bold text-slate-800">Choose Your Practice Mode</h1>
          <p className="text-lg text-slate-600">Pick the way you want to practice today!</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Adaptive Practice Mode */}
          <Card className="p-6 bg-white/90 backdrop-blur shadow-xl rounded-3xl hover:shadow-2xl transition-all hover:scale-105 cursor-pointer group">
            <button onClick={() => router.push("/practice")} className="w-full text-left">
              <div className="space-y-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 mx-auto group-hover:scale-110 transition-transform">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div className="text-center space-y-2">
                  <h2 className="text-xl font-bold text-slate-800">Adaptive Practice</h2>
                  <p className="text-sm text-slate-600">Smart practice with hints and Vedic math tricks!</p>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span>10 questions per session</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span>Hints & explanations</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span>Earn coins</span>
                  </div>
                </div>
                <Button className="w-full py-4 text-sm bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl">
                  Start Practice
                </Button>
              </div>
            </button>
          </Card>

          {/* Multiplication Drill */}
          <Card className="p-6 bg-white/90 backdrop-blur shadow-xl rounded-3xl hover:shadow-2xl transition-all hover:scale-105 cursor-pointer group">
            <button onClick={() => router.push("/multiplication-drill")} className="w-full text-left">
              <div className="space-y-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 mx-auto group-hover:scale-110 transition-transform">
                  <X className="w-8 h-8 text-white" />
                </div>
                <div className="text-center space-y-2">
                  <h2 className="text-xl font-bold text-slate-800">Multiplication Drill</h2>
                  <p className="text-sm text-slate-600">Master your times tables with speed!</p>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    <span>50 questions in 5 minutes</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    <span>Times tables 2-12</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    <span>Build speed & accuracy</span>
                  </div>
                </div>
                <Button className="w-full py-4 text-sm bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-xl">
                  Start Drill
                </Button>
              </div>
            </button>
          </Card>

          {/* Division Drill */}
          <Card className="p-6 bg-white/90 backdrop-blur shadow-xl rounded-3xl hover:shadow-2xl transition-all hover:scale-105 cursor-pointer group">
            <button onClick={() => router.push("/division-drill")} className="w-full text-left">
              <div className="space-y-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 mx-auto group-hover:scale-110 transition-transform">
                  <Divide className="w-8 h-8 text-white" />
                </div>
                <div className="text-center space-y-2">
                  <h2 className="text-xl font-bold text-slate-800">Division Drill</h2>
                  <p className="text-sm text-slate-600">Master division facts with practice!</p>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>50 questions in 5 minutes</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>Division facts 2-12</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>Boost calculation speed</span>
                  </div>
                </div>
                <Button className="w-full py-4 text-sm bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl">
                  Start Drill
                </Button>
              </div>
            </button>
          </Card>
        </div>

        <div className="text-center">
          <Button variant="outline" onClick={() => router.push("/")} className="px-8 py-3 rounded-xl">
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  )
}
