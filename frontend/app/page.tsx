"use client";

import React, { useState, useEffect, useRef } from "react";
import Y2KWindow from "../components/Y2KWindow";

function getApiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL || "";
}

interface UploadedImage {
  id: string;
  name: string;
  previewUrl: string;
  dataUrl?: string;
  detectedTag: string;
  dominantHex: string;
  paletteHexes: string[];
}

interface CulturalMatch {
  id?: string;
  name: string;
  type: string;
  sub: string;
  affinity?: number;
  source?: string;
}

interface HobbyCard {
  id: string;
  tag: string;
  title: string;
  category: string;
  difficulty: string;
  match_score: number;
  description: string;
  starter_kit: string[];
  cultural_matches: CulturalMatch[];
}

interface FeedPost {
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

const INITIAL_STICKERS = [
  "botanical",
  "ceramics & clay",
  "analog photography",
  "lo-fi jazz",
  "anime & illustration",
  "vintage vinyl",
  "urban architecture",
  "cozy reading",
  "indie cinema",
  "retro gaming",
];

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return (
    "#" +
    [clamp(r), clamp(g), clamp(b)]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

export default function HomePage() {
  // Navigation between the 2 main tabs
  const [activeTab, setActiveTab] = useState<"discover" | "community">(
    "discover"
  );

  // Starts empty so only the user's uploaded photos are displayed
  const [images, setImages] = useState<UploadedImage[]>([]);
  // Progressive reveal: sections 02, 03, and 04 stay hidden until photos are uploaded or button clicked
  const [hasUnlockedResults, setHasUnlockedResults] = useState(false);

  const [availableTags, setAvailableTags] =
    useState<string[]>(INITIAL_STICKERS);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Interactive states for filters, copy card, and Judge Mode
  const [mixtapeFilter, setMixtapeFilter] = useState<string>("all");
  const [copiedCard, setCopiedCard] = useState(false);
  const [showJudgeLogs, setShowJudgeLogs] = useState(false);

  // Results from Claude Vision + Qloo
  const [archetype, setArchetype] = useState("COZY INDIE EXPLORER");
  const [vibeSummary, setVibeSummary] = useState(
    "Hang your favorite screenshots on the clothesline above or pick your aesthetic stickers to unlock cozy hobbies and cultural picks powered by Claude Vision & Qloo!"
  );
  const [visionMode, setVisionMode] = useState<string>("READY");
  const [signalSource, setSignalSource] = useState<"CLAUDE_VISION" | "FALLBACK">(
    "FALLBACK"
  );
  const [claudeModelUsed, setClaudeModelUsed] =
    useState<string>("claude-haiku-5-5");
  const [qlooMode, setQlooMode] = useState<string>("QLOO_READY");
  const [qlooSeeds, setQlooSeeds] = useState<{
    tag_queries: string[];
    entity_queries: string[];
  }>({ tag_queries: [], entity_queries: [] });
  const [hobbies, setHobbies] = useState<HobbyCard[]>([]);
  const [qlooInsights, setQlooInsights] = useState<CulturalMatch[]>([]);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "🍀 QLOO HOBBY MARKET ENGINE v3.0 (CLAUDE VISION + QLOO TASTE AI) READY...",
    "☁️ TARGET GATEWAY: https://hackathon.api.qloo.com/v2/insights",
  ]);

