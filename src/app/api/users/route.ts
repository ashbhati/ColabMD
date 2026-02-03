import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userIds = searchParams.get("userIds")?.split(",").filter(Boolean) || [];

    if (userIds.length === 0) {
      return NextResponse.json([]);
    }

    const supabase = await createServerSupabaseClient();

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

    return NextResponse.json(users);
  } catch (error) {
    console.error("Users API error:", error);
    return NextResponse.json([]);
  }
}
