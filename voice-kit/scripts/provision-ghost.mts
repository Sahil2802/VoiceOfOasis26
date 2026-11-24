/** Create/update the Ghost Navigator agents (web + robot). Needs RECEPTION_URL (public .../api/reception/ask) and RECEPTION_SECRET.
 *  Run: npx tsx --env-file=../.env.local provision-ghost.mts */
import { createVoiceKit, presets } from '../packages/voice-kit/src/index.js'

if (!process.env.RECEPTION_URL) throw new Error('Set RECEPTION_URL to the deployed https://<host>/api/reception/ask')
const kit = createVoiceKit()
const ghost = presets['ghost-navigator']
console.log(`AGENT_ID_GHOST_NAVIGATOR=${await kit.ensureAgent(ghost, 'web')}`)
console.log(`ROBOT_AGENT_ID=${await kit.ensureAgent(ghost, 'robot')}   <- give this to MangoBot`)
