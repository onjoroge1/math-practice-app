import type { Skill, MathItem, Grade } from "./types"
import { getSkillsForGrade, getRandomItem, getSkillsForTopics } from "./mock-data"

export interface MasterySnapshot {
  skillId: string
  level: number
  attempts: number
  correctCount: number
  lastPracticed?: string | null
}

// Adaptive difficulty engine
export class AdaptiveEngine {
  // Determine which skills to practice based on mastery levels and selected topics
  static selectSkillsForPractice(
    grade: number,
    count = 3,
    mastery: MasterySnapshot[] = [],
  ): Skill[] {
    // Get selected topics from localStorage
    const selectedTopicsJson = localStorage.getItem("selectedTopics")
    let gradeSkills: Skill[]

    if (selectedTopicsJson) {
      const selectedTopics = JSON.parse(selectedTopicsJson) as string[]
      gradeSkills = getSkillsForTopics(grade as Grade, selectedTopics)
    } else {
      // Fallback: use all skills for the grade
      gradeSkills = getSkillsForGrade(grade as Grade)
    }

    // Sort skills by mastery level (prioritize lower mastery)
    const masteryBySkill = new Map(mastery.map((row) => [row.skillId, row]))
    const skillsWithMastery = gradeSkills.map((skill) => {
      const skillMastery = masteryBySkill.get(skill.id)
      return {
        skill,
        masteryLevel: skillMastery?.level ?? 0,
        lastPracticed: skillMastery?.lastPracticed
          ? new Date(skillMastery.lastPracticed).getTime()
          : null,
      }
    })

    // Sort: lowest mastery first, then by least recently practiced
    skillsWithMastery.sort((a, b) => {
      if (a.masteryLevel !== b.masteryLevel) {
        return a.masteryLevel - b.masteryLevel
      }
      // If same mastery, prioritize least recently practiced
      if (a.lastPracticed === null) return -1
      if (b.lastPracticed === null) return 1
      return a.lastPracticed - b.lastPracticed
    })

    return skillsWithMastery.slice(0, count).map((s) => s.skill)
  }

  // Determine difficulty level for a skill based on student's mastery
  static getDifficultyForSkill(skillId: string, snapshots: MasterySnapshot[] = []): number {
    const mastery = snapshots.find((row) => row.skillId === skillId)

    if (!mastery || mastery.level === 0) {
      return 1 // Start with easiest
    }

    const accuracy = mastery.correctCount / mastery.attempts

    // Adjust difficulty based on recent performance
    if (accuracy >= 0.9 && mastery.level < 5) {
      return Math.min(mastery.level + 1, 5) // Increase difficulty
    } else if (accuracy < 0.6 && mastery.level > 1) {
      return Math.max(mastery.level - 1, 1) // Decrease difficulty
    }

    return mastery.level
  }

  // Generate a practice session (list of items)
  static generatePracticeSession(
    grade: number,
    itemCount = 10,
    mastery: MasterySnapshot[] = [],
  ): MathItem[] {
    const skills = this.selectSkillsForPractice(grade, 3, mastery)
    const items: MathItem[] = []

    if (skills.length === 0) return items

    // Distribute items across selected skills
    const itemsPerSkill = Math.ceil(itemCount / skills.length)

    for (const skill of skills) {
      const difficulty = this.getDifficultyForSkill(skill.id, mastery)

      for (let i = 0; i < itemsPerSkill && items.length < itemCount; i++) {
        const item = getRandomItem(skill.id, difficulty)
        if (item) {
          items.push(item)
        }
      }
    }

    // Shuffle items for variety
    return items.sort(() => Math.random() - 0.5)
  }

  // Calculate coins earned based on performance
  static calculateCoins(correct: boolean, hintsUsed: number, timeSpent: number): number {
    if (!correct) return 0

    let coins = 10 // Base coins for correct answer

    // Bonus for no hints
    if (hintsUsed === 0) coins += 5

    // Bonus for speed (under 30 seconds)
    if (timeSpent < 30) coins += 3

    return coins
  }
}
