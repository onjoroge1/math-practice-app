import { describe, it, expect } from "vitest"
import { SKILLS, MATH_ITEMS, AVATARS, getSkillsForGrade, getItemsForSkill, getSkillsForTopics } from "@/lib/mock-data"
import type { Grade } from "@/lib/types"

describe("Data integrity: SKILLS array", () => {
  it("has unique skill IDs", () => {
    const ids = SKILLS.map((s) => s.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it("every skill has required fields", () => {
    SKILLS.forEach((skill) => {
      expect(skill.id).toBeTruthy()
      expect(skill.name).toBeTruthy()
      expect(skill.category).toBeTruthy()
      expect([1, 2, 3, 4, 5]).toContain(skill.grade)
      expect(skill.description).toBeTruthy()
      expect(Array.isArray(skill.prerequisites)).toBe(true)
    })
  })

  it("all prerequisite skill IDs reference existing skills", () => {
    const skillIds = new Set(SKILLS.map((s) => s.id))
    SKILLS.forEach((skill) => {
      skill.prerequisites.forEach((prereq) => {
        expect(skillIds.has(prereq)).toBe(true)
      })
    })
  })

  it("has skills for every grade 1-4", () => {
    for (const grade of [1, 2, 3, 4, 5] as Grade[]) {
      const gradeSkills = SKILLS.filter((s) => s.grade === grade)
      expect(gradeSkills.length).toBeGreaterThan(0)
    }
  })
})

describe("Data integrity: MATH_ITEMS array", () => {
  it("has unique item IDs", () => {
    const ids = MATH_ITEMS.map((i) => i.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it("every item references an existing skill", () => {
    const skillIds = new Set(SKILLS.map((s) => s.id))
    const orphans: string[] = []
    MATH_ITEMS.forEach((item) => {
      if (!skillIds.has(item.skillId)) {
        orphans.push(`${item.id} → ${item.skillId}`)
      }
    })
    expect(orphans).toEqual([])
  })

  it("every item has a valid difficulty between 1 and 5", () => {
    MATH_ITEMS.forEach((item) => {
      expect(item.difficulty).toBeGreaterThanOrEqual(1)
      expect(item.difficulty).toBeLessThanOrEqual(5)
    })
  })

  it("every item has a question and answer", () => {
    MATH_ITEMS.forEach((item) => {
      expect(item.question).toBeTruthy()
      expect(item.answer !== undefined && item.answer !== null).toBe(true)
    })
  })

  it("total item count exceeds 100", () => {
    expect(MATH_ITEMS.length).toBeGreaterThan(100)
  })
})

describe("Data integrity: AVATARS", () => {
  it("has at least 4 avatars", () => {
    expect(AVATARS.length).toBeGreaterThanOrEqual(4)
  })

  it("each avatar has an id, emoji, and name", () => {
    AVATARS.forEach((avatar) => {
      expect(avatar.id).toBeTruthy()
      expect(avatar.emoji).toBeTruthy()
      expect(avatar.name).toBeTruthy()
    })
  })
})

describe("getSkillsForGrade", () => {
  it("returns only skills for the requested grade", () => {
    for (const grade of [1, 2, 3, 4, 5] as Grade[]) {
      const skills = getSkillsForGrade(grade)
      expect(skills.length).toBeGreaterThan(0)
      skills.forEach((s) => expect(s.grade).toBe(grade))
    }
  })
})

describe("getItemsForSkill", () => {
  it("returns items only for the requested skill", () => {
    const items = getItemsForSkill("add-sub-within-10")
    expect(items.length).toBeGreaterThan(0)
    items.forEach((item) => {
      expect(item.skillId).toBe("add-sub-within-10")
    })
  })

  it("returns empty array for nonexistent skill", () => {
    expect(getItemsForSkill("nonexistent")).toEqual([])
  })
})

describe("getSkillsForTopics", () => {
  it("returns skills matching the topic categories for grade 1", () => {
    const skills = getSkillsForTopics(1, ["addition-subtraction"])
    expect(skills.length).toBeGreaterThan(0)
    skills.forEach((s) => expect(s.grade).toBe(1))
  })

  it("returns all grade skills when no topics provided", () => {
    const allSkills = getSkillsForGrade(2)
    const topicSkills = getSkillsForTopics(2, [])
    expect(topicSkills.length).toBe(allSkills.length)
  })
})
