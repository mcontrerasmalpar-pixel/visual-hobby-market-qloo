import base64
import io
import json
import os
import re
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
import httpx
from dotenv import load_dotenv
from PIL import Image

# Load environment variables from project root (qloo-y2k-app/.env) or backend/.env
ROOT_ENV = Path(__file__).resolve().parent.parent.parent / ".env"
LOCAL_ENV = Path(__file__).resolve().parent.parent / ".env"
if ROOT_ENV.exists():
    load_dotenv(dotenv_path=ROOT_ENV)
elif LOCAL_ENV.exists():
    load_dotenv(dotenv_path=LOCAL_ENV)
else:
    load_dotenv()

QLOO_BASE_URL = os.getenv("QLOO_BASE_URL", "https://hackathon.api.qloo.com").rstrip("/")

# Curated Matrix: Visual Aesthetic DNA -> Actionable Hobbies + Qloo Bridge Queries
AESTHETIC_HOBBY_MATRIX: Dict[str, Dict[str, Any]] = {
    "botanical": {
        "hobby_title": "Closed Glass Terrariums, Flower Pressing & Botanical Journals",
        "category": "NATURE / DESIGN",
        "difficulty": "BEGINNER",
        "match_score": 99,
        "description": "Create self-sustaining miniature ecosystems inside glass jars with live moss, volcanic stones, and pressed flowers while listening to warm ambient music.",
        "starter_kit": ["Airtight glass jar", "Live moss + activated charcoal", "Long aquascaping tweezers & flower press"],
        "qloo_queries": ["botanical garden", "nature", "ambient", "plant"],
        "fallback_entities": [
            {"name": "Plantasia (Mort Garson)", "type": "artist", "sub": "Warm Earth Music for Plants"},
            {"name": "Kew Royal Botanic Gardens", "type": "place", "sub": "Botanical Conservatory"},
            {"name": "Braiding Sweetgrass", "type": "book", "sub": "Botany & Ecology"},
            {"name": "My Neighbor Totoro", "type": "movie", "sub": "Lush Nature & Forest Spirits"},
        ]
    },
    "ceramics & clay": {
        "hobby_title": "Hand-Built Pinch Pots, Botanical Reliefs & Air-Dry Ceramics",
        "category": "CRAFTS / CERAMICS",
        "difficulty": "BEGINNER",
        "match_score": 98,
        "description": "Sculpt speckled stoneware-style coasters, incense holders, and pinch-pot mugs at your table using air-dry or polymer clay and matte mineral glazes.",
        "starter_kit": ["Speckled air-dry or stoneware clay", "Wooden rib tools & sponge", "Matte acrylic sealers & earth pigments"],
        "qloo_queries": ["ceramics", "pottery", "indie folk", "craft"],
        "fallback_entities": [
            {"name": "Ichiko Aoba", "type": "artist", "sub": "Gentle Acoustic & Studio Folk"},
            {"name": "The Unknown Craftsman (Soetsu Yanagi)", "type": "book", "sub": "Japanese Folk Craft & Mingei"},
            {"name": "Mashiko Pottery Village", "type": "place", "sub": "Historic Ceramic Craft Town"},
            {"name": "Little Forest", "type": "movie", "sub": "Slow Living & Handmade Craft"},
        ]
    },
    "analog photography": {
        "hobby_title": "Solar Cyanotype Printing & 35mm Film Walks",
        "category": "ART / DARKROOM LAB",
        "difficulty": "INTERMEDIATE",
        "match_score": 96,
        "description": "Bring your digital photos into the physical world by printing negatives onto cotton paper using sunlight and Prussian-blue cyanotype chemistry.",
        "starter_kit": ["Cyanotype sensitizer kit (Part A+B)", "300g watercolor cotton paper", "Compact 35mm film camera"],
        "qloo_queries": ["indie film", "photography", "art house", "indie rock"],
        "fallback_entities": [
            {"name": "Wong Kar-wai", "type": "movie", "sub": "Cinematic Color & Mood"},
            {"name": "Vivian Maier", "type": "book", "sub": "Street Photography Archive"},
            {"name": "Fotografiska Museum", "type": "place", "sub": "Contemporary Photography Space"},
            {"name": "Khruangbin", "type": "artist", "sub": "Warm Analog Instrumental Grooves"},
        ]
    },
    "lo-fi jazz": {
        "hobby_title": "Sampler Beatmaking & Vinyl Crate Digging",
        "category": "MUSIC / CULTURE",
        "difficulty": "BEGINNER",
        "match_score": 97,
        "description": "Browse local record shops for 70s jazz samples, chop warm tape loops on a pocket sampler, and host cozy late-night listening sessions.",
        "starter_kit": ["Pad controller or Koala Sampler app", "Entry-level turntable", "Open-back studio headphones"],
        "qloo_queries": ["nujabes", "lo-fi", "jazz hop", "vinyl"],
        "fallback_entities": [
            {"name": "Nujabes", "type": "artist", "sub": "Lo-Fi Jazz Hop Pioneer"},
            {"name": "J Dilla - Donuts", "type": "artist", "sub": "Instrumental Hip-Hop"},
            {"name": "Blue Note Jazz Club", "type": "place", "sub": "Historic Jazz Venue"},
            {"name": "Whisper of the Heart", "type": "movie", "sub": "Cozy Creative Storytelling"},
        ]
    },
    "anime & illustration": {
        "hobby_title": "Gouache Background Painting, Sketchbook Journaling & Artbook Collecting",
        "category": "ILLUSTRATION / ANIMATION",
        "difficulty": "BEGINNER",
        "match_score": 99,
        "description": "Paint luminous sky and meadow scenes inspired by animation background art using matte gouache paints, and keep an illustrated daily sketchbook.",
        "starter_kit": ["Himi or Holbein Gouache Set", "Cold-press watercolor sketchbook", "Studio Ghibli Layout & Background Artbook"],
        "qloo_queries": ["anime", "studio ghibli", "manga", "j-pop"],
        "fallback_entities": [
            {"name": "Studio Ghibli / Hayao Miyazaki", "type": "movie", "sub": "Iconic Hand-Drawn Animation"},
            {"name": "Joe Hisaishi", "type": "artist", "sub": "Orchestral & Piano Soundtracks"},
            {"name": "Ghibli Museum Mitaka", "type": "place", "sub": "Animation Craft & Sketch Archives"},
            {"name": "Starting Point (Hayao Miyazaki)", "type": "book", "sub": "Essays & Sketches on Animation"},
        ]
    },
    "cozy reading": {
        "hobby_title": "Handcrafted Bookbinding, Fountain Pen Journaling & Indie Book Club",
        "category": "LITERATURE / PAPER CRAFT",
        "difficulty": "BEGINNER",
        "match_score": 95,
        "description": "Sew your own exposed-spine journals with waxed linen thread, annotate favorite essays with fountain pen ink, and visit independent bookshops.",
        "starter_kit": ["Fountain pen + warm sepia ink", "Waxed linen thread & bookbinding awl", "120g ivory dot-grid paper"],
        "qloo_queries": ["classical music", "literature", "philosophy", "bookstore"],
        "fallback_entities": [
            {"name": "Shakespeare and Company", "type": "place", "sub": "Historic Independent Bookstore"},
            {"name": "Max Richter", "type": "artist", "sub": "Neo-Classical / Post-Minimalism"},
            {"name": "84, Charing Cross Road", "type": "book", "sub": "Letters Between Book Lovers"},
            {"name": "Paterson (Jim Jarmusch)", "type": "movie", "sub": "Poetic Everyday Observation"},
        ]
    },
}


