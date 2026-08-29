import { describe, expect, it } from "vitest"
import { PROFILES, getProfileByKey, getProfileByName } from "@/lib/profiles"

describe("fixed kid profiles", () => {
  it("maps Amir to Grade 2 and Aden to Grade 5", () => {
    expect(getProfileByKey("amir")?.grade).toBe(2)
    expect(getProfileByKey("aden")?.grade).toBe(5)
  })

  it("keeps profile keys and names unique", () => {
    expect(new Set(PROFILES.map((profile) => profile.key)).size).toBe(PROFILES.length)
    expect(new Set(PROFILES.map((profile) => profile.name.toLowerCase())).size).toBe(PROFILES.length)
  })

  it("resolves names case-insensitively", () => {
    expect(getProfileByName(" AMIR ")?.key).toBe("amir")
    expect(getProfileByName("aden")?.key).toBe("aden")
  })
})
