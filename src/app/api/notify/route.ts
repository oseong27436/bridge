import { NextResponse } from 'next/server'

function buildMessage(action: 'approved' | 'rejected', eventTitle: string, lang: string, openChatUrl?: string | null): string {
  const chatLine = openChatUrl
    ? (lang === 'ko'
        ? `\n\n📢 오픈채팅 참가: ${openChatUrl}`
        : lang === 'en'
        ? `\n\n📢 Join our open chat: ${openChatUrl}`
        : `\n\n📢 オープンチャットに参加する: ${openChatUrl}`)
    : ''

  if (lang === 'ko') {
    return action === 'approved'
      ? `🎉 이벤트 「${eventTitle}」 참가가 승인되었습니다! 당일 뵙겠습니다.${chatLine}`
      : `「${eventTitle}」 참가 신청은 이번에 승인되지 않았습니다. 다음에 또 신청해주세요.`
  }
  if (lang === 'en') {
    return action === 'approved'
      ? `🎉 Your registration for "${eventTitle}" has been approved! See you there!${chatLine}`
      : `Your registration for "${eventTitle}" was not approved this time. Hope to see you at future events!`
  }
  return action === 'approved'
    ? `🎉 イベント「${eventTitle}」への参加が承認されました！当日お会いできるのを楽しみにしています。${chatLine}`
    : `「${eventTitle}」への参加申請は今回見送りとなりました。またのご参加をお待ちしています。`
}

export async function POST(request: Request) {
  try {
    const { lineUserId, email, action, eventTitle, openChatUrl, lang = 'ja' } = await request.json()

    // LINE push notification
    if (lineUserId && process.env.LINE_MESSAGING_ACCESS_TOKEN) {
      const text = buildMessage(action, eventTitle, lang, openChatUrl)
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
      const isApproved = action === 'approved'
      const text = buildMessage(action, eventTitle, lang, openChatUrl)
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Bridge Osaka <noreply@bridgeosaka.com>',
          to: [email],
          subject: isApproved ? `イベント参加が承認されました` : `イベント参加申請について`,
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
