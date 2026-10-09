/**
 * The deck of daily moments.
 * Placeholders: {partner} is the other player's name, {daughter} is the daughter's name.
 * Prompt ids are stored in the database, so never change or reuse an id.
 */

export type TextKind = "question" | "memory" | "dream" | "about_her" | "gratitude";

export type Prompt =
  | { id: string; kind: TextKind; text: string }
  | { id: string; kind: "this_or_that"; text: string; options: [string, string] }
  | { id: string; kind: "guess_partner"; text: string; options: string[] }
  | {
      id: string;
      kind: "split_clue";
      text: string;
      /** Clue shown to the first and second member respectively. */
      clues: [string, string];
      solution: string;
      /** Accepted answers after normalization (lowercase, letters and digits only). */
      accept: string[];
    };

export type PromptKind = Prompt["kind"];

const q = (id: string, text: string): Prompt => ({ id, kind: "question", text });
const mem = (id: string, text: string): Prompt => ({ id, kind: "memory", text });
const dream = (id: string, text: string): Prompt => ({ id, kind: "dream", text });
const her = (id: string, text: string): Prompt => ({ id, kind: "about_her", text });
const thanks = (id: string, text: string): Prompt => ({ id, kind: "gratitude", text });
const tot = (id: string, a: string, b: string, text = "Which one?"): Prompt => ({
  id,
  kind: "this_or_that",
  text,
  options: [a, b],
});
const guess = (id: string, text: string, options: string[]): Prompt => ({
  id,
  kind: "guess_partner",
  text,
  options,
});

