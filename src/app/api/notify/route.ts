import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const DEFAULTS: Record<string, string> = {
  applied:
    '📋 イベント「{eventTitle}」への参加申請を受け付けました。承認をお待ちください。\n\n---\n\n📋 Your registration for "{eventTitle}" has been received. Please wait for approval.',
  approved:
    '🎉 イベント「{eventTitle}」への参加が承認されました！当日お会いできるのを楽しみにしています。{openChatLine}\n\n---\n\n🎉 Your registration for "{eventTitle}" has been approved! See you there!',
  rejected:
    '「{eventTitle}」への参加申請は今回見送りとなりました。またのご参加をお待ちしています。\n\n---\n\nYour registration for "{eventTitle}" was not approved this time. Hope to see you at future events!',
}

async function buildMessage(
  action: 'applied' | 'approved' | 'rejected',
  eventTitle: string,
  openChatUrl?: string | null
): Promise<string> {
  const openChatLine =
    openChatUrl && action === 'approved'
      ? `\n\n📢 オープンチャットに参加する: ${openChatUrl}\n📢 Join our open chat: ${openChatUrl}`
      : ''

  // Try to fetch template from DB (lang='all')
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
      .eq('lang', 'all')
      .maybeSingle()
    if (data?.body) template = data.body
  } catch {
    // fallback to defaults
  }

  const body = template ?? DEFAULTS[action] ?? ''

  return body
    .replaceAll('{eventTitle}', eventTitle)
    .replaceAll('{openChatLine}', openChatLine)
}

export async function POST(request: Request) {
  try {
    const { lineUserId, email, action, eventTitle, openChatUrl } = await request.json()
    const text = await buildMessage(action, eventTitle, openChatUrl)

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
        applied: 'イベント参加申請を受け付けました / Registration received',
        approved: 'イベント参加が承認されました / Registration approved',
        rejected: 'イベント参加申請について / Regarding your registration',
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
          html: `<p style="white-space:pre-line">${text}</p>`,
        }),
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Notify error:', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
