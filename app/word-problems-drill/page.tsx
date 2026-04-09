"use client"

import DrillPage, { type DrillQuestion } from "@/components/drill-page"

const ADDITION_PROBLEMS: DrillQuestion[] = [
  { id: 0, question: "There are 7 ducks in the pond. 5 more ducks swim over. How many ducks are there in all?", answer: 12 },
  { id: 1, question: "I have 6 crayons. My friend gives me 4 more. How many crayons do I have in all?", answer: 10 },
  { id: 2, question: "There are 9 books on the table. Mom puts 3 more books down. How many books are there altogether?", answer: 12 },
  { id: 3, question: "We pick 5 flowers. Then we pick 6 more flowers. How many flowers did we pick in all?", answer: 11 },
  { id: 4, question: "Sam has 8 toy cars. He gets 2 more toy cars. How many toy cars does he have now?", answer: 10 },
  { id: 5, question: "There are 4 puppies in the yard. 7 more puppies come out to play. How many puppies are there in all?", answer: 11 },
  { id: 6, question: "I see 3 red balloons and 8 blue balloons. How many balloons do I see altogether?", answer: 11 },
  { id: 7, question: "Mia finds 6 shells at the beach. Then she finds 5 more. How many shells does she have in all?", answer: 11 },
  { id: 8, question: "There are 2 frogs on a log. 9 more frogs jump up. How many frogs are on the log now?", answer: 11 },
  { id: 9, question: "Jack has 7 blocks. His sister gives him 6 more blocks. How many blocks does Jack have in all?", answer: 13 },
]

const SUBTRACTION_PROBLEMS: DrillQuestion[] = [
  { id: 10, question: "There are 15 cookies. We eat 4 of them. How many cookies are left?", answer: 11 },
  { id: 11, question: "I have 12 stickers. I give 3 away. How many stickers do I have left?", answer: 9 },
  { id: 12, question: "There are 14 apples in the basket. We use 5 apples. How many apples are left?", answer: 9 },
  { id: 13, question: "We catch 13 fish. We keep 6 of them. How many fish do we put back?", answer: 7 },
  { id: 14, question: "There are 11 birds in the tree. 2 birds fly away. How many birds are left?", answer: 9 },
  { id: 15, question: "I have 16 pennies. I spend 7 pennies. How many pennies do I have left?", answer: 9 },
  { id: 16, question: "There are 10 cupcakes. 3 cupcakes are eaten. How many cupcakes are left?", answer: 7 },
  { id: 17, question: "Lily has 18 beads. She gives 8 beads away. How many beads does she have left?", answer: 10 },
  { id: 18, question: "There are 17 leaves on the branch. 9 leaves fall off. How many leaves are left?", answer: 8 },
  { id: 19, question: "We have 14 toy animals. We put 5 away. How many toy animals are left out?", answer: 9 },
]

const MIXED_PROBLEMS: DrillQuestion[] = [
  { id: 20, question: "There are 8 hens in the coop. 4 more hens come in. How many hens are there in all?", answer: 12 },
  { id: 21, question: "I have 13 marbles. I lose 5 marbles. How many marbles are left?", answer: 8 },
  { id: 22, question: "Ben has 6 pencils. Ava has 7 pencils. How many pencils do they have in all?", answer: 13 },
  { id: 23, question: "There are 12 eggs. 3 eggs crack. How many eggs are left?", answer: 9 },
  { id: 24, question: "We see 5 green frogs and 6 yellow frogs. How many frogs do we see altogether?", answer: 11 },
  { id: 25, question: "There are 18 oranges. We eat 9 oranges. How many oranges are left?", answer: 9 },
  { id: 26, question: "Kim runs 3 laps. Dad runs 8 laps. How many laps do they run in all?", answer: 11 },
  { id: 27, question: "I have 11 toy trains. I give 4 away. How many toy trains do I have left?", answer: 7 },
  { id: 28, question: "There are 7 cats on the porch. 5 more cats come over. How many cats are there in all?", answer: 12 },
  { id: 29, question: "There are 16 stars on the page. 6 are crossed out. How many stars are left?", answer: 10 },
]

function generateQuestions(): DrillQuestion[] {
  const all = [...ADDITION_PROBLEMS, ...SUBTRACTION_PROBLEMS, ...MIXED_PROBLEMS]
  // Shuffle
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]]
  }
  return all.map((q, idx) => ({ ...q, id: idx }))
}

export default function WordProblemsDrillPage() {
  return (
    <DrillPage config={{
      title: "Word Problems Challenge",
      description: "30 addition, subtraction, and mixed word problems",
      subject: "Grade 1 • Word Problems",
      accentColor: "cyan",
      mode: "sequential",
      generateQuestions,
      totalTime: 600,
      questionCount: 30,
    }} />
  )
}
