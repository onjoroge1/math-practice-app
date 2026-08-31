import { afterEach, describe, expect, it, vi } from "vitest"
import { GET } from "@/app/api/auth/setup-status/route"

afterEach(() => vi.unstubAllEnvs())

describe("parent portal setup status", () => {
  it("reports ready only when both required secrets are configured", async () => {
    vi.stubEnv("AUTH_SECRET", "a-private-auth-secret")
    vi.stubEnv("PARENT_ADMIN_PASSWORD", "a-private-parent-password")

    const response = await GET()
    expect(await response.json()).toEqual({ configured: true })
    expect(response.headers.get("cache-control")).toBe("no-store")
  })

  it("reports incomplete without exposing which secret or its value", async () => {
    vi.stubEnv("AUTH_SECRET", "")
    vi.stubEnv("PARENT_ADMIN_PASSWORD", "short")

    const response = await GET()
    expect(await response.json()).toEqual({ configured: false })
  })
})
