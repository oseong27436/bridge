import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bridge-green-theta.vercel.app'

const DEFAULT_TEMPLATE =
  '🙏 本日はBridgeイベント「{eventTitle}」にご参加いただきありがとうございました！\n\n' +
  'ぜひ感想をポストイットに残してください 📝\n{reviewUrl}\n\n' +
  '---\n\n' +
  '🙏 오늘 Bridge 이벤트 「{eventTitle}」에 참가해 주셔서 감사합니다!\n\n' +
  '포스트잇으로 후기를 남겨주세요 📝\n{reviewUrl}'

export async function GET(req: Request) {
  // Verify cron secret (Vercel sets this automatically)
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Find events that ended within the last 30 minutes
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const nowTime = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`
  // window: 30 min ago ~ now
  const windowStart = new Date(now.getTime() - 30 * 60 * 1000)
  const windowStartTime = `${String(windowStart.getUTCHours()).padStart(2, '0')}:${String(windowStart.getUTCMinutes()).padStart(2, '0')}`

  const { data: events } = await supabase
    .from('bridge_events')
    .select('id, title_ja, title_ko, title_en, time_end')
    .eq('date', todayStr)
    .eq('status', 'published')
    .gte('time_end', windowStartTime)
    .lte('time_end', nowTime)

  if (!events?.length) {
    return NextResponse.json({ ok: true, sent: 0, message: 'No events ending in window' })
  }

  // Fetch template from DB
  let template = DEFAULT_TEMPLATE
  const { data: tmpl } = await supabase
    .from('bridge_line_templates')
    .select('body')
    .eq('action', 'review')
    .eq('lang', 'all')
    .maybeSingle()
  if (tmpl?.body) template = tmpl.body

  let totalSent = 0

  for (const event of events) {
    // Get confirmed/attended registrants with LINE
    const { data: regs } = await supabase
      .from('bridge_registrations')
      .select('user_id')
      .eq('event_id', event.id)
      .in('status', ['confirmed', 'approved', 'attended'])

    if (!regs?.length) continue

    const userIds = regs.map((r: { user_id: string }) => r.user_id)
    const { data: profiles } = await supabase
      .from('bridge_profiles')
      .select('line_user_id')
      .in('id', userIds)
      .not('line_user_id', 'is', null)

    if (!profiles?.length) continue

    const eventTitle = event.title_ja || event.title_ko || event.title_en || ''
    const reviewUrl = `${SITE_URL}/my/reservations`
    const text = template
      .replaceAll('{eventTitle}', eventTitle)
      .replaceAll('{reviewUrl}', reviewUrl)

    for (const profile of profiles) {
      if (!profile.line_user_id) continue
      await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.LINE_MESSAGING_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: profile.line_user_id,
          messages: [{ type: 'text', text }],
        }),
      })
      totalSent++
    }
  }

  return NextResponse.json({ ok: true, sent: totalSent, events: events.length })
}
