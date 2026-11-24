import { timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import { robotEvents, unauthorized } from '@/lib/reception'

export const dynamic = 'force-dynamic'

/** Robot polls GET /robot/events?after=N&k=<ROBOT_TOKEN>. Operator posts {stop, finished} with x-reception-secret. */
const tokenOk = (given: string | null) => {
  const want = process.env.ROBOT_TOKEN
  if (!want || given === null || given.length !== want.length) return false
  return timingSafeEqual(Buffer.from(given), Buffer.from(want))
}

export function GET (req: Request) {
  const q = new URL(req.url).searchParams
  if (!tokenOk(q.get('k'))) return Response.json({ error: 'unauthorized' }, { status: 401 })
  return Response.json(robotEvents.since(Number(q.get('after')) || 0))
}

const body = z.object({ stop: z.string().trim().min(1).max(200), finished: z.boolean().default(false) })

export async function POST (req: Request) {
  const denied = unauthorized(req)
  if (denied) return denied
  const parsed = body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'stop required' }, { status: 400 })
  return Response.json(robotEvents.push(parsed.data.stop, parsed.data.finished))
}
