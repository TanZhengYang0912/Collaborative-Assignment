// Auto display name so every account has something to show on reviews without
// forcing the onboarding flow. e.g. "SpicyFoodie4821".
const ADJECTIVES = ["Hungry", "Happy", "Spicy", "Golden", "Curious", "Cheerful", "Zesty", "Melaka", "Savoury", "Sunny"];
const NOUNS = ["Foodie", "Explorer", "Gourmet", "Wanderer", "Diner", "Nomad", "Traveller", "Taster"];

export function randomDisplayName() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj}${noun}${Math.floor(1000 + Math.random() * 9000)}`;
}
