import { track } from "@vercel/analytics"

/** Fire a custom analytics event. No-ops gracefully outside production. */
function safeTrack(event: string, properties?: Record<string, string | number | boolean>) {
  try {
    track(event, properties)
  } catch {
    // analytics not loaded — ignore
  }
}

export function trackOnboardingComplete(grade: number) {
  safeTrack("onboarding_completed", { grade })
}

export function trackDrillStarted(topic: string, grade: number) {
  safeTrack("drill_started", { topic, grade })
}

export function trackDrillCompleted(topic: string, grade: number, accuracy: number, correct: number, total: number) {
  safeTrack("drill_completed", { topic, grade, accuracy, correct, total })
}

export function trackPracticeStarted(grade: number, mode: string) {
  safeTrack("practice_started", { grade, mode })
}

export function trackTopicsSelected(topics: string[], grade: number) {
  safeTrack("topics_selected", { topics: topics.join(","), count: topics.length, grade })
}

export function trackParentSignup() {
  safeTrack("parent_signup")
}

export function trackParentLogin() {
  safeTrack("parent_login")
}
