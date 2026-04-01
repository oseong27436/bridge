import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { message } = await request.json()
    if (!message?.trim()) return NextResponse.json({ ok: false }, { status: 400 })

    if (!process.env.LINE_MESSAGING_ACCESS_TOKEN) {
      return NextResponse.json({ ok: 0, fail: 0, error: 'LINE_MESSAGING_ACCESS_TOKEN not set' }, { status: 500 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: profiles } = await supabase
      .from('bridge_profiles')
      .select('line_user_id')
      .not('line_user_id', 'is', null)

    if (!profiles?.length) return NextResponse.json({ ok: 0, fail: 0 })

    let okCount = 0
    let failCount = 0

    // Send in batches to avoid rate limits
    for (const profile of profiles) {
      const res = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.LINE_MESSAGING_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: profile.line_user_id,
          messages: [{ type: 'text', text: message }],
        }),
      })
      if (res.ok) {
        okCount++
      } else {
        failCount++
        console.error('LINE broadcast failed for', profile.line_user_id, await res.text())
      }
      // Small delay to respect rate limits
      await new Promise((r) => setTimeout(r, 50))
    }

    return NextResponse.json({ ok: okCount, fail: failCount })
  } catch (err) {
    console.error('Broadcast error:', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