def get_api_key() -> str:
    """Fetches the latest QLOO_API_KEY from the environment or .env file."""
    if ROOT_ENV.exists():
        load_dotenv(dotenv_path=ROOT_ENV, override=True)
    elif LOCAL_ENV.exists():
        load_dotenv(dotenv_path=LOCAL_ENV, override=True)
    key = os.getenv("QLOO_API_KEY", "").strip()
    if key in ("", "your_qloo_hackathon_api_key_here"):
        return ""
    return key


def resize_image_backend(data_url: str, index: int, logs: List[str]) -> Optional[Tuple[str, str]]:
    """Resizes base64 image on the backend to <=512x512 JPEG quality 75 before sending to Claude Vision."""
    m = re.match(r"^data:(image/[a-zA-Z0-9.+-]+);base64,(.+)$", data_url or "")
    if not m:
        return None
    media_type, b64_data = m.group(1), m.group(2)
    raw = base64.b64decode(b64_data)
    orig_kb = len(raw) / 1024.0
    try:
        img = Image.open(io.BytesIO(raw)).convert("RGB")
        img.thumbnail((512, 512))
        out = io.BytesIO()
        img.save(out, format="JPEG", quality=75, optimize=True)
        resized_bytes = out.getvalue()
        resized_kb = len(resized_bytes) / 1024.0
        logs.append(f"  [BACKEND RESIZE] Image #{index + 1}: {orig_kb:.1f} KB -> {resized_kb:.1f} KB (<=512px JPEG)")
        return "image/jpeg", base64.b64encode(resized_bytes).decode("ascii")
    except Exception:
        logs.append(f"  [BACKEND IMAGE CHECK] Image #{index + 1}: {orig_kb:.1f} KB ({media_type})")
        return media_type, b64_data


