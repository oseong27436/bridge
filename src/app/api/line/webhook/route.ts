import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'crypto'

function verifySignature(body: string, signature: string): boolean {
  if (!process.env.LINE_CHANNEL_SECRET) return true // skip if not configured
  const expected = createHmac('SHA256', process.env.LINE_CHANNEL_SECRET)
    .update(body)
    .digest('base64')
  return signature === expected
}

async function fetchLineProfile(lineUserId: string): Promise<{ displayName: string; pictureUrl: string } | null> {
  if (!process.env.LINE_MESSAGING_ACCESS_TOKEN) return null
  try {
    const res = await fetch(`https://api.line.me/v2/bot/profile/${lineUserId}`, {
      headers: { Authorization: `Bearer ${process.env.LINE_MESSAGING_ACCESS_TOKEN}` },
    })
    if (!res.ok) return null
    const data = await res.json()
    return { displayName: data.displayName, pictureUrl: data.pictureUrl }
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-line-signature') ?? ''

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let body: { events: Array<{
    type: string
    replyToken?: string
    source: { userId: string }
    message?: { type: string; text: string }
  }> }

  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  for (const event of body.events ?? []) {
    if (event.type !== 'message') continue
    if (event.message?.type !== 'text') continue

    const lineUserId = event.source.userId
    const messageText = event.message.text

    // Fetch LINE profile (display name + avatar)
    const profile = await fetchLineProfile(lineUserId)

    await supabase.from('bridge_line_messages').insert({
      line_user_id: lineUserId,
      display_name: profile?.displayName ?? null,
      picture_url: profile?.pictureUrl ?? null,
      message_text: messageText,
      reply_token: event.replyToken ?? null,
    })
  }

  return NextResponse.json({ ok: true })
}
