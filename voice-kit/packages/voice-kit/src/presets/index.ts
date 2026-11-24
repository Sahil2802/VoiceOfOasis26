import { assistant } from './assistant.js'
import { ghostNavigator } from './ghost-navigator.js'
import { hala } from './hala.js'
import { navigator } from './navigator.js'
import { softLanding } from './soft-landing.js'
import type { ResolvedPreset } from './types.js'

export const presets: Record<string, ResolvedPreset> = {
  navigator, 'ghost-navigator': ghostNavigator(), 'soft-landing': softLanding, hala, assistant
}

export const getPreset = (id: string): ResolvedPreset | undefined =>
  Object.hasOwn(presets, id) ? presets[id] : undefined

export { definePreset } from './define.js'
export { buildAgentConfig, agentName, agentTag } from './build.js'
export * from './tool-specs.js'
export type { VoicePreset, ResolvedPreset } from './types.js'
export { ghostNavigator } from './ghost-navigator.js'
export { assistant, hala, navigator, softLanding }
