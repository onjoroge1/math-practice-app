import { afterEach, describe, expect, it, vi } from "vitest"
import { verifyAdminCredentials } from "@/lib/admin-auth"

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("family admin credentials", () => {
  it("accepts the configured password and default admin username", () => {
    vi.stubEnv("PARENT_ADMIN_PASSWORD", "a-private-test-password")
    expect(verifyAdminCredentials("admin", "a-private-test-password")).toBe(true)
  })

  it("normalizes username casing and surrounding whitespace", () => {
    vi.stubEnv("PARENT_ADMIN_USERNAME", "FamilyAdmin")
    vi.stubEnv("PARENT_ADMIN_PASSWORD", "a-private-test-password")
    expect(verifyAdminCredentials(" familyADMIN ", "a-private-test-password")).toBe(true)
  })

  it("rejects an incorrect username or password", () => {
    vi.stubEnv("PARENT_ADMIN_PASSWORD", "a-private-test-password")
    expect(verifyAdminCredentials("someone-else", "a-private-test-password")).toBe(false)
    expect(verifyAdminCredentials("admin", "wrong-password-value")).toBe(false)
  })

  it("fails closed when the password secret is missing or too short", () => {
    vi.stubEnv("PARENT_ADMIN_PASSWORD", "")
    expect(verifyAdminCredentials("admin", "")).toBe(false)

    vi.stubEnv("PARENT_ADMIN_PASSWORD", "short")
    expect(verifyAdminCredentials("admin", "short")).toBe(false)
  })
})
