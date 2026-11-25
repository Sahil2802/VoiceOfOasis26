import { describe, expect, it } from 'vitest'
import { buildAgentConfig, definePreset, getPreset, presets } from '../src/presets/index.js'
import { pickTtsModel } from '../src/languages.js'

describe('pickTtsModel', () => {
  it('uses the English-only flash model for English, multilingual otherwise', () => {
    expect(pickTtsModel(['en'])).toBe('eleven_flash_v2')
    expect(pickTtsModel(['en', 'ar'])).toBe('eleven_flash_v2_5')
  })
})

describe('definePreset', () => {
  it('requires a first message for every language', () => {
    expect(() =>
      definePreset({ id: 'x', name: 'X', description: 'd', languages: ['en', 'ar'], firstMessage: { en: 'Hi' }, systemPrompt: 'p' })
    ).toThrow(/ar/)
  })
})

describe('built-in presets', () => {
  it('ships the three hackathon challenges plus a generic assistant', () => {
    expect(Object.keys(presets).sort()).toEqual(['assistant', 'ghost-navigator', 'hala', 'navigator', 'soft-landing'])
    expect(getPreset('nope')).toBeUndefined()
  })

  it.each(['navigator', 'soft-landing', 'hala'])('%s is bilingual EN/AR with tools', (id) => {
    const preset = getPreset(id)!
    expect(preset.languages).toEqual(['en', 'ar'])
    expect(preset.tools.length).toBeGreaterThan(0)
    expect(preset.tools.map((t) => t.name)).toContain('handover_to_human')
  })
})

describe('buildAgentConfig', () => {
  const config = buildAgentConfig(getPreset('hala')!)

  it('names and tags the agent so it can be found again', () => {
    expect(config.name).toBe('voice-kit · HALA Concierge')
    expect(config.tags).toContain('voice-kit:hala')
  })

  it('makes bilingual agents multilingual-primary so Arabic is never spoken by the English-only model', () => {
    const cc = config.conversationConfig
    expect(cc.agent?.language).toBe('ar')
    expect(cc.tts?.modelId).toBe('eleven_flash_v2_5')
    expect(cc.languagePresets?.en?.overrides.agent?.language).toBe('en')
    expect(cc.agent?.firstMessage).toMatch(/Welcome to HALA/)
    expect(cc.agent?.firstMessage?.length).toBeLessThan(90)
    expect(cc.agent?.firstMessage).toMatch(/[\u0600-\u06FF]/)
    expect(cc.agent?.prompt?.builtInTools?.languageDetection).toBeDefined()
    expect(cc.agent?.prompt?.builtInTools?.endCall).toBeDefined()
  })

  it('keeps English-only agents on the fast English model', () => {
    const en = buildAgentConfig(definePreset({ id: 'e', name: 'E', description: 'd', languages: ['en'], firstMessage: { en: 'Hi' }, systemPrompt: 'p' }))
    expect(en.conversationConfig.agent?.language).toBe('en')
    expect(en.conversationConfig.tts?.modelId).toBe('eleven_flash_v2')
    expect(en.conversationConfig.agent?.firstMessage).toBe('Hi')
  })

  it('embeds knowledge into the prompt and caps conversation length', () => {
    expect(config.conversationConfig.agent?.prompt?.prompt).toContain('600 59 55 57')
    expect(config.conversationConfig.conversation?.maxDurationSeconds).toBe(300)
    expect(config.conversationConfig.agent?.prompt?.prompt).toMatch(/language_detection/)
    expect(config.conversationConfig.agent?.prompt?.llm).not.toMatch(/^gpt/)
  })

  it('declares every preset tool as a client tool', () => {
    const tools = config.conversationConfig.agent?.prompt?.tools ?? []
    expect(tools.every((t) => t.type === 'client')).toBe(true)
    expect(tools.map((t) => (t as { name: string }).name)).toContain('book_appointment')
    const research = tools.find((t) => (t as { name: string }).name === 'research_fact') as { responseTimeoutSecs: number, forcePreToolSpeech: boolean }
    expect(research.responseTimeoutSecs).toBe(30)
    expect(research.forcePreToolSpeech).toBe(true)
  })
})

describe('forChannel', async () => {
  const { forChannel } = await import('../src/server/agents.js')
  const body = buildAgentConfig(getPreset('hala')!)

  it('phone variant uses 8 kHz μ-law both ways', () => {
    const phone = forChannel(body, 'phone')
    expect(phone.name).toBe('voice-kit · HALA Concierge (phone)')
    expect((phone.conversationConfig.tts as { agentOutputAudioFormat?: string }).agentOutputAudioFormat).toBe('ulaw_8000')
  })

  it('avatar variant drops browser tools but keeps system tools', () => {
    const avatar = forChannel(body, 'avatar')
    expect(avatar.name).toBe('voice-kit · HALA Concierge (avatar)')
    expect(avatar.conversationConfig.agent?.prompt?.tools).toEqual([])
    expect(avatar.conversationConfig.agent?.prompt?.builtInTools?.languageDetection).toBeDefined()
    expect(avatar.conversationConfig.agent?.prompt?.prompt).toMatch(/cannot book/i)
    // LiveAvatar rejects anything but 24 kHz PCM (API error 4000)
    expect((avatar.conversationConfig.tts as { agentOutputAudioFormat?: string }).agentOutputAudioFormat).toBe('pcm_24000')
    expect((avatar.conversationConfig as { asr?: { userInputAudioFormat?: string } }).asr?.userInputAudioFormat).toBe('pcm_24000')
  })
})

