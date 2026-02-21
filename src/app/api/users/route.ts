import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userIds = searchParams.get("userIds")?.split(",").filter(Boolean) || [];
    const roomId = searchParams.get("roomId");
    const text = (searchParams.get("text") || "").trim().toLowerCase();

    const supabase = await createServerSupabaseClient();

    // Mention suggestions path: list document collaborators by room and optional text filter.
    if (roomId) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json([]);
      }

      const documentId = roomId.replace("doc:", "");
      const adminSupabase = createAdminSupabaseClient();

      const { data: document } = await adminSupabase
        .from("documents")
        .select("id, owner_id")
        .eq("id", documentId)
        .maybeSingle();

      if (!document) {
        return NextResponse.json([]);
      }

      const { data: viewerShare } = await adminSupabase
        .from("document_shares")
        .select("id")
        .eq("document_id", documentId)
        .eq("user_id", user.id)
        .maybeSingle();

      const canAccess = document.owner_id === user.id || !!viewerShare;
      if (!canAccess) {
        return NextResponse.json([]);
      }

      const { data: shareRows } = await adminSupabase
        .from("document_shares")
        .select("user_id")
        .eq("document_id", documentId)
        .not("user_id", "is", null);

      const collaboratorIds = Array.from(
        new Set(
          [document.owner_id, ...(shareRows || []).map((row) => row.user_id).filter(Boolean)] as string[]
        )
      );

      if (collaboratorIds.length === 0) {
        return NextResponse.json([]);
      }

      const { data: profiles } = await adminSupabase
        .from("profiles")
        .select("id, display_name, avatar_url, email")
        .in("id", collaboratorIds);

      const users = (profiles || [])
        .map((profile) => ({
          id: profile.id,
          name: profile.display_name || profile.email?.split("@")[0] || "Anonymous",
          avatar: profile.avatar_url || "",
          email: profile.email || "",
        }))
        .filter((candidate) => {
          if (!text) return true;
          return candidate.name.toLowerCase().includes(text) || candidate.email.toLowerCase().includes(text);
        })
        .slice(0, 10)
        .map(({ id, name, avatar }) => ({ id, name, avatar }));

      const response = NextResponse.json(users);
      response.headers.set("Cache-Control", "private, max-age=30, stale-while-revalidate=120");
      return response;
    }

    if (userIds.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch user profiles
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, email")
      .in("id", userIds);

    if (error) {
      console.error("Failed to fetch user profiles:", error);
      return NextResponse.json([]);
    }

    // Also get user metadata from auth for users who might not have profiles
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    // Map profiles to the format expected by Liveblocks
    const users = userIds.map((userId) => {
      const profile = profiles?.find((p) => p.id === userId);

      // If this is the current user, use their auth metadata
      if (currentUser && userId === currentUser.id) {
        return {
          id: userId,
          name: currentUser.user_metadata?.full_name ||
                profile?.display_name ||
                currentUser.email?.split("@")[0] ||
                "Anonymous",
          avatar: currentUser.user_metadata?.avatar_url ||
                  profile?.avatar_url ||
                  "",
        };
      }

      // For other users, use profile data
      if (profile) {
        return {
          id: userId,
          name: profile.display_name || profile.email?.split("@")[0] || "Anonymous",
          avatar: profile.avatar_url || "",
        };
      }

      // Fallback for unknown users
      return {
        id: userId,
        name: "Anonymous",
        avatar: "",
      };
    });

    const response = NextResponse.json(users);
    response.headers.set("Cache-Control", "private, max-age=60, stale-while-revalidate=180");
    return response;
  } catch (error) {
    console.error("Users API error:", error);
    return NextResponse.json([]);
  }
}
