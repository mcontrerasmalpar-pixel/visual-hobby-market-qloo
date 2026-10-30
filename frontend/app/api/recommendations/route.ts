import { NextRequest, NextResponse } from "next/server";

const QLOO_BASE_URL = (
  process.env.QLOO_BASE_URL || "https://hackathon.api.qloo.com"
).replace(/\/$/, "");

interface CulturalEntity {
  id?: string;
  name: string;
  type: string;
  sub: string;
  affinity?: number;
  image_url?: string | null;
  source?: string;
}

interface InputImagePayload {
  name?: string;
  dataUrl?: string;
  dominantHex?: string;
}

interface ClaudeVisionHobby {
  tag: string;
  title: string;
  category: string;
  difficulty: string;
  match_score: number;
  description: string;
  starter_kit: string[];
}

interface ClaudeVisionAnalysis {
  archetype: string;
  visual_narrative: string;
  per_image_captions: string[];
  dynamic_tags: string[];
  qloo_seeds: {
    tag_queries: string[];
    entity_queries: string[];
  };
  custom_hobbies: ClaudeVisionHobby[];
}

interface AestheticTemplate {
  hobby_title: string;
  category: string;
  difficulty: string;
  match_score: number;
  description: string;
  starter_kit: string[];
  qloo_queries: string[];
  fallback_entities: CulturalEntity[];
}

