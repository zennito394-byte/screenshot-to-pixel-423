// Editing categories and styles shared by the studio UI and the server prompt builder.
// The server only trusts style ids from this catalog; it never trusts prompt text for styles.

export type CategoryId = "portraits" | "fashion" | "hair" | "background" | "artistic" | "custom";

export type StyleOption = {
  id: string;
  label: string;
  description: string;
  instruction: string;
};

export type Category = {
  id: CategoryId;
  label: string;
  tagline: string;
  /** What the model must keep unchanged for this category. */
  preserve: string;
  styles: StyleOption[];
};

export const CATEGORIES: Category[] = [
  {
    id: "portraits",
    label: "AI Portraits",
    tagline: "Studio-grade headshots from any snapshot",
    preserve:
      "the person's exact facial identity, face shape, eyes, nose, mouth, skin tone, hairstyle, hair colour, age and expression",
    styles: [
      {
        id: "professional",
        label: "Professional",
        description: "Clean corporate headshot",
        instruction:
          "Turn this into a polished professional headshot: smart business attire, softly blurred neutral office background, flattering soft key light, crisp focus on the eyes.",
      },
      {
        id: "studio",
        label: "Studio",
        description: "Seamless backdrop, editorial light",
        instruction:
          "Turn this into a high-end studio portrait on a seamless charcoal backdrop with soft rim lighting, editorial magazine quality, sharp detail.",
      },
      {
        id: "cinematic",
        label: "Cinematic",
        description: "Moody film-still lighting",
        instruction:
          "Turn this into a cinematic portrait that looks like a film still: dramatic directional light, rich colour grading with teal shadows and warm highlights, shallow depth of field, anamorphic feel.",
      },
      {
        id: "passport",
        label: "Passport style",
        description: "Plain background, front-facing",
        instruction:
          "Turn this into a passport-style photo: plain light grey background, even shadow-free lighting, head and shoulders centred and facing forward, neutral natural look, no filters. This is a styling preview, not an official document.",
      },
    ],
  },
  {
    id: "fashion",
    label: "Fashion Studio",
    tagline: "Try new outfits and looks",
    preserve:
      "the person's exact facial identity, face shape, skin tone, hairstyle, body proportions and pose",
    styles: [
      {
        id: "streetwear",
        label: "Streetwear",
        description: "Urban, oversized, fresh",
        instruction:
          "Change the outfit to stylish modern streetwear: oversized jacket, graphic layers and clean sneakers, styled like an urban fashion campaign.",
      },
      {
        id: "formal",
        label: "Formal",
        description: "Tailored suit or evening wear",
        instruction:
          "Change the outfit to elegant formal wear that suits the person: a perfectly tailored suit or refined evening attire, premium fabrics, sharp fit.",
      },
      {
        id: "editorial",
        label: "Fashion shoot",
        description: "High-fashion editorial",
        instruction:
          "Restyle this as a high-fashion editorial photoshoot: designer outfit, confident styling, professional fashion lighting and a minimal set.",
      },
      {
        id: "casual-chic",
        label: "Casual chic",
        description: "Effortless everyday style",
        instruction:
          "Change the outfit to a casual-chic look: well-fitted knitwear or a crisp shirt, neutral tones, relaxed and polished.",
      },
    ],
  },
  {
    id: "hair",
    label: "Hairstyle Studio",
    tagline: "Preview cuts and colours",
    preserve:
      "the person's exact facial identity, face shape, eyes, nose, mouth, skin tone, clothing, background and expression",
    styles: [
      {
        id: "new-cut",
        label: "New haircut",
        description: "A modern, flattering cut",
        instruction:
          "Give the person a modern, flattering new haircut that suits their face shape, styled by a professional, realistic hair texture.",
      },
      {
        id: "color",
        label: "Hair colour",
        description: "Try a bold new colour",
        instruction:
          "Change the hair colour to a rich, fashionable shade (such as copper, platinum or deep burgundy) while keeping the hairstyle shape, realistic strands and natural roots.",
      },
      {
        id: "long",
        label: "Longer hair",
        description: "Add length and volume",
        instruction:
          "Give the person longer, voluminous hair in a natural style with realistic texture and movement.",
      },
      {
        id: "short",
        label: "Short crop",
        description: "Clean, short and sharp",
        instruction: "Give the person a sharp, short cropped haircut with a clean modern finish.",
      },
    ],
  },
  {
    id: "background",
    label: "Background Studio",
    tagline: "Place yourself anywhere",
    preserve:
      "the person exactly as they are: facial identity, skin tone, hair, clothing, pose and expression. Only replace the background and adapt lighting to match",
    styles: [
      {
        id: "pro-backdrop",
        label: "Professional",
        description: "Clean office or studio",
        instruction:
          "Replace the background with a clean professional setting: a softly blurred modern office or neutral studio backdrop.",
      },
      {
        id: "nature",
        label: "Nature",
        description: "Forest, beach or mountains",
        instruction:
          "Replace the background with a beautiful natural environment: lush forest or mountain scenery with golden-hour sunlight.",
      },
      {
        id: "city",
        label: "City",
        description: "Skyline and streets",
        instruction:
          "Replace the background with a vibrant modern city: skyline or stylish street at blue hour with glowing lights.",
      },
      {
        id: "luxury",
        label: "Luxury interior",
        description: "Elegant upscale spaces",
        instruction:
          "Replace the background with a luxury interior: elegant lounge or penthouse with warm lighting, marble and rich textures.",
      },
    ],
  },
  {
    id: "artistic",
    label: "Artistic Transformations",
    tagline: "Turn photos into art",
    preserve:
      "the person's recognisable features, face shape, skin tone, hairstyle and expression so they are clearly the same person",
    styles: [
      {
        id: "anime",
        label: "Anime-inspired",
        description: "Clean cel-shaded illustration",
        instruction:
          "Transform the photo into a vibrant anime-inspired illustration with clean line art and cel shading.",
      },
      {
        id: "digital-art",
        label: "Digital art",
        description: "Painterly concept art",
        instruction:
          "Transform the photo into rich digital painting concept art with expressive brushwork and dramatic lighting.",
      },
      {
        id: "cartoon",
        label: "Cartoon",
        description: "Friendly 3D cartoon",
        instruction:
          "Transform the photo into a friendly, polished 3D animated cartoon character style with soft lighting.",
      },
      {
        id: "creative",
        label: "Creative photo",
        description: "Surreal, artistic photography",
        instruction:
          "Transform the photo into a creative fine-art photograph with surreal colour, double-exposure light effects and a striking composition.",
      },
    ],
  },
  {
    id: "custom",
    label: "Custom AI Editing",
    tagline: "Describe exactly what you want",
    preserve:
      "the person's facial identity and recognisable features unless the instructions explicitly ask to change them",
    styles: [
      {
        id: "custom",
        label: "Custom",
        description: "Your own instructions",
        instruction: "Apply the user's instructions below to the photo.",
      },
    ],
  },
];

export function findCategory(id: string | undefined): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function findStyle(categoryId: string | undefined, styleId: string | undefined) {
  const category = findCategory(categoryId);
  const style = category?.styles.find((s) => s.id === styleId);
  return category && style ? { category, style } : undefined;
}

export const ASPECT_RATIOS = [
  { id: "1:1", label: "1:1", hint: "Square" },
  { id: "4:5", label: "4:5", hint: "Portrait" },
  { id: "3:4", label: "3:4", hint: "Classic" },
  { id: "16:9", label: "16:9", hint: "Wide" },
  { id: "original", label: "Original", hint: "Keep shape" },
] as const;

export type AspectRatioId = (typeof ASPECT_RATIOS)[number]["id"];