  // Community Guestbook
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);
  const [username, setUsername] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("🍀");
  const [chosenHobby, setChosenHobby] = useState("");
  const [chosenQlooMatch, setChosenQlooMatch] = useState("");
  const [comment, setComment] = useState("");
  const [postSuccess, setPostSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchFeed();
  }, []);

  async function fetchFeed() {
    try {
      const res = await fetch(`${getApiBase()}/api/feed`);
      if (res.ok) {
        const data = await res.json();
        setFeedPosts(data.posts || []);
      }
    } catch {
      // ignore if backend starting
    }
  }

  async function analyzeImageFile(file: File): Promise<UploadedImage> {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext("2d");
        let detectedTag = "cozy aesthetic";
        let dominantHex = "#10B981";
        let paletteHexes: string[] = ["#BAE6FD", "#A7F3D0", "#FEF08A"];

        if (ctx) {
          ctx.drawImage(img, 0, 0, 32, 32);
          const data = ctx.getImageData(0, 0, 32, 32).data;
          let r = 0,
            g = 0,
            b = 0,
            count = 0;

          let r1 = 0,
            g1 = 0,
            b1 = 0,
            c1 = 0;
          let r2 = 0,
            g2 = 0,
            b2 = 0,
            c2 = 0;

          for (let i = 0; i < data.length; i += 4) {
            const pr = data[i];
            const pg = data[i + 1];
            const pb = data[i + 2];
            r += pr;
            g += pg;
            b += pb;
            count++;

            if (i < data.length / 2) {
              r1 += pr;
              g1 += pg;
              b1 += pb;
              c1++;
            } else {
              r2 += pr;
              g2 += pg;
              b2 += pb;
              c2++;
            }
          }
          r = Math.round(r / count);
          g = Math.round(g / count);
          b = Math.round(b / count);

          const hexAvg = rgbToHex(r, g, b);
          const hexTop = rgbToHex(r1 / c1, g1 / c1, b1 / c1);
          const hexBot = rgbToHex(r2 / c2, g2 / c2, b2 / c2);
          paletteHexes = Array.from(new Set([hexAvg, hexTop, hexBot]));

          const brightness = (r + g + b) / 3;
          const nameLow = file.name.toLowerCase();

          if (
            nameLow.includes("anime") ||
            nameLow.includes("manga") ||
            nameLow.includes("ghibli")
          ) {
            detectedTag = "anime & illustration";
            dominantHex = "#60A5FA";
          } else if (
            nameLow.includes("ceramic") ||
            nameLow.includes("clay") ||
            nameLow.includes("craft") ||
            (brightness > 155 && (r > 150 || g > 150))
          ) {
            detectedTag = "ceramics & clay";
            dominantHex = "#F59E0B";
          } else if (
            nameLow.includes("plant") ||
            nameLow.includes("flower") ||
            (g > r + 15 && g > b + 10)
          ) {
            detectedTag = "botanical";
            dominantHex = "#10B981";
          } else if (
            nameLow.includes("arch") ||
            (Math.abs(r - g) < 10 && Math.abs(g - b) < 10 && brightness < 150)
          ) {
            detectedTag = "urban architecture";
            dominantHex = "#38BDF8";
          } else if (brightness < 75) {
            detectedTag = "cozy reading";
            dominantHex = "#A855F7";
          } else if (r > 140 && g > 110) {
            detectedTag = "analog photography";
            dominantHex = "#F59E0B";
          } else {
            detectedTag = "botanical";
            dominantHex = "#38BDF8";
          }
        }

        // Also create a compressed JPEG dataUrl (max 512px) for Claude Vision API
        let dataUrl = "";
        try {
          const maxDim = 512;
          const scale = Math.min(
            1,
            maxDim / Math.max(img.width || 512, img.height || 512)
          );
          const vCanvas = document.createElement("canvas");
          vCanvas.width = Math.max(1, Math.round((img.width || 512) * scale));
          vCanvas.height = Math.max(1, Math.round((img.height || 512) * scale));
          const vCtx = vCanvas.getContext("2d");
          if (vCtx) {
            vCtx.drawImage(img, 0, 0, vCanvas.width, vCanvas.height);
            dataUrl = vCanvas.toDataURL("image/jpeg", 0.75);
          }
        } catch {
          // ignore if canvas tainted
        }

        resolve({
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          name: file.name,
          previewUrl: url,
          dataUrl,
          detectedTag,
          dominantHex,
          paletteHexes,
        });
      };
      img.onerror = () => {
        resolve({
          id: `${file.name}-${Date.now()}`,
          name: file.name,
          previewUrl: url,
          detectedTag: "botanical",
          dominantHex: "#38BDF8",
          paletteHexes: ["#BAE6FD", "#A7F3D0"],
        });
      };
      img.src = url;
    });
  }

  async function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const filesArray = Array.from(fileList).slice(0, 4);

    const processed = await Promise.all(filesArray.map(analyzeImageFile));
    const combined = [...images, ...processed].slice(-4);
    setImages(combined);
  }

  function handleRemoveImage(idToRemove: string) {
    setImages((prev) => {
      const next = prev.filter((img) => img.id !== idToRemove);
      if (next.length === 0) {
        setHasUnlockedResults(false);
      }
      return next;
    });
  }

  function toggleTag(tag: string) {
    const updated = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(updated);
  }

  function handleAddCustomTag(e: React.FormEvent) {
    e.preventDefault();
    const clean = customTagInput.trim().toLowerCase();
    if (!clean) return;

    if (!availableTags.includes(clean)) {
      setAvailableTags((prev) => [...prev, clean]);
    }

    const nextSelected = selectedTags.includes(clean)
      ? selectedTags
      : [...selectedTags, clean];
    setSelectedTags(nextSelected);
    setCustomTagInput("");
  }

  async function fetchRecommendations(
    tagsToQuery: string[] = selectedTags,
    imagesToAnalyze: UploadedImage[] = images
  ) {
    const effectiveTags =
      tagsToQuery.length > 0
        ? tagsToQuery
        : ["botanical", "ceramics & clay", "analog photography"];
    setIsLoading(true);

    try {
      const res = await fetch(`${getApiBase()}/api/recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tags: effectiveTags,
          images: imagesToAnalyze.map((img) => ({
            name: img.name,
            dataUrl: img.dataUrl || "",
            dominantHex: img.dominantHex,
          })),
          entity_types: [
            "urn:entity:artist",
            "urn:entity:place",
            "urn:entity:book",
            "urn:entity:movie",
          ],
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      setArchetype(data.aesthetic_dna?.archetype || "COZY INDIE EXPLORER");
      setVibeSummary(data.aesthetic_dna?.vibe_summary || "");
      setVisionMode(data.vision_mode || "FALLBACK_HEURISTIC");
      setSignalSource(
        data.signal_source === "CLAUDE_VISION" ? "CLAUDE_VISION" : "FALLBACK"
      );
      setClaudeModelUsed(data.claude_model_used || "claude-haiku-5-5");
      setQlooMode(data.qloo_mode || "QLOO_LIVE");
      if (data.aesthetic_dna?.qloo_seeds) {
        setQlooSeeds(data.aesthetic_dna.qloo_seeds);
      }

      // If Claude Vision discovered dynamic tags, add them to the scrapbook!
      if (Array.isArray(data.aesthetic_dna?.tags) && data.aesthetic_dna.tags.length > 0) {
        const returnedTags: string[] = data.aesthetic_dna.tags;
        setAvailableTags((prev) => Array.from(new Set([...prev, ...returnedTags])));
        setSelectedTags(returnedTags.slice(0, 6));
      }

      // If Claude Vision returned per-image micro-captions, update the photo badges on the clothesline!
      if (
        Array.isArray(data.aesthetic_dna?.per_image_captions) &&
        data.aesthetic_dna.per_image_captions.length > 0
      ) {
        const captions: string[] = data.aesthetic_dna.per_image_captions;
        setImages((prev) =>
          prev.map((item, idx) =>
            captions[idx] ? { ...item, detectedTag: captions[idx] } : item
          )
        );
      }

      setHobbies(data.hobbies || []);
      setQlooInsights(data.qloo_insights || []);
      if (Array.isArray(data.terminal_logs)) {
        setTerminalLogs(data.terminal_logs);
      }
      if (data.hobbies?.[0]) {
        setChosenHobby(data.hobbies[0].title);
        const firstMatch =
          data.hobbies[0].cultural_matches?.[0]?.name || "Qloo Taste Match";
        setChosenQlooMatch(firstMatch);
      }
      setHasUnlockedResults(true);
    } catch (err) {
      setTerminalLogs((prev) => [
        ...prev,
        `[!] Connect API at ${getApiBase() || "/api"}: ${String(err)}`,
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleCopyZineResult() {
    const topHobbies = hobbies.map((h) => h.title).join(" • ");
    const topQloo = qlooInsights
      .slice(0, 3)
      .map((q) => q.name)
      .join(", ");
    const shareText = `🍀 MY VISUAL HOBBY MARKET PERSONA: ${archetype} ✨\n🏷️ Aesthetic Tags: ${selectedTags
      .map((t) => "#" + t)
      .join(" ")}\n🧺 Unlocked Hobbies: ${topHobbies}\n🎵 Qloo Cultural Picks: ${topQloo}`;

    navigator.clipboard?.writeText(shareText);
    setCopiedCard(true);
    setTimeout(() => setCopiedCard(false), 3000);
  }

  function handleSelectHobbyForCommunity(hobby: HobbyCard) {
    setChosenHobby(hobby.title);
    const matchNames = hobby.cultural_matches
      .map((m) => m.name)
      .slice(0, 2)
      .join(" / ");
    setChosenQlooMatch(matchNames || "Qloo Taste Match");
    setActiveTab("community");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handlePublishPost(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !chosenHobby.trim() || !comment.trim()) return;

    try {
      const res = await fetch(`${getApiBase()}/api/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          avatar: selectedAvatar,
          hobby_title: chosenHobby,
          aesthetic_tags: selectedTags,
          qloo_match: chosenQlooMatch || "Qloo Taste AI",
          comment,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setFeedPosts(data.posts || []);
        setComment("");
        setPostSuccess(true);
        setTimeout(() => setPostSuccess(false), 3000);
      }
    } catch {
      // ignore
    }
  }

  async function handleLikePost(postId: string) {
    try {
      const res = await fetch(`${getApiBase()}/api/feed/${postId}/like`, {
        method: "POST",
      });
      if (res.ok) {
        fetchFeed();
      }
    } catch {
      // ignore
    }
  }

  const allVisibleStickers = Array.from(
    new Set([...availableTags, ...selectedTags])
  );

  const extractedSwatches = Array.from(
    new Set(images.flatMap((img) => img.paletteHexes))
  ).slice(0, 8);

  const filteredQlooInsights =
    mixtapeFilter === "all"
      ? qlooInsights.slice(0, 4)
      : qlooInsights.filter((item) => item.type === mixtapeFilter).slice(0, 4);

  const typeEmoji: Record<string, string> = {
    artist: "🎵",
    place: "📍",
    book: "📖",
    movie: "🎬",
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* FLOATING COZY DECORATIONS (CLOVERS, CLOUDS, SPARKLES & VINTAGE STAMP) */}
      <span className="fixed top-8 left-8 text-3xl pointer-events-none select-none hidden md:block">
        🍀
      </span>
      <span className="fixed top-14 right-12 text-2xl pointer-events-none select-none text-[#F59E0B] hidden md:block">
        ✦
      </span>
      <span className="fixed bottom-16 left-10 text-2xl pointer-events-none select-none text-[#059669] hidden md:block">
        ♪
      </span>

      {/* Circular Vintage Market Stamp (Bottom-Right Corner like Pet Paradise) */}
      <div className="hidden lg:flex w-24 h-24 rounded-full bg-[#FEF08A]/90 border-2 border-dashed border-[#4A3531] items-center justify-center text-center p-2 fixed bottom-6 right-8 rotate-12 pointer-events-none z-20 shadow-sm">
        <span className="text-xs font-extrabold text-[#4A3531] leading-tight">
          ★ QLOO
          <br />
          HOBBY MARKET
          <br />
          TASTE AI ★
        </span>
      </div>

      {/* MAIN CONTENT */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-9 relative z-10">
        {/* COZY STORYBOOK HEADER (INSPIRED BY FIGURE 8 MARKET & PET PARADISE) */}
        <header className="flex flex-col items-center text-center space-y-3">
          <div className="handwritten-note text-xl sm:text-2xl text-[#047857] tracking-wide">
            new hobby unlocked! 🍀
          </div>

          <h1 className="cozy-cloud-title text-4xl sm:text-6xl tracking-tight leading-none py-1">
            Visual 🍀 Hobby Market
          </h1>

          <p className="handwritten-note text-xl sm:text-2xl text-[#4A3531] max-w-xl">
            vintage aesthetics, music, trinkets &amp; cozy hobbies powered by Qloo AI
          </p>

          {/* 2 COZY PILL NAVIGATION TABS */}
          <nav
            aria-label="Market sections"
            className="flex flex-wrap items-center justify-center gap-3.5 pt-2"
          >
            <button
              type="button"
              onClick={() => setActiveTab("discover")}
              className={`cozy-pill-btn px-6 py-2 text-sm sm:text-base font-extrabold ${
                activeTab === "discover"
                  ? "bg-[#FEF08A] text-[#4A3531]"
                  : "bg-white/90 text-[#4A3531] hover:bg-white"
              }`}
            >
              🧺 01. Your Clothesline Scrapbook
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("community")}
              className={`cozy-pill-btn px-6 py-2 text-sm sm:text-base font-extrabold ${
                activeTab === "community"
                  ? "bg-[#BAE6FD] text-[#4A3531]"
                  : "bg-white/90 text-[#4A3531] hover:bg-white"
              }`}
            >
              💌 02. Market Guestbook ({feedPosts.length})
            </button>
          </nav>
        </header>

        {/* ================================================================= */}
        {/* TAB 1: CLOTHESLINE SCRAPBOOK (COMPACT START -> REVEALS 02, 03, 04) */}
        {/* ================================================================= */}
        {activeTab === "discover" && (
          <div className="space-y-9 pb-10">
            <div
              className={
                hasUnlockedResults
                  ? "grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
                  : "max-w-3xl mx-auto"
              }
            >
              {/* 01. CLOTHESLINE SCRAPBOOK IN A BLUE GINGHAM CLOUD */}
              <div className={hasUnlockedResults ? "lg:col-span-7" : "w-full"}>
                <Y2KWindow
                  title="01. Your Clothesline Scrapbook (Hang Photos)"
                  accent="cyan"
                  badge={`${images.length} HUNG`}
                  sticker="🧺"
                >
                  <div className="space-y-5">
                    {/* Drag & Drop Zone */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        handleFilesSelected(e.dataTransfer.files);
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      className={`cursor-pointer rounded-3xl border-[3px] border-dashed p-6 text-center transition-all ${
                        isDragging
                          ? "border-[#10B981] bg-[#ECFDF5] scale-[1.01]"
                          : "border-[#4A3531] bg-white/90 hover:bg-[#FEFCE8]"
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleFilesSelected(e.target.files)}
                        className="hidden"
                      />
                      <div className="text-3xl mb-1">🍀 🧺 ☁️ ♪</div>
                      <div className="cozy-subtitle text-xl sm:text-2xl text-[#4A3531]">
                        Hang your screenshots or Pinterest pins on the clothesline!
                      </div>
                      <p className="handwritten-note text-lg text-[#4A3531]/80 mt-0.5">
                        click or drag 1 to 4 images from your computer to unlock your cozy hobbies
                      </p>
                    </div>

                    {/* CLOTHESLINE WITH WOODEN CLOTHESPINS (ONLY SHOWN WHEN USER UPLOADS PHOTOS) */}
                    {images.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-xs font-extrabold text-[#4A3531] uppercase">
                            🧺 Hung on your clothesline ({images.length}/4):
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setImages([]);
                              setHasUnlockedResults(false);
                            }}
                            className="text-xs font-extrabold text-[#92400E] hover:underline"
                          >
                            🗑️ Take down all photos
                          </button>
                        </div>

                        {/* Clothesline Rope + Hanging Photos */}
                        <div className="relative pt-4">
                          {/* Rope across the top */}
                          <div className="absolute top-6 left-2 right-2 h-1 bg-[#4A3531] rounded-full z-0" />

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
                            {images.map((img, slotIndex) => {
                              const rotations = [
                                "-rotate-2",
                                "rotate-2",
                                "-rotate-1",
                                "rotate-1",
                              ];

                              return (
                                <div
                                  key={img.id}
                                  className={`relative bg-white border-[2.5px] border-[#4A3531] rounded-2xl p-2.5 shadow-[0_5px_0_rgba(74,53,49,0.18)] transform ${
                                    rotations[slotIndex % 4]
                                  } transition-transform hover:rotate-0 hover:scale-105`}
                                >
                                  {/* Wooden Clothespin at top center */}
                                  <div className="wooden-clothespin mx-auto -mt-6 mb-1.5" />

                                  {/* Remove single photo button */}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveImage(img.id)}
                                    title="Remove this photo"
                                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#FEF08A] text-[#4A3531] border-2 border-[#4A3531] text-xs font-extrabold flex items-center justify-center shadow-xs hover:bg-[#FDE047] z-20"
                                  >
                                    ✕
                                  </button>

                                  <div className="space-y-1.5">
                                    <div className="aspect-[4/3] w-full overflow-hidden rounded-xl border-2 border-[#4A3531]">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={img.previewUrl}
                                        alt={img.name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div className="truncate text-xs font-extrabold text-[#4A3531] text-center">
                                      {img.name}
                                    </div>
                                    <div className="text-center">
                                      <span className="inline-block handwritten-note text-base text-[#065F46] bg-[#D1FAE5] border border-[#4A3531] px-2.5 py-0.2 rounded-full">
                                        ✦ {img.detectedTag}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Extracted Color Palette Swatches */}
                        {extractedSwatches.length > 0 && (
                          <div className="bg-white/95 border-2 border-[#4A3531] rounded-2xl px-3.5 py-2 flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-extrabold text-[#4A3531] uppercase">
                              🎨 Extracted Color DNA:
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                              {extractedSwatches.map((hex) => (
                                <div
                                  key={hex}
                                  className="flex items-center gap-1 bg-[#FEFCE8] border border-[#4A3531] rounded-full px-2 py-0.5"
                                >
                                  <span
                                    className="w-3.5 h-3.5 rounded-full border border-[#4A3531] inline-block"
                                    style={{ backgroundColor: hex }}
                                  />
                                  <span className="text-xs font-mono font-bold text-[#4A3531]">
                                    {hex}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Cozy Aesthetic Sticker Pills */}
                    <div className="bg-white/95 border-[2.5px] border-[#4A3531] rounded-3xl p-4 space-y-3 shadow-[0_4px_0_rgba(74,53,49,0.12)]">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs sm:text-sm font-extrabold text-[#4A3531] uppercase">
                          🍀 Aesthetic Trinkets &amp; Tags (Click to mix):
                        </span>
                        <span className="handwritten-note text-base text-[#047857]">
                          {selectedTags.length} selected
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {allVisibleStickers.map((tag, i) => {
                          const active = selectedTags.includes(tag);
                          const activeColors = [
                            "bg-[#D1FAE5] text-[#065F46]",
                            "bg-[#BAE6FD] text-[#075985]",
                            "bg-[#FEF08A] text-[#4A3531]",
                            "bg-[#FEF3C7] text-[#92400E]",
                          ];
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => toggleTag(tag)}
                              className={`cozy-pill-btn text-xs font-extrabold px-3.5 py-1 uppercase ${
                                active
                                  ? activeColors[i % activeColors.length]
                                  : "bg-white text-[#4A3531] hover:bg-[#FEFCE8]"
                              }`}
                            >
                              {active ? "🍀 " : "+ "}
                              {tag}
                            </button>
                          );
                        })}
                      </div>

                      {/* Custom Tag Input + "go go go !!" CTA Button */}
                      <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                        <form
                          onSubmit={handleAddCustomTag}
                          className="flex flex-1 gap-2"
                        >
                          <input
                            type="text"
                            value={customTagInput}
                            onChange={(e) => setCustomTagInput(e.target.value)}
                            placeholder="Add another vibe (e.g. anime, ceramics, vinyl)..."
                            className="flex-1 bg-[#FEFCE8] border-2 border-[#4A3531] rounded-full px-4 py-1.5 text-xs font-bold text-[#4A3531] placeholder:text-[#4A3531]/50 focus:outline-none focus:bg-white"
                          />
                          <button
                            type="submit"
                            className="cozy-pill-btn bg-[#BAE6FD] text-[#4A3531] font-extrabold text-xs px-4 py-1.5"
                          >
                            + TAG
                          </button>
                        </form>

                        <button
                          type="button"
                          onClick={() =>
                            fetchRecommendations(selectedTags, images)
                          }
                          disabled={isLoading}
                          className="cozy-pill-btn bg-[#A7F3D0] hover:bg-[#6EE7B7] text-[#4A3531] font-extrabold text-xs sm:text-sm px-6 py-2 disabled:opacity-50"
                        >
                          {isLoading
                            ? "🔭 Claude Vision + Qloo..."
                            : "✨ Find My Hobbies! go go go !! →"}
                        </button>
                      </div>
                    </div>
                  </div>
                </Y2KWindow>
              </div>

              {/* RIGHT COLUMN (5 cols): ONLY SHOWN AFTER UPLOADING PHOTOS OR CLICKING BUTTON */}
              {hasUnlockedResults && (
                <div className="lg:col-span-5 flex flex-col gap-8">
                  <Y2KWindow
                    title="02. Your Cozy Vibe Check"
                    accent="lime"
                    badge={
                      signalSource === "CLAUDE_VISION"
                        ? `CLAUDE (${claudeModelUsed})`
                        : "FALLBACK SIGNALS"
                    }
                    sticker="🍀"
                  >
                    <div className="space-y-3 text-center">
                      <div className="bg-[#FEFCE8] border-[2.5px] border-[#4A3531] rounded-3xl p-4 shadow-[0_4px_0_rgba(74,53,49,0.12)]">
                        <div className="handwritten-note text-lg text-[#047857]">
                          ✦ your aesthetic persona is ✦
                        </div>
                        <div className="cozy-subtitle text-2xl sm:text-3xl text-[#4A3531] mt-0.5">
                          {archetype}
                        </div>
                      </div>

                      <div className="text-left bg-white/95 p-3.5 rounded-2xl border-2 border-dashed border-[#4A3531] space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <span className="text-xs font-extrabold text-[#047857] uppercase">
                            🔭 Visual Reading (Input Bridge):
                          </span>
                          <span
                            className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border border-[#4A3531] ${
                              signalSource === "CLAUDE_VISION"
                                ? "bg-[#D1FAE5] text-[#065F46]"
                                : "bg-[#FEF3C7] text-[#92400E]"
                            }`}
                          >
                            {signalSource === "CLAUDE_VISION"
                              ? `🟢 Source: Claude (${claudeModelUsed})`
                              : "🟠 Source: Fallback Heuristic"}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-[#4A3531] leading-relaxed">
                          {vibeSummary}
                        </p>
                      </div>

                      {/* Semantic Seeds Translated for Qloo Taxonomy */}
                      {(qlooSeeds.entity_queries.length > 0 ||
                        qlooSeeds.tag_queries.length > 0) && (
                        <div className="text-left bg-[#E0F2FE]/60 border-2 border-[#4A3531] rounded-2xl p-3 space-y-1.5">
                          <div className="flex flex-wrap items-center justify-between gap-1">
                            <span className="text-xs font-extrabold text-[#4A3531] uppercase">
                              🎯 Seeds for Qloo Taxonomy:
                            </span>
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white text-[#4A3531] border border-[#4A3531]">
                              {signalSource === "CLAUDE_VISION"
                                ? "Translated by Claude Vision"
                                : "From Local Tag Fallback"}
                            </span>
                          </div>
                          {qlooSeeds.entity_queries.length > 0 && (
                            <div className="text-xs font-bold text-[#4A3531]">
                              <span className="text-[#075985] font-extrabold">
                                Anchor Entities (/search):{" "}
                              </span>
                              {qlooSeeds.entity_queries.join(" • ")}
                            </div>
                          )}
                          {qlooSeeds.tag_queries.length > 0 && (
                            <div className="text-xs font-bold text-[#4A3531]">
                              <span className="text-[#065F46] font-extrabold">
                                Taxonomy Tags (/v2/tags):{" "}
                              </span>
                              {qlooSeeds.tag_queries.join(" • ")}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={handleCopyZineResult}
                          className="cozy-pill-btn bg-[#FEF08A] hover:bg-[#FDE047] text-[#4A3531] px-4 py-1.5 text-xs font-extrabold"
                        >
                          {copiedCard
                            ? "🍀 Copied to Clipboard! Ready to Share!"
                            : "📋 Copy My Market Card Summary"}
                        </button>
                      </div>
                    </div>
                  </Y2KWindow>

                  {/* 03. QLOO MIXTAPE & TOP PICKS */}
                  <Y2KWindow
                    title="03. Your Qloo Mixtape & Top Picks"
                    accent="pink"
                    badge="TASTE AI™"
                    sticker="🎵"
                  >
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-1.5 bg-white/95 border-2 border-[#4A3531] rounded-2xl p-2">
                        {[
                          { id: "all", label: "✦ All" },
                          { id: "artist", label: "🎵 Music" },
                          { id: "movie", label: "🎬 Movies" },
                          { id: "book", label: "📖 Books" },
                          { id: "place", label: "📍 Places" },
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setMixtapeFilter(tab.id)}
                            className={`rounded-full text-xs font-extrabold px-2.5 py-1 border-2 border-[#4A3531] transition-colors ${
                              mixtapeFilter === tab.id
                                ? "bg-[#FEF08A] text-[#4A3531]"
                                : "bg-white text-[#4A3531] hover:bg-[#E0F2FE]"
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {filteredQlooInsights.map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-white/95 border-2 border-[#4A3531] rounded-2xl px-3 py-2 flex items-center justify-between gap-2 shadow-[0_2px_0_rgba(74,53,49,0.12)]"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-8 h-8 rounded-full bg-[#E0F2FE] border-2 border-[#4A3531] flex items-center justify-center text-base shrink-0">
                                {typeEmoji[item.type] || "✦"}
                              </span>
                              <div className="truncate">
                                <div className="text-xs font-extrabold text-[#4A3531] truncate">
                                  {item.name}
                                </div>
                                <div className="text-xs font-bold text-[#4A3531]/70 truncate">
                                  {item.sub}
                                </div>
                              </div>
                            </div>

                            <span className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#D1FAE5] text-[#065F46] border border-[#4A3531] shrink-0">
                              {item.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Y2KWindow>
                </div>
              )}
            </div>

            {/* 04. UNLOCKED HOBBIES & JUDGE MODE */}
            {hasUnlockedResults && (
              <>
                <Y2KWindow
                  title="04. Unlocked Hobbies & Trinkets Powered by Qloo"
                  accent="lime"
                  badge={`${hobbies.length} HOBBIES FOR YOU`}
                  sticker="✨"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {hobbies.map((hobby, index) => {
                      const cardThemes = [
                        {
                          bg: "bg-[#FFFFFF]",
                          pill: "bg-[#D1FAE5] text-[#065F46]",
                        },
                        {
                          bg: "bg-[#FFFFFF]",
                          pill: "bg-[#BAE6FD] text-[#075985]",
                        },
                        {
                          bg: "bg-[#FFFFFF]",
                          pill: "bg-[#FEF3C7] text-[#92400E]",
                        },
                      ][index % 3];

                      return (
                        <article
                          key={hobby.id}
                          className={`${cardThemes.bg} border-[3px] border-[#4A3531] rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-[0_6px_0_rgba(74,53,49,0.16)] relative`}
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`text-xs font-extrabold px-3 py-0.5 rounded-full border-2 border-[#4A3531] uppercase ${cardThemes.pill}`}
                              >
                                🍀 {hobby.tag}
                              </span>
                              <span className="bg-[#FEF08A] text-[#4A3531] border-2 border-[#4A3531] rounded-full px-2.5 py-0.5 text-xs font-extrabold">
                                ✦ {hobby.match_score}% MATCH
                              </span>
                            </div>

                            <div>
                              <div className="handwritten-note text-base text-[#047857] uppercase">
                                {hobby.category} • {hobby.difficulty}
                              </div>
                              <h3 className="cozy-subtitle text-xl text-[#4A3531] leading-snug mt-0.5">
                                {hobby.title}
                              </h3>
                            </div>

                            <p className="text-xs font-bold text-[#4A3531]/85 leading-relaxed">
                              {hobby.description}
                            </p>

                            {/* Starter Kit */}
                            <div className="bg-[#FEFCE8] border-2 border-dashed border-[#4A3531] rounded-2xl p-3 space-y-1.5">
                              <div className="text-xs font-extrabold text-[#4A3531] uppercase">
                                🧺 Starter Kit to Begin:
                              </div>
                              <ul className="text-xs font-bold text-[#4A3531] space-y-1">
                                {hobby.starter_kit.map((item, i) => (
                                  <li
                                    key={i}
                                    className="flex items-start gap-1.5"
                                  >
                                    <span>🍀</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Single Paired Cultural Companion (full list lives in Section 03 Mixtape) */}
                            {hobby.cultural_matches?.[0] && (
                              <div className="bg-[#E0F2FE]/60 border-2 border-[#4A3531] rounded-2xl px-3 py-2 flex items-center justify-between gap-2 text-xs font-bold">
                                <div className="truncate">
                                  <span className="text-[#075985] font-extrabold uppercase block text-[10px]">
                                    🎵 Paired Qloo Companion:
                                  </span>
                                  <span className="text-[#4A3531] font-extrabold">
                                    {hobby.cultural_matches[0].name}
                                  </span>
                                </div>
                                <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#FEF08A] text-[#4A3531] border border-[#4A3531] shrink-0">
                                  {hobby.cultural_matches[0].type}
                                </span>
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSelectHobbyForCommunity(hobby)}
                            className="cozy-pill-btn w-full bg-[#BAE6FD] hover:bg-[#FEF08A] text-[#4A3531] font-extrabold text-xs sm:text-sm py-2.5"
                          >
                            🍀 Try This Hobby! → Pin to Guestbook
                          </button>
                        </article>
                      );
                    })}
                  </div>
                </Y2KWindow>

                {/* DISCREET JUDGE MODE BUTTON */}
                <div className="flex flex-col items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setShowJudgeLogs((prev) => !prev)}
                    className="cozy-pill-btn bg-white/90 hover:bg-white text-[#4A3531] px-4 py-1 text-xs font-extrabold"
                  >
                    {showJudgeLogs
                      ? "🔼 Hide Qloo API Technical Log (Judge Mode)"
                      : `🔍 Hackathon Judge Mode: Signals=[${signalSource}] • Qloo=[${qlooMode}]`}
                  </button>

                  {showJudgeLogs && (
                    <div className="mt-3 w-full max-w-3xl bg-white border-[2.5px] border-[#4A3531] rounded-2xl p-4 font-mono text-xs text-[#4A3531] shadow-sm space-y-1">
                      <div className="font-extrabold text-[#065F46] mb-1">
                        📡 LIVE REQUEST LOG TO https://hackathon.api.qloo.com:
                      </div>
                      {terminalLogs.map((line, i) => (
                        <div key={i}>🍀 {line}</div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: MARKET GUESTBOOK (COMMUNITY)                               */}
        {/* ================================================================= */}
        {activeTab === "community" && (
          <div className="space-y-6 pb-12">
            <Y2KWindow
              title="Market Guestbook // Community Notes"
              accent="pink"
              badge={`${feedPosts.length} NOTES`}
              sticker="💌"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Guestbook Form */}
                <form
                  onSubmit={handlePublishPost}
                  className="lg:col-span-5 bg-white/95 border-[3px] border-[#4A3531] rounded-3xl p-5 space-y-3.5 shadow-[0_5px_0_rgba(74,53,49,0.15)]"
                >
                  <div className="cozy-subtitle text-2xl text-[#4A3531]">
                    ✍️ Leave a note at the market!
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="col-span-2">
                      <label className="block text-xs font-extrabold text-[#4A3531] uppercase mb-1">
                        YOUR NICKNAME:
                      </label>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g. clover_mika"
                        className="w-full bg-[#FEFCE8] border-2 border-[#4A3531] rounded-full px-3.5 py-1.5 text-xs font-bold text-[#4A3531] focus:outline-none focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-[#4A3531] uppercase mb-1">
                        CHARM:
                      </label>
                      <select
                        value={selectedAvatar}
                        onChange={(e) => setSelectedAvatar(e.target.value)}
                        className="w-full bg-[#FEFCE8] border-2 border-[#4A3531] rounded-full px-2.5 py-1.5 text-xs font-bold text-[#4A3531]"
                      >
                        <option value="🍀">🍀 Clover</option>
                        <option value="☁️">☁️ Cloud</option>
                        <option value="🧸">🧸 Plushie</option>
                        <option value="📸">📸 Camera</option>
                        <option value="🎵">🎵 Vinyl</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-[#4A3531] uppercase mb-1">
                      HOBBY YOU ARE STARTING:
                    </label>
                    <input
                      type="text"
                      required
                      value={chosenHobby}
                      onChange={(e) => setChosenHobby(e.target.value)}
                      className="w-full bg-[#E0F2FE]/60 border-2 border-[#4A3531] rounded-full px-3.5 py-1.5 text-xs font-bold text-[#4A3531]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-[#4A3531] uppercase mb-1">
                      FAVORITE QLOO PICK:
                    </label>
                    <input
                      type="text"
                      value={chosenQlooMatch}
                      onChange={(e) => setChosenQlooMatch(e.target.value)}
                      className="w-full bg-[#D1FAE5]/70 border-2 border-[#4A3531] rounded-full px-3.5 py-1.5 text-xs font-bold text-[#4A3531]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-[#4A3531] uppercase mb-1">
                      YOUR NOTE:
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Tell us which photos you hung on the clothesline and how you're starting this hobby!"
                      className="w-full bg-[#FEFCE8] border-2 border-[#4A3531] rounded-2xl p-3 text-xs font-bold text-[#4A3531] focus:outline-none focus:bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="cozy-pill-btn w-full bg-[#FEF08A] hover:bg-[#FDE047] text-[#4A3531] font-extrabold text-sm py-2.5"
                  >
                    🍀 Pin My Note to the Market Board
                  </button>

                  {postSuccess && (
                    <div className="text-xs font-extrabold text-[#065F46] text-center">
                      ✨ Your note has been hung on the board! ✨
                    </div>
                  )}
                </form>

                {/* Community Notes */}
                <div className="lg:col-span-7 space-y-4 max-h-[520px] overflow-y-auto pr-1">
                  {feedPosts.map((post, idx) => {
                    const noteBg = [
                      "bg-[#FEFCE8]",
                      "bg-[#F0F9FF]",
                      "bg-[#ECFDF5]",
                    ][idx % 3];

                    return (
                      <div
                        key={post.id}
                        className={`${noteBg} border-[2.5px] border-[#4A3531] rounded-3xl p-4 shadow-[0_4px_0_rgba(74,53,49,0.14)] space-y-2`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl bg-white rounded-full border-2 border-[#4A3531] w-9 h-9 flex items-center justify-center">
                              {post.avatar}
                            </span>
                            <div>
                              <span className="text-xs font-extrabold text-[#4A3531]">
                                @{post.username}
                              </span>
                              <span className="text-xs font-bold text-[#4A3531]/60 block">
                                {post.timestamp}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleLikePost(post.id)}
                            className="cozy-pill-btn bg-white hover:bg-[#FEF08A] text-[#4A3531] px-3 py-0.5 text-xs font-extrabold"
                          >
                            ♥ {post.likes}
                          </button>
                        </div>

                        <div className="text-xs font-bold text-[#4A3531]">
                          <span>🍀 Trying hobby: </span>
                          <strong className="text-[#065F46]">
                            {post.hobby_title}
                          </strong>
                        </div>

                        <p className="handwritten-note text-lg text-[#4A3531] bg-white/90 p-3 rounded-2xl border-2 border-dashed border-[#4A3531]">
                          &ldquo;{post.comment}&rdquo;
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <div className="flex flex-wrap gap-1.5">
                            {post.aesthetic_tags.map((t, i) => (
                              <span
                                key={i}
                                className="text-xs font-extrabold bg-[#BAE6FD] text-[#4A3531] border border-[#4A3531] rounded-full px-2.5 py-0.5 uppercase"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                          <span className="text-xs font-extrabold text-[#075985]">
                            🎵 Qloo Pick: {post.qloo_match}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Y2KWindow>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("discover");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="cozy-pill-btn bg-white hover:bg-[#FEF08A] text-[#4A3531] px-6 py-2 text-xs sm:text-sm font-extrabold"
              >
                ← Back to 🧺 01. Your Clothesline Scrapbook
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
