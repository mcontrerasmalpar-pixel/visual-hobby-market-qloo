import json
import sys
from datetime import datetime
from pathlib import Path
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

sys.path.insert(0, str(Path(__file__).resolve().parent))

from services.qloo import get_hobby_recommendations, get_api_key, QLOO_BASE_URL, AESTHETIC_HOBBY_MATRIX

app = FastAPI(
    title="Visual Hobby Finder API (Qloo Hackathon)",
    description="Transforms passive visual inspiration (Pinterest boards, screenshots) into active lifestyle hobbies powered by Qloo Taste AI.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FEED_FILE = Path(__file__).resolve().parent / "community_feed.json"

DEFAULT_FEED = [
    {
        "id": "post-1",
        "username": "bratz_valeria99",
        "avatar": "🌺",
        "hobby_title": "Y2K Zine Making, Scrapbooking & 2000s Digicam Hunting",
        "aesthetic_tags": ["Y2K RETRO", "ANIME"],
        "qloo_match": "Daft Punk / Studio Ghibli",
        "comment": "Uploaded 4 screenshots from my 2000s magazine Pinterest board and started making a physical collage zine with my besties!",
        "timestamp": "12 MINS AGO",
        "likes": 24
    },
    {
        "id": "post-2",
        "username": "analog_mateo",
        "avatar": "📸",
        "hobby_title": "Urban 35mm Film Photography & Architectural Sketching",
        "aesthetic_tags": ["BRUTALIST ARCHITECTURE", "ANALOG PHOTOGRAPHY"],
        "qloo_match": "Barbican Centre / Ilford B&W",
        "comment": "I had dozens of concrete architecture photos saved on my phone. Finally took a 35mm film camera downtown this weekend!",
        "timestamp": "1 HOUR AGO",
        "likes": 19
    },
    {
        "id": "post-3",
        "username": "moss_girl_2000",
        "avatar": "🦋",
        "hobby_title": "Closed Glass Terrariums, Flower Pressing & Botanical Journals",
        "aesthetic_tags": ["BOTANICAL", "LO-FI JAZZ"],
        "qloo_match": "Plantasia (Mort Garson) / Nujabes",
        "comment": "Built my first closed moss terrarium while listening to the Plantasia album Qloo recommended. 10/10 vibe!",
        "timestamp": "3 HOURS AGO",
        "likes": 31
    }
]


MEMORY_FEED: Optional[List[dict]] = None


def load_feed() -> List[dict]:
    global MEMORY_FEED
    if MEMORY_FEED is not None:
        return MEMORY_FEED
    if FEED_FILE.exists():
        try:
            MEMORY_FEED = json.loads(FEED_FILE.read_text(encoding="utf-8"))
            return MEMORY_FEED
        except Exception:
            pass
    MEMORY_FEED = list(DEFAULT_FEED)
    try:
        FEED_FILE.write_text(json.dumps(MEMORY_FEED, ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception:
        pass
    return MEMORY_FEED


def save_feed(posts: List[dict]) -> None:
    global MEMORY_FEED
    MEMORY_FEED = posts
    try:
        FEED_FILE.write_text(json.dumps(posts, ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception:
        pass


class RecommendationRequest(BaseModel):
    tags: List[str] = Field(
        default=["y2k retro", "anime", "kawaii pop"],
        description="Semantic aesthetic tags extracted from user images"
    )
    entity_types: Optional[List[str]] = Field(
        default=["urn:entity:artist", "urn:entity:place", "urn:entity:book", "urn:entity:movie"],
        description="Qloo entity categories (/v2/insights filter.type)"
    )


class FeedPostCreate(BaseModel):
    username: str = Field(..., min_length=2, max_length=32)
    avatar: str = Field(default="🌺")
    hobby_title: str = Field(..., min_length=3, max_length=120)
    aesthetic_tags: List[str] = Field(default_factory=list)
    qloo_match: str = Field(default="Qloo Taste AI Match")
    comment: str = Field(..., min_length=3, max_length=280)


@app.get("/api/health")
@app.get("/health")
async def health_check():
    api_key = get_api_key()
    return {
        "status": "SYSTEM_ONLINE",
        "qloo_base_url": QLOO_BASE_URL,
        "qloo_api_key_configured": bool(api_key),
        "available_aesthetics": list(AESTHETIC_HOBBY_MATRIX.keys()),
    }


@app.post("/api/recommendations")
@app.post("/recommendations")
async def generate_recommendations(payload: RecommendationRequest):
    if not payload.tags:
        raise HTTPException(status_code=400, detail="Please send at least one visual tag.")
    result = await get_hobby_recommendations(
        tags=payload.tags,
        entity_types=payload.entity_types,
    )
    return result


@app.get("/api/feed")
@app.get("/feed")
async def get_community_feed():
    return {"posts": load_feed()}


@app.post("/api/feed")
@app.post("/feed")
async def create_community_post(post: FeedPostCreate):
    posts = load_feed()
    new_entry = {
        "id": f"post-{int(datetime.utcnow().timestamp())}",
        "username": post.username.strip(),
        "avatar": post.avatar or "🌺",
        "hobby_title": post.hobby_title.strip(),
        "aesthetic_tags": [t.upper() for t in post.aesthetic_tags[:4]],
        "qloo_match": post.qloo_match.strip(),
        "comment": post.comment.strip(),
        "timestamp": "JUST NOW",
        "likes": 1,
    }
    posts.insert(0, new_entry)
    save_feed(posts[:30])
    return {"status": "created", "post": new_entry, "posts": posts[:30]}


@app.post("/api/feed/{post_id}/like")
@app.post("/feed/{post_id}/like")
async def like_community_post(post_id: str):
    posts = load_feed()
    for p in posts:
        if p["id"] == post_id:
            p["likes"] = int(p.get("likes", 0)) + 1
            save_feed(posts)
            return {"status": "liked", "post": p}
    raise HTTPException(status_code=404, detail="Post not found")
