import { reception, unauthorized } from '@/lib/reception'

export const dynamic = 'force-dynamic'

export const GET = (req: Request) => unauthorized(req) ?? Response.json({ tickets: reception.pending() })
