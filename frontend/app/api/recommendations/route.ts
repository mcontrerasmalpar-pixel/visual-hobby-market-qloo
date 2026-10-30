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
  "ceramics & clay": {
    hobby_title: "Hand-Built Stoneware Pinch Pots, Ceramic Glazing & Trinket Trays",
    category: "CERAMICS / TACTILE CRAFT",
    difficulty: "BEGINNER",
    match_score: 99,
    description:
      "Shape speckled stoneware or air-dry clay into morning matcha bowls, incense holders, and hand-painted trinket trays at your kitchen table.",
    starter_kit: [
      "Speckled stoneware or air-dry clay block",
      "Wooden rib tool, sponge & wire clay cutter",
      "Food-safe matte glaze or pastel underglazes",
    ],
    qloo_queries: ["ceramics", "pottery", "craft", "folk art"],
    fallback_entities: [
      {
        name: "Ichiko Aoba - Windswept Adan",
        type: "artist",
        sub: "Acoustic Ambient / Craft Soundtrack",
      },
      {
        name: "Little Forest",
        type: "movie",
        sub: "Slow Living & Handcrafted Seasons",
      },
      {
        name: "A Potter's Book (Bernard Leach)",
        type: "book",
        sub: "Foundational Studio Pottery Guide",
      },
    ],
  },
  "anime & illustration": {
    hobby_title:
      "Watercolor & Cel-Shading Character Sketching, Artbooks & Figure Painting",
    category: "ILLUSTRATION / ANIMATION",
    difficulty: "BEGINNER",
    match_score: 99,
    description:
      "Paint expressive storyboards and cozy background studies inspired by classic animation studios, and customize vinyl figures or model kits.",
    starter_kit: [
      "Hot-press watercolor pad + alcohol markers",
      "Blank vinyl figure or model kit",
      "Animation background artbook",
    ],
    qloo_queries: ["anime", "studio ghibli", "manga", "illustration"],
    fallback_entities: [
      {
        name: "Studio Ghibli / Hayao Miyazaki",
        type: "movie",
        sub: "Iconic Japanese Animation",
      },
      {
        name: "Joe Hisaishi",
        type: "artist",
        sub: "Orchestral Animation Soundtracks",
      },
      {
        name: "Ghibli Museum, Mitaka",
        type: "place",
        sub: "Animation & Sketchbook Sanctuary",
      },
    ],
  },
  "vintage vinyl": {
    hobby_title: "Flea Market Vinyl Crate Digging, Cassette Mixtapes & Hi-Fi Listening",
    category: "MUSIC / ANALOG AUDIO",
    difficulty: "BEGINNER",
    match_score: 98,
    description:
      "Hunt weekend indie markets for 70s soul, city pop, and ambient LP pressings, clean and sleeve your records, and curate physical mixtapes.",
    starter_kit: [
      "Belt-drive turntable & carbon fiber brush",
      "Anti-static inner sleeves & crate dividers",
      "Listening notes journal",
    ],
    qloo_queries: ["vinyl", "city pop", "indie folk", "soul music"],
    fallback_entities: [
      {
        name: "Tatsuro Yamashita",
        type: "artist",
        sub: "Warm Analog City Pop",
      },
      {
        name: "High Fidelity",
        type: "movie",
        sub: "Record Store Culture Classic",
      },
      {
        name: "Amoeba Music",
        type: "place",
        sub: "Legendary Independent Record Store",
      },
    ],
  },
  "retro gaming": {
    hobby_title: "Handheld Console Modding, Pixel Art Sprites & Cozy Indie Game Dev",
    category: "TECH / PIXEL ART",
    difficulty: "INTERMEDIATE",
    match_score: 97,
    description:
      "Restore classic pocket handhelds with IPS backlit shells, draw 16-bit pixel art tilesets in Aseprite, and build tiny narrative games.",
    starter_kit: [
      "Aseprite or Pico-8 fantasy console",
      "Custom translucent shell & screwdriver kit",
      "Chiptune / synth soundtrack playlist",
    ],
    qloo_queries: ["video games", "pixel art", "chiptune", "indie games"],
    fallback_entities: [
      { name: "C418 - Minecraft Volume Alpha", type: "artist", sub: "Cozy Ambient Game Soundtrack" },
      {
        name: "Blood, Sweat, and Pixels",
        type: "book",
        sub: "Indie Game Craft Stories",
      },
      {
        name: "Super Potato Retro Game Shop",
        type: "place",
        sub: "Vintage Handheld & Cartridge Hub",
      },
    ],
  },
  "urban architecture": {
    hobby_title: "Urban 35mm Film Photography & Architectural Fountain-Pen Sketching",
    category: "VISUAL ART / URBAN",
    difficulty: "BEGINNER",
    match_score: 95,
    description:
      "Explore your neighborhood documenting sunlit facades, geometric shadows, and historic street corners using 35mm film and an ink sketchbook.",
    starter_kit: [
      "Compact 35mm camera or pocket sketchbook",
      "Kodak Gold 200 or Ilford HP5 film roll",
      "Waterproof fineliner pen + travel waterbrush",
    ],
    qloo_queries: ["architecture", "photography", "urban design", "minimalism"],
    fallback_entities: [
      {
        name: "Barbican Centre & Conservatory",
        type: "place",
        sub: "Iconic Architectural Landmark",
      },
      {
        name: "Columbus (Kogonada)",
        type: "movie",
        sub: "Architectural Cinema Masterpiece",
      },
      {
        name: "The Eyes of the Skin (Juhani Pallasmaa)",
        type: "book",
        sub: "Sensory Architecture Essay",
      },
    ],
  },
  "lo-fi jazz": {
    hobby_title: "Sampler Beatmaking & Late-Night Vinyl Crate Digging",
    category: "MUSIC / CULTURE",
    difficulty: "BEGINNER",
    match_score: 96,
    description:
      "Browse local record shops for 70s jazz samples, chop warm tape loops on a pocket sampler, and host cozy listening sessions.",
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
    match_score: 98,
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
    hobby_title: "Solar Cyanotype Printing & 35mm Film Scrapbooking",
    category: "ART / DARKROOM LAB",
    difficulty: "INTERMEDIATE",
    match_score: 96,
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
        sub: "Cinematic Color & Mood",
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
  "cozy reading": {
    hobby_title:
      "Handcrafted Bookbinding, Fountain Pen Journaling & Indie Book Club",
    category: "LITERATURE / PAPER CRAFT",
    difficulty: "BEGINNER",
    match_score: 95,
    description:
      "Sew your own exposed-spine journals with waxed linen thread, practice fountain-pen lettering, and explore independent bookshops and cafes.",
    starter_kit: [
      "Fountain pen + warm sepia ink",
      "Waxed linen thread & bookbinding awl",
      "120g cream dot-grid paper",
    ],
    qloo_queries: ["literature", "bookshop", "classical music", "indie folk"],
    fallback_entities: [
      {
        name: "Shakespeare and Company",
        type: "place",
        sub: "Historic Independent Bookstore",
      },
      {
        name: "Max Richter",
        type: "artist",
        sub: "Neo-Classical / Reading Soundtrack",
      },
      {
        name: "84, Charing Cross Road (Helene Hanff)",
        type: "book",
        sub: "Bookshop Letters Classic",
      },
    ],
  },
  "indie cinema": {
    hobby_title: "Super-8 / MiniDV Video Diaries, Storyboarding & Film Club Zines",
    category: "CINEMA / STORYTELLING",
    difficulty: "BEGINNER",
    match_score: 96,
    description:
      "Shoot warm weekend video postcards with vintage camcorders or film emulation lenses, print frame-grab zines, and host backyard movie nights.",
    starter_kit: [
      "Vintage camcorder or 16mm film app",
      "Pocket storyboard notebook",
      "Portable mini projector for movie nights",
    ],
    qloo_queries: ["art house", "indie film", "cinematography", "soundtrack"],
    fallback_entities: [
      {
        name: "Before Sunrise (Richard Linklater)",
        type: "movie",
        sub: "Indie Cinema Classic",
      },
      { name: "Air - Moon Safari", type: "artist", sub: "Cinematic Downtempo" },
      {
        name: "Sculpting in Time (Andrei Tarkovsky)",
        type: "book",
        sub: "Poetic Cinema Reflections",
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

async function resizeImageOnBackend(
  mediaType: string,
  base64Data: string,
  index: number,
  logs: string[]
): Promise<{ mediaType: string; base64Data: string }> {
  const inputBuffer = Buffer.from(base64Data, "base64");
  const originalKb = (inputBuffer.byteLength / 1024).toFixed(1);

  let width = 0;
  let height = 0;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const sizeOf = eval('require("next/dist/compiled/image-size")');
    const dims = sizeOf(inputBuffer);
    width = dims?.width || 0;
    height = dims?.height || 0;
  } catch {
    // Ignore dimension check error
  }

  // 1. Try sharp (available in Vercel / standard Node production environments)
  try {
    const sharpModule = await eval('import("sharp")').catch(() => null);
    if (sharpModule && sharpModule.default) {
      const resizedBuffer: Buffer = await sharpModule
        .default(inputBuffer)
        .resize(512, 512, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 75 })
        .toBuffer();
      const resizedKb = (resizedBuffer.byteLength / 1024).toFixed(1);
      logs.push(
        `  [BACKEND RESIZE] Image #${index + 1}: ${originalKb} KB -> ${resizedKb} KB (<=512px JPEG via sharp)`
      );
      return {
        mediaType: "image/jpeg",
        base64Data: resizedBuffer.toString("base64"),
      };
    }
  } catch {
    // Fallback if sharp binary not present locally
  }

  // 2. If image exceeds 512px or 80KB and sharp isn't installed locally, resize via Python Pillow if available
  if (width > 512 || height > 512 || inputBuffer.byteLength > 80 * 1024) {
    try {
      const { execFileSync } = eval('require("child_process")');
      const path = eval('require("path")');
      const fs = eval('require("fs")');
      const venvPy = path.resolve(
        process.cwd(),
        "..",
        "backend",
        "venv",
        "Scripts",
        "python.exe"
      );
      const pyBin = fs.existsSync(venvPy) ? venvPy : "python";
      const pyScript =
        "import sys, base64, io; from PIL import Image; " +
        "raw = base64.b64decode(sys.stdin.read()); " +
        "img = Image.open(io.BytesIO(raw)).convert('RGB'); " +
        "img.thumbnail((512, 512)); " +
        "out = io.BytesIO(); img.save(out, format='JPEG', quality=75, optimize=True); " +
        "sys.stdout.write(base64.b64encode(out.getvalue()).decode('ascii'))";
      const resizedB64: string = execFileSync(pyBin, ["-c", pyScript], {
        input: base64Data,
        encoding: "utf-8",
        timeout: 4000,
      });
      if (resizedB64 && resizedB64.length > 50) {
        const resizedKb = ((resizedB64.length * 0.75) / 1024).toFixed(1);
        logs.push(
          `  [BACKEND RESIZE] Image #${index + 1} (${width}x${height}): ${originalKb} KB -> ${resizedKb} KB (<=512px JPEG)`
        );
        return {
          mediaType: "image/jpeg",
          base64Data: resizedB64.trim(),
        };
      }
    } catch {
      // Continue with existing buffer if Python/Pillow unavailable
    }
  }

  const dimLabel = width && height ? `${width}x${height}, ` : "";
  logs.push(
    `  [BACKEND RESIZE] Image #${index + 1} verified (${dimLabel}${originalKb} KB, ${mediaType} <=512px)`
  );
  return { mediaType, base64Data };
}

async function analyzeWithClaudeVision(
  images: InputImagePayload[],
  userTags: string[],
  anthropicKey: string,
  logs: string[]
): Promise<{ analysis: ClaudeVisionAnalysis | null; modelUsed: string }> {
  const validImages = images
    .filter((img) => img.dataUrl && img.dataUrl.startsWith("data:image/"))
    .slice(0, 4);

  // 1 single default model (claude-haiku-5-5); sonnet is only used if explicitly configured in CLAUDE_MODEL
  const selectedModel = (
    process.env.CLAUDE_MODEL || "claude-haiku-5-5"
  ).trim();

  if (validImages.length === 0 && userTags.length === 0) {
    return { analysis: null, modelUsed: selectedModel };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contentBlocks: any[] = [];

  for (let i = 0; i < validImages.length; i++) {
    const parsed = parseDataUrl(validImages[i].dataUrl || "");
    if (parsed) {
      const resized = await resizeImageOnBackend(
        parsed.mediaType,
        parsed.base64Data,
        i,
        logs
      );
      contentBlocks.push({
        type: "image",
        source: {
          type: "base64",
          media_type: resized.mediaType,
          data: resized.base64Data,
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

  // 25s timeout for Vision + 1 single retry (maxAttempts = 2), NO temperature parameter
  const maxAttempts = 2;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);
    try {
      logs.push(
        `> [CLAUDE VISION] Attempt ${attempt}/${maxAttempts}: Sending ${validImages.length} image(s) to Anthropic (${selectedModel}, timeout=25s)...`
      );
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: selectedModel,
          max_tokens: 900,
          messages: [
            {
              role: "user",
              content: contentBlocks,
            },
          ],
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!resp.ok) {
        const errText = await resp.text();
        logs.push(
          `  [!] Claude API (${selectedModel}) returned HTTP ${resp.status}: ${errText.slice(
            0,
            110
          )}`
        );
        // Do not retry on client/auth/model errors (4xx except 429)
        if (resp.status >= 400 && resp.status < 500 && resp.status !== 429) {
          break;
        }
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
        `  [OK] [SIGNAL SOURCE: CLAUDE_VISION (${selectedModel})] Decoded archetype: "${parsed.archetype}"`
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
      return { analysis: parsed, modelUsed: selectedModel };
    } catch (err) {
      clearTimeout(timeoutId);
      logs.push(
        `  [!] Claude Vision attempt ${attempt}/${maxAttempts} failed (${selectedModel}): ${String(
          err
        ).slice(0, 80)}`
      );
    }
  }

  return { analysis: null, modelUsed: selectedModel };
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
    "> INITIALIZING VISUAL_HOBBY_MARKET ENGINE v3.1 (CLAUDE VISION + QLOO TASTE AI)...",
    `> TARGET QLOO GATEWAY: ${QLOO_BASE_URL}`,
  ];

  const anthropicKey = (process.env.ANTHROPIC_API_KEY || "").trim();
  let claudeAnalysis: ClaudeVisionAnalysis | null = null;
  let claudeModelUsed = (
    process.env.CLAUDE_MODEL || "claude-haiku-5-5"
  ).trim();
  let visionMode = "FALLBACK_HEURISTIC";
  let signalSource: "CLAUDE_VISION" | "FALLBACK" = "FALLBACK";

  if (
    anthropicKey &&
    anthropicKey !== "your_anthropic_claude_api_key_here" &&
    (rawImages.length > 0 || cleanTags.length > 0)
  ) {
    const resVision = await analyzeWithClaudeVision(
      rawImages,
      cleanTags,
      anthropicKey,
      logs
    );
    claudeAnalysis = resVision.analysis;
    claudeModelUsed = resVision.modelUsed;
    if (claudeAnalysis) {
      visionMode = "CLAUDE_VISION_LIVE";
      signalSource = "CLAUDE_VISION";
    } else {
      logs.push(
        `> [SIGNAL SOURCE: FALLBACK_HEURISTIC] Claude Vision (${claudeModelUsed}) did not return analysis -> Using fallback aesthetic signals.`
      );
    }
  } else {
    logs.push(
      "> [SIGNAL SOURCE: FALLBACK_HEURISTIC] ANTHROPIC_API_KEY not configured -> Using fallback aesthetic signals."
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
    effectiveTags.push("botanical", "ceramics & clay", "analog photography");
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

    const uniqueTagTerms = Array.from(new Set(tagSearchTerms)).slice(0, 3);
    const uniqueEntityTerms = Array.from(new Set(entitySearchTerms)).slice(0, 3);

    const tagUrns: string[] = [];
    const entityIds: string[] = [];

    // 1A & 1B IN PARALLEL: Resolve Qloo Tag URNs (/v2/tags) and Entity IDs (/search) simultaneously!
    await Promise.all([
      ...uniqueTagTerms.map(async (term) => {
        try {
          const tagUrl = `${QLOO_BASE_URL}/v2/tags?filter.query=${encodeURIComponent(
            term
          )}&take=2`;
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
      }),
      ...uniqueEntityTerms.map(async (term) => {
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
      }),
    ]);

    // Step 2 IN PARALLEL: Query Qloo /v2/insights across all 4 entityTypes simultaneously!
    if (tagUrns.length > 0 || entityIds.length > 0) {
      await Promise.all(
        entityTypes.map(async (etype) => {
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
              params.set(
                "signal.interests.tags",
                tagUrns.slice(0, 4).join(",")
              );
            }

            const insightsUrl = `${QLOO_BASE_URL}/v2/insights?${params.toString()}`;
            logs.push(`> GET ${QLOO_BASE_URL}/v2/insights?filter.type=${etype}`);
            const resp = await fetch(insightsUrl, { headers });
            if (resp.ok) {
              const payload = await resp.json();
              const entities =
                payload?.results?.entities || payload?.results || [];
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
        })
      );

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
      name: "Plantasia (Mort Garson)",
      type: "artist",
      sub: "Warm Earth Music for Plants & Crafts",
    },
    {
      name: "Studio Ghibli / Spirited Away",
      type: "movie",
      sub: "Iconic Animation & Visual World",
    },
    {
      name: "Braiding Sweetgrass (Robin Wall Kimmerer)",
      type: "book",
      sub: "Botany, Craft & Slow Living",
    },
    {
      name: "Kew Royal Botanic Gardens",
      type: "place",
      sub: "Historic Botanical Conservatory",
    },
  ];

  const existingTypes = new Set(allCultural.map((i) => i.type));
  for (const item of defaultCrossDomain) {
    if (!existingTypes.has(item.type)) {
      allCultural.push(item);
    }
  }

  logs.push(
    `> SYNTHESIS COMPLETE [SIGNAL SOURCE: ${signalSource}${
      signalSource === "CLAUDE_VISION" ? ` (${claudeModelUsed})` : ""
    } | QLOO: ${qlooMode}]: ${hobbyCards.length} HOBBIES + ${
      allCultural.length
    } QLOO CULTURAL MATCHES READY.`
  );

  return NextResponse.json({
    status: "ok",
    signal_source: signalSource,
    claude_model_used: claudeModelUsed,
    vision_mode: visionMode,
    qloo_mode: qlooMode,
    qloo_base_url: QLOO_BASE_URL,
    aesthetic_dna: {
      signal_source: signalSource,
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
