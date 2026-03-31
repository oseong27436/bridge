import { NextResponse } from 'next/server'

function buildMessage(action: 'applied' | 'approved' | 'rejected', eventTitle: string, lang: string, openChatUrl?: string | null): string {
  const chatLine = openChatUrl && action === 'approved'
    ? (lang === 'ko'
        ? `\n\n📢 오픈채팅 참가: ${openChatUrl}`
        : lang === 'en'
        ? `\n\n📢 Join our open chat: ${openChatUrl}`
        : `\n\n📢 オープンチャットに参加する: ${openChatUrl}`)
    : ''

  if (lang === 'ko') {
    if (action === 'applied') return `📋 이벤트 「${eventTitle}」 참가 신청이 접수되었습니다. 승인을 기다려주세요.`
    if (action === 'approved') return `🎉 이벤트 「${eventTitle}」 참가가 승인되었습니다! 당일 뵙겠습니다.${chatLine}`
    return `「${eventTitle}」 참가 신청은 이번에 승인되지 않았습니다. 다음에 또 신청해주세요.`
  }
  if (lang === 'en') {
    if (action === 'applied') return `📋 Your registration for "${eventTitle}" has been received. Please wait for approval.`
    if (action === 'approved') return `🎉 Your registration for "${eventTitle}" has been approved! See you there!${chatLine}`
    return `Your registration for "${eventTitle}" was not approved this time. Hope to see you at future events!`
  }
  // Default: Japanese
  if (action === 'applied') return `📋 イベント「${eventTitle}」への参加申請を受け付けました。承認をお待ちください。`
  if (action === 'approved') return `🎉 イベント「${eventTitle}」への参加が承認されました！当日お会いできるのを楽しみにしています。${chatLine}`
  return `「${eventTitle}」への参加申請は今回見送りとなりました。またのご参加をお待ちしています。`
}

export async function POST(request: Request) {
  try {
    const { lineUserId, email, action, eventTitle, openChatUrl, lang = 'ja' } = await request.json()
    const text = buildMessage(action, eventTitle, lang, openChatUrl)

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
