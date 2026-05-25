import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

// Add any future protected tools here
const PROTECTED_ROUTES = [
  '/tools/task-tracker',
  '/tools/calendar',
  '/tools/assets',
]

export async function middleware(request) {
  const { pathname } = request.nextUrl
  const isProtected = PROTECTED_ROUTES.some(route => pathname.startsWith(route))

  if (!isProtected) return NextResponse.next()

  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request: { headers: request.headers } })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: ['/tools/task-tracker/:path*', '/tools/calendar/:path*', '/tools/assets/:path*'],
}
