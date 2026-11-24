import { z } from 'zod'
import { reception, unauthorized } from '@/lib/reception'

export const dynamic = 'force-dynamic'
const body = z.object({ question: z.string().trim().min(1).max(500), language: z.string().max(8).default('en') })

export async function POST (req: Request) {
  const denied = unauthorized(req)
  if (denied) return denied
  const parsed = body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'question required' }, { status: 400 })
  return Response.json(await reception.ask(parsed.data.question, parsed.data.language))
}
