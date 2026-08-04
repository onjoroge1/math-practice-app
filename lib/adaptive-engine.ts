import type { Skill, MathItem, Grade } from "./types"
import { getMastery, getSkillsForGrade, getRandomItem, getSkillsForTopics } from "./mock-data"

// Adaptive difficulty engine
export class AdaptiveEngine {
  // Determine which skills to practice based on mastery levels and selected topics
  static selectSkillsForPractice(studentId: string, grade: number, count = 3): Skill[] {
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
    const skillsWithMastery = gradeSkills.map((skill) => {
      const mastery = getMastery(studentId, skill.id)
      return {
        skill,
        masteryLevel: mastery?.level ?? 0,
        lastPracticed: mastery?.lastPracticed,
      }
    })

    // Sort: lowest mastery first, then by least recently practiced
    skillsWithMastery.sort((a, b) => {
      if (a.masteryLevel !== b.masteryLevel) {
        return a.masteryLevel - b.masteryLevel
      }
      // If same mastery, prioritize least recently practiced
      if (!a.lastPracticed) return -1
      if (!b.lastPracticed) return 1
      return a.lastPracticed.getTime() - b.lastPracticed.getTime()
    })

    return skillsWithMastery.slice(0, count).map((s) => s.skill)
  }

  // Determine difficulty level for a skill based on student's mastery
  static getDifficultyForSkill(studentId: string, skillId: string): number {
    const mastery = getMastery(studentId, skillId)

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
  static generatePracticeSession(studentId: string, grade: number, itemCount = 10): MathItem[] {
    const skills = this.selectSkillsForPractice(studentId, grade, 3)
    const items: MathItem[] = []

    // Distribute items across selected skills
    const itemsPerSkill = Math.ceil(itemCount / skills.length)

    for (const skill of skills) {
      const difficulty = this.getDifficultyForSkill(studentId, skill.id)

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
