export interface FeedPost {
  id: string;
  username: string;
  avatar: string;
  hobby_title: string;
  aesthetic_tags: string[];
  qloo_match: string;
  comment: string;
  timestamp: string;
  likes: number;
}

export const feedStore: FeedPost[] = [
  {
    id: "post-1",
    username: "clover_valeria",
    avatar: "🍀",
    hobby_title: "Closed Glass Terrariums, Flower Pressing & Botanical Journals",
    aesthetic_tags: ["BOTANICAL", "LO-FI JAZZ"],
    qloo_match: "Plantasia (Mort Garson) / Nujabes",
    comment:
      "Hung 3 botanical garden photos on the clothesline and built my first closed moss terrarium while listening to the Plantasia album Qloo recommended!",
    timestamp: "12 MINS AGO",
    likes: 24,
  },
  {
    id: "post-2",
    username: "analog_mateo",
    avatar: "📸",
    hobby_title: "Urban 35mm Film Photography & Architectural Sketching",
    aesthetic_tags: ["BRUTALIST ARCHITECTURE", "ANALOG PHOTOGRAPHY"],
    qloo_match: "Barbican Centre / Ilford B&W",
    comment:
      "I had dozens of architecture screenshots saved on my phone. Finally took a 35mm film camera downtown this weekend!",
    timestamp: "1 HOUR AGO",
    likes: 19,
  },
  {
    id: "post-3",
    username: "mika_market",
    avatar: "🧸",
    hobby_title: "Y2K Zine Making, Scrapbooking & 2000s Digicam Hunting",
    aesthetic_tags: ["Y2K RETRO", "ANIME"],
    qloo_match: "Daft Punk / Studio Ghibli",
    comment:
      "Uploaded screenshots from my vintage market Pinterest board and started making a physical collage zine with my friends!",
    timestamp: "3 HOURS AGO",
    likes: 31,
  },
];
