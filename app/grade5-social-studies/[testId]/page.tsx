import Grade5SocialStudiesTest from "@/components/grade5-social-studies-test"

export default async function Grade5SocialStudiesTestPage({ params }: { params: Promise<{ testId: string }> }) {
  const { testId } = await params
  return <Grade5SocialStudiesTest testId={testId} />
}
