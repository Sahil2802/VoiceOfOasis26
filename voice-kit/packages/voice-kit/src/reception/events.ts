export interface RobotEvent { seq: number, stop: string, finished: boolean }

/** In-memory operator -> robot event log (robot polls since(seq)). ponytail: single process, capped at `max`. */
export function createRobotEvents (max = 100) {
  const log: RobotEvent[] = []
  let seq = 0

  const push = (stop: string, finished = false): RobotEvent => {
    const ev = { seq: ++seq, stop, finished }
    log.push(ev)
    if (log.length > max) log.shift()
    return ev
  }
  const since = (after: number) => ({ seq, events: log.filter((e) => e.seq > after) })
  return { push, since }
}

export type RobotEvents = ReturnType<typeof createRobotEvents>
