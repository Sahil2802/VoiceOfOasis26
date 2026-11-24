import 'server-only'
import { createReception, type Reception } from '@workhub/voice-kit/next'

const g = globalThis as unknown as { __reception?: Reception }
/** One shared queue per process (survives dev hot reloads). Needs a single long-running server, not serverless. */
export const reception = (g.__reception ??= createReception())

/** If RECEPTION_SECRET is set, every reception call must send it as x-reception-secret. */
export const unauthorized = (req: Request): Response | undefined => {
  const secret = process.env.RECEPTION_SECRET
  if (!secret || req.headers.get('x-reception-secret') === secret) return undefined
  return Response.json({ error: 'unauthorized' }, { status: 401 })
}