describe('robot channel + webhook tools', async () => {
  const { forChannel } = await import('../src/server/agents.js')
  const { ghostNavigator } = await import('../src/presets/ghost-navigator.js')
  const preset = ghostNavigator()
  const body = buildAgentConfig(preset)

  it('robot variant uses PCM 16 kHz both ways and its own agent name', () => {
    const robot = forChannel(body, 'robot')
    expect(robot.name).toMatch(/\(robot\)$/)
    expect((robot.conversationConfig.tts as { agentOutputAudioFormat?: string }).agentOutputAudioFormat).toBe('pcm_16000')
    expect(((robot.conversationConfig as Record<string, any>).asr as { userInputAudioFormat?: string }).userInputAudioFormat).toBe('pcm_16000')
  })

  it('ghost-navigator is pure voice: no tools, so nothing to wire on the robot', () => {
    expect(body.conversationConfig.agent.prompt.tools).toEqual([])
  })

  it('speaks English, Arabic and Hindi, says AI in every greeting and lasts 900 s', () => {
    expect(preset.languages).toEqual(['en', 'ar', 'hi'])
    expect(preset.firstMessage.en).toMatch(/AI/)
    expect(preset.firstMessage.hi).toMatch(/AI/)
    expect(preset.firstMessage.hi).toMatch(/[ऀ-ॿ]/)
    expect(body.conversationConfig.agent.language).toBe('ar')
    expect(Object.keys(body.conversationConfig.languagePresets)).toEqual(['en', 'hi'])
    expect(preset.systemPrompt).toMatch(/Hindi/)
    expect(body.conversationConfig.agent.prompt.prompt).toMatch(/Urdu words written in Arabic letters/)
    expect(preset.greeting).toMatch(/AI/)
    expect(preset.maxDurationSeconds).toBe(900)
    expect(preset.systemPrompt).toMatch(/Never say "follow me"/)
  })

  it('is quick by default: own voice rules replace the default, short replies, capped output', () => {
    const text = body.conversationConfig.agent.prompt.prompt
    expect(text).toMatch(/one sentence, two at most/)
    expect(text).not.toMatch(/3 to 5 sentences/)
    expect(text).not.toMatch(/1-2 sentences\)/)
    expect(body.conversationConfig.agent.prompt).toMatchObject({ maxTokens: 512 })
    expect(text).toMatch(/humanoid/)
    expect(text).not.toMatch(/wheels/)
  })

  it('fills the wait for the operator with sourced "Did you know" DSO facts on silence', () => {
    const text = body.conversationConfig.agent.prompt.prompt
    expect(preset.knowledge.length).toBeGreaterThanOrEqual(8)
    expect(text).toContain('# Knowledge')
    expect(text).toMatch(/Did you know/)
    expect(text).toMatch(/"\.\.\."/)
    expect(text).toMatch(/never repeat a fact/i)
  })

  it('opens with a short greeting', () => {
    expect(preset.firstMessage.en!.split(/[.?!]/).filter(Boolean).length).toBeLessThanOrEqual(2)
  })

  it('addresses one person per message and tells speakers apart by tag or context', () => {
    expect(preset.systemPrompt).toMatch(/exactly ONE/)
    expect(preset.systemPrompt).toMatch(/Never address two people in one message/)
    for (const tag of ['[visitor]', '[operator]', '[staff]', '[ROBOT EVENT]']) expect(preset.systemPrompt).toContain(tag)
    expect(preset.systemPrompt).toMatch(/person you addressed last/)
  })

  it('asks the operator by voice, then staff, and never guesses a location', () => {
    expect(preset.systemPrompt).toMatch(/Operator, please take us to the nearest reception or staff member/)
    expect(preset.systemPrompt).toMatch(/never guess where anything is/)
    expect(preset.systemPrompt).toMatch(/Only repeat what staff told you/)
  })

  it('other presets keep the default voice rules and have no token cap', () => {
    const hala = buildAgentConfig(getPreset('hala')!).conversationConfig.agent.prompt
    expect(hala.prompt).toMatch(/Short answers first \(1-2 sentences\)/)
    expect(hala).not.toHaveProperty('maxTokens')
  })
})

describe('webhook tools', () => {
  it('serialise with the secret header, timeout and body schema', async () => {
    const { defineClientTool, toElevenTool } = await import('../src/tools/define.js')
    const tool = toElevenTool(defineClientTool({
      name: 'ping', description: 'd', params: { q: { type: 'string', description: 'q' } }, timeoutSecs: 10, speakFirst: true,
      webhook: { url: 'https://r.example/x', headers: { 'x-s': '1' } }
    }) as never)
    expect(tool).toMatchObject({ type: 'webhook', name: 'ping', responseTimeoutSecs: 10, preToolSpeech: 'force' })
    expect(tool.apiSchema).toMatchObject({ url: 'https://r.example/x', method: 'POST', requestHeaders: { 'x-s': '1' } })
  })
})
