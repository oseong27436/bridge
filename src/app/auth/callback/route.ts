import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const linkUserId = searchParams.get('link_user_id')

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
      const isLine = user.app_metadata?.provider === 'custom:line'
      const lineUserId = user.user_metadata?.sub

      // LINE 연동 요청 (기존 구글/이메일 유저가 LINE 연동)
      if (isLine && linkUserId && lineUserId) {
        await supabase
          .from('bridge_profiles')
          .update({ line_user_id: lineUserId })
          .eq('id', linkUserId)
        // LINE OAuth 세션 종료 후 로그인으로 (원래 세션은 이미 사라짐)
        await supabase.auth.signOut()
        return NextResponse.redirect(origin + '/auth/login?line_linked=1')
      }

      const { data: profile } = await supabase
        .from('bridge_profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      // LINE SSO 로그인 시 line_user_id 저장
      if (isLine && profile && lineUserId) {
        await supabase
          .from('bridge_profiles')
          .update({ line_user_id: lineUserId })
          .eq('id', user.id)
      }

      if (!profile) {
        return NextResponse.redirect(origin + '/auth/signup?sso=1')
      }
    }
  }

  return NextResponse.redirect(origin + '/')
}
