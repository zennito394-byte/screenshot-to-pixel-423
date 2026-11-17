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
    label: "Retro Time Machine (1950s–1990s)",
    tagline: "Step back into iconic vintage cultural eras",
    preserve: "authentic natural skin tones, facial symmetry, and era-accurate styling",
    styles: [
      {
        id: "vintage-70s",
        label: "70s Afro Funk & Soul",
        description: "Warm 35mm disco funk aesthetic",
        instruction:
          "Cinematic 1970s vintage Kodachrome photograph of an African protagonist in iconic 70s disco-funk style, wide-collar patterned silk shirt, tinted aviator sunglasses, warm amber film grain, golden lens flare, authentic analog warmth.",
      },
      {
        id: "vintage-80s",
        label: "80s Township Retro",
        description: "Classic boombox street vibe",
        instruction:
          "Authentic 1980s Southern African street portrait, high-waisted acid-wash denim, retro bomber jacket, vibrant color palette, candid 35mm flash photography, nostalgic township aesthetic.",
      },
      {
        id: "vintage-90s",
        label: "90s Kwaito & Golden Era",
        description: "Nostalgic 90s urban culture",
        instruction:
          "Iconic 1990s African urban music culture portrait, classic bucket hat, oversized leather jacket, gold chain, nostalgic film grain, stylish attitude, golden-hour city light.",
      },
      {
        id: "vintage-50s",
        label: "1950s Sophiatown Jazz",
        description: "Classic black & white jazz club",
        instruction:
          "1950s Sophiatown jazz lounge cinematic portrait, sharp fedora, double-breasted vintage suit, smoky jazz atmosphere, rich black-and-white tonal contrast, dramatic rim lighting.",
      },
      {
        id: "professional",
        label: "Modern Heritage Executive",
        description: "Tailored executive portrait",
        instruction:
          "High-end corporate executive portrait with subtle cultural accents, tailored modern suit, soft office bokeh background, confident warm expression, crisp studio lighting.",
      },
    ],
  },
  {
    id: "fashion",
    label: "African Royalty & Haute Couture",
    tagline: "Imperial robes, regal crowns, and runway fashion",
    preserve: "regal poise, authentic cultural textiles, and sharp garment textures",
    styles: [
      {
        id: "botswana-kgosi",
        label: "Setswana Royal Heritage",
        description: "Traditional Kaross fur & modern elegance",
        instruction:
          "Regal modern Setswana royalty portrait, luxurious traditional Kaross fur mantle draped over bespoke modern tailoring, rich beadwork accents, warm Kalahari earth tones, dignified posture.",
      },
      {
        id: "west-african-agbada",
        label: "Imperial Agbada & Kente",
        description: "Embroidered grandeur & gold threads",
        instruction:
          "Magnificent royal Agbada embroidered with intricate gold patterns, handwoven Kente cloth sash, regal velvet cap, opulent studio background with warm royal lighting.",
      },
      {
        id: "pan-african-haute",
        label: "Pan-African High Fashion",
        description: "Avant-garde runway statement",
        instruction:
          "High-fashion editorial runway portrait, sculptural African silhouettes, bold geometric prints, striking avant-garde headpiece, dramatic architectural studio lighting.",
      },
      {
        id: "formal",
        label: "Black-Tie Gala & Gold",
        description: "Luxurious evening attire",
        instruction:
          "Sophisticated black-tie gala portrait, tailored tuxedo or flowing silk evening gown with subtle gold filigree details, glamorous ballroom ambient lighting.",
      },
    ],
  },
  {
    id: "hair",
    label: "Iconic Afrocentric Hairstyles",
    tagline: "Celebrate legendary crowns, braids, and fades",
    preserve: "hair structure, crisp edges, and natural texture",
    styles: [
      {
        id: "sculptural-crown",
        label: "Sculptural Threading & Cowries",
        description: "Intricate traditional royal braids",
        instruction:
          "Breathtaking African sculptural threaded hairstyle adorned with polished cowrie shells and brass rings, high-fashion beauty photography, glowing skin, macro focus.",
      },
      {
        id: "majestic-afro",
        label: "Majestic Halo Afro",
        description: "Perfect voluminous natural crown",
        instruction:
          "Glorious, perfectly picked halo afro with subtle golden highlight reflections, flawless silhouette, minimalist dark background, cinematic rim lighting.",
      },
      {
        id: "locs-adorned",
        label: "Golden Adorned Locs",
        description: "Flowing locs with gold jewelry",
        instruction:
          "Magnificent flowing dreadlocks wrapped with delicate gold wire and amber wooden beads, warm sunlit studio lighting, authentic natural hair texture.",
      },
      {
        id: "fade-geometric",
        label: "Sharp Geometric Skin Fade",
        description: "Razor-sharp modern barbering",
        instruction:
          "Impeccably sharp skin fade haircut with crisp geometric curved hairline accents and perfectly groomed beard, high-contrast studio spotlight.",
      },
    ],
  },
  {
    id: "background",
    label: "Iconic African Landscapes",
    tagline: "From Okavango waterways to modern skylines",
    preserve: "atmospheric perspective, lighting direction, and natural depth",
    styles: [
      {
        id: "okavango-sunset",
        label: "Okavango Delta Sunset",
        description: "Golden waterways & acacia silhouettes",
        instruction:
          "Atmospheric golden-hour portrait along the winding water channels of the Okavango Delta, glowing sunset reflections, silhouetted umbrella acacia trees, warm amber haze.",
      },
      {
        id: "kalahari-dunes",
        label: "Kalahari Crimson Dunes",
        description: "Vast red sand dunes & twilight sky",
        instruction:
          "Cinematic portrait in the vast crimson sand dunes of the Kalahari desert under a deep indigo starry twilight sky, dramatic wind-sculpted sand textures.",
      },
      {
        id: "joburg-skyline",
        label: "Modern Megacity Skyline",
        description: "Urban rooftop at blue hour",
        instruction:
          "Chic penthouse rooftop portrait overlooking a glowing modern African metropolis skyline at dusk, sparkling city lights, architectural bokeh.",
      },
      {
        id: "vintage-market",
        label: "Historic Lantern Market",
        description: "Warm spice stalls & rich textures",
        instruction:
          "Vibrant atmospheric historic open-air market, warm hanging lantern light, colorful spice sacks and woven baskets, rich cinematic depth.",
      },
    ],
  },
  {
    id: "artistic",
    label: "Afrofuturism & Mythic Art",
    tagline: "Sci-fi visions, gold leaf, and painterly dreams",
    preserve: "mythic grandeur and vibrant visual storytelling",
    styles: [
      {
        id: "afrofuturist-cyborg",
        label: "Afrofuturistic Neo-Warrior",
        description: "Glowing circuit markings & sci-fi armor",
        instruction:
          "Striking Afrofuturistic sci-fi portrait, subtle luminous gold and turquoise holographic markings on radiant dark skin, high-tech metallic jewelry, neon rim light.",
      },
      {
        id: "solar-deity",
        label: "Solar Deity & Hammered Gold",
        description: "Mythic sun god with gold leaf",
        instruction:
          "Divine mythological solar deity portrait adorned in hammered 24k gold leaf jewelry, floating celestial amber embers, radiant godly aura, regal gaze.",
      },
      {
        id: "oil-canvas",
        label: "Contemporary Oil Masterpiece",
        description: "Rich impasto oil painting on canvas",
        instruction:
          "Expressive contemporary African fine art oil painting, visible palette knife texture, rich ochre, cobalt and umber pigments, museum gallery lighting.",
      },
      {
        id: "cyberpunk-lagos",
        label: "Neon Cyberpunk Metropolis",
        description: "Rain-slicked neon street aesthetic",
        instruction:
          "Atmospheric cyberpunk street portrait in a futuristic African megacity, glowing purple and cyan neon signs reflecting on wet asphalt, cinematic depth of field.",
      },
    ],
  },
  {
    id: "custom",
    label: "Custom Time Travel & Vision",
    tagline: "Describe your own era, look, or concept",
    preserve: "the character details and specific prompt instructions",
    styles: [
      {
        id: "custom",
        label: "Custom Prompt",
        description: "Your own unique creative idea",
        instruction: "Create a breathtaking photorealistic scene matching the custom details provided.",
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