async def analyze_with_claude_vision(
    images: List[Dict[str, Any]],
    user_tags: List[str],
    logs: List[str]
) -> Tuple[Optional[Dict[str, Any]], str]:
    """
    Calls Anthropic Claude Vision with:
    - Single default model: claude-haiku-5-5 (sonnet only if explicitly configured via CLAUDE_MODEL)
    - No temperature parameter
    - Backend-resized images (<=512px JPEG)
    - 25s timeout and 1 single retry (max_attempts = 2)
    """
    selected_model = os.getenv("CLAUDE_MODEL", "claude-haiku-5-5").strip() or "claude-haiku-5-5"
    anthropic_key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    if not anthropic_key or anthropic_key == "your_anthropic_claude_api_key_here":
        return None, selected_model

    content_blocks: List[Dict[str, Any]] = []
    valid_images = [img for img in (images or []) if str(img.get("dataUrl", "")).startswith("data:image/")][:4]

    for idx, img in enumerate(valid_images):
        resized = resize_image_backend(str(img.get("dataUrl", "")), idx, logs)
        if resized:
            mtype, b64 = resized
            content_blocks.append({
                "type": "image",
                "source": {"type": "base64", "media_type": mtype, "data": b64},
            })

    prompt_text = (
        f"You are the Multimodal Visual-to-Semantic Bridge for 'Visual Hobby Market', a Qloo Hackathon application.\n"
        f"Inspect the user's {len(valid_images)} uploaded image(s) (and optional tags: {', '.join(user_tags) or 'none'}) "
        f"and return ONLY valid JSON with keys: archetype, visual_narrative, per_image_captions, dynamic_tags, "
        f"qloo_seeds ({{tag_queries, entity_queries}}), and custom_hobbies (3 items with tag, title, category, difficulty, match_score, description, starter_kit)."
    )
    content_blocks.append({"type": "text", "text": prompt_text})

    max_attempts = 2
    async with httpx.AsyncClient() as client:
        for attempt in range(1, max_attempts + 1):
            try:
                logs.append(
                    f"> [CLAUDE VISION] Attempt {attempt}/{max_attempts}: Sending {len(valid_images)} image(s) to Anthropic ({selected_model}, timeout=25s)..."
                )
                resp = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": anthropic_key,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json",
                    },
                    json={
                        "model": selected_model,
                        "max_tokens": 900,
                        "messages": [{"role": "user", "content": content_blocks}],
                    },
                    timeout=25.0,
                )
                if resp.status_code != 200:
                    logs.append(f"  [!] Claude API ({selected_model}) returned HTTP {resp.status_code}: {resp.text[:110]}")
                    if 400 <= resp.status_code < 500 and resp.status_code != 429:
                        break
                    continue

                data = resp.json()
                raw_text = next((c.get("text", "") for c in data.get("content", []) if c.get("type") == "text"), "")
                m = re.search(r"\{[\s\S]*\}", raw_text)
                if not m:
                    continue
                parsed = json.loads(m.group(0))
                logs.append(f"  [OK] [SIGNAL SOURCE: CLAUDE_VISION ({selected_model})] Decoded archetype: \"{parsed.get('archetype', '')}\"")
                return parsed, selected_model
            except Exception as exc:
                logs.append(f"  [!] Claude Vision attempt {attempt}/{max_attempts} failed ({selected_model}): {str(exc)[:80]}")

    return None, selected_model



