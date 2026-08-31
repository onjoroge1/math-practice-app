export interface SocialStudiesQuestion {
  id: string
  unit: "chapter-7" | "chapter-8"
  skill: string
  prompt: string
  choices: readonly [string, string, string, string]
  answer: number
  explanation: string
}

export interface SocialStudiesTest {
  id: "chapter-7" | "chapter-8" | "wednesday-review"
  title: string
  shortTitle: string
  description: string
  icon: string
  questionIds: readonly string[]
}

const q = (
  id: string,
  unit: SocialStudiesQuestion["unit"],
  skill: string,
  prompt: string,
  choices: SocialStudiesQuestion["choices"],
  answer: number,
  explanation: string,
): SocialStudiesQuestion => ({ id, unit, skill, prompt, choices, answer, explanation })

/**
 * Curated from Aden's uploaded Chapter 7 and Chapter 8 class materials.
 * Wording is original so the app teaches the facts without reproducing textbook pages.
 */
export const SOCIAL_STUDIES_QUESTIONS: readonly SocialStudiesQuestion[] = [
  q("c7-01", "chapter-7", "Railroads", "How did many people travel west over land in the 1840s?", ["In automobiles", "In wagons pulled by animals", "On airplanes", "On electric trains"], 1, "Many travelers went overland in wagons pulled by horses, mules, or oxen."),
  q("c7-02", "chapter-7", "Communication", "What did Samuel Morse's telegraph send over wires?", ["Electric signals", "Steam", "Printed newspapers", "Radio waves"], 0, "The telegraph sent electric signals. Morse code used patterns of dots and dashes for letters."),
  q("c7-03", "chapter-7", "Communication", "Why was the telegraph important in the 1800s?", ["It made crops grow faster", "It carried cattle", "It sent messages long distances in seconds", "It built railroad tracks"], 2, "The telegraph changed communication by sending news and messages much faster than mail."),
  q("c7-04", "chapter-7", "Communication", "Which person would most likely use the telegraph to send a battle plan?", ["A Civil War general", "A homesteader digging a well", "A cowboy branding cattle", "A farmer planting wheat"], 0, "Generals used telegraphs for battle plans; reporters, bankers, families, and friends also used them."),
  q("c7-05", "chapter-7", "Railroads", "What is a transcontinental railroad?", ["A railroad inside one city", "A railroad that crosses a continent", "A railroad used only for cattle", "A railroad under the ocean"], 1, "Transcontinental means crossing a continent."),
  q("c7-06", "chapter-7", "Railroads", "Which law helped the Union Pacific and Central Pacific build the railroad?", ["Homestead Act", "Pacific Railway Act", "19th Amendment", "Civil Rights Act"], 1, "Congress passed the Pacific Railway Act in 1862 and provided loans and land."),
  q("c7-07", "chapter-7", "Railroads", "From which direction did the Union Pacific build?", ["East to west from Nebraska", "West to east from California", "North from Texas", "South from Canada"], 0, "The Union Pacific began in Nebraska and built west."),
  q("c7-08", "chapter-7", "Railroads", "From which direction did the Central Pacific build?", ["East from Chicago", "North from Mexico", "West to east from California", "South from Canada"], 2, "The Central Pacific began in California and built east."),
  q("c7-09", "chapter-7", "Railroads", "Where did the Central Pacific and Union Pacific meet in 1869?", ["Chicago, Illinois", "Promontory Point, Utah", "Pittsburgh, Pennsylvania", "Ellis Island, New York"], 1, "The tracks joined at Promontory Point, Utah, on May 10, 1869."),
  q("c7-10", "chapter-7", "Railroads", "Which goods commonly traveled east on transcontinental railroads?", ["Cattle, wheat, and western crops", "Only gold coins", "Telephones and airplanes", "Nothing but passengers"], 0, "Western farmers and ranchers shipped cattle, wheat, and other crops to eastern markets."),
  q("c7-11", "chapter-7", "Economics", "How did railroads help western settlers earn more money?", ["They gave everyone free cattle", "They carried products to larger eastern markets", "They ended all farming costs", "They lowered the amount of land available"], 1, "Railroads connected settlers with more buyers in eastern cities, where their products could sell for more."),
  q("c7-12", "chapter-7", "Great Plains", "Why did settlers from Europe and the eastern United States move to the Great Plains?", ["Land was inexpensive and available", "The area had many forests", "Cities paid them to leave", "The climate never had storms"], 0, "The Homestead Act and other offers made land inexpensive, attracting people seeking farms and opportunity."),
  q("c7-13", "chapter-7", "Great Plains", "What did the Homestead Act offer qualified settlers?", ["40 acres after one month", "160 acres after farming it for five years", "A free city apartment", "A railroad company"], 1, "Settlers paid a small fee, lived on and farmed 160 acres for five years, and then owned it."),
  q("c7-14", "chapter-7", "Great Plains", "Why was building on the Great Plains difficult?", ["There were few trees for lumber", "There was too much gold", "The land was covered by oceans", "Railroads banned homes"], 0, "The plains had few trees, so wood for homes and fences was hard to find."),
  q("c7-15", "chapter-7", "Great Plains", "Which combination describes hardships faced by Great Plains settlers?", ["Drought, blizzards, prairie fires, and grasshoppers", "Tropical storms and volcanoes", "Only heavy rain", "No weather changes"], 0, "The harsh climate included drought, extreme temperatures, blizzards, fires, and crop-damaging insects."),
  q("c7-16", "chapter-7", "Innovation", "How did farmers adapt to having few extra workers?", ["They stopped growing crops", "They used improved farm machines", "They moved every week", "They planted only flowers"], 1, "Steel plows, planters, reapers, and threshers helped fewer workers farm more land."),
  q("c7-17", "chapter-7", "Innovation", "How did many settlers pump water for crops?", ["With windmills", "With telephones", "With locomotives", "With barbed wire"], 0, "Wind power operated pumps that brought water up from deep wells."),
  q("c7-18", "chapter-7", "Great Plains", "Who were the Exodusters?", ["Railroad owners from Europe", "African Americans who moved from the South to Kansas and other Plains areas", "Cowboys who moved cattle to Chicago", "Inventors who worked for Edison"], 1, "Exodusters sought land, safety, opportunity, and freedom from racism and violence in the South."),
  q("c7-19", "chapter-7", "Cattle Trails", "What was a railhead?", ["A cattle breed", "A town at the beginning or end of railroad tracks", "The front of a wagon", "A type of windmill"], 1, "Cowboys drove cattle to railhead towns, where the animals could be loaded onto trains."),
  q("c7-20", "chapter-7", "Cattle Trails", "About how many cattle were commonly guided in one herd?", ["20 to 30", "200 to 300", "2,000 to 3,000", "20,000 to 30,000"], 2, "The class study guide says cattle-drive herds usually held about 2,000 to 3,000 cattle."),
  q("c7-21", "chapter-7", "Cattle Trails", "Why did ranchers drive Texas cattle to railheads in places such as Kansas?", ["To ship them to northern and eastern cities", "To hide them from farmers", "To turn them into farm machines", "To send them to Europe by airplane"], 0, "At the railhead, cattle boarded trains to Chicago and other cities where demand and prices were higher."),
  q("c7-22", "chapter-7", "Economics", "A steer worth about $4 in Texas could sell for about how much in northern and eastern cities?", ["$1", "$10", "$20", "$40"], 3, "Texas had a large supply, but distant cities had strong demand; the study guide compares about $4 with about $40."),
  q("c7-23", "chapter-7", "Cattle Trails", "Which group was an important part of cattle-drive history?", ["Black Cowboys of Texas", "Only factory owners", "Only railroad presidents", "Pilots from Angel Island"], 0, "Black cowboys were among the skilled workers hired to guide large herds."),
  q("c7-24", "chapter-7", "Cattle Trails", "Which development helped bring the era of long cattle trails to an end?", ["Barbed wire", "The telephone", "Crop rotation", "Ellis Island"], 0, "Barbed wire, railroads reaching Texas, bad winters, disease, and overgrazing all helped end the trails."),
  q("c7-25", "chapter-7", "Economics", "What is a price incentive?", ["A map of railroad routes", "A reward or penalty that affects a buyer's or seller's action", "A machine used on farms", "A law about voting"], 1, "Prices can encourage or discourage economic choices, acting as rewards or penalties."),

  q("c8-01", "chapter-8", "Inventors", "Which invention is connected with Alexander Graham Bell?", ["Telephone", "Airplane", "Electric light bulb", "Steel plow"], 0, "Bell's telephone allowed people miles apart to speak with one another."),
  q("c8-02", "chapter-8", "Inventors", "What did Orville and Wilbur Wright develop?", ["Phonograph", "Airplane", "Telegraph", "Assembly line"], 1, "The Wright brothers' airplane made much faster long-distance travel possible."),
  q("c8-03", "chapter-8", "Inventors", "Which inventor improved the electric light bulb and also developed the phonograph?", ["Samuel Gompers", "Thomas Edison", "George Washington Carver", "John D. Rockefeller"], 1, "Thomas Edison worked on electric lighting and hundreds of other inventions, including the phonograph."),
  q("c8-04", "chapter-8", "Inventors", "Why were electric lights an improvement over gas lamps?", ["They were cleaner, safer, and easier", "They required cattle trails", "They only worked outdoors", "They used more smoke"], 0, "Electric light was cleaner and safer than open-flame gas lighting."),
  q("c8-05", "chapter-8", "Inventors", "What farming method did George Washington Carver encourage?", ["Growing one crop forever", "Crop rotation", "Cattle drives", "Mass production"], 1, "Rotating crops helped restore soil nutrients; Carver found many uses for crops such as peanuts."),
  q("c8-06", "chapter-8", "Business", "What is an entrepreneur?", ["A person who takes risks to start a business", "A person who only works on a farm", "A government law", "A city apartment"], 0, "Entrepreneurs accept risk in order to create and operate businesses."),
  q("c8-07", "chapter-8", "Business", "What is a corporation?", ["A business owned in shares by many people", "A cattle trail", "A labor protest", "An immigration station"], 0, "People can own shares, or parts, of a corporation."),
  q("c8-08", "chapter-8", "Business", "What is mass production?", ["Making a large quantity of a product", "Moving immigrants by ship", "Raising cattle on open land", "Sending one message at a time"], 0, "New machines and systems allowed factories to manufacture large quantities more efficiently."),
  q("c8-09", "chapter-8", "Business", "What happens on an assembly line?", ["A product moves from worker to worker as each completes a task", "Cattle move to a railhead", "Voters line up for an election", "Farmers rotate crops"], 0, "Dividing production into repeated tasks made factory work faster."),
  q("c8-10", "chapter-8", "Business", "What is a monopoly?", ["Complete control of a business or industry", "A shared city garden", "A labor union election", "A type of tenement"], 0, "A monopoly has little or no competition because one business controls the market."),
  q("c8-11", "chapter-8", "Business", "Which company was built by John D. Rockefeller?", ["Standard Oil", "Union Pacific", "American Federation of Labor", "NAACP"], 0, "Rockefeller's Standard Oil became a powerful oil corporation."),
  q("c8-12", "chapter-8", "Workers", "Why did workers form labor unions?", ["To improve pay and working conditions", "To stop all immigration", "To own cattle trails", "To build sod houses"], 0, "Workers organized together to seek safer workplaces, shorter hours, and better wages."),
  q("c8-13", "chapter-8", "Workers", "Which organization did Samuel Gompers lead?", ["American Federation of Labor", "Central Pacific", "Standard Oil", "NAACP"], 0, "Samuel Gompers led the American Federation of Labor, or AFL."),
  q("c8-14", "chapter-8", "Immigration", "Before 1880, most European immigrants came from which region?", ["Northern and Western Europe", "Southern and Eastern Europe", "Australia", "South America"], 0, "Earlier European immigration largely came from places such as Ireland and Germany."),
  q("c8-15", "chapter-8", "Immigration", "Between 1880 and 1924, most European immigrants came from which region?", ["Northern and Western Europe", "Southern and Eastern Europe", "Only Canada", "Only Mexico"], 1, "Many later immigrants arrived from Russia, Poland, Italy, and other parts of Southern and Eastern Europe."),
  q("c8-16", "chapter-8", "Immigration", "Where did most European immigrants enter the United States?", ["Angel Island", "Ellis Island", "Promontory Point", "Pittsburgh"], 1, "Ellis Island in New York Harbor processed many European immigrants."),
  q("c8-17", "chapter-8", "Immigration", "Where did many Asian immigrants enter the United States?", ["Angel Island", "Ellis Island", "Chicago", "Kansas"], 0, "Many Asian immigrants entered through Angel Island in San Francisco Bay."),
  q("c8-18", "chapter-8", "Immigration", "Which was a common reason people immigrated to the United States?", ["To find work and freedom", "To avoid all cities", "To join cattle drives only", "To lose their land"], 0, "People sought jobs, freedom, better living conditions, and escape from persecution."),
  q("c8-19", "chapter-8", "Immigration", "Where did many immigrants settle, and why?", ["In large cities for jobs", "Only on empty islands", "In deserts without work", "At railroad construction camps forever"], 0, "Factories and other employers made urban areas important destinations."),
  q("c8-20", "chapter-8", "Immigration", "Why did immigrants often live near people from the same country?", ["For family, friendship, language, and community support", "Because the government required it", "To avoid all employment", "To become railroad owners"], 0, "Ethnic neighborhoods offered familiar languages, traditions, and help adjusting to a new country."),
  q("c8-21", "chapter-8", "Immigration", "What was a tenement?", ["A poorly built, crowded apartment building", "A large western farm", "A railroad station", "A labor union"], 0, "Many low-paid urban families lived in cramped tenements with unsafe or unhealthy conditions."),
  q("c8-22", "chapter-8", "Immigration", "Which hardship did many immigrants face?", ["Prejudice, low pay, and cramped housing", "Too much free land", "Short workdays and high wages", "No need to learn a new language"], 0, "Immigrants often experienced unfair treatment, difficult work, and overcrowded living conditions."),
  q("c8-23", "chapter-8", "Cities", "Why were many large cities located near railroads and waterways?", ["Transportation made it easier to move people and goods", "Waterways stopped all fires", "Railroads made farms unnecessary", "Factories could not exist elsewhere"], 0, "Transportation routes connected factories, resources, workers, and markets."),
  q("c8-24", "chapter-8", "Cities", "Which movement brought many African Americans from the South to cities in other regions?", ["Great Migration", "Cattle Drive", "Homestead Act", "Pacific Railway Act"], 0, "The Great Migration was one reason American cities grew."),
  q("c8-25", "chapter-8", "Cities", "Which was a benefit of growing cities?", ["More jobs, stores, services, and transportation", "No sickness", "No crime", "No crowding"], 0, "Cities provided opportunity and services, even though they also had serious problems."),
  q("c8-26", "chapter-8", "Cities", "Which was a problem in rapidly growing cities?", ["Overcrowding and fires that spread easily", "Too many empty homes", "No stores", "No transportation"], 0, "Overcrowding, disease, crime, and fire danger were common urban problems."),
  q("c8-27", "chapter-8", "Cities", "Why did Pittsburgh become a major steel city?", ["It was near iron, coal, and rivers", "It had the largest cattle ranches", "It was an immigration island", "It had no transportation"], 0, "Nearby natural resources supplied steelmaking, and rivers helped transport materials and products."),
  q("c8-28", "chapter-8", "Cities", "Why was Chicago important to the meat industry?", ["It had stockyards, meatpacking plants, railroads, and Lake Michigan", "It grew peanuts", "It was the end of every cattle trail", "It had no factories"], 0, "Chicago combined rail and water transportation with major stockyards and meatpacking plants."),
  q("c8-29", "chapter-8", "Reform", "What did the 19th Amendment establish?", ["Women's right to vote", "The Homestead Act", "The first railroad", "A ban on labor unions"], 0, "The 19th Amendment gave women the constitutional right to vote."),
  q("c8-30", "chapter-8", "Reform", "What was a goal of the NAACP?", ["Equality for African Americans", "Building cattle trails", "Controlling the oil industry", "Running Ellis Island"], 0, "The NAACP organized to fight discrimination and promote equal rights for African Americans."),
]