const AESTHETIC_HOBBY_MATRIX: Record<string, AestheticTemplate> = {
  "y2k retro": {
    hobby_title: "Y2K Zine Making, Scrapbooking & 2000s Digicam Hunting",
    category: "CREATIVE DESIGN / ZINES",
    difficulty: "BEGINNER",
    match_score: 99,
    description:
      "Capture everyday moments with early-2000s CCD Cyber-shot cameras, print glossy sticker sheets, and craft physical collage zines with your friends.",
    starter_kit: [
      "2000s CCD Digicam (Sony Cyber-shot)",
      "Glossy sticker paper & gel pens",
      "Blender 3D (low-poly retro mode)",
    ],
    qloo_queries: ["electronic", "pop art", "video games", "anime"],
    fallback_entities: [
      {
        name: "Daft Punk - Discovery",
        type: "artist",
        sub: "French Touch / Y2K Anthem",
      },
      {
        name: "Jet Set Radio",
        type: "movie",
        sub: "Y2K Aesthetic Cult Classic",
      },
      {
        name: "The Designers Republic",
        type: "book",
        sub: "Futuristic Graphic Design",
      },
    ],
  },
  anime: {
    hobby_title:
      "Cel-Shading Digital Illustration, Artbook Collecting & Figure Customizing",
    category: "ANIME / POP CULTURE",
    difficulty: "BEGINNER",
    match_score: 99,
    description:
      "Design your own 2000s-style anime characters, customize blind-box vinyl figures or Gunpla kits, and explore iconic Japanese animation soundtracks.",
    starter_kit: [
      "Sketchbook + Copic markers or Procreate",
      "Blank vinyl figure / Model kit",
      "Japanese Animation Studio Artbook",
    ],
    qloo_queries: ["anime", "studio ghibli", "manga", "j-pop"],
    fallback_entities: [
      {
        name: "Studio Ghibli / Hayao Miyazaki",
        type: "movie",
        sub: "Iconic Japanese Animation",
      },
      {
        name: "Cowboy Bebop (Yoko Kanno)",
        type: "artist",
        sub: "Anime Soundtrack & Jazz",
      },
      {
        name: "Akihabara & Nakano Broadway",
        type: "place",
        sub: "Anime, Figures & Retro Artbooks",
      },
    ],
  },
  "kawaii pop": {
    hobby_title: "Polymer Clay Art Toys, Deco-Den Crafting & UV Resin Charms",
    category: "CRAFTS / TOY ART",
    difficulty: "BEGINNER",
    match_score: 98,
    description:
      "Sculpt and paint your own collectible blind-box style figures, decorate phone cases with whipped silicone clay (Deco-Den), and cast glittery Y2K charms.",
    starter_kit: [
      "Polymer or air-dry clay",
      "Pastel acrylic paints & high-gloss varnish",
      "Mini flower beads, rhinestones & UV resin",
    ],
    qloo_queries: ["pop art", "sanrio", "japanese pop", "illustration"],
    fallback_entities: [
      {
        name: "Takashi Murakami",
        type: "artist",
        sub: "Superflat Pop Art & Figures",
      },
      {
        name: "Harajuku Takeshita Street",
        type: "place",
        sub: "Kawaii Pop Culture Hub",
      },
      {
        name: "FRUiTS Magazine (Shoichi Aoki)",
        type: "book",
        sub: "Harajuku Street Fashion & Pop",
      },
    ],
  },
  cyberpunk: {
    hobby_title: "Retro Hardware Modding & Synthwave Jamming",
    category: "TECH / AUDIO",
    difficulty: "INTERMEDIATE",
    match_score: 98,
    description:
      "Build custom translucent mechanical keyboards with neon lighting, mod 2000s handheld consoles, or produce synthwave tracks using software synthesizers.",
    starter_kit: [
      "Translucent keycaps & soldering kit",
      "Free DAW (Vital Synth)",
      "Vintage CCD digital camera",
    ],
    qloo_queries: ["cyberpunk", "synthwave", "blade runner", "electronic music"],
    fallback_entities: [
      { name: "Kavinsky", type: "artist", sub: "Synthwave / Outrun" },
      {
        name: "Neuromancer (William Gibson)",
        type: "book",
        sub: "Sci-Fi Cyberpunk",
      },
      {
        name: "Akihabara Electric Town",
        type: "place",
        sub: "Tech & Retro Arcade District",
      },
    ],
  },
  "brutalist architecture": {
    hobby_title: "Urban 35mm Film Photography & Architectural Sketching",
    category: "VISUAL ART / URBAN",
    difficulty: "BEGINNER",
    match_score: 95,
    description:
      "Explore your city documenting bold concrete geometry, dramatic shadows, and monolithic structures using high-contrast black-and-white 35mm film.",
    starter_kit: [
      "Compact 35mm camera or B&W film app",
      "Ilford HP5 400 Film Roll",
      "Isometric dot-grid sketchbook",
    ],
    qloo_queries: ["brutalism", "architecture", "photography", "minimalism"],
    fallback_entities: [
      {
        name: "Barbican Centre",
        type: "place",
        sub: "Iconic Brutalist Landmark",
      },
      {
        name: "Andreas Gursky",
        type: "artist",
        sub: "Large Format Photography",
      },
      {
        name: "Towards a New Architecture (Le Corbusier)",
        type: "book",
        sub: "Architecture Manifesto",
      },
    ],
  },
  "lo-fi jazz": {
    hobby_title: "Sampler Beatmaking & Vinyl Crate Digging",
    category: "MUSIC / CULTURE",
    difficulty: "BEGINNER",
    match_score: 96,
    description:
      "Browse local record shops for 70s jazz samples, chop warm tape loops on a pocket sampler, and host cozy late-night listening sessions.",
    starter_kit: [
      "Pad controller or Koala Sampler app",
      "Entry-level turntable",
      "Open-back studio headphones",
    ],
    qloo_queries: ["nujabes", "lo-fi", "jazz hop", "vinyl"],
    fallback_entities: [
      { name: "Nujabes", type: "artist", sub: "Lo-Fi Jazz Hop Pioneer" },
      {
        name: "J Dilla - Donuts",
        type: "artist",
        sub: "Instrumental Hip-Hop",
      },
      {
        name: "Blue Note Jazz Club",
        type: "place",
        sub: "Historic Jazz Venue",
      },
    ],
  },
  botanical: {
    hobby_title:
      "Closed Glass Terrariums, Flower Pressing & Botanical Journals",
    category: "NATURE / DESIGN",
    difficulty: "BEGINNER",
    match_score: 96,
    description:
      "Create self-sustaining miniature ecosystems inside glass jars with live moss, volcanic stones, and pressed flowers while listening to warm ambient music.",
    starter_kit: [
      "Airtight glass jar",
      "Live moss + activated charcoal",
      "Long aquascaping tweezers & flower press",
    ],
    qloo_queries: ["botanical garden", "nature", "ambient", "plant"],
    fallback_entities: [
      {
        name: "Plantasia (Mort Garson)",
        type: "artist",
        sub: "Warm Earth Music for Plants",
      },
      {
        name: "Kew Royal Botanic Gardens",
        type: "place",
        sub: "Botanical Conservatory",
      },
      { name: "Braiding Sweetgrass", type: "book", sub: "Botany & Ecology" },
    ],
  },
  "analog photography": {
    hobby_title: "Solar Cyanotype Printing & Experimental Film Lab",
    category: "ART / DARKROOM LAB",
    difficulty: "INTERMEDIATE",
    match_score: 94,
    description:
      "Bring your digital screenshots into the physical world by printing negatives onto cotton paper using sunlight and Prussian-blue cyanotype chemistry.",
    starter_kit: [
      "Cyanotype sensitizer kit (Part A+B)",
      "300g watercolor cotton paper",
      "Printed transparency negatives",
    ],
    qloo_queries: ["indie film", "photography", "art house", "indie rock"],
    fallback_entities: [
      {
        name: "Wong Kar-wai",
        type: "movie",
        sub: "Cinematic Color & Neon Mood",
      },
      {
        name: "Vivian Maier",
        type: "book",
        sub: "Street Photography Archive",
      },
      {
        name: "Fotografiska Museum",
        type: "place",
        sub: "Contemporary Photography Space",
      },
    ],
  },
  "dark academia": {
    hobby_title:
      "Handcrafted Bookbinding, Fountain Pen Calligraphy & Classic Book Club",
    category: "LITERATURE / CRAFT",
    difficulty: "BEGINNER",
    match_score: 93,
    description:
      "Sew your own exposed-spine journals with waxed linen thread, practice calligraphy with sepia ink, and explore historic libraries and cozy cafes.",
    starter_kit: [
      "Fountain pen + sepia ink",
      "Waxed thread & bookbinding awl",
      "120g ivory dot-grid paper",
    ],
    qloo_queries: ["classical music", "literature", "philosophy", "museum"],
    fallback_entities: [
      {
        name: "The Secret History (Donna Tartt)",
        type: "book",
        sub: "Dark Academia Essential",
      },
      {
        name: "Max Richter",
        type: "artist",
        sub: "Neo-Classical / Post-Minimalism",
      },
      {
        name: "Shakespeare and Company",
        type: "place",
        sub: "Historic Independent Bookstore",
      },
    ],
  },
  "indie sleaze": {
    hobby_title: "Vinyl / CDJ Mixing & Underground Nightlife Zines",
    category: "MUSIC / NIGHTLIFE",
    difficulty: "INTERMEDIATE",
    match_score: 95,
    description:
      "Mix electro-clash, post-punk revival, and bloghouse tracks while documenting your local music scene with direct flash photography.",
    starter_kit: [
      "2-channel DJ controller",
      "Point-and-shoot camera with direct flash",
      "Curated electro-indie playlist",
    ],
    qloo_queries: ["indie rock", "electroclash", "post-punk", "nightlife"],
    fallback_entities: [
      {
        name: "LCD Soundsystem",
        type: "artist",
        sub: "Dance-Punk / Indie Electronic",
      },
      { name: "Justice - Cross", type: "artist", sub: "French Electro" },
      {
        name: "Meet Me in the Bathroom",
        type: "book",
        sub: "2000s Music Oral History",
      },
    ],
  },
};