async def resolve_qloo_signals(
    client: httpx.AsyncClient,
    tags: List[str],
    api_key: str,
    logs: List[str]
) -> Tuple[List[str], List[str]]:
    """
    Step 1: Resolves visual semantic tags into valid Qloo Entity IDs and Tag URNs
    via GET /search and GET /v2/tags on https://hackathon.api.qloo.com
    """
    headers = {
        "X-Api-Key": api_key,
        "Accept": "application/json",
    }
    entity_ids: List[str] = []
    tag_urns: List[str] = []

    search_terms: List[str] = []
    for t in tags[:4]:
        norm = t.lower().strip()
        search_terms.append(norm)
        if norm in AESTHETIC_HOBBY_MATRIX:
            search_terms.extend(AESTHETIC_HOBBY_MATRIX[norm]["qloo_queries"][:1])

    unique_terms = list(dict.fromkeys(search_terms))[:5]

    for term in unique_terms:
        # 1A. Search /v2/tags
        try:
            logs.append(f"> GET {QLOO_BASE_URL}/v2/tags?filter.query={term}")
            tag_resp = await client.get(
                f"{QLOO_BASE_URL}/v2/tags",
                params={"filter.query": term, "take": 3},
                headers=headers,
                timeout=8.0
            )
            if tag_resp.status_code == 200:
                data = tag_resp.json()
                results = data.get("results", {}).get("tags", []) or data.get("results", [])
                if isinstance(results, list):
                    for item in results[:2]:
                        tag_id = item.get("id") or item.get("tag_id")
                        if tag_id and tag_id not in tag_urns:
                            tag_urns.append(tag_id)
                            logs.append(f"  [+] Resolved Tag URN: {tag_id}")
            else:
                logs.append(f"  [!] /v2/tags status {tag_resp.status_code} for '{term}'")
        except Exception as exc:
            logs.append(f"  [!] Warning in /v2/tags ({term}): {str(exc)[:60]}")

        # 1B. Search /search for Entity IDs
        try:
            logs.append(f"> GET {QLOO_BASE_URL}/search?query={term}")
            search_resp = await client.get(
                f"{QLOO_BASE_URL}/search",
                params={"query": term, "take": 2},
                headers=headers,
                timeout=8.0
            )
            if search_resp.status_code == 200:
                sdata = search_resp.json()
                sresults = sdata.get("results", [])
                if isinstance(sresults, list):
                    for ent in sresults[:2]:
                        ent_id = ent.get("entity_id") or ent.get("id")
                        ent_name = ent.get("name", term)
                        if ent_id and ent_id not in entity_ids:
                            entity_ids.append(str(ent_id))
                            logs.append(f"  [+] Resolved Entity ID: {ent_name} ({str(ent_id)[:12]}...)")
            else:
                logs.append(f"  [!] /search status {search_resp.status_code} for '{term}'")
        except Exception as exc:
            logs.append(f"  [!] Warning in /search ({term}): {str(exc)[:60]}")

    return entity_ids, tag_urns


async def fetch_qloo_insights(
    client: httpx.AsyncClient,
    entity_ids: List[str],
    tag_urns: List[str],
    entity_types: List[str],
    api_key: str,
    logs: List[str]
) -> List[Dict[str, Any]]:
    """
    Step 2: Queries GET /v2/insights on https://hackathon.api.qloo.com using filter.type
    and resolved taste signals (signal.interests.entities / signal.interests.tags).
    """
    headers = {
        "X-Api-Key": api_key,
        "Accept": "application/json",
    }
    discovered_entities: List[Dict[str, Any]] = []

    if not entity_ids and not tag_urns:
        logs.append("> [WARN] No signals resolved in Step 1; querying base /v2/insights.")

    for etype in entity_types:
        params: Dict[str, Any] = {
            "filter.type": etype,
            "take": 4,
        }
        if entity_ids:
            params["signal.interests.entities"] = ",".join(entity_ids[:3])
        if tag_urns:
            params["signal.interests.tags"] = ",".join(tag_urns[:3])

        try:
            logs.append(f"> GET {QLOO_BASE_URL}/v2/insights?filter.type={etype}")
            resp = await client.get(
                f"{QLOO_BASE_URL}/v2/insights",
                params=params,
                headers=headers,
                timeout=10.0
            )
            if resp.status_code == 200:
                payload = resp.json()
                entities = (
                    payload.get("results", {}).get("entities", [])
                    or payload.get("results", [])
                )
                if isinstance(entities, list) and entities:
                    logs.append(f"  [OK] Qloo /v2/insights returned {len(entities)} matches for {etype}")
                    for item in entities[:4]:
                        props = item.get("properties", {}) if isinstance(item.get("properties"), dict) else {}
                        short_type = etype.split(":")[-1]
                        discovered_entities.append({
                            "id": item.get("entity_id") or item.get("id") or "",
                            "name": item.get("name", "Cultural Match"),
                            "type": short_type,
                            "sub": (
                                props.get("short_description")
                                or props.get("address")
                                or item.get("disambiguation")
                                or f"Qloo Taste Match ({short_type.upper()})"
                            ),
                            "affinity": round(float(item.get("query", {}).get("affinity", 0.94)) * 100)
                            if isinstance(item.get("query"), dict)
                            else 94,
                            "image_url": (
                                props.get("image", {}).get("url")
                                if isinstance(props.get("image"), dict)
                                else None
                            ),
                            "source": "qloo_live"
                        })
                else:
                    logs.append(f"  [i] /v2/insights returned 200 with 0 entities for {etype}")
            else:
                logs.append(f"  [!] /v2/insights returned HTTP {resp.status_code} for {etype}")
        except Exception as exc:
            logs.append(f"  [!] Network error in /v2/insights ({etype}): {str(exc)[:60]}")

    return discovered_entities


