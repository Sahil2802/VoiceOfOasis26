import { AgentConsole } from '@/components/AgentConsole'
import { getChallenge } from '@/lib/challenges'

/** Robot screen: Noor's eyes full-screen; the console sits behind a toggle. */
export default function Home () {
  return <AgentConsole challenge={getChallenge('ghost-navigator')!} />
}
