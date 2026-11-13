import { DAILY_FREE_CREDITS, FREE_SIGNUP_CREDITS } from "@/lib/generation-rules";

export const FAQS = [
  {
    q: "Is PIXORA really editing my photo with AI?",
    a: "Yes. Your photo and chosen style are sent securely to a state-of-the-art image-editing model, which returns a new, transformed image. Nothing is faked or pre-made.",
  },
  {
    q: "How many free generations do I get?",
    a: `Every new account starts with ${FREE_SIGNUP_CREDITS} free credits. After that, every night at midnight (Botswana time) anyone with fewer than ${DAILY_FREE_CREDITS} credits is topped back up to ${DAILY_FREE_CREDITS} — bought credits are always kept. Each successful generation uses one credit — failed attempts are never charged.`,
  },
  {
    q: "Will the result still look like me?",
    a: "PIXORA instructs the AI to preserve your facial identity and recognisable features. Results are usually very close, though AI can occasionally alter small details — just regenerate if needed.",
  },
  {
    q: "Who can see my photos?",
    a: "Only you. Photos are stored in private storage tied to your account and are never public. You can delete any image, or everything at once, from your account settings.",
  },
  {
    q: "Which file types are supported?",
    a: "JPG, JPEG, PNG and WEBP photos up to 15 MB. Large photos are automatically resized in your browser before upload, which also removes location metadata.",
  },
  {
    q: "What isn't allowed?",
    a: "You must have permission to edit every photo you upload. PIXORA blocks intimate or sexual edits, impersonation, fake identity documents and any non-consensual manipulation.",
  },
];