export const PROMPTS: Prompt[] = [
  // Light questions
  q("q-perfect-sunday", "Describe a perfect lazy Sunday, start to finish."),
  q("q-comfort-food", "What's the food you'd want after a really long day?"),
  q("q-song-stuck", "What song has been stuck in your head lately?"),
  q("q-small-joy", "What's one small thing that made today a little better?"),
  q("q-superpower", "If you could have one very minor superpower, what would it be?"),
  q("q-kid-dream-job", "What did you want to be when you were seven?"),
  q("q-signature-dish", "If you had to cook one dish to impress someone, what would it be?"),
  q("q-guilty-pleasure-show", "What show could you rewatch forever?"),
  q("q-tiny-luxury", "What's a tiny luxury that feels way bigger than it is?"),
  q("q-weird-talent", "What's a strange thing you're secretly good at?"),
  q("q-best-smell", "What smell instantly makes you feel at home?"),
  q("q-three-words-today", "Describe today in exactly three words."),
  q("q-dinner-guest", "Anyone, living or not, for dinner tonight. Who?"),
  q("q-favorite-season", "Which season feels most like you, and why?"),
  q("q-laugh-recent", "What's the last thing that made you really laugh?"),
  q("q-dream-snack", "Build your dream snack plate. What's on it?"),
  q("q-useless-fact", "Share a useless fact you love."),
  q("q-rainy-day", "Rainy day, nowhere to be. What are you doing?"),
  q("q-theme-song", "If your week had a theme song, what would it be?"),
  q("q-learn-instantly", "What skill would you love to learn overnight?"),
  q("q-favorite-word", "What's a word you just like the sound of?"),
  q("q-cozy-spot", "Where's your coziest spot in the house?"),
  q("q-breakfast", "What's the ideal breakfast?"),
  q("q-hidden-gem", "What's a movie or book more people should know about?"),
  q("q-collect", "If you collected one thing, what would it be?"),
  q("q-street-name", "Make up a name for our street. Go."),
  q("q-pet-name", "If we got a pet tomorrow, what would we name it?"),
  q("q-mood-weather", "If your mood today were weather, what would it be?"),
  q("q-tiny-goal", "What's one tiny thing you'd like to get done this week?"),
  q("q-ice-cream", "Invent an ice cream flavor."),

  // Memories
  mem("m-first-noticed", "What's something you noticed about {partner} early on?"),
  mem("m-favorite-trip", "What's a trip or outing of ours you'd happily redo?"),
  mem("m-laugh-together", "Describe a time the two of us couldn't stop laughing."),
  mem("m-childhood-home", "What's one detail you remember from your childhood home?"),
  mem("m-family-recipe", "Is there a family recipe or dish that means something to you?"),
  mem("m-best-meal", "What's the best meal we've shared?"),
  mem("m-proud-moment", "When were you quietly proud of yourself recently?"),
  mem("m-grandparent", "Share something a grandparent or older relative used to say."),
  mem("m-first-date-detail", "What do you remember about one of our first times together?"),
  mem("m-song-memory", "Name a song that takes you straight back to a moment with {partner}."),
  mem("m-holiday-memory", "What's a favorite holiday memory from growing up?"),
  mem("m-childhood-game", "What game did you play over and over as a kid?"),
  mem("m-teacher", "Who's a teacher or mentor you still think about?"),
  mem("m-bedtime-story", "What story or book do you remember from bedtime as a kid?"),
  mem("m-home-moment", "What's a small at-home moment with {partner} you loved?"),
  mem("m-photo", "Think of a photo of us you love. What's happening in it?"),
  mem("m-first-day-home", "What do you remember about the first day home with {daughter}?"),
  mem("m-kindness", "Tell me about a kindness from a stranger you never forgot."),

  // Dreams
  dream("d-dream-trip", "One trip, all three of us, anywhere. Where to?"),
  dream("d-future-weekend", "Describe a weekend one year from now that would make you happy."),
  dream("d-garden", "If we had a garden, what would you grow?"),
  dream("d-family-tradition", "What's a little family tradition you'd love to start?"),
  dream("d-dream-kitchen", "Describe the kitchen of your dreams."),
  dream("d-learn-together", "What's something we could learn together?"),
  dream("d-retire", "We're old and gray. What does an ordinary day look like?"),
  dream("d-house-feature", "What's one feature our someday-home must have?"),
  dream("d-next-adventure", "What's a small adventure we could have this month?"),
  dream("d-hobby", "If you had two free hours every week, how would you spend them?"),
  dream("d-celebrate", "What's something worth celebrating soon, and how should we celebrate it?"),
  dream("d-cook-together", "What should we cook together sometime?"),
  dream("d-table", "Picture a big table full of people we love. Who's there?"),

  // About the daughter
  her("h-favorite-face", "What's {daughter}'s funniest face lately?"),
  her("h-who-she-looks-like", "Who do you think {daughter} takes after more, and in what way?"),
  her("h-hope-for-her", "What's one thing you hope {daughter} always knows?"),
  her("h-first-word", "Place your bet: what will {daughter}'s first word be?"),
  her("h-song-for-her", "What song should be {daughter}'s song?"),
  her("h-what-you-love", "What's one little thing about {daughter} that melts you?"),
  her("h-teach-her", "What's something you can't wait to teach {daughter}?"),
  her("h-her-personality", "Three words for {daughter}'s personality so far."),
  her("h-book-for-her", "What book do you want to read to {daughter} someday?"),
  her("h-food-for-her", "What food are you most excited for {daughter} to try?"),
  her("h-tradition-for-her", "What's a tradition from your family you want {daughter} to have?"),
  her("h-nickname", "What's your favorite nickname for {daughter}?"),
  her("h-sixteen", "Imagine {daughter} at sixteen. What's she into?"),
  her("h-sound", "What's your favorite sound {daughter} makes?"),
  her("h-today", "What did {daughter} do today that you want to remember?"),
  her("h-strength", "What's a strength you already see in {daughter}?"),
  her("h-place-show-her", "What place do you want to show {daughter} one day?"),
  her("h-like-partner", "What do you hope {daughter} gets from {partner}?"),

  // Gratitude (Fridays)
  thanks("g-week-good", "What's one good thing from this week?"),
  thanks("g-partner-did", "What's something {partner} did this week that you appreciated?"),
  thanks("g-small-thing", "What small, ordinary thing are you grateful for right now?"),
  thanks("g-person", "Who's someone you're grateful for this week, and why?"),
  thanks("g-body", "What's something your body did for you this week?"),
  thanks("g-home", "What's something about our home you're thankful for?"),
  thanks("g-daughter-week", "What's a moment with {daughter} this week you're grateful for?"),
  thanks("g-food", "What's a meal or bite this week you enjoyed?"),
  thanks("g-rest", "How do you want to rest this weekend?"),
  thanks("g-lesson", "What's something this week taught you?"),
  thanks("g-surprise", "What surprised you, in a good way, this week?"),
  thanks("g-quality", "What's a quality of {partner}'s you're thankful for?"),
  thanks("g-outside", "What's something beautiful you saw outside this week?"),
  thanks("g-easier", "What made life a little easier this week?"),
  thanks("g-laugh", "What made you smile this week?"),
  thanks("g-looking-forward", "What are you looking forward to next week?"),
  thanks("g-candle", "If you lit a candle for one thing this week, what would it be?"),
  thanks("g-tiny-win", "What's a tiny win from this week?"),

  // This or that
  tot("t-mountains-beach", "Mountains", "Beach"),
  tot("t-coffee-tea", "Coffee", "Tea"),
  tot("t-sunrise-sunset", "Sunrise", "Sunset"),
  tot("t-sweet-salty", "Sweet", "Salty"),
  tot("t-cook-order", "Cook at home", "Order in", "Tonight's dinner?"),
  tot("t-city-country", "City weekend", "Cabin weekend"),
  tot("t-movie-show", "A movie", "Three episodes of a show"),
  tot("t-early-late", "Early bird", "Night owl"),
  tot("t-pancakes-waffles", "Pancakes", "Waffles"),
  tot("t-plan-wing", "Plan everything", "Wing it", "Vacation style?"),
  tot("t-rain-snow", "Rain on the window", "Fresh snow"),
  tot("t-dog-cat", "Dog", "Cat"),
  tot("t-pizza-tacos", "Pizza night", "Taco night"),
  tot("t-music-quiet", "Music in the car", "Quiet drive"),
  tot("t-read-listen", "Read the book", "Listen to the audiobook"),
  tot("t-board-cards", "Board game", "Card game"),
  tot("t-picnic-restaurant", "Picnic", "Restaurant"),
  tot("t-candles-fairy", "Candlelight", "String lights"),
  tot("t-soup-salad", "Soup", "Salad"),
  tot("t-past-future", "Visit the past for a day", "Visit the future for a day"),

  // Guess your partner
  guess("p-morning-drink", "What does {partner} reach for first in the morning?", ["Coffee", "Tea", "Water", "Phone"]),
  guess("p-free-evening", "Free evening, no responsibilities. What does {partner} pick?", [
    "Sleep",
    "A show",
    "Go out",
    "A hobby",
  ]),
  guess("p-vacation", "{partner}'s ideal vacation?", [
    "Beach and books",
    "Exploring a city",
    "Nature and hiking",
    "Staying home",
  ]),
  guess("p-snack", "{partner}'s go-to snack?", ["Chips", "Chocolate", "Fruit", "Cheese"]),
  guess("p-superpower", "Which superpower would {partner} pick?", [
    "Flying",
    "Teleporting",
    "Pausing time",
    "Reading minds",
  ]),
  guess("p-chore", "Which chore does {partner} mind least?", ["Dishes", "Laundry", "Cooking", "Vacuuming"]),
  guess("p-season", "{partner}'s favorite season?", ["Spring", "Summer", "Fall", "Winter"]),
  guess("p-movie-genre", "Movie night. What genre does {partner} want?", ["Comedy", "Romance", "Thriller", "Animated"]),
  guess("p-love-language", "What makes {partner} feel most cared for?", [
    "Kind words",
    "Help with things",
    "Time together",
    "A hug",
  ]),
  guess("p-recharge", "How does {partner} recharge best?", ["Alone time", "With friends", "Outside", "Sleeping in"]),
  guess("p-daughter-moment", "{partner}'s favorite part of the day with {daughter}?", [
    "Morning cuddles",
    "Bath time",
    "Playtime",
    "Bedtime",
  ]),
  guess("p-dessert", "{partner} gets one dessert. Which?", ["Ice cream", "Cake", "Cookies", "Something fruity"]),
  guess("p-cuisine", "Which cuisine would {partner} eat every week?", [
    "Italian",
    "Mexican",
    "Asian",
    "Middle Eastern",
  ]),
  guess("p-breakfast", "{partner}'s ideal breakfast?", ["Eggs", "Pastry", "Shakshuka", "Just coffee"]),
  guess("p-music", "Long drive. What does {partner} put on?", [
    "Old favorites",
    "Something new",
    "A podcast",
    "Silence",
  ]),

  // Split clues: each of you sees half. Share yours however you like, then both answer.
  {
    id: "s-pomegranate",
    kind: "split_clue",
    text: "Put your halves together. What is it?",
    clues: ["I'm red and round, with a little crown on top.", "Inside me hide hundreds of tiny jewels."],
    solution: "a pomegranate",
    accept: ["pomegranate", "apomegranate", "pomegranates"],
  },
  {
    id: "s-candle",
    kind: "split_clue",
    text: "Put your halves together. What is it?",
    clues: ["I'm tall when I'm young and short when I'm old.", "Give me air and I live. Give me water and I die."],
    solution: "a candle",
    accept: ["candle", "acandle", "candles"],
  },
  {
    id: "s-key",
    kind: "split_clue",
    text: "Put your halves together. What is it?",
    clues: ["I have teeth, but I never bite.", "Without me, you might be stuck outside."],
    solution: "a key",
    accept: ["key", "akey", "keys"],
  },
  {
    id: "s-echo",
    kind: "split_clue",
    text: "Put your halves together. What is it?",
    clues: ["I speak without a mouth.", "I answer you in your own voice."],
    solution: "an echo",
    accept: ["echo", "anecho"],
  },
  {
    id: "s-map",
    kind: "split_clue",
    text: "Put your halves together. What is it?",
    clues: ["I have cities, but no houses. Forests, but no trees.", "I have water, but no fish."],
    solution: "a map",
    accept: ["map", "amap"],
  },
  {
    id: "s-bread",
    kind: "split_clue",
    text: "Put your halves together. What is it?",
    clues: ["Sometimes I'm braided, and I'm best when I'm warm.", "I rise without ever standing up."],
    solution: "bread",
    accept: ["bread", "challah", "loaf", "aloaf", "dough"],
  },
  {
    id: "s-footsteps",
    kind: "split_clue",
    text: "Put your halves together. What is it?",
    clues: ["The more you take, the more you leave behind.", "You make me every time you walk."],
    solution: "footsteps",
    accept: ["footsteps", "footstep", "steps", "footprints", "footprint"],
  },
  {
    id: "s-promise",
    kind: "split_clue",
    text: "Put your halves together. What is it?",
    clues: ["I can be kept, but never held in your hand.", "I'm easy to make and meaningful to keep."],
    solution: "a promise",
    accept: ["promise", "apromise", "yourword", "word"],
  },
  {
    id: "s-olive",
    kind: "split_clue",
    text: "Put your halves together. What is it?",
    clues: ["A dove once carried my branch.", "Press me and I give you golden oil."],
    solution: "an olive",
    accept: ["olive", "anolive", "olives", "olivetree", "olivebranch"],
  },
  {
    id: "s-honey",
    kind: "split_clue",
    text: "Put your halves together. What is it?",
    clues: ["I never spoil, even after thousands of years.", "Dip an apple in me for a sweet new start."],
    solution: "honey",
    accept: ["honey"],
  },
  {
    id: "s-star",
    kind: "split_clue",
    text: "Put your halves together. What is it?",
    clues: ["You need three of me to know the day is done.", "I'm always there, but you only see me at night."],
    solution: "a star",
    accept: ["star", "stars", "astar"],
  },
  {
    id: "s-door",
    kind: "split_clue",
    text: "Put your halves together. What is it?",
    clues: ["I welcome you and I keep you safe.", "My frame sometimes wears a tiny scroll."],
    solution: "a door",
    accept: ["door", "adoor", "doorway", "doorpost", "frontdoor"],
  },
];

export const PROMPTS_BY_ID: ReadonlyMap<string, Prompt> = new Map(PROMPTS.map((p) => [p.id, p]));

/** Kinds that need the daughter's name to make sense. */
export function needsDaughter(prompt: Prompt): boolean {
  return prompt.text.includes("{daughter}") || prompt.kind === "about_her";
}

export function renderPromptText(text: string, names: { partner: string; daughter: string | null }): string {
  return text.replaceAll("{partner}", names.partner).replaceAll("{daughter}", names.daughter ?? "the baby");
}

export function normalizeGuess(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}