function toTitleCase(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseDataUrl(dataUrl: string): {
  mediaType: string;
  base64Data: string;
} | null {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;
  return {
    mediaType: match[1],
    base64Data: match[2],
  };
}

async function analyzeWithClaudeVision(
  images: InputImagePayload[],
  userTags: string[],
  anthropicKey: string,
  logs: string[]
): Promise<ClaudeVisionAnalysis | null> {
  const validImages = images
    .filter((img) => img.dataUrl && img.dataUrl.startsWith("data:image/"))
    .slice(0, 4);

  if (validImages.length === 0 && userTags.length === 0) {
    return null;
  }

  const preferredModel =
    process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514";
  const candidateModels = Array.from(
    new Set([
      preferredModel,
      "claude-sonnet-4-20250514",
      "claude-3-5-sonnet-latest",
      "claude-3-haiku-20240307",
    ])
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contentBlocks: any[] = [];

  for (const img of validImages) {
    const parsed = parseDataUrl(img.dataUrl || "");
    if (parsed) {
      contentBlocks.push({
        type: "image",
        source: {
          type: "base64",
          media_type: parsed.mediaType,
          data: parsed.base64Data,
        },
      });
    }
  }

  const promptText = `You are the Multimodal Visual-to-Semantic Bridge for "Visual Hobby Market", a Qloo Hackathon application.
Your job is to inspect the user's ${validImages.length} uploaded visual inspiration image(s) (and their optional selected tags: ${
    userTags.join(", ") || "none"
  }) and translate their nuanced visual intuition into:
1. A poetic, specific visual reading that captures subtle details fixed tags miss (e.g. "Warm late-afternoon sunlight in a kitchen with hanging pothos, speckled stoneware, and analog paper textures").
2. Semantic seeds in the exact vocabulary that Qloo's Taste AI taxonomy understands:
   - tag_queries: 4 to 6 short genre/style/mood keywords for Qloo's /v2/tags endpoint (e.g. "ambient", "indie folk", "botanical", "ceramics", "art house", "japanese pop", "jazz hop", "minimalism").
   - entity_queries: 4 to 6 real, well-known cultural entities (musical artists, film directors, movies, books, or iconic places) that match the visual vibe for Qloo's /search endpoint (e.g. "Mort Garson", "Studio Ghibli", "Nujabes", "Wong Kar-wai", "Kinfolk", "Ichiko Aoba").
3. 3 specific, hands-on, actionable real-world hobbies tailored directly to the visual details in these images (not generic templates), each with 3 concrete starter_kit items.

Return ONLY valid JSON matching this exact structure (no markdown fences, no extra text):
{
  "archetype": "3-5 WORD CREATIVE PERSONA IN CAPS",
  "visual_narrative": "2-sentence specific description of the lighting, textures, objects, and atmosphere across the uploaded images and how they translate into a lifestyle vibe.",
  "per_image_captions": ["short 2-4 word micro-vibe for image 1", "short 2-4 word micro-vibe for image 2"],
  "dynamic_tags": ["specific vibe tag 1", "specific vibe tag 2", "specific vibe tag 3", "specific vibe tag 4"],
  "qloo_seeds": {
    "tag_queries": ["genre or style 1", "genre or style 2", "genre or style 3", "genre or style 4"],
    "entity_queries": ["Real Artist or Movie 1", "Real Artist or Director 2", "Real Book or Author 3", "Real Place or Cultural Icon 4"]
  },
  "custom_hobbies": [
    {
      "tag": "SHORT VIBE TAG",
      "title": "Specific Actionable Hobby Title",
      "category": "CATEGORY / CRAFT",
      "difficulty": "BEGINNER",
      "match_score": 99,
      "description": "2 sentences explaining how to practice this hobby based on the exact aesthetic details in the user's photos.",
      "starter_kit": ["Item 1", "Item 2", "Item 3"]
    }
  ]
}`;

  contentBlocks.push({
    type: "text",
    text: promptText,
  });

  for (const model of candidateModels) {
    try {
      logs.push(
        `> [CLAUDE VISION] Sending ${validImages.length} image(s) to Anthropic (${model})...`
      );
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model,
          max_tokens: 1200,
          temperature: 0.4,
          messages: [
            {
              role: "user",
              content: contentBlocks,
            },
          ],
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        logs.push(
          `  [!] Claude API (${model}) returned HTTP ${resp.status}: ${errText.slice(
            0,
            90
          )}`
        );
        continue;
      }

      const data = await resp.json();
      const rawText: string =
        data?.content?.find(
          (c: { type?: string; text?: string }) => c.type === "text"
        )?.text || "";

      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logs.push("  [!] Claude response did not contain JSON block.");
        continue;
      }

      const parsed = JSON.parse(jsonMatch[0]) as ClaudeVisionAnalysis;
      logs.push(
        `  [OK] Claude Vision decoded archetype: "${parsed.archetype}"`
      );
      logs.push(
        `  [OK] Claude -> Qloo Tag Seeds: ${(
          parsed.qloo_seeds?.tag_queries || []
        ).join(", ")}`
      );
      logs.push(
        `  [OK] Claude -> Qloo Entity Seeds: ${(
          parsed.qloo_seeds?.entity_queries || []
        ).join(", ")}`
      );
      return parsed;
    } catch (err) {
      logs.push(`  [!] Claude Vision error (${model}): ${String(err).slice(0, 80)}`);
    }
  }

  return null;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const rawTags: string[] = Array.isArray(body.tags) ? body.tags : [];
  const rawImages: InputImagePayload[] = Array.isArray(body.images)
    ? body.images
    : [];
  const entityTypes: string[] = Array.isArray(body.entity_types)
    ? body.entity_types
    : [
        "urn:entity:artist",
        "urn:entity:place",
        "urn:entity:book",
        "urn:entity:movie",
      ];

  const cleanTags = rawTags
    .map((t) => String(t).trim().toLowerCase())
    .filter(Boolean);

  const logs: string[] = [
    "> INITIALIZING VISUAL_HOBBY_MARKET ENGINE v3.0 (CLAUDE VISION + QLOO TASTE AI)...",
    `> TARGET QLOO GATEWAY: ${QLOO_BASE_URL}`,
  ];

  const anthropicKey = (process.env.ANTHROPIC_API_KEY || "").trim();
  let claudeAnalysis: ClaudeVisionAnalysis | null = null;
  let visionMode = "CANVAS_HEURISTIC";

  if (
    anthropicKey &&
    anthropicKey !== "your_anthropic_claude_api_key_here" &&
    (rawImages.length > 0 || cleanTags.length > 0)
  ) {
    claudeAnalysis = await analyzeWithClaudeVision(
      rawImages,
      cleanTags,
      anthropicKey,
      logs
    );
    if (claudeAnalysis) {
      visionMode = "CLAUDE_VISION_LIVE";
    }
  } else if (rawImages.length > 0) {
    logs.push(
      "> [NOTICE] ANTHROPIC_API_KEY not set -> Using local Color DNA + tag heuristics (Add ANTHROPIC_API_KEY for Claude Vision)."
    );
  }

  const effectiveTags = Array.from(
    new Set([
      ...(claudeAnalysis?.dynamic_tags?.map((t) => t.toLowerCase().trim()) ||
        []),
      ...cleanTags,
    ])
  ).filter(Boolean);

  if (effectiveTags.length === 0) {
    effectiveTags.push("botanical", "anime", "y2k retro");
  }

  logs.push(`> ACTIVE AESTHETIC SIGNALS: ${effectiveTags.join(", ").toUpperCase()}`);

  const apiKey = (process.env.QLOO_API_KEY || "").trim();
  const qlooLiveEntities: CulturalEntity[] = [];
  let qlooMode = "SIMULATION_FALLBACK";

  if (apiKey && apiKey !== "your_qloo_hackathon_api_key_here") {
    logs.push(
      "> X-API-KEY DETECTED [REDACTED]. CONNECTING TO QLOO HACKATHON API..."
    );
    const headers = {
      "X-Api-Key": apiKey,
      Accept: "application/json",
    };

    // Combine Claude's semantic tag_queries & entity_queries with user tags
    const tagSearchTerms: string[] = [];
    const entitySearchTerms: string[] = [];

    if (claudeAnalysis?.qloo_seeds) {
      tagSearchTerms.push(...(claudeAnalysis.qloo_seeds.tag_queries || []));
      entitySearchTerms.push(
        ...(claudeAnalysis.qloo_seeds.entity_queries || [])
      );
    }

    for (const t of effectiveTags.slice(0, 4)) {
      tagSearchTerms.push(t);
      if (AESTHETIC_HOBBY_MATRIX[t]) {
        tagSearchTerms.push(...AESTHETIC_HOBBY_MATRIX[t].qloo_queries.slice(0, 2));
        entitySearchTerms.push(
          AESTHETIC_HOBBY_MATRIX[t].fallback_entities[0].name.split(" - ")[0]
        );
      } else {
        entitySearchTerms.push(t);
      }
    }

    const uniqueTagTerms = Array.from(new Set(tagSearchTerms)).slice(0, 5);
    const uniqueEntityTerms = Array.from(new Set(entitySearchTerms)).slice(0, 5);

    const tagUrns: string[] = [];
    const entityIds: string[] = [];

    // 1A. Resolve Qloo Tag URNs via /v2/tags
    for (const term of uniqueTagTerms) {
      try {
        const tagUrl = `${QLOO_BASE_URL}/v2/tags?filter.query=${encodeURIComponent(
          term
        )}&take=3`;
        logs.push(`> GET ${tagUrl}`);
        const tagResp = await fetch(tagUrl, { headers });
        if (tagResp.ok) {
          const data = await tagResp.json();
          const results = data?.results?.tags || data?.results || [];
          if (Array.isArray(results)) {
            for (const item of results.slice(0, 2)) {
              const id = item?.id || item?.tag_id;
              if (id && !tagUrns.includes(id)) {
                tagUrns.push(id);
                logs.push(`  [+] Qloo Tag URN: ${id}`);
              }
            }
          }
        }
      } catch {
        // continue
      }
    }

    // 1B. Resolve Qloo Entity IDs via /search (powered by Claude's entity_queries!)
    for (const term of uniqueEntityTerms) {
      try {
        const searchUrl = `${QLOO_BASE_URL}/search?query=${encodeURIComponent(
          term
        )}&take=2`;
        logs.push(`> GET ${searchUrl}`);
        const sResp = await fetch(searchUrl, { headers });
        if (sResp.ok) {
          const sdata = await sResp.json();
          const sresults = sdata?.results || [];
          if (Array.isArray(sresults)) {
            for (const ent of sresults.slice(0, 2)) {
              const entId = ent?.entity_id || ent?.id;
              if (entId && !entityIds.includes(String(entId))) {
                entityIds.push(String(entId));
                logs.push(
                  `  [+] Qloo Entity Seed: ${ent?.name || term} (${String(
                    entId
                  ).slice(0, 10)}...)`
                );
              }
            }
          }
        }
      } catch {
        // continue
      }
    }

    // Step 2: Query Qloo /v2/insights with resolved Tag URNs and Entity IDs
    if (tagUrns.length > 0 || entityIds.length > 0) {
      for (const etype of entityTypes) {
        try {
          const params = new URLSearchParams({
            "filter.type": etype,
            take: "4",
          });
          if (entityIds.length > 0) {
            params.set(
              "signal.interests.entities",
              entityIds.slice(0, 4).join(",")
            );
          }
          if (tagUrns.length > 0) {
            params.set("signal.interests.tags", tagUrns.slice(0, 4).join(","));
          }

          const insightsUrl = `${QLOO_BASE_URL}/v2/insights?${params.toString()}`;
          logs.push(`> GET ${QLOO_BASE_URL}/v2/insights?filter.type=${etype}`);
          const resp = await fetch(insightsUrl, { headers });
          if (resp.ok) {
            const payload = await resp.json();
            const entities = payload?.results?.entities || payload?.results || [];
            if (Array.isArray(entities) && entities.length > 0) {
              logs.push(
                `  [OK] Qloo /v2/insights returned ${entities.length} matches for ${etype}`
              );
              const shortType = etype.split(":").pop() || "artist";
              for (const item of entities.slice(0, 4)) {
                const props = item?.properties || {};
                qlooLiveEntities.push({
                  id: item?.entity_id || item?.id || "",
                  name: item?.name || "Cultural Match",
                  type: shortType,
                  sub:
                    props?.short_description ||
                    props?.address ||
                    item?.disambiguation ||
                    `Qloo Taste Match (${shortType.toUpperCase()})`,
                  affinity: 95,
                  source: "qloo_live",
                });
              }
            }
          }
        } catch {
          // continue
        }
      }

      if (qlooLiveEntities.length > 0) {
        qlooMode = "QLOO_LIVE_API";
      }
    }
  } else {
    logs.push(
      "> [NOTICE] Using Curated Cultural Graph (Add QLOO_API_KEY in Environment Variables for live API)."
    );
  }

  const hobbyCards: Array<{
    id: string;
    tag: string;
    title: string;
    category: string;
    difficulty: string;
    match_score: number;
    description: string;
    starter_kit: string[];
    cultural_matches: CulturalEntity[];
  }> = [];

  // If Claude Vision generated custom hobbies tailored to the exact photos, use them first!
  if (
    claudeAnalysis?.custom_hobbies &&
    Array.isArray(claudeAnalysis.custom_hobbies) &&
    claudeAnalysis.custom_hobbies.length > 0
  ) {
    claudeAnalysis.custom_hobbies.slice(0, 3).forEach((ch, idx) => {
      const sliceStart = idx * 2;
      const sliceEntities =
        qlooLiveEntities.length > 0
          ? qlooLiveEntities.slice(sliceStart, sliceStart + 3).length > 0
            ? qlooLiveEntities.slice(sliceStart, sliceStart + 3)
            : qlooLiveEntities.slice(0, 3)
          : [
              {
                name:
                  claudeAnalysis?.qloo_seeds?.entity_queries?.[idx] ||
                  "Plantasia (Mort Garson)",
                type: "artist",
                sub: "Qloo Cultural Match",
              },
              {
                name:
                  claudeAnalysis?.qloo_seeds?.entity_queries?.[idx + 1] ||
                  "Studio Ghibli",
                type: "movie",
                sub: "Qloo Aesthetic Affinity",
              },
              {
                name: "Independent Zine & Craft Sanctuary",
                type: "place",
                sub: "Qloo Recommended Spot",
              },
            ];

      hobbyCards.push({
        id: `hobby-claude-${idx}`,
        tag: String(ch.tag || effectiveTags[idx] || "VISUAL VIBE").toUpperCase(),
        title: ch.title,
        category: ch.category || "CLAUDE VISION // CUSTOM HOBBY",
        difficulty: ch.difficulty || "BEGINNER",
        match_score: Number(ch.match_score) || 98,
        description: ch.description,
        starter_kit: Array.isArray(ch.starter_kit)
          ? ch.starter_kit.slice(0, 3)
          : [
              "Dedicated starter toolkit",
              "Visual inspiration journal",
              "Qloo cultural mixtape",
            ],
        cultural_matches: sliceEntities,
      });
    });
  } else {
    // Fallback to matrix + custom tag synthesis when no Claude Vision response
    const usedKeys = new Set<string>();
    for (const tag of effectiveTags) {
      let matchedKey: string | null = null;
      if (AESTHETIC_HOBBY_MATRIX[tag]) {
        matchedKey = tag;
      } else {
        for (const k of Object.keys(AESTHETIC_HOBBY_MATRIX)) {
          if (tag.includes(k) || k.includes(tag)) {
            matchedKey = k;
            break;
          }
        }
      }

      if (matchedKey && !usedKeys.has(matchedKey)) {
        usedKeys.add(matchedKey);
        const template = AESTHETIC_HOBBY_MATRIX[matchedKey];
        const idx = hobbyCards.length * 2;
        const sliceEntities =
          qlooLiveEntities.length > 0
            ? qlooLiveEntities.slice(idx, idx + 3).length > 0
              ? qlooLiveEntities.slice(idx, idx + 3)
              : qlooLiveEntities.slice(0, 3)
            : template.fallback_entities;

        hobbyCards.push({
          id: `hobby-${matchedKey.replace(/\s+/g, "-")}`,
          tag: matchedKey.toUpperCase(),
          title: template.hobby_title,
          category: template.category,
          difficulty: template.difficulty,
          match_score: template.match_score,
          description: template.description,
          starter_kit: template.starter_kit,
          cultural_matches: sliceEntities,
        });
      } else if (!usedKeys.has(tag)) {
        usedKeys.add(tag);
        const customLabel = tag.toUpperCase();
        const titleTag = toTitleCase(tag);
        const idx = hobbyCards.length * 2;
        const sliceEntities =
          qlooLiveEntities.length > 0 &&
          qlooLiveEntities.slice(idx, idx + 3).length > 0
            ? qlooLiveEntities.slice(idx, idx + 3)
            : [
                {
                  name: `${titleTag} Creators & Community`,
                  type: "artist",
                  sub: `Qloo Taste Match (${customLabel})`,
                },
                {
                  name: `${titleTag} Studios & Local Spots`,
                  type: "place",
                  sub: "Recommended Cultural Spot",
                },
                {
                  name: `The Essential ${titleTag} Zine`,
                  type: "book",
                  sub: "Visual Reference & Guide",
                },
              ];

        hobbyCards.push({
          id: `hobby-custom-${tag.replace(/\s+/g, "-")}`,
          tag: customLabel,
          title: `Hands-On ${titleTag} Creation, Collecting & DIY Club`,
          category: `CUSTOM STICKER // ${customLabel}`,
          difficulty: "BEGINNER",
          match_score: 97,
          description: `Turn your visual inspiration around #${customLabel} into a real-world hobby: start a weekend DIY project, explore cultural picks powered by Qloo, and share your progress with friends.`,
          starter_kit: [
            `Starter kit for ${tag} projects`,
            "Physical moodboard / Scrapbook journal",
            `Curated ${tag} playlist & culture via Qloo API`,
          ],
          cultural_matches: sliceEntities,
        });
      }
    }
  }

  const allCultural: CulturalEntity[] = [...qlooLiveEntities];
  for (const card of hobbyCards) {
    for (const ent of card.cultural_matches) {
      if (!allCultural.some((e) => e.name === ent.name)) {
        allCultural.push(ent);
      }
    }
  }

  const defaultCrossDomain: CulturalEntity[] = [
    {
      name: "Daft Punk - Discovery",
      type: "artist",
      sub: "French Touch / Y2K Electronic",
    },
    {
      name: "Studio Ghibli / Spirited Away",
      type: "movie",
      sub: "Iconic Animation & Visual World",
    },
    {
      name: "FRUiTS Magazine (Shoichi Aoki)",
      type: "book",
      sub: "Harajuku Street Fashion Archive",
    },
    {
      name: "Harajuku Takeshita Street",
      type: "place",
      sub: "Pop Culture & Vintage District",
    },
  ];

  const existingTypes = new Set(allCultural.map((i) => i.type));
  for (const item of defaultCrossDomain) {
    if (!existingTypes.has(item.type)) {
      allCultural.push(item);
    }
  }

  logs.push(
    `> SYNTHESIS COMPLETE (${visionMode} + ${qlooMode}): ${hobbyCards.length} HOBBIES + ${allCultural.length} QLOO CULTURAL MATCHES READY.`
  );

  return NextResponse.json({
    status: "ok",
    vision_mode: visionMode,
    qloo_mode: qlooMode,
    qloo_base_url: QLOO_BASE_URL,
    aesthetic_dna: {
      archetype:
        claudeAnalysis?.archetype ||
        `COZY ${effectiveTags[0].toUpperCase()} EXPLORER`,
      tags: effectiveTags,
      vibe_summary:
        claudeAnalysis?.visual_narrative ||
        `Your visual scrapbook blends ${effectiveTags
          .slice(0, 3)
          .join(
            ", "
          )}! Instead of just saving screenshots on your phone, your aesthetic DNA points to hands-on creative projects, collectible culture, and iconic music & places.`,
      per_image_captions: claudeAnalysis?.per_image_captions || [],
      qloo_seeds: claudeAnalysis?.qloo_seeds || {
        tag_queries: effectiveTags.slice(0, 4),
        entity_queries: [],
      },
    },
    hobbies: hobbyCards,
    qloo_insights: allCultural.slice(0, 12),
    terminal_logs: logs,
  });
}
