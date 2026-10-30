import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const ts = require(path.join(__dirname, "../node_modules/typescript"));

// Compile route.ts on the fly in memory so we can test the exact Next.js POST handler in Node
function loadRouteModule() {
  const routePath = path.join(__dirname, "../app/api/recommendations/route.ts");
  const source = fs.readFileSync(routePath, "utf-8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;

  const tempFile = path.join(__dirname, "../.next-test-route.cjs");
  fs.writeFileSync(tempFile, transpiled, "utf-8");
  try {
    delete require.cache[require.resolve(tempFile)];
    return require(tempFile);
  } finally {
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
}

const TINY_JPEG_DATA_URL =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";

test("Case 1: When Claude Vision returns tool_use 'visual_signals', signal_source = 'claude_vision' and tags match tool_use.input", async () => {
  process.env.ANTHROPIC_API_KEY = "sk-ant-test-key";
  process.env.QLOO_API_KEY = "";
  process.env.CLAUDE_MODEL = "claude-haiku-5-5";

  const expectedTags = [
    "yellow locker organizer",
    "heart-framed pet photos",
    "pastel sticky notes",
    "retro board game design",
  ];
  const expectedVibe =
    "Bright yellow locker wall with heart-framed pet photos, pastel sticky notes, and playful retro tabletop illustrations.";

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    if (String(url).includes("api.anthropic.com/v1/messages")) {
      const reqBody = JSON.parse(init.body);
      // Verify request uses thinking: { type: "disabled" } and forced tool_choice
      assert.deepEqual(reqBody.thinking, { type: "disabled" });
      assert.deepEqual(reqBody.tool_choice, {
        type: "tool",
        name: "visual_signals",
      });
      assert.equal(reqBody.temperature, undefined);

      return new Response(
        JSON.stringify({
          id: "msg_test_01",
          type: "message",
          role: "assistant",
          model: "claude-haiku-5-5",
          stop_reason: "tool_use",
          usage: {
            input_tokens: 500,
            output_tokens: 420,
            output_tokens_details: { thinking_tokens: 0 },
          },
          content: [
            {
              type: "tool_use",
              id: "toolu_01",
              name: "visual_signals",
              input: {
                tags: expectedTags,
                vibe_summary: expectedVibe,
                archetype: "NOSTALGIC STICKER COLLAGE CURATOR",
                per_image_captions: ["Sunny locker", "Teal stickers"],
                qloo_seeds: {
                  tag_queries: ["kawaii", "collage art"],
                  entity_queries: ["Sanrio", "Tamagotchi"],
                },
                custom_hobbies: [
                  {
                    tag: "scrapbook-collage",
                    title: "Locker Sticker Collage Making",
                    category: "Arts & Crafts",
                    difficulty: "Beginner",
                    match_score: 0.94,
                    description: "Decorate a locker or notebook with stickers.",
                    starter_kit: ["Assorted stickers", "Washi tape", "Polaroids"],
                  },
                ],
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    throw new Error(`Unexpected fetch URL: ${url}`);
  };

  try {
    const { POST } = loadRouteModule();
    const fakeReq = {
      json: async () => ({
        tags: [],
        images: [{ name: "test.jpg", dataUrl: TINY_JPEG_DATA_URL }],
      }),
    };

    const res = await POST(fakeReq);
    const data = await res.json();

    assert.equal(data.signal_source, "claude_vision");
    assert.equal(data.aesthetic_dna.signal_source, "claude_vision");
    assert.deepEqual(data.aesthetic_dna.tags, expectedTags);
    assert.equal(data.aesthetic_dna.vibe_summary, expectedVibe);
    assert.equal(data.hobbies[0].match_score, 94);
    assert.ok(
      data.terminal_logs.some(
        (l) =>
          l.includes('stop_reason="tool_use"') &&
          l.includes('block_types=["tool_use"]')
      ),
      "Log must include stop_reason and block_types"
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Case 2: When Claude Vision fails, signal_source = 'fallback_no_vision', no fixed visual tags are used, and vibe_summary does not simulate vision", async () => {
  process.env.ANTHROPIC_API_KEY = "sk-ant-test-key";
  process.env.QLOO_API_KEY = "";
  process.env.CLAUDE_MODEL = "claude-haiku-5-5";

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url).includes("api.anthropic.com/v1/messages")) {
      return new Response(
        JSON.stringify({
          type: "error",
          error: { type: "overloaded_error", message: "Overloaded" },
        }),
        { status: 529, headers: { "Content-Type": "application/json" } }
      );
    }
    throw new Error(`Unexpected fetch URL: ${url}`);
  };

  try {
    const { POST } = loadRouteModule();
    const fakeReq = {
      json: async () => ({
        tags: [],
        images: [{ name: "test.jpg", dataUrl: TINY_JPEG_DATA_URL }],
      }),
    };

    const res = await POST(fakeReq);
    const data = await res.json();

    assert.equal(data.signal_source, "fallback_no_vision");
    assert.equal(data.aesthetic_dna.signal_source, "fallback_no_vision");

    // Verify it does NOT inject fixed visual aesthetic tags ("botanical", "ceramics & clay", "analog photography")
    const forbiddenVisualTags = [
      "botanical",
      "ceramics & clay",
      "analog photography",
    ];
    for (const badTag of forbiddenVisualTags) {
      assert.ok(
        !data.aesthetic_dna.tags.includes(badTag),
        `Fallback must not inject fixed visual tag: ${badTag}`
      );
    }
    assert.deepEqual(data.aesthetic_dna.tags, ["music", "film", "books"]);

    // Verify vibe_summary explicitly marks fallback_no_vision and does NOT simulate having seen the images
    assert.ok(
      data.aesthetic_dna.vibe_summary.includes("fallback_no_vision") &&
        data.aesthetic_dna.vibe_summary.includes("Fallback sin visión"),
      "vibe_summary must explicitly mention fallback_no_vision / Fallback sin visión"
    );
    assert.ok(
      !data.aesthetic_dna.vibe_summary.includes("Your visual scrapbook blends"),
      "vibe_summary must not pretend to have read the visual scrapbook"
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
