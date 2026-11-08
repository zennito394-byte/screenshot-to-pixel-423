import beforePortrait from "@/assets/before-portrait.jpg";
import afterPortrait from "@/assets/after-portrait.jpg";
import afterAnime from "@/assets/after-anime.jpg";
import beforeMan from "@/assets/before-man.jpg";
import afterManFashion from "@/assets/after-man-fashion.jpg";
import afterManHair from "@/assets/after-man-hair.jpg";

export const SHOWCASE = [
  { id: "studio", before: beforePortrait, after: afterPortrait, label: "Studio portrait", category: "AI Portraits" },
  { id: "fashion", before: beforeMan, after: afterManFashion, label: "Formal + city rooftop", category: "Fashion Studio" },
  { id: "anime", before: beforePortrait, after: afterAnime, label: "Anime-inspired", category: "Artistic" },
  { id: "hair", before: beforeMan, after: afterManHair, label: "Platinum crop + forest", category: "Hairstyle Studio" },
];

export const CATEGORY_IMAGES: Record<string, string> = {
  portraits: afterPortrait,
  fashion: afterManFashion,
  hair: afterManHair,
  background: afterManFashion,
  artistic: afterAnime,
  custom: beforePortrait,
};
