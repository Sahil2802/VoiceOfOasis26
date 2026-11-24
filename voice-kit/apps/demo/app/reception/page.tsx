'use client'
import { useEffect, useRef, useState } from 'react'

interface Ticket { id: string, question: string, language: string }

const chime = () => {
  const ctx = new AudioContext()
  const osc = ctx.createOscillator()
  osc.connect(ctx.destination)
  osc.frequency.value = 880
  osc.start()
  osc.stop(ctx.currentTime + 0.25)
}

/** Receptionist console: open as /reception?key=<RECEPTION_SECRET>. */
export default function ReceptionPage () {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const seen = useRef(new Set<string>())
  const key = useRef('')

  const call = (path: string, init?: RequestInit) =>
    fetch(`/api/reception/${path}`, { ...init, headers: { 'content-type': 'application/json', 'x-reception-secret': key.current } })

  useEffect(() => {
    key.current = new URLSearchParams(location.search).get('key') ?? ''
    const poll = async () => {
      try {
        const res = await call('pending')
        if (!res.ok) throw new Error(res.status === 401 ? 'Wrong or missing ?key=' : `Error ${res.status}`)
        const { tickets: next } = await res.json() as { tickets: Ticket[] }
        if (next.some((t) => !seen.current.has(t.id))) chime()
        next.forEach((t) => seen.current.add(t.id))
        setTickets(next); setError('')
      } catch (e) { setError((e as Error).message) }
    }
    void poll()
    const timer = setInterval(poll, 1000)
    return () => clearInterval(timer)
  }, [])

  const send = async (id: string) => {
    const answer = drafts[id]?.trim()
    if (!answer) return
    const res = await call('reply', { method: 'POST', body: JSON.stringify({ id, answer }) })
    if (!res.ok) setError('Too late: the visitor already heard "none yet".')
    setTickets((all) => all.filter((t) => t.id !== id))
  }

  return (
    <>
      <h1 style={{ fontSize: 40 }}>Reception</h1>
      {error && <p style={{ color: 'var(--red)' }}>{error}</p>}
      {!tickets.length && <p className='dim'>No visitors waiting.</p>}
      {tickets.map((t) => (
        <div key={t.id} className='card'>
          <p dir='auto'><span className='tag'>{t.language}</span> {t.question}</p>
          <div className='row'>
            <input value={drafts[t.id] ?? ''} onChange={(e) => setDrafts({ ...drafts, [t.id]: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && void send(t.id)} placeholder='Type the directions' style={{ flex: 1 }} dir='auto' />
            <button className='btn solid' onClick={() => void send(t.id)}>Send</button>
          </div>
        </div>
      ))}
    </>
  )
}
