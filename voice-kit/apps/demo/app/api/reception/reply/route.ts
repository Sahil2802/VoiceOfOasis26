import { z } from 'zod'
import { reception, unauthorized } from '@/lib/reception'

export const dynamic = 'force-dynamic'
const body = z.object({ id: z.string().min(1), answer: z.string().trim().min(1).max(500) })

export async function POST (req: Request) {
  const denied = unauthorized(req)
  if (denied) return denied
  const parsed = body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'id and answer required' }, { status: 400 })
  const ok = reception.reply(parsed.data.id, parsed.data.answer)
  return Response.json({ ok }, { status: ok ? 200 : 404 })
}
