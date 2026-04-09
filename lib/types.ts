// Core data types for the math practice app

export type Grade = 1 | 2 | 3 | 4

export type SkillCategory =
  | "counting"
  | "addition"
  | "subtraction"
  | "multiplication"
  | "division"
  | "place-value"
  | "fractions"
  | "geometry"
  | "operations-algebraic"
  | "number-place-value"
  | "measurement"
  | "time"
  | "money"

export interface Skill {
  id: string
  name: string
  category: SkillCategory
  grade: Grade
  description: string
  prerequisites: string[] // skill IDs
}

export interface MathItem {
  id: string
  skillId: string
  difficulty: number // 1-5
  question: string
  answer: string | number
  choices?: (string | number)[] // for multiple choice
  hint?: string
  explanation?: string
  vedicTrick?: {
    name: string
    steps: string[]
  }
  imageUrl?: string
}

export interface Student {
  id: string
  name: string
  grade: Grade
  avatarId: string
  coins: number
  streak: number
  createdAt: Date
  lastPracticeDate?: Date
}

export interface Mastery {
  id: string
  studentId: string
  skillId: string
  level: number // 0-5 (0=not started, 5=mastered)
  attempts: number
  correctCount: number
  lastPracticed?: Date
  updatedAt: Date
}

export interface Attempt {
  id: string
  studentId: string
  itemId: string
  skillId: string
  correct: boolean
  timeSpent: number // seconds
  hintsUsed: number
  timestamp: Date
}

export interface PracticeSession {
  id: string
  studentId: string
  date: Date
  itemsCompleted: number
  accuracy: number
  timeSpent: number
  coinsEarned: number
}

export interface Topic {
  id: string
  name: string
  description: string
  icon: string
  category: SkillCategory
  grades: Grade[]
}
