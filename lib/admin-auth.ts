import { createHash, timingSafeEqual } from "node:crypto"

export const FAMILY_ADMIN_ID = "family-admin"
export const FAMILY_ADMIN_NAME = "Parent Admin"

function digest(value: string) {
  return createHash("sha256").update(value).digest()
}

function safeEqual(left: string, right: string) {
  return timingSafeEqual(digest(left), digest(right))
}

/**
 * Validate the one family-admin credential without storing it in source code.
 * The username comparison is case-insensitive; the password remains exact.
 */
export function verifyAdminCredentials(username: string, password: string) {
  const expectedUsername = (process.env.PARENT_ADMIN_USERNAME || "admin").trim().toLowerCase()
  const expectedPassword = process.env.PARENT_ADMIN_PASSWORD

  // Fail closed when the deployment secret is absent or unreasonably short.
  if (!expectedPassword || expectedPassword.length < 12) return false

  const usernameMatches = safeEqual(username.trim().toLowerCase(), expectedUsername)
  const passwordMatches = safeEqual(password, expectedPassword)
  return usernameMatches && passwordMatches
}