const chapter7Ids = SOCIAL_STUDIES_QUESTIONS.filter((question) => question.unit === "chapter-7").map((question) => question.id)
const chapter8Ids = SOCIAL_STUDIES_QUESTIONS.filter((question) => question.unit === "chapter-8").map((question) => question.id)

export const SOCIAL_STUDIES_TESTS: readonly SocialStudiesTest[] = [
  {
    id: "chapter-7",
    title: "Chapter 7: Changes on the Plains",
    shortTitle: "Chapter 7",
    description: "Railroads, the telegraph, homesteaders, Great Plains adaptations, Exodusters, and cattle trails.",
    icon: "🚂",
    questionIds: chapter7Ids,
  },
  {
    id: "chapter-8",
    title: "Chapter 8: Big Business and Big Cities",
    shortTitle: "Chapter 8",
    description: "Inventors, corporations, workers, immigration, growing cities, and reform.",
    icon: "🏙️",
    questionIds: chapter8Ids,
  },
  {
    id: "wednesday-review",
    title: "Wednesday Exam Review",
    shortTitle: "Final Review",
    description: "A balanced 30-question practice exam mixing the most important facts from both chapters.",
    icon: "🎯",
    questionIds: [
      "c7-02", "c7-03", "c7-05", "c7-06", "c7-09", "c7-10", "c7-11", "c7-13", "c7-15", "c7-16",
      "c7-17", "c7-18", "c7-20", "c7-22", "c7-24", "c8-01", "c8-03", "c8-05", "c8-07", "c8-10",
      "c8-12", "c8-15", "c8-16", "c8-17", "c8-18", "c8-21", "c8-23", "c8-27", "c8-29", "c8-30",
    ],
  },
]

