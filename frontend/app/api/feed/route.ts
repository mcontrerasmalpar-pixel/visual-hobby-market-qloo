import { NextRequest, NextResponse } from "next/server";
import { feedStore } from "../feedStore";

export async function GET() {
  return NextResponse.json({ posts: feedStore });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const newEntry = {
    id: `post-${Date.now()}`,
    username: String(body.username || "guest").trim(),
    avatar: String(body.avatar || "🍀"),
    hobby_title: String(body.hobby_title || "Cozy Hobby").trim(),
    aesthetic_tags: Array.isArray(body.aesthetic_tags)
      ? body.aesthetic_tags.slice(0, 4).map((t: string) => String(t).toUpperCase())
      : [],
    qloo_match: String(body.qloo_match || "Qloo Taste AI").trim(),
    comment: String(body.comment || "").trim(),
    timestamp: "JUST NOW",
    likes: 1,
  };
  feedStore.unshift(newEntry);
  return NextResponse.json({
    status: "created",
    post: newEntry,
    posts: feedStore.slice(0, 30),
  });
}
