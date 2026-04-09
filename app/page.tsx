import Link from "next/link"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth"

export default async function HomePage() {
  const session = await auth()
  const isLoggedIn = !!session?.user

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-4">
          <div className="text-7xl">🎓</div>
          <h1 className="text-5xl font-bold text-indigo-600">Math Practice</h1>
          <p className="text-xl text-slate-600">Learn math at your own pace with fun, adaptive practice!</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/onboarding">
            <Button
              size="lg"
              className="text-lg px-8 py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all"
            >
              Start Learning
            </Button>
          </Link>
          <Link href="/parent">
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 rounded-2xl bg-transparent"
            >
              Parent Dashboard
            </Button>
          </Link>
        </div>

        {!isLoggedIn && (
          <div className="flex gap-3 justify-center text-sm">
            <Link href="/login" className="text-indigo-600 hover:text-indigo-800 font-medium">
              Parent Login
            </Link>
            <span className="text-slate-400">|</span>
            <Link href="/signup" className="text-indigo-600 hover:text-indigo-800 font-medium">
              Create Parent Account
            </Link>
          </div>
        )}

        {isLoggedIn && (
          <p className="text-sm text-slate-500">
            Signed in as <span className="font-medium text-slate-700">{session.user.name}</span>
          </p>
        )}

        <div className="grid sm:grid-cols-3 gap-6 mt-12">
          <div className="bg-white/80 backdrop-blur p-6 rounded-2xl shadow-md">
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="font-bold text-lg text-slate-800 mb-2">Adaptive Learning</h3>
            <p className="text-sm text-slate-600">Problems adjust to your level</p>
          </div>
          <div className="bg-white/80 backdrop-blur p-6 rounded-2xl shadow-md">
            <div className="text-4xl mb-3">⭐</div>
            <h3 className="font-bold text-lg text-slate-800 mb-2">Earn Rewards</h3>
            <p className="text-sm text-slate-600">Collect coins and build streaks</p>
          </div>
          <div className="bg-white/80 backdrop-blur p-6 rounded-2xl shadow-md">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="font-bold text-lg text-slate-800 mb-2">Track Progress</h3>
            <p className="text-sm text-slate-600">See your mastery grow</p>
          </div>
        </div>
      </div>
    </div>
  )
}
