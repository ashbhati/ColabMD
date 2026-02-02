import { Liveblocks } from "@liveblocks/node";
import { isValidUUID } from "@/lib/validation";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate AI agent API key
    const authHeader = request.headers.get("authorization");
    const expectedKey = process.env.AI_AGENT_API_KEY;

    if (!expectedKey) {
      return NextResponse.json(
        { error: "AI agent authentication not configured" },
        { status: 503 }
      );
    }

    if (!authHeader || authHeader !== `Bearer ${expectedKey}`) {
      return NextResponse.json({ error: "Invalid AI agent API key" }, { status: 401 });
    }

    const { id: documentId } = await params;

    // Validate UUID format
    if (!isValidUUID(documentId)) {
      return NextResponse.json({ error: "Invalid document ID" }, { status: 400 });
    }

    // Verify document exists
    const supabase = await createServerSupabaseClient();
    const { data: document } = await supabase
      .from("documents")
      .select("id")
      .eq("id", documentId)
      .single();

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      agentId,
      highlightId,
      content,
      confidence,
      reasoning,
      suggestedAction,
      category,
    } = body;

    if (!agentId) {
      return NextResponse.json({ error: "Agent ID is required" }, { status: 400 });
    }

    if (!highlightId) {
      return NextResponse.json({ error: "Highlight ID is required" }, { status: 400 });
    }

    if (!content) {
      return NextResponse.json({ error: "Comment content is required" }, { status: 400 });
    }

    const roomId = `doc:${documentId}`;
    const aiUserId = `ai-agent:${agentId}`;

    // Create thread with AI metadata using Liveblocks API
    const thread = await liveblocks.createThread({
      roomId,
      data: {
        metadata: {
          resolved: false,
          highlightId,
          aiGenerated: true,
          aiConfidence: confidence ?? null,
          aiReasoning: reasoning ?? null,
          aiSuggestedAction: suggestedAction ?? "none",
          aiCategory: category ?? "suggestion",
        },
        comment: {
          userId: aiUserId,
          body: {
            version: 1,
            content: [
              {
                type: "paragraph",
                children: [{ text: content }],
              },
            ],
          },
        },
      },
    });

    return NextResponse.json({
      threadId: thread.id,
      message: "AI comment created successfully",
    });
  } catch (error) {
    console.error("AI comment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
