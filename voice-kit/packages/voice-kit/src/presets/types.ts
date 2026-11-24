import type { Lang } from '../languages.js'
import type { ClientToolSpec } from '../tools/define.js'

export interface VoicePreset {
  id: string
  name: string
  description: string
  languages: Lang[]
  firstMessage: Partial<Record<Lang, string>>
  /** Short opening line for multilingual agents (defaults to every first message joined). */
  greeting?: string
  systemPrompt: string
  knowledge?: string[]
  tools?: ClientToolSpec[]
  voiceId?: string
  llm?: string
  maxDurationSeconds?: number
  /** Replaces the default "Voice rules" block appended to the prompt (e.g. for a chattier agent). */
  voiceRules?: string
  /** Cap on LLM output tokens per reply. Unset leaves ElevenLabs' default (no cap). */
  maxTokens?: number
}

type Optional = 'voiceId' | 'llm' | 'greeting' | 'voiceRules' | 'maxTokens'
export type ResolvedPreset = Required<Omit<VoicePreset, Optional>> & Pick<VoicePreset, Optional>
