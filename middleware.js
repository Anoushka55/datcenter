import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

// No forced login gate — the app is open access. This middleware only
// refreshes the Supabase session cookie so components like Navbar can
// still reflect a signed-in user if one exists.
export async function middleware(request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // A Supabase outage, network blip, or hung connection must not turn every
  // request — including /api/* — into a 500 or a Vercel middleware timeout.
  // Race against a timeout so a stalled call degrades to an unrefreshed
  // session instead of hanging until the platform kills the invocation.
  try {
    await Promise.race([
      supabase.auth.getUser(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Supabase auth timed out')), 5000)
      ),
    ]);
  } catch (err) {
    console.error('[middleware] Supabase session refresh failed:', err);
    return NextResponse.next({ request });
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)'],
};
