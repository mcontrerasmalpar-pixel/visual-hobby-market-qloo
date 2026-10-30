import os
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
import httpx
from dotenv import load_dotenv

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
    "y2k retro": {
        "hobby_title": "Y2K Zine Making, Scrapbooking & 2000s Digicam Hunting",
        "category": "CREATIVE DESIGN / ZINES",
        "difficulty": "BEGINNER",
        "match_score": 99,
        "description": "Capture everyday moments with early-2000s CCD Cyber-shot cameras, print glossy sticker sheets, and craft physical collage zines with your friends.",
        "starter_kit": ["2000s CCD Digicam (Sony Cyber-shot)", "Glossy sticker paper & gel pens", "Blender 3D (low-poly retro mode)"],
        "qloo_queries": ["electronic", "pop art", "video games", "anime"],
        "fallback_entities": [
            {"name": "Daft Punk - Discovery", "type": "artist", "sub": "French Touch / Y2K Anthem"},
            {"name": "Jet Set Radio", "type": "movie", "sub": "Y2K Aesthetic Cult Classic"},
            {"name": "The Designers Republic", "type": "book", "sub": "Futuristic Graphic Design"}
        ]
    },
    "anime": {
        "hobby_title": "Cel-Shading Digital Illustration, Artbook Collecting & Figure Customizing",
        "category": "ANIME / POP CULTURE",
        "difficulty": "BEGINNER",
        "match_score": 99,
        "description": "Design your own 2000s-style anime characters, customize blind-box vinyl figures or Gunpla kits, and explore iconic Japanese animation soundtracks.",
        "starter_kit": ["Sketchbook + Copic markers or Procreate", "Blank vinyl figure / Model kit", "Japanese Animation Studio Artbook"],
        "qloo_queries": ["anime", "studio ghibli", "manga", "j-pop"],
        "fallback_entities": [
            {"name": "Studio Ghibli / Hayao Miyazaki", "type": "movie", "sub": "Iconic Japanese Animation"},
            {"name": "Cowboy Bebop (Yoko Kanno)", "type": "artist", "sub": "Anime Soundtrack & Jazz"},
            {"name": "Akihabara & Nakano Broadway", "type": "place", "sub": "Anime, Figures & Retro Artbooks"}
        ]
    },
    "kawaii pop": {
        "hobby_title": "Polymer Clay Art Toys, Deco-Den Crafting & UV Resin Charms",
        "category": "CRAFTS / TOY ART",
        "difficulty": "BEGINNER",
        "match_score": 98,
        "description": "Sculpt and paint your own collectible blind-box style figures, decorate phone cases with whipped silicone clay (Deco-Den), and cast glittery Y2K charms.",
        "starter_kit": ["Polymer or air-dry clay", "Pastel acrylic paints & high-gloss varnish", "Mini flower beads, rhinestones & UV resin"],
        "qloo_queries": ["pop art", "sanrio", "japanese pop", "illustration"],
        "fallback_entities": [
            {"name": "Takashi Murakami", "type": "artist", "sub": "Superflat Pop Art & Figures"},
            {"name": "Harajuku Takeshita Street", "type": "place", "sub": "Kawaii Pop Culture Hub"},
            {"name": "FRUiTS Magazine (Shoichi Aoki)", "type": "book", "sub": "Harajuku Street Fashion & Pop"}
        ]
    },
    "cyberpunk": {
        "hobby_title": "Retro Hardware Modding & Synthwave Jamming",
        "category": "TECH / AUDIO",
        "difficulty": "INTERMEDIATE",
        "match_score": 98,
        "description": "Build custom translucent mechanical keyboards with neon lighting, mod 2000s handheld consoles, or produce synthwave tracks using software synthesizers.",
        "starter_kit": ["Translucent keycaps & soldering kit", "Free DAW (Vital Synth)", "Vintage CCD digital camera"],
        "qloo_queries": ["cyberpunk", "synthwave", "blade runner", "electronic music"],
        "fallback_entities": [
            {"name": "Kavinsky", "type": "artist", "sub": "Synthwave / Outrun"},
            {"name": "Neuromancer (William Gibson)", "type": "book", "sub": "Sci-Fi Cyberpunk"},
            {"name": "Akihabara Electric Town", "type": "place", "sub": "Tech & Retro Arcade District"}
        ]
    },
    "brutalist architecture": {
        "hobby_title": "Urban 35mm Film Photography & Architectural Sketching",
        "category": "VISUAL ART / URBAN",
        "difficulty": "BEGINNER",
        "match_score": 95,
        "description": "Explore your city documenting bold concrete geometry, dramatic shadows, and monolithic structures using high-contrast black-and-white 35mm film.",
        "starter_kit": ["Compact 35mm camera or B&W film app", "Ilford HP5 400 Film Roll", "Isometric dot-grid sketchbook"],
        "qloo_queries": ["brutalism", "architecture", "photography", "minimalism"],
        "fallback_entities": [
            {"name": "Barbican Centre", "type": "place", "sub": "Iconic Brutalist Landmark"},
            {"name": "Andreas Gursky", "type": "artist", "sub": "Large Format Photography"},
            {"name": "Towards a New Architecture (Le Corbusier)", "type": "book", "sub": "Architecture Manifesto"}
        ]
    },
    "lo-fi jazz": {
        "hobby_title": "Sampler Beatmaking & Vinyl Crate Digging",
        "category": "MUSIC / CULTURE",
        "difficulty": "BEGINNER",
        "match_score": 96,
        "description": "Browse local record shops for 70s jazz samples, chop warm tape loops on a pocket sampler, and host cozy late-night listening sessions.",
        "starter_kit": ["Pad controller or Koala Sampler app", "Entry-level turntable", "Open-back studio headphones"],
        "qloo_queries": ["nujabes", "lo-fi", "jazz hop", "vinyl"],
        "fallback_entities": [
            {"name": "Nujabes", "type": "artist", "sub": "Lo-Fi Jazz Hop Pioneer"},
            {"name": "J Dilla - Donuts", "type": "artist", "sub": "Instrumental Hip-Hop"},
            {"name": "Blue Note Jazz Club", "type": "place", "sub": "Historic Jazz Venue"}
        ]
    },
    "botanical": {
        "hobby_title": "Closed Glass Terrariums, Flower Pressing & Botanical Journals",
        "category": "NATURE / DESIGN",
        "difficulty": "BEGINNER",
        "match_score": 96,
        "description": "Create self-sustaining miniature ecosystems inside glass jars with live moss, volcanic stones, and pressed flowers while listening to warm ambient music.",
        "starter_kit": ["Airtight glass jar", "Live moss + activated charcoal", "Long aquascaping tweezers & flower press"],
        "qloo_queries": ["botanical garden", "nature", "ambient", "plant"],
        "fallback_entities": [
            {"name": "Plantasia (Mort Garson)", "type": "artist", "sub": "Warm Earth Music for Plants"},
            {"name": "Kew Royal Botanic Gardens", "type": "place", "sub": "Botanical Conservatory"},
            {"name": "Braiding Sweetgrass", "type": "book", "sub": "Botany & Ecology"}
        ]
    },
    "analog photography": {
        "hobby_title": "Solar Cyanotype Printing & Experimental Film Lab",
        "category": "ART / DARKROOM LAB",
        "difficulty": "INTERMEDIATE",
        "match_score": 94,
        "description": "Bring your digital screenshots into the physical world by printing negatives onto cotton paper using sunlight and Prussian-blue cyanotype chemistry.",
        "starter_kit": ["Cyanotype sensitizer kit (Part A+B)", "300g watercolor cotton paper", "Printed transparency negatives"],
        "qloo_queries": ["indie film", "photography", "art house", "indie rock"],
        "fallback_entities": [
            {"name": "Wong Kar-wai", "type": "movie", "sub": "Cinematic Color & Neon Mood"},
            {"name": "Vivian Maier", "type": "book", "sub": "Street Photography Archive"},
            {"name": "Fotografiska Museum", "type": "place", "sub": "Contemporary Photography Space"}
        ]
    },
    "dark academia": {
        "hobby_title": "Handcrafted Bookbinding, Fountain Pen Calligraphy & Classic Book Club",
        "category": "LITERATURE / CRAFT",
        "difficulty": "BEGINNER",
        "match_score": 93,
        "description": "Sew your own exposed-spine journals with waxed linen thread, practice calligraphy with sepia ink, and explore historic libraries and cozy cafes.",
        "starter_kit": ["Fountain pen + sepia ink", "Waxed thread & bookbinding awl", "120g ivory dot-grid paper"],
        "qloo_queries": ["classical music", "literature", "philosophy", "museum"],
        "fallback_entities": [
            {"name": "The Secret History (Donna Tartt)", "type": "book", "sub": "Dark Academia Essential"},
            {"name": "Max Richter", "type": "artist", "sub": "Neo-Classical / Post-Minimalism"},
            {"name": "Shakespeare and Company", "type": "place", "sub": "Historic Independent Bookstore"}
        ]
    },
    "indie sleaze": {
        "hobby_title": "Vinyl / CDJ Mixing & Underground Nightlife Zines",
        "category": "MUSIC / NIGHTLIFE",
        "difficulty": "INTERMEDIATE",
        "match_score": 95,
        "description": "Mix electro-clash, post-punk revival, and bloghouse tracks while documenting your local music scene with direct flash photography.",
        "starter_kit": ["2-channel DJ controller", "Point-and-shoot camera with direct flash", "Curated electro-indie playlist"],
        "qloo_queries": ["indie rock", "electroclash", "post-punk", "nightlife"],
        "fallback_entities": [
            {"name": "LCD Soundsystem", "type": "artist", "sub": "Dance-Punk / Indie Electronic"},
            {"name": "Justice - Cross", "type": "artist", "sub": "French Electro"},
            {"name": "Meet Me in the Bathroom", "type": "book", "sub": "2000s Music Oral History"}
        ]
    }
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
    entity_types: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Orchestrates the full Visual-to-Hobby pipeline:
    1. Normalizes the user's visual aesthetic tags.
    2. Queries https://hackathon.api.qloo.com (/v2/tags, /search, and /v2/insights).
    3. Synthesizes actionable Hobby cards paired with Qloo cultural matches.
    """
    logs: List[str] = [
        "> INITIALIZING VISUAL_HOBBY_FINDER ENGINE v2.4...",
        f"> TARGET GATEWAY: {QLOO_BASE_URL}",
    ]

    clean_tags = [t.strip().lower() for t in tags if t.strip()]
    if not clean_tags:
        clean_tags = ["y2k retro", "anime", "kawaii pop"]

    logs.append(f"> DECODED VISUAL DNA TAGS: {', '.join(clean_tags).upper()}")

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
                "category": f"CUSTOM STICKER // {custom_label}",
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
        {"name": "Daft Punk - Discovery", "type": "artist", "sub": "French Touch / Y2K Electronic"},
        {"name": "Studio Ghibli / Spirited Away", "type": "movie", "sub": "Iconic Animation & Visual World"},
        {"name": "FRUiTS Magazine (Shoichi Aoki)", "type": "book", "sub": "Harajuku Street Fashion Archive"},
        {"name": "Harajuku Takeshita Street", "type": "place", "sub": "Pop Culture & Vintage District"},
    ]
    existing_types = {item.get("type") for item in all_cultural}
    for fallback_item in default_cross_domain:
        if fallback_item["type"] not in existing_types:
            all_cultural.append(fallback_item)

    logs.append(f"> SYNTHESIS COMPLETE: {len(hobby_cards)} HOBBIES + {len(all_cultural)} QLOO CULTURAL MATCHES READY.")
    logs.append("> SYSTEM READY_")

    return {
        "status": "ok",
        "qloo_mode": qloo_mode,
        "qloo_base_url": QLOO_BASE_URL,
        "aesthetic_dna": {
            "archetype": f"2000s {clean_tags[0].upper()} STAR",
            "tags": clean_tags,
            "vibe_summary": (
                f"Your visual scrapbook blends {', '.join(clean_tags[:3])}! "
                "Instead of just saving screenshots on your phone, your aesthetic DNA points to hands-on creative projects, "
                "collectible culture, and iconic music & places."
            )
        },
        "hobbies": hobby_cards,
        "qloo_insights": all_cultural[:12],
        "terminal_logs": logs,
    }
