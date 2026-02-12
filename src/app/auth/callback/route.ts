import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Validate redirect path to prevent open redirect attacks
function getSafeRedirectPath(path: string | null): string {
  if (!path) return '/'

  // Decode once because login flow passes encoded next paths
  // e.g. /auth/callback?next=%2Fshare%2Ftoken
  let decoded = path
  try {
    decoded = decodeURIComponent(path)
  } catch {
    // keep original value if malformed encoding
  }

  // Remove any whitespace characters that could be used for bypass
  // This includes \r, \n, \t, \f, and other control characters
  const cleaned = decoded.replace(/[\s\x00-\x1f]/g, '')

  // Must start with exactly one / and not be a protocol-relative URL
  // Also block encoded slashes and other bypass attempts
  // Check for // anywhere in path (could be smuggled via null byte)
  if (
    cleaned.startsWith('/') &&
    !cleaned.startsWith('//') &&
    !cleaned.includes('//') &&
    !cleaned.includes(':') &&
    !cleaned.includes('\\') &&
    !cleaned.includes('%2f') &&
    !cleaned.toLowerCase().includes('%2f')
  ) {
    return cleaned
  }
  return '/'
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = getSafeRedirectPath(searchParams.get('next'))

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Check if user profile exists, if not create one
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select()
          .eq('id', user.id)
          .single()

        if (!profile) {
          await supabase.from('profiles').insert({
            id: user.id,
            email: user.email!,
            display_name: user.user_metadata.full_name || user.email!.split('@')[0],
            avatar_url: user.user_metadata.avatar_url || null,
          })
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_error`)
}
