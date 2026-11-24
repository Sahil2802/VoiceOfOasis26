import { describe, expect, it } from 'vitest'
import { createReception } from '../src/reception/tickets.js'
import { createRobotEvents } from '../src/reception/events.js'

describe('robot events', () => {
  it('since(after) returns only newer events and the current seq', () => {
    const e = createRobotEvents()
    e.push('Lobby')
    e.push('Techno Point', true)
    expect(e.since(0).events.map((x) => x.stop)).toEqual(['Lobby', 'Techno Point'])
    expect(e.since(1)).toEqual({ seq: 2, events: [{ seq: 2, stop: 'Techno Point', finished: true }] })
    expect(e.since(2).events).toEqual([])
  })

  it('keeps only the last `max` events', () => {
    const e = createRobotEvents(2)
    ;['a', 'b', 'c'].forEach((s) => e.push(s))
    expect(e.since(0).events.map((x) => x.stop)).toEqual(['b', 'c'])
  })
})

describe('reception tickets', () => {
  it('ask() resolves with the answer once reply() is called', async () => {
    const r = createReception({ waitMs: 1000 })
    const pending = r.ask('Where is the mosque?', 'en')
    const [t] = r.pending()
    expect(t.question).toBe('Where is the mosque?')
    expect(r.reply(t.id, 'Techno Point, ground floor')).toBe(true)
    expect(await pending).toEqual({ answer: 'Techno Point, ground floor' })
    expect(r.pending()).toEqual([])
  })

  it('ask() returns "none yet" after the wait and drops the ticket', async () => {
    const r = createReception({ waitMs: 20 })
    expect(await r.ask('Where?', 'ar')).toEqual({ answer: 'none yet' })
    expect(r.pending()).toEqual([])
  })

  it('reply() on an unknown or expired ticket returns false', async () => {
    const r = createReception({ waitMs: 10 })
    await r.ask('Where?', 'en')
    expect(r.reply('nope', 'x')).toBe(false)
  })

  it('reply() cannot answer the same ticket twice', async () => {
    const r = createReception({ waitMs: 1000 })
    const p = r.ask('Q', 'en')
    const [t] = r.pending()
    expect(r.reply(t.id, 'a')).toBe(true)
    expect(r.reply(t.id, 'b')).toBe(false)
    expect(await p).toEqual({ answer: 'a' })
  })
})
