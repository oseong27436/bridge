import { NextResponse } from 'next/server'

const LINE_API = 'https://api.line.me/v2/bot'
const LINE_DATA_API = 'https://api-data.line.me/v2/bot'

function authHeader() {
  return { Authorization: `Bearer ${process.env.LINE_MESSAGING_ACCESS_TOKEN!}` }
}

export async function GET() {
  const res = await fetch(`${LINE_API}/richmenu/list`, { headers: authHeader() })
  const data = await res.json()
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const { chatBarText, areas, reuseImageFromId, imageDataUrl } = await req.json()

  // 1. Create rich menu
  const body = {
    size: { width: 1600, height: 910 },
    selected: true,
    name: chatBarText,
    chatBarText,
    areas,
  }
  const createRes = await fetch(`${LINE_API}/richmenu`, {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!createRes.ok) {
    const err = await createRes.text()
    return NextResponse.json({ ok: false, error: err }, { status: 400 })
  }
  const { richMenuId } = await createRes.json()

  // 2. Upload image
  if (imageDataUrl) {
    const base64 = imageDataUrl.split(',')[1]
    const imageBuffer = Buffer.from(base64, 'base64')
    const mime = imageDataUrl.split(';')[0].split(':')[1] || 'image/jpeg'
    await fetch(`${LINE_DATA_API}/richmenu/${richMenuId}/content`, {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': mime },
      body: imageBuffer,
    })
  } else if (reuseImageFromId) {
    const imgRes = await fetch(`${LINE_DATA_API}/richmenu/${reuseImageFromId}/content`, {
      headers: authHeader(),
    })
    if (imgRes.ok) {
      const imgBuffer = await imgRes.arrayBuffer()
      const contentType = imgRes.headers.get('content-type') || 'image/jpeg'
      await fetch(`${LINE_DATA_API}/richmenu/${richMenuId}/content`, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': contentType },
        body: imgBuffer,
      })
    }
  }

  // 3. Set as default
  await fetch(`${LINE_API}/user/all/richmenu/${richMenuId}`, {
    method: 'POST',
    headers: authHeader(),
  })

  // 4. Delete old menu
  if (reuseImageFromId) {
    await fetch(`${LINE_API}/richmenu/${reuseImageFromId}`, {
      method: 'DELETE',
      headers: authHeader(),
    })
  }

  return NextResponse.json({ ok: true, richMenuId })
}

export async function DELETE(req: Request) {
  const { richMenuId } = await req.json()
  const res = await fetch(`${LINE_API}/richmenu/${richMenuId}`, {
    method: 'DELETE',
    headers: authHeader(),
  })
  return NextResponse.json({ ok: res.ok })
}
