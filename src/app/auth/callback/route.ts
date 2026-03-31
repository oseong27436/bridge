import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cs) =>
            cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
        },
      }
    )

    const { data: { user } } = await supabase.auth.exchangeCodeForSession(code)

    if (user) {
      const { data: profile } = await supabase
        .from('bridge_profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      // LINE 로그인 시 line_user_id 저장
      const isLine = user.app_metadata?.provider === 'custom:line'
      if (isLine && profile) {
        const lineUserId = user.user_metadata?.sub
        if (lineUserId) {
          await supabase
            .from('bridge_profiles')
            .update({ line_user_id: lineUserId })
            .eq('id', user.id)
        }
      }

      if (!profile) {
        return NextResponse.redirect(origin + '/auth/signup?sso=1')
      }
    }
  }

  return NextResponse.redirect(origin + '/')
}
