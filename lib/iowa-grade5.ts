// Iowa-style Grade 5 comprehensive practice battery.
// Original data is extracted from the Iowa_Grade_5_Comprehensive_Practice_Package (361 questions,
// 10 subtests). This is independent practice material, not an official Iowa Assessments test.
import rawData from "./data/iowa-grade5.json"
import explanationData from "./data/iowa-explanations.json"
import expansionData from "./data/iowa-expansion.json"

export interface IowaChoice {
  label: string // "A" | "B" | "C" | "D" | "E"
  text: string
}

export interface IowaExplanation {
  skill: string
  steps: string[]
}

export interface IowaQuestion {
  explanation?: IowaExplanation
  retired?: boolean
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

const explanations = explanationData as Record<string, Record<string, IowaExplanation>>
const additions = expansionData as { questions: Record<string, IowaQuestion[]>; stimuli: Record<string, IowaStimulus[]> }
export const IOWA: IowaData = { units: rawData.units.map((unit) => {
  const questions: IowaQuestion[] = unit.questions.map((q) => ({ ...q,
    // Preserve IDs/keys for historical scores, but do not ask ambiguous editing items again.
    stem: q.stem.replaceAll("&gt;", ">").replaceAll("&lt;", "<"),
    choices: q.choices.map((c) => ({ ...c, text: c.text.replaceAll("&gt;", ">").replaceAll("&lt;", "<") })),
    retired: unit.id === "punctuation" && [1, 5, 14].includes(q.number),
    stimulusId: unit.id === "vocabulary" ? null : q.stimulusId,
    explanation: explanations[unit.id]?.[q.number],
  }))
  questions.push(...(additions.questions[unit.id] ?? []))
  return { ...unit, questions, poolSize: questions.length,
    stimuli: [...unit.stimuli, ...(additions.stimuli[unit.id] ?? [])] }
}) }
export const IOWA_ACTIVE_COUNT = IOWA.units.reduce((total, unit) => total + unit.questions.filter((q) => !q.retired).length, 0)
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

export function scoreIowaAttempt(questions: IowaQuestion[], answers: Record<number, string>) {
  const total = questions.length
  const answered = questions.filter((question) => Boolean(answers[question.number])).length
  const correct = questions.filter((question) => answers[question.number] === question.answer).length
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0
  return { total, answered, correct, percent, band: bandFor(percent) }
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
  unit.questions.filter((q) => !q.retired).forEach((q, i) => {
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
