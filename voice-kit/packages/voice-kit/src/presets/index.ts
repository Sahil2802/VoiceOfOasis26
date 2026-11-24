import { assistant } from './assistant.js'
import { ghostNavigator } from './ghost-navigator.js'
import { hala } from './hala.js'
import { navigator } from './navigator.js'
import { softLanding } from './soft-landing.js'
import type { ResolvedPreset } from './types.js'

// Reads RECEPTION_URL / RECEPTION_SECRET at import; set them before provisioning the agent.
const ghost = ghostNavigator({ receptionUrl: process.env.RECEPTION_URL ?? 'http://localhost:3005/api/reception/ask', secret: process.env.RECEPTION_SECRET })

export const presets: Record<string, ResolvedPreset> = {
  navigator, 'ghost-navigator': ghost, 'soft-landing': softLanding, hala, assistant
}

export const getPreset = (id: string): ResolvedPreset | undefined =>
  Object.hasOwn(presets, id) ? presets[id] : undefined

export { definePreset } from './define.js'
export { buildAgentConfig, agentName, agentTag } from './build.js'
export * from './tool-specs.js'
export type { VoicePreset, ResolvedPreset } from './types.js'
export { ghostNavigator } from './ghost-navigator.js'
export { assistant, hala, navigator, softLanding }