const questionById = new Map(SOCIAL_STUDIES_QUESTIONS.map((question) => [question.id, question]))

export function getSocialStudiesTest(testId: string): SocialStudiesTest | null {
  return SOCIAL_STUDIES_TESTS.find((test) => test.id === testId) ?? null
}

export function getSocialStudiesTestQuestions(testId: string): SocialStudiesQuestion[] {
  const test = getSocialStudiesTest(testId)
  if (!test) return []
  return test.questionIds.map((id) => questionById.get(id)).filter((question): question is SocialStudiesQuestion => Boolean(question))
}

function choiceRotation(questionId: string) {
  return [...questionId].reduce((sum, character) => sum + character.charCodeAt(0), 0) % 4
}

/** Rotate answer positions so a source-authored question bank cannot teach an A/B/C/D pattern. */
export function prepareSocialStudiesTestQuestions(testId: string): SocialStudiesQuestion[] {
  return getSocialStudiesTestQuestions(testId).map((question) => {
    const rotation = choiceRotation(`${testId}:${question.id}`)
    if (rotation === 0) return question
    const choices = [...question.choices.slice(rotation), ...question.choices.slice(0, rotation)] as unknown as SocialStudiesQuestion["choices"]
    return { ...question, choices, answer: (question.answer - rotation + 4) % 4 }
  })
}

export function scoreSocialStudiesTest(questions: readonly SocialStudiesQuestion[], answers: Record<string, number>) {
  const correct = questions.filter((question) => answers[question.id] === question.answer).length
  const answered = questions.filter((question) => Number.isInteger(answers[question.id])).length
  const percent = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0
  return { correct, answered, percent }
}
