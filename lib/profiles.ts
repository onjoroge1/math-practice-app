// Fixed kid profiles. This app is for two specific kids — there is no sign-up
// flow. Progress is stored in the `students` table under these names, and the
// home page resolves a profile to its student row on first click.

import type { Grade } from "./types"

export interface KidProfile {
  /** Stable slug used in localStorage keys and URLs. */
  key: string
  /** Display name — also the `students.name` this profile maps to. */
  name: string
  grade: Grade
  /** Matches an id in AVATARS (lib/mock-data). */
  avatar: string
  emoji: string
  /** Tailwind classes for the home-page card. */
  cardClass: string
  ringClass: string
}

export const PROFILES: KidProfile[] = [
  {
    key: "amir",
    name: "Amir",
    grade: 2,
    avatar: "rocket",
    emoji: "🚀",
    cardClass: "from-indigo-500 to-purple-600",
    ringClass: "ring-indigo-300",
  },
  {
    key: "aden",
    name: "Aden",
    grade: 5,
    avatar: "dragon",
    emoji: "🐉",
    cardClass: "from-emerald-500 to-teal-600",
    ringClass: "ring-emerald-300",
  },
]

export function getProfileByKey(key: string): KidProfile | undefined {
  return PROFILES.find((p) => p.key === key)
}

export function getProfileByName(name: string): KidProfile | undefined {
  const lower = name.trim().toLowerCase()
  return PROFILES.find((p) => p.name.toLowerCase() === lower)
}
