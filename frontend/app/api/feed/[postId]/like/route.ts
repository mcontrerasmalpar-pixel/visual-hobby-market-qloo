import { NextRequest, NextResponse } from "next/server";
import { feedStore } from "../../../feedStore";

export async function POST(
  _req: NextRequest,
  { params }: { params: { postId: string } }
) {
  const post = feedStore.find((p) => p.id === params.postId);
  if (!post) {
    return NextResponse.json({ detail: "Post not found" }, { status: 404 });
  }
  post.likes += 1;
  return NextResponse.json({ status: "liked", post });
}
