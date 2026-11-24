/** Create/update the Ghost Navigator agents (web + robot). Needs only ELEVENLABS_API_KEY.
 *  Run: npx tsx --env-file=../.env.local provision-ghost.mts */
import { createVoiceKit, presets } from '../packages/voice-kit/src/index.js'

const kit = createVoiceKit()
const ghost = presets['ghost-navigator']
console.log(`AGENT_ID_GHOST_NAVIGATOR=${await kit.ensureAgent(ghost, 'web')}`)
console.log(`ROBOT_AGENT_ID=${await kit.ensureAgent(ghost, 'robot')}   <- give this to MangoBot`)
