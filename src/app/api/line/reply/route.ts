import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { messageId, lineUserId, text } = await request.json()
    if (!messageId || !lineUserId || !text?.trim()) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    if (!process.env.LINE_MESSAGING_ACCESS_TOKEN) {
      return NextResponse.json({ ok: false, error: 'LINE_MESSAGING_ACCESS_TOKEN not set' }, { status: 500 })
    }

    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.LINE_MESSAGING_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: lineUserId,
        messages: [{ type: 'text', text }],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('LINE reply failed:', err)
      return NextResponse.json({ ok: false, error: err }, { status: 500 })
    }

    // Mark message as replied in DB
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase
      .from('bridge_line_messages')
      .update({ replied_at: new Date().toISOString(), reply_text: text })
      .eq('id', messageId)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Reply error:', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
