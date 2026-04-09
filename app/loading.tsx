export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-6xl animate-bounce">🎓</div>
        <p className="text-xl text-slate-600 font-medium">Loading...</p>
      </div>
    </div>
  )
}
