import { z } from 'zod'
import { reception, unauthorized } from '@/lib/reception'

export const dynamic = 'force-dynamic'
const OPERATOR_TICKET_MS = 120_000
const OPERATOR_NOTIFIED = 'The operator has been notified and will take the robot to the nearest staff member or reception.'
const body = z.object({ question: z.string().trim().min(1).max(500), language: z.string().max(8).default('en') })

export async function POST (req: Request) {
  const denied = unauthorized(req)
  if (denied) return denied
  const parsed = body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'question required' }, { status: 400 })
  // Help request for the operator: shows on the console for 2 min, the agent is told right away.
  void reception.ask(parsed.data.question, parsed.data.language, OPERATOR_TICKET_MS)
  return Response.json({ answer: OPERATOR_NOTIFIED })
}
