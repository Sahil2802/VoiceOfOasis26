'use client'
import { useVoiceAgent, VoiceKitProvider } from '@workhub/voice-kit/react'
import { useEffect, useRef, useState } from 'react'
import type { Challenge } from '@/lib/challenges'
import { EventCard } from './EventCard'
import { Wave } from './Wave'

const WANDER_MS = 2500
const WANDER_RANGE = 40 // % of pupil size
const HOLD_GAZE = { x: 20, y: -35 } // looks up and aside while "thinking"

function Controls ({ agent, error }: { agent: ReturnType<typeof useVoiceAgent>, error: string }) {
  const live = agent.status === 'connected'
  return (
    <div className='card'>
      <div className='row'><span className={`tag ${live ? 'live' : ''}`}>● {agent.status}</span>{agent.onHold && <span className='tag hold'>♪ on hold — researching</span>}</div>
      <Wave on={live && (agent.isSpeaking || agent.onHold)} />
      <div className='row'>
        {!live && <button className='btn solid' onClick={agent.start} disabled={agent.status === 'connecting'}>▶ start talking</button>}
        {live && <button className='btn stop' onClick={agent.stop}>■ end</button>}
      </div>
      {error && <p style={{ color: 'var(--red)' }}>{error}</p>}
      <p className='dim' style={{ fontSize: 12 }}>Mic required. Speak English or Arabic and switch any time.</p>
    </div>
  )
}

function Transcript ({ lines }: { lines: Array<{ role: string, text: string }> }) {
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }) }, [lines.length])
  return (
    <div className='card transcript'>
      {!lines.length && <p className='dim prompt'>waiting for conversation…</p>}
      {lines.map((l, i) => (
        <div key={i} className={`line ${l.role}`} dir='auto'><span className='who'>{l.role}</span>{l.text}</div>
      ))}
      <div ref={end} />
    </div>
  )
}

/** Idle pupils drift to a random spot every few seconds; on hold they look up as if thinking. */
function useGaze (onHold: boolean) {
  const [gaze, setGaze] = useState({ x: 0, y: 0 })
  useEffect(() => {
    if (onHold) { setGaze(HOLD_GAZE); return }
    const wander = () => setGaze({ x: (Math.random() * 2 - 1) * WANDER_RANGE, y: (Math.random() * 2 - 1) * WANDER_RANGE * 0.6 })
    const timer = setInterval(wander, WANDER_MS)
    return () => clearInterval(timer)
  }, [onHold])
  return gaze
}

function Eyes ({ live, talking, onHold, onTap }: { live: boolean, talking: boolean, onHold: boolean, onTap: () => void }) {
  const gaze = useGaze(onHold)
  const style = { '--x': `${gaze.x}%`, '--y': `${gaze.y}%` } as React.CSSProperties
  return (
    <button className={`face ${talking ? 'talk' : ''}`} style={style} onClick={onTap} aria-label={live ? 'Noor eyes, tap to hang up' : 'Noor eyes, tap to talk'}>
      <span className='eye'><span className='pupil' /></span>
      <span className='eye'><span className='pupil' /></span>
    </button>
  )
}

function Console ({ challenge }: { challenge: Challenge }) {
  const agent = useVoiceAgent({ preset: challenge.id })
  const [error, setError] = useState('')
  const [panel, setPanel] = useState(false)
  const live = agent.status === 'connected'
  const start = () => { setError(''); agent.start().catch((e: Error) => { setError(e.message); setPanel(true) }) }
  const tap = () => { if (live) void agent.stop(); else if (agent.status !== 'connecting') start() }
  return (
    <>
      <Eyes live={live} talking={live && agent.isSpeaking} onHold={agent.onHold} onTap={tap} />
      <button className='btn panel-toggle' onClick={() => setPanel(!panel)}>{panel ? '✕ hide panel' : '☰ show panel'}</button>
      {panel && (
        <div className='panel'>
          <h1 style={{ fontSize: 32 }}>{challenge.title}</h1>
          <p className='dim'>{challenge.pitch}</p>
          <div className='console'>
            <div>
              <Controls agent={{ ...agent, start } as never} error={error} />
              <div className='card' style={{ marginTop: 16 }}>
                <h3 style={{ fontSize: 14 }} className='prompt'>try saying</h3>
                {challenge.trySaying.map((t) => <p key={t} dir='auto' className='dim'>“{t}”</p>)}
              </div>
            </div>
            <Transcript lines={agent.lines} />
            <div className='card'>
              <h3 style={{ fontSize: 14 }} className='prompt'>tool calls</h3>
              {!agent.events.length && <p className='dim'>Noor is voice-only, so this normally stays empty.</p>}
              {agent.events.map((e, i) => <EventCard key={i} event={e} />)}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export function AgentConsole ({ challenge }: { challenge: Challenge }) {
  return <VoiceKitProvider><Console challenge={challenge} /></VoiceKitProvider>
}
