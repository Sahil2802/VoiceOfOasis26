import { randomUUID } from 'node:crypto'

export interface Ticket { id: string, question: string, language: string, createdAt: number }
export type Answer = { answer: string }
export const NO_ANSWER = 'none yet'

interface Waiter { ticket: Ticket, done: (a: Answer) => void }

/** In-memory receptionist queue. ponytail: single process only; use a shared store to scale out. */
export function createReception ({ waitMs = 25000 }: { waitMs?: number } = {}) {
  const waiting = new Map<string, Waiter>()

  function ask (question: string, language: string, ttlMs = waitMs): Promise<Answer> {
    const ticket: Ticket = { id: randomUUID(), question, language, createdAt: Date.now() }
    return new Promise((resolve) => {
      const timer = setTimeout(() => { waiting.delete(ticket.id); resolve({ answer: NO_ANSWER }) }, ttlMs)
      waiting.set(ticket.id, { ticket, done: (a) => { clearTimeout(timer); resolve(a) } })
    })
  }

  function reply (id: string, answer: string): boolean {
    const w = waiting.get(id)
    if (!w) return false
    waiting.delete(id)
    w.done({ answer })
    return true
  }

  const pending = (): Ticket[] => [...waiting.values()].map((w) => w.ticket)
  return { ask, reply, pending }
}

export type Reception = ReturnType<typeof createReception>
