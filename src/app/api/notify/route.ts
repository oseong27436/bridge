import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const DEFAULTS: Record<string, Record<string, string>> = {
  applied: {
    ja: '📋 イベント「{eventTitle}」への参加申請を受け付けました。承認をお待ちください。',
    ko: '📋 이벤트 「{eventTitle}」 참가 신청이 접수되었습니다. 승인을 기다려주세요.',
    en: '📋 Your registration for "{eventTitle}" has been received. Please wait for approval.',
  },
  approved: {
    ja: '🎉 イベント「{eventTitle}」への参加が承認されました！当日お会いできるのを楽しみにしています。{openChatLine}',
    ko: '🎉 이벤트 「{eventTitle}」 참가가 승인되었습니다! 당일 뵙겠습니다.{openChatLine}',
    en: '🎉 Your registration for "{eventTitle}" has been approved! See you there!{openChatLine}',
  },
  rejected: {
    ja: '「{eventTitle}」への参加申請は今回見送りとなりました。またのご参加をお待ちしています。',
    ko: '「{eventTitle}」 참가 신청은 이번에 승인되지 않았습니다. 다음에 또 신청해주세요.',
    en: 'Your registration for "{eventTitle}" was not approved this time. Hope to see you at future events!',
  },
}

async function buildMessage(
  action: 'applied' | 'approved' | 'rejected',
  eventTitle: string,
  lang: string,
  openChatUrl?: string | null
): Promise<string> {
  const resolvedLang = ['ja', 'ko', 'en'].includes(lang) ? lang : 'ja'

  // Build the open chat line for approved messages
  const openChatLine = openChatUrl && action === 'approved'
    ? (resolvedLang === 'ko'
        ? `\n\n📢 오픈채팅 참가: ${openChatUrl}`
        : resolvedLang === 'en'
        ? `\n\n📢 Join our open chat: ${openChatUrl}`
        : `\n\n📢 オープンチャットに参加する: ${openChatUrl}`)
    : ''

  // Try to fetch template from DB
  let template: string | null = null
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data } = await supabase
      .from('bridge_line_templates')
      .select('body')
      .eq('action', action)
      .eq('lang', resolvedLang)
      .maybeSingle()
    if (data?.body) template = data.body
  } catch {
    // fallback to defaults
  }

  const body = template ?? DEFAULTS[action]?.[resolvedLang] ?? DEFAULTS[action]?.['ja'] ?? ''

  return body
    .replace('{eventTitle}', eventTitle)
    .replace('{openChatLine}', openChatLine)
}

export async function POST(request: Request) {
  try {
    const { lineUserId, email, action, eventTitle, openChatUrl, lang = 'ja' } = await request.json()
    const text = await buildMessage(action, eventTitle, lang, openChatUrl)

    // LINE push notification
    if (lineUserId && process.env.LINE_MESSAGING_ACCESS_TOKEN) {
      const res = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.LINE_MESSAGING_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: lineUserId,
          messages: [{ type: 'text', text }],
        }),
      })
      if (!res.ok) {
        console.error('LINE push failed:', await res.text())
      }
    }

    // Email notification via Resend (set RESEND_API_KEY in env to enable)
    if (!lineUserId && email && process.env.RESEND_API_KEY) {
      const subjectMap: Record<string, string> = {
        applied: 'イベント参加申請を受け付けました',
        approved: 'イベント参加が承認されました',
        rejected: 'イベント参加申請について',
      }
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Bridge Osaka <noreply@bridgeosaka.com>',
          to: [email],
          subject: subjectMap[action] ?? subjectMap.applied,
          html: `<p>${text}</p>`,
        }),
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Notify error:', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
