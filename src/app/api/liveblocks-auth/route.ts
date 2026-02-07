import { Liveblocks } from "@liveblocks/node";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { isValidUUID } from "@/lib/validation";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

// Generate a consistent color for a user based on their ID
function getUserColor(userId: string): string {
  const colors = [
    "#E57373", "#F06292", "#BA68C8", "#9575CD",
    "#7986CB", "#64B5F6", "#4FC3F7", "#4DD0E1",
    "#4DB6AC", "#81C784", "#AED581", "#DCE775",
    "#FFD54F", "#FFB74D", "#FF8A65", "#A1887F",
  ];

  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the room from the request body
    const { room } = await request.json();

    if (!room) {
      return NextResponse.json({ error: "Room is required" }, { status: 400 });
    }

    // Extract document ID from room name (format: "doc:uuid")
    const documentId = room.replace("doc:", "");

    // Validate UUID format
    if (!isValidUUID(documentId)) {
      return NextResponse.json({ error: "Invalid document ID" }, { status: 400 });
    }

    // Check if user has access to this document
    const { data: document } = await supabase
      .from("documents")
      .select()
      .eq("id", documentId)
      .single();

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    let canAccess = document.owner_id === user.id;
    let permission = "write" as "write" | "read" | "comment";

    if (!canAccess) {
      const { data: share } = await supabase
        .from("document_shares")
        .select()
        .eq("document_id", documentId)
        .eq("user_id", user.id)
        .single();

      if (share) {
        canAccess = true;
        permission = share.permission === "edit" ? "write" : share.permission === "comment" ? "comment" : "read";
      }
    }

    if (!canAccess) {
      const cookieStore = await cookies();
      const shareToken = cookieStore.get(`share_${documentId}`)?.value;

      if (shareToken) {
        const { data: tokenShare } = await supabase
          .from("document_shares")
          .select("permission")
          .eq("document_id", documentId)
          .eq("share_token", shareToken)
          .single();

        if (tokenShare) {
          canAccess = true;
          permission = tokenShare.permission === "edit" ? "write" : tokenShare.permission === "comment" ? "comment" : "read";
        }
      }
    }

    if (!canAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get user profile for display name and avatar
    let displayName = user.user_metadata?.full_name;
    let avatar = user.user_metadata?.avatar_url || "";

    // If no name in metadata (or empty string), check profiles table
    if (!displayName || displayName.trim() === "") {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user.id)
        .single();

      // Log unexpected errors (PGRST116 is "not found" which is expected)
      if (profileError && profileError.code !== "PGRST116") {
        console.warn("Failed to fetch user profile:", profileError.message);
      }

      if (profile) {
        displayName = profile.display_name || user.email?.split("@")[0] || "Anonymous";
        avatar = avatar || profile.avatar_url || "";
      } else {
        displayName = user.email?.split("@")[0] || "Anonymous";
      }
    }

    // Create a session for the user
    const session = liveblocks.prepareSession(user.id, {
      userInfo: {
        name: displayName,
        email: user.email || "",
        avatar: avatar,
        color: getUserColor(user.id),
        type: "human" as const,
      },
    });

    // Set permissions based on document access
    if (permission === "write") {
      session.allow(room, session.FULL_ACCESS);
    } else if (permission === "comment") {
      // Allow reading and commenting but not editing the document content
      session.allow(room, ["room:read", "room:presence:write", "comments:write"]);
    } else {
      session.allow(room, session.READ_ACCESS);
    }

    const { body, status } = await session.authorize();

    return new NextResponse(body, { status });
  } catch (error) {
    console.error("Liveblocks auth error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
