import { Liveblocks } from "@liveblocks/node";
import { isValidUUID } from "@/lib/validation";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

// AI agent specific colors (purple palette)
const AI_COLORS = [
  "#9333EA", "#A855F7", "#C084FC", "#7C3AED",
  "#8B5CF6", "#A78BFA", "#C4B5FD", "#6366F1",
];

function getAIColor(agentId: string): string {
  let hash = 0;
  for (let i = 0; i < agentId.length; i++) {
    hash = agentId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AI_COLORS[Math.abs(hash) % AI_COLORS.length];
}

export async function POST(request: Request) {
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

    const body = await request.json();
    const { room, agentId, agentName, agentModel, agentProvider } = body;

    if (!room) {
      return NextResponse.json({ error: "Room is required" }, { status: 400 });
    }

    if (!agentId) {
      return NextResponse.json({ error: "Agent ID is required" }, { status: 400 });
    }

    // Extract document ID from room name (format: "doc:uuid")
    const documentId = room.replace("doc:", "");

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

    // Create a session for the AI agent with comment-only permissions
    const aiUserId = `ai-agent:${agentId}`;
    const session = liveblocks.prepareSession(aiUserId, {
      userInfo: {
        name: agentName || `AI Agent (${agentId})`,
        email: `${agentId}@ai-agent.local`,
        avatar: "",
        color: getAIColor(agentId),
        type: "ai-agent",
        agentId,
        agentModel: agentModel || "unknown",
        agentProvider: agentProvider || "unknown",
      },
    });

    // AI agents only get comment permissions, not full write access
    session.allow(room, ["room:read", "room:presence:write", "comments:write"]);

    const { body: responseBody, status } = await session.authorize();

    return new NextResponse(responseBody, { status });
  } catch (error) {
    console.error("AI agent auth error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
