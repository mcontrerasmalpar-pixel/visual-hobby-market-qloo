"use client";

import React, { useState, useRef } from "react";
import Y2KWindow from "../components/Y2KWindow";

function getApiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL || "";
}

interface UploadedImage {
  id: string;
  name: string;
  previewUrl: string;
  dataUrl?: string;
  visionCaption?: string;
  localPreviewLabel: string;
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
  // Starts empty so only the user's uploaded photos are displayed
  const [images, setImages] = useState<UploadedImage[]>([]);
  // View switch: false = Step 1 (Clothesline Scrapbook), true = Step 2 (Only 04 Hobbies on top + 02 & 03 below)
  const [hasUnlockedResults, setHasUnlockedResults] = useState(false);

  const [availableTags, setAvailableTags] =
    useState<string[]>(INITIAL_STICKERS);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Interactive states for filters, copy buttons, and Judge Mode
  const [mixtapeFilter, setMixtapeFilter] = useState<string>("all");
  const [copiedCard, setCopiedCard] = useState(false);
  const [copiedHobbyId, setCopiedHobbyId] = useState<string | null>(null);
  const [showJudgeLogs, setShowJudgeLogs] = useState(false);

  // Results from Claude Vision + Qloo
  const [archetype, setArchetype] = useState("COZY INDIE EXPLORER");
  const [vibeSummary, setVibeSummary] = useState(
    "Hang your favorite screenshots on the clothesline above or pick your aesthetic stickers to unlock cozy hobbies and cultural picks powered by Claude Vision & Qloo!"
  );
  const [signalSource, setSignalSource] = useState<
    "claude_vision" | "fallback_no_vision"
  >("fallback_no_vision");
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
    "🍀 QLOO HOBBY MARKET ENGINE v3.2 (CLAUDE VISION TOOL_USE + QLOO TASTE AI) READY...",
    "☁️ TARGET GATEWAY: https://hackathon.api.qloo.com/v2/insights",
  ]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function analyzeImageFile(file: File): Promise<UploadedImage> {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext("2d");
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
          dominantHex = hexAvg;
          paletteHexes = Array.from(new Set([hexAvg, hexTop, hexBot]));
        }

        // Create a compact JPEG dataUrl (max 384px) for fast Claude Vision API ingestion
        let dataUrl = "";
        try {
          const maxDim = 384;
          const scale = Math.min(
            1,
            maxDim / Math.max(img.width || 384, img.height || 384)
          );
          const vCanvas = document.createElement("canvas");
          vCanvas.width = Math.max(1, Math.round((img.width || 384) * scale));
          vCanvas.height = Math.max(1, Math.round((img.height || 384) * scale));
          const vCtx = vCanvas.getContext("2d");
          if (vCtx) {
            vCtx.drawImage(img, 0, 0, vCanvas.width, vCanvas.height);
            dataUrl = vCanvas.toDataURL("image/jpeg", 0.72);
          }
        } catch {
          // ignore if canvas tainted
        }

        resolve({
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          name: file.name,
          previewUrl: url,
          dataUrl,
          visionCaption: undefined,
          localPreviewLabel: "vista previa local",
          dominantHex,
          paletteHexes,
        });
      };
      img.onerror = () => {
        resolve({
          id: `${file.name}-${Date.now()}`,
          name: file.name,
          previewUrl: url,
          visionCaption: undefined,
          localPreviewLabel: "vista previa local",
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
    setIsLoading(true);
    setApiError(null);

    // If user typed a tag into the input box without clicking "+ TAG", include it automatically
    let finalManualTags = [...tagsToQuery];
    const pendingTag = customTagInput.trim().toLowerCase();
    if (pendingTag) {
      if (!availableTags.includes(pendingTag)) {
        setAvailableTags((prev) => [...prev, pendingTag]);
      }
      if (!finalManualTags.includes(pendingTag)) {
        finalManualTags = [...finalManualTags, pendingTag];
        setSelectedTags(finalManualTags);
      }
      setCustomTagInput("");
    }

    try {
      const res = await fetch(`${getApiBase()}/api/recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Only send the user's manually selected tags (never inject fixed visual tags from client)
          tags: finalManualTags,
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
        const errText = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${errText.slice(0, 120)}`);
      }

      const data = await res.json();
      setArchetype(data.aesthetic_dna?.archetype || "COZY INDIE EXPLORER");
      setVibeSummary(data.aesthetic_dna?.vibe_summary || "");
      setSignalSource(
        data.signal_source === "claude_vision"
          ? "claude_vision"
          : "fallback_no_vision"
      );
      setClaudeModelUsed(data.claude_model_used || "claude-haiku-5-5");
      setQlooMode(data.qloo_mode || "QLOO_LIVE");
      if (data.aesthetic_dna?.qloo_seeds) {
        setQlooSeeds(data.aesthetic_dna.qloo_seeds);
      }

      // Only add tags to the scrapbook if Claude Vision actually extracted them
      if (
        data.signal_source === "claude_vision" &&
        Array.isArray(data.aesthetic_dna?.tags) &&
        data.aesthetic_dna.tags.length > 0
      ) {
        const returnedTags: string[] = data.aesthetic_dna.tags;
        setAvailableTags((prev) =>
          Array.from(new Set([...prev, ...returnedTags]))
        );
        setSelectedTags(returnedTags.slice(0, 6));
      }

      // Update polaroid captions ONLY if Claude Vision returned per_image_captions
      if (
        data.signal_source === "claude_vision" &&
        Array.isArray(data.aesthetic_dna?.per_image_captions) &&
        data.aesthetic_dna.per_image_captions.length > 0
      ) {
        const captions: string[] = data.aesthetic_dna.per_image_captions;
        setImages((prev) =>
          prev.map((item, idx) =>
            captions[idx] ? { ...item, visionCaption: captions[idx] } : item
          )
        );
      }

      setHobbies(data.hobbies || []);
      setQlooInsights(data.qloo_insights || []);
      if (Array.isArray(data.terminal_logs)) {
        setTerminalLogs(data.terminal_logs);
      }
      setHasUnlockedResults(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const msg = String(err);
      setApiError(`Could not complete recommendation request: ${msg}`);
      setTerminalLogs((prev) => [
        ...prev,
        `[!] Connect API at ${getApiBase() || "/api"}: ${msg}`,
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

  function handleCopySingleHobby(hobby: HobbyCard) {
    const starterList = hobby.starter_kit.join(", ");
    const companion = hobby.cultural_matches?.[0]?.name || "Qloo Taste Match";
    const text = `🍀 Hobby: ${hobby.title} (${hobby.match_score}% Match)\n🧺 Starter Kit: ${starterList}\n🎵 Paired Qloo Companion: ${companion}`;
    navigator.clipboard?.writeText(text);
    setCopiedHobbyId(hobby.id);
    setTimeout(() => setCopiedHobbyId(null), 2500);
  }

  const allVisibleStickers = Array.from(
    new Set([...availableTags, ...selectedTags])
  );

  const extractedSwatches = Array.from(
    new Set(images.flatMap((img) => img.paletteHexes))
  ).slice(0, 8);

  const filteredQlooInsights =
    mixtapeFilter === "all"
      ? qlooInsights.slice(0, 6)
      : qlooInsights.filter((item) => item.type === mixtapeFilter).slice(0, 6);

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

      {/* Circular Vintage Market Stamp (Bottom-Right Corner) */}
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
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 relative z-10">
        {/* COZY STORYBOOK HEADER */}
        <header className="flex flex-col items-center text-center space-y-2.5">
          <div className="handwritten-note text-xl sm:text-2xl text-[#047857] tracking-wide">
            new hobby unlocked! 🍀
          </div>

          <h1 className="cozy-cloud-title text-4xl sm:text-6xl tracking-tight leading-none py-1">
            Visual 🍀 Hobby Market
          </h1>

          <p className="handwritten-note text-xl sm:text-2xl text-[#4A3531] max-w-xl">
            vintage aesthetics, music, trinkets &amp; cozy hobbies powered by Claude Vision &amp; Qloo AI
          </p>
        </header>

        {/* ================================================================= */}
        {/* STEP 1: CLOTHESLINE SCRAPBOOK (BEFORE RESULTS ARE UNLOCKED)       */}
        {/* ================================================================= */}
        {!hasUnlockedResults && (
          <div className="max-w-3xl mx-auto pb-10">
            <Y2KWindow
              title="01. Your Clothesline Scrapbook (Hang Photos & Tags)"
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
                                  {img.visionCaption ? (
                                    <span className="inline-block handwritten-note text-base text-[#065F46] bg-[#D1FAE5] border border-[#4A3531] px-2.5 py-0.2 rounded-full">
                                      ✦ {img.visionCaption}
                                    </span>
                                  ) : (
                                    <span className="inline-block text-[11px] font-bold text-[#4A3531]/80 bg-[#FEFCE8] border border-[#4A3531]/50 px-2.5 py-0.5 rounded-full">
                                      🖼️ {img.localPreviewLabel}
                                    </span>
                                  )}
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

                  {isLoading && (
                    <div className="bg-[#FEFCE8] border-2 border-dashed border-[#4A3531] rounded-2xl px-4 py-2.5 text-xs font-extrabold text-[#065F46] flex items-center justify-center gap-2 animate-pulse">
                      <span>🔭</span>
                      <span>
                        Analyzing your photos with Claude Vision (claude-haiku-5-5) &amp; querying Qloo Taste AI (~8–12s)...
                      </span>
                    </div>
                  )}

                  {apiError && (
                    <div className="bg-[#FEF3C7] border-2 border-[#4A3531] rounded-2xl px-4 py-2.5 text-xs font-extrabold text-[#92400E]">
                      ⚠️ {apiError}
                    </div>
                  )}
                </div>
              </div>
            </Y2KWindow>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 2: RESULTS VIEW — ONLY 04 (TOP HORIZONTAL) + 02 & 03 (BELOW) */}
        {/* ================================================================= */}
        {hasUnlockedResults && (
          <div className="space-y-8 pb-12">
            {/* Compact Bar: Mini Preview of Hung Photos/Tags + Back to Edit Button */}
            <div className="bg-white/95 border-[2.5px] border-[#4A3531] rounded-3xl px-4 py-3 shadow-[0_5px_0_rgba(74,53,49,0.14)] flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                {images.length > 0 && (
                  <div className="flex items-center gap-2">
                    {images.map((img) => (
                      <div
                        key={img.id}
                        className="flex items-center gap-1.5 bg-[#FEFCE8] border-2 border-[#4A3531] rounded-2xl p-1 pr-2.5"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.previewUrl}
                          alt={img.name}
                          className="w-9 h-9 rounded-xl object-cover border border-[#4A3531]"
                        />
                        <span className="text-xs font-extrabold text-[#065F46] max-w-[120px] truncate">
                          {img.visionCaption
                            ? `✦ ${img.visionCaption}`
                            : img.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-1.5">
                  {selectedTags.slice(0, 5).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs font-extrabold bg-[#D1FAE5] text-[#065F46] border-2 border-[#4A3531] rounded-full px-3 py-0.5 uppercase"
                    >
                      🍀 {tag}
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setHasUnlockedResults(false)}
                className="cozy-pill-btn bg-[#FEF08A] hover:bg-[#FDE047] text-[#4A3531] px-4 py-1.5 text-xs sm:text-sm font-extrabold"
              >
                🧺 ← Edit Photos &amp; Tags
              </button>
            </div>

            {/* TOP ROW (HORIZONTAL FULL-WIDTH): 04. UNLOCKED HOBBIES & TRINKETS */}
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

                        {/* Single Paired Cultural Companion */}
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
                        onClick={() => handleCopySingleHobby(hobby)}
                        className="cozy-pill-btn w-full bg-[#BAE6FD] hover:bg-[#FEF08A] text-[#4A3531] font-extrabold text-xs sm:text-sm py-2"
                      >
                        {copiedHobbyId === hobby.id
                          ? "🍀 Starter Kit Copied!"
                          : "📋 Save Hobby & Starter Kit"}
                      </button>
                    </article>
                  );
                })}
              </div>
            </Y2KWindow>

            {/* BOTTOM ROW (2 HARMONIOUS COLUMNS): 02. VIBE CHECK + 03. QLOO MIXTAPE */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LEFT COLUMN (6 cols): 02. YOUR COZY VIBE CHECK */}
              <div className="lg:col-span-6">
                <Y2KWindow
                  title="02. Your Cozy Vibe Check"
                  accent="lime"
                  badge={
                    signalSource === "claude_vision"
                      ? `CLAUDE (${claudeModelUsed})`
                      : "FALLBACK SIN VISIÓN"
                  }
                  sticker="🍀"
                >
                  <div className="space-y-3.5 text-center">
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
                            signalSource === "claude_vision"
                              ? "bg-[#D1FAE5] text-[#065F46]"
                              : "bg-[#FEF3C7] text-[#92400E]"
                          }`}
                        >
                          {signalSource === "claude_vision"
                            ? `🟢 Source: claude_vision (${claudeModelUsed})`
                            : "🟠 Source: fallback_no_vision (Fallback sin visión)"}
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
                            {signalSource === "claude_vision"
                              ? "Translated by Claude Vision (tool_use)"
                              : "Fallback sin visión (Neutral/Manual Tags)"}
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
              </div>

              {/* RIGHT COLUMN (6 cols): 03. YOUR QLOO MIXTAPE & TOP PICKS */}
              <div className="lg:col-span-6">
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
            </div>

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
          </div>
        )}
      </main>
    </div>
  );
}
