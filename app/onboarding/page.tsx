import { redirect } from "next/navigation"

/**
 * The name / grade / avatar wizard was removed — this app has two fixed
 * profiles (Amir and Aden) chosen on the home page. Any old link or bookmark
 * pointing here goes back to the picker.
 */
export default function OnboardingPage() {
  redirect("/")
}
