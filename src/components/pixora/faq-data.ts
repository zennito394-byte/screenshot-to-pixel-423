import { DAILY_FREE_CREDITS, FREE_SIGNUP_CREDITS } from "@/lib/generation-rules";

export const FAQS = [
  {
    q: "What is Musafa AI?",
    a: "Musafa AI is an African cultural time machine. It generates authentic portraits across iconic vintage decades (50s, 70s, 80s, 90s), traditional royal regalia, hairstyles, and Afrofuturist visions using advanced AI.",
  },
  {
    q: "How many free generations do I get?",
    a: `Every new account starts with ${FREE_SIGNUP_CREDITS} free credits. After that, every night at midnight (Botswana time), anyone with fewer than ${DAILY_FREE_CREDITS} credits is automatically topped back up to ${DAILY_FREE_CREDITS}. Purchased credits are always kept. Each successful generation uses 1 credit — failed attempts are never charged.`,
  },
  {
    q: "Can I customize the era and outfit?",
    a: "Yes! You can choose from our curated archetypes (like 70s Afro Funk or Botswana Royal Kgosi) or type your own custom prompts and details into the Studio to craft a unique scene.",
  },
  {
    q: "Who can see my generated portraits?",
    a: "Only you. All your generations are stored in a private gallery tied securely to your account. You can download them anytime or permanently delete them with one tap.",
  },
  {
    q: "What aspect ratios are supported?",
    a: "You can generate portraits in 1:1 (Square), 4:5 (Instagram portrait), 3:4 (Classic), and 16:9 (Cinematic wide).",
  },
  {
    q: "What content is not allowed?",
    a: "Musafa AI strictly prohibits harmful, sexual, hateful, or non-consensual content. Prompts violating safety guidelines will be rejected automatically.",
  },
];
