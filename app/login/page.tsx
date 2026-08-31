"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("admin")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [portalConfigured, setPortalConfigured] = useState<boolean | null>(null)

  useEffect(() => {
    let active = true
    fetch("/api/auth/setup-status", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { configured?: boolean }) => {
        if (active) setPortalConfigured(data.configured === true)
      })
      .catch(() => {
        if (active) setPortalConfigured(null)
      })
    return () => {
      active = false
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError(portalConfigured === false
          ? "The parent portal still needs its Vercel secrets. Add AUTH_SECRET and PARENT_ADMIN_PASSWORD, then redeploy."
          : "Invalid username or password")
        return
      }

      router.replace("/parent")
      router.refresh()
    } catch {
      setError("We couldn't sign you in. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 bg-white/90 backdrop-blur shadow-2xl rounded-3xl">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
          <h1 className="text-3xl font-bold text-slate-800">Parent Login</h1>
          <p className="text-slate-600 mt-2">Sign in to view your child&apos;s progress</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {portalConfigured === false && (
            <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <strong>One-time setup needed:</strong> this deployment is missing <code>AUTH_SECRET</code> or a 12+ character <code>PARENT_ADMIN_PASSWORD</code>. Add both in Vercel and redeploy.
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium text-slate-700">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={50}
              className="p-3 rounded-xl border-2 focus:border-indigo-600"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              minLength={12}
              className="p-3 rounded-xl border-2 focus:border-indigo-600"
            />
          </div>

          {error && (
            <div role="alert" className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full py-6 text-lg bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
            size="lg"
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
            ← Back to Home
          </Link>
        </div>
      </Card>
    </div>
  )
}
