"use client"

import { Button } from "@/components/ui/button"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-md text-center space-y-6">
        <div className="text-6xl">😵</div>
        <h1 className="text-3xl font-bold text-slate-800">Something went wrong</h1>
        <p className="text-slate-600">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            onClick={reset}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 py-3"
          >
            Try Again
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/")}
            className="rounded-xl px-6 py-3"
          >
            Go Home
          </Button>
        </div>
      </div>
    </div>
  )
}
