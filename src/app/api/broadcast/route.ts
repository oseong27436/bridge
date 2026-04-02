import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { message, imageUrls, targetType, eventId } = await request.json()
    if (!message?.trim()) return NextResponse.json({ ok: false }, { status: 400 })

    if (!process.env.LINE_MESSAGING_ACCESS_TOKEN) {
      return NextResponse.json({ ok: 0, fail: 0, error: 'LINE_MESSAGING_ACCESS_TOKEN not set' }, { status: 500 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    let lineUserIds: string[] = []

    if (targetType === 'event' && eventId) {
      // LINE-connected users who registered for the event (not cancelled/rejected)
      const { data: regs } = await supabase
        .from('bridge_registrations')
        .select('user_id')
        .eq('event_id', eventId)
        .in('status', ['pending', 'approved', 'attended'])

      if (!regs?.length) return NextResponse.json({ ok: 0, fail: 0 })

      const userIds = regs.map((r: { user_id: string }) => r.user_id)
      const { data: profiles } = await supabase
        .from('bridge_profiles')
        .select('line_user_id')
        .in('id', userIds)
        .not('line_user_id', 'is', null)

      lineUserIds = (profiles ?? []).map((p: { line_user_id: string }) => p.line_user_id)
    } else {
      // All LINE-connected users
      const { data: profiles } = await supabase
        .from('bridge_profiles')
        .select('line_user_id')
        .not('line_user_id', 'is', null)

      lineUserIds = (profiles ?? []).map((p: { line_user_id: string }) => p.line_user_id)
    }

    if (!lineUserIds.length) return NextResponse.json({ ok: 0, fail: 0 })

    // Build messages array (images first, then text)
    const images = Array.isArray(imageUrls) ? imageUrls.filter(Boolean) : []
    const messages: object[] = [
      ...images.slice(0, 4).map((url: string) => ({
        type: 'image',
        originalContentUrl: url,
        previewImageUrl: url,
      })),
      { type: 'text', text: message },
    ]

    let okCount = 0
    let failCount = 0

    for (const lineUserId of lineUserIds) {
      const res = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.LINE_MESSAGING_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to: lineUserId, messages }),
      })
      if (res.ok) {
        okCount++
      } else {
        failCount++
        console.error('LINE broadcast failed for', lineUserId, await res.text())
      }
      await new Promise((r) => setTimeout(r, 50))
    }

    return NextResponse.json({ ok: okCount, fail: failCount })
  } catch (err) {
    console.error('Broadcast error:', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