async def get_hobby_recommendations(
    tags: List[str],
    entity_types: Optional[List[str]] = None,
    images: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Orchestrates the full Visual-to-Hobby pipeline:
    1. Analyzes uploaded images + tags via Claude Vision (claude-haiku-5-5 default, no temperature, 25s timeout, 1 retry).
    2. Queries https://hackathon.api.qloo.com (/v2/tags, /search, and /v2/insights).
    3. Synthesizes actionable Hobby cards paired with Qloo cultural matches.
    """
    logs: List[str] = [
        "> INITIALIZING VISUAL_HOBBY_MARKET ENGINE v3.1 (CLAUDE VISION + QLOO TASTE AI)...",
        f"> TARGET QLOO GATEWAY: {QLOO_BASE_URL}",
    ]

    clean_tags = [t.strip().lower() for t in tags if t.strip()]
    claude_analysis, claude_model_used = await analyze_with_claude_vision(images or [], clean_tags, logs)
    if claude_analysis:
        vision_mode = "CLAUDE_VISION_LIVE"
        signal_source = "CLAUDE_VISION"
        dyn_tags = [str(t).strip().lower() for t in claude_analysis.get("dynamic_tags", []) if str(t).strip()]
        clean_tags = list(dict.fromkeys(dyn_tags + clean_tags))
    else:
        vision_mode = "FALLBACK_HEURISTIC"
        signal_source = "FALLBACK"
        logs.append(
            f"> [SIGNAL SOURCE: FALLBACK_HEURISTIC] Claude Vision ({claude_model_used}) did not return analysis -> Using fallback aesthetic signals."
        )

    if not clean_tags:
        clean_tags = ["botanical", "ceramics & clay", "analog photography"]

    logs.append(f"> ACTIVE AESTHETIC SIGNALS: {', '.join(clean_tags).upper()}")

    if not entity_types:
        entity_types = ["urn:entity:artist", "urn:entity:place", "urn:entity:book", "urn:entity:movie"]

    api_key = get_api_key()
    qloo_live_entities: List[Dict[str, Any]] = []
    qloo_mode = "SIMULATION_FALLBACK"

    if api_key:
        logs.append("> X-API-KEY DETECTED [REDACTED]. CONNECTING TO QLOO HACKATHON API...")
        async with httpx.AsyncClient() as client:
            entity_ids, tag_urns = await resolve_qloo_signals(client, clean_tags, api_key, logs)
            if entity_ids or tag_urns:
                qloo_live_entities = await fetch_qloo_insights(
                    client, entity_ids, tag_urns, entity_types, api_key, logs
                )
                if qloo_live_entities:
                    qloo_mode = "QLOO_LIVE_API"
    else:
        logs.append("> [NOTICE] QLOO_API_KEY not set in .env -> Using Curated Cultural Graph.")

    hobby_cards: List[Dict[str, Any]] = []
    used_keys = set()

    for tag in clean_tags:
        matched_key = None
        if tag in AESTHETIC_HOBBY_MATRIX:
            matched_key = tag
        else:
            for k in AESTHETIC_HOBBY_MATRIX:
                if tag in k or k in tag:
                    matched_key = k
                    break

        if matched_key and matched_key not in used_keys:
            used_keys.add(matched_key)
            template = AESTHETIC_HOBBY_MATRIX[matched_key]

            if qloo_live_entities:
                idx = len(hobby_cards) * 2
                slice_entities = qloo_live_entities[idx:idx + 3] or qloo_live_entities[:3]
            else:
                slice_entities = [
                    {**item, "source": "curated_qloo_graph"} for item in template["fallback_entities"]
                ]

            hobby_cards.append({
                "id": f"hobby-{matched_key.replace(' ', '-')}",
                "tag": matched_key.upper(),
                "title": template["hobby_title"],
                "category": template["category"],
                "difficulty": template["difficulty"],
                "match_score": template["match_score"],
                "description": template["description"],
                "starter_kit": template["starter_kit"],
                "cultural_matches": slice_entities,
            })
        elif tag not in used_keys:
            used_keys.add(tag)
            custom_label = tag.upper()
            idx = len(hobby_cards) * 2
            slice_entities = (
                qloo_live_entities[idx:idx + 3]
                if qloo_live_entities
                else [
                    {"name": f"{tag.title()} Creators & Community", "type": "artist", "sub": f"Qloo Taste Match ({custom_label})"},
                    {"name": f"{tag.title()} Studios & Local Spots", "type": "place", "sub": "Recommended Cultural Spot"},
                    {"name": f"The Essential {tag.title()} Zine", "type": "book", "sub": "Visual Reference & Guide"},
                ]
            )
            hobby_cards.append({
                "id": f"hobby-custom-{tag.replace(' ', '-')}",
                "tag": custom_label,
                "title": f"Hands-On {tag.title()} Creation, Collecting & DIY Club",
                "category": f"CUSTOM CRAFT // {custom_label}",
                "difficulty": "BEGINNER",
                "match_score": 97,
                "description": (
                    f"Turn your visual inspiration around #{custom_label} into a real-world hobby: start a weekend DIY project, "
                    "explore cultural picks powered by Qloo, and share your progress with friends."
                ),
                "starter_kit": [
                    f"Starter kit for {tag} projects",
                    "Physical moodboard / Scrapbook journal",
                    f"Curated {tag} playlist & culture via Qloo API",
                ],
                "cultural_matches": slice_entities,
            })

    all_cultural = list(qloo_live_entities) if qloo_live_entities else []
    for card in hobby_cards:
        for ent in card["cultural_matches"]:
            if not any(existing.get("name") == ent.get("name") for existing in all_cultural):
                all_cultural.append(ent)

    # Ensure all 4 cross-domain types (artist, movie, book, place) have at least one match for the UI filter tabs
    default_cross_domain = [
        {"name": "Plantasia (Mort Garson)", "type": "artist", "sub": "Warm Earth Music for Plants"},
        {"name": "Studio Ghibli / My Neighbor Totoro", "type": "movie", "sub": "Iconic Animation & Visual World"},
        {"name": "The Unknown Craftsman (Soetsu Yanagi)", "type": "book", "sub": "Japanese Folk Craft & Mingei"},
        {"name": "Kew Royal Botanic Gardens", "type": "place", "sub": "Botanical Conservatory & Glasshouse"},
    ]
    existing_types = {item.get("type") for item in all_cultural}
    for fallback_item in default_cross_domain:
        if fallback_item["type"] not in existing_types:
            all_cultural.append(fallback_item)

    logs.append(
        f"> SYNTHESIS COMPLETE (SIGNALS={signal_source} [{claude_model_used if signal_source == 'CLAUDE_VISION' else 'LOCAL_TAGS'}] + QLOO={qloo_mode}): {len(hobby_cards)} HOBBIES + {len(all_cultural)} QLOO CULTURAL MATCHES READY."
    )

    return {
        "status": "ok",
        "qloo_mode": qloo_mode,
        "vision_mode": vision_mode,
        "signal_source": signal_source,
        "claude_model_used": claude_model_used if signal_source == "CLAUDE_VISION" else None,
        "qloo_base_url": QLOO_BASE_URL,
        "aesthetic_dna": {
            "archetype": (claude_analysis or {}).get("archetype") or f"{clean_tags[0].upper()} MARKET CURATOR",
            "tags": clean_tags,
            "vibe_summary": (claude_analysis or {}).get("visual_narrative") or (
                f"Your visual scrapbook blends {', '.join(clean_tags[:3])}! "
                "Instead of just saving screenshots on your phone, your aesthetic DNA points to hands-on creative projects, "
                "tactile crafts, and iconic music & places."
            ),
            "per_image_captions": (claude_analysis or {}).get("per_image_captions", []),
            "qloo_seeds": (claude_analysis or {}).get("qloo_seeds"),
        },
        "hobbies": hobby_cards,
        "qloo_insights": all_cultural[:16],
        "terminal_logs": logs,
    }
