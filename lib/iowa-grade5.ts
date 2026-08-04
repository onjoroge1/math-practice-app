// Iowa-style Grade 5 comprehensive practice battery.
// Data is extracted from the Iowa_Grade_5_Comprehensive_Practice_Package (361 questions,
// 10 subtests). This is independent practice material, not an official Iowa Assessments test.
import rawData from "./data/iowa-grade5.json"

export interface IowaChoice {
  label: string // "A" | "B" | "C" | "D" | "E"
  text: string
}

export interface IowaQuestion {
  number: number
  stem: string
  choices: IowaChoice[]
  answer: string // correct choice label
  stimulusId: string | null
}

export interface IowaStimulus {
  id: string
  title: string
  body: string
}

export interface IowaUnit {
  id: string
  name: string
  poolSize: number
  sampleSize: number
  suggestedMinutes: number
  primarySkills: string
  passageBased: boolean
  stimuli: IowaStimulus[]
  questions: IowaQuestion[]
}

export interface IowaData {
  units: IowaUnit[]
}

export const IOWA: IowaData = rawData as IowaData
export const IOWA_UNITS: IowaUnit[] = IOWA.units

/** Target number of questions presented per unit attempt. */
export const IOWA_TARGET = 25

export function getIowaUnit(id: string): IowaUnit | undefined {
  return IOWA.units.find((u) => u.id === id)
}

export function stimulusFor(unit: IowaUnit, q: IowaQuestion): IowaStimulus | undefined {
  if (!q.stimulusId) return undefined
  return unit.stimuli.find((s) => s.id === q.stimulusId)
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Passage-aware, coverage-biased sampler.
 * - Questions that share a stimulus (reading passages, writing drafts) are kept together,
 *   so a sampled passage always brings its whole question group.
 * - Groups containing not-yet-seen questions are preferred, so repeat attempts surface new
 *   material before repeating. `seen` holds question numbers the student has already answered.
 * Returns roughly `target` questions (whole groups, so it may slightly overshoot).
 */
export function sampleUnit(
  unit: IowaUnit,
  target: number = IOWA_TARGET,
  seen: Set<number> = new Set(),
  rng: () => number = Math.random,
): IowaQuestion[] {
  const groups = new Map<string, IowaQuestion[]>()
  const order: string[] = []
  unit.questions.forEach((q, i) => {
    const key = q.stimulusId ?? `__solo_${i}`
    if (!groups.has(key)) {
      groups.set(key, [])
      order.push(key)
    }
    groups.get(key)!.push(q)
  })

  const fresh: string[] = []
  const repeated: string[] = []
  for (const key of order) {
    if (groups.get(key)!.some((q) => !seen.has(q.number))) fresh.push(key)
    else repeated.push(key)
  }
  const ordered = [...shuffle(fresh, rng), ...shuffle(repeated, rng)]

  const picked: IowaQuestion[] = []
  for (const key of ordered) {
    if (picked.length >= target) break
    picked.push(...groups.get(key)!)
  }
  return picked
}

export type IowaBandTone = "emerald" | "sky" | "amber" | "rose"

export interface IowaBand {
  min: number
  label: string
  tone: IowaBandTone
  guidance: string
}

// Performance bands from the package's scoring guide (instructional guidelines only —
// not official percentile ranks or proficiency classifications).
export const IOWA_BANDS: IowaBand[] = [
  { min: 90, label: "Strong readiness", tone: "emerald", guidance: "Maintain skills and practice pacing." },
  { min: 80, label: "Generally on track", tone: "sky", guidance: "Review missed skill categories and retry similar items." },
  { min: 70, label: "Developing", tone: "amber", guidance: "Provide targeted instruction before another full simulation." },
  { min: 0, label: "Needs focused review", tone: "rose", guidance: "Use shorter lessons and untimed practice by skill." },
]

export function bandFor(percent: number): IowaBand {
  return IOWA_BANDS.find((b) => percent >= b.min) ?? IOWA_BANDS[IOWA_BANDS.length - 1]
}
