import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-md text-center space-y-6">
        <div className="text-6xl">🔍</div>
        <h1 className="text-4xl font-bold text-slate-800">Page Not Found</h1>
        <p className="text-slate-600">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 py-3 text-lg">
            Go Home
          </Button>
        </Link>
      </div>
    </div>
  )
}
