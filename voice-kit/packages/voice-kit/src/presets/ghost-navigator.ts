import { definePreset } from './define.js'
import { defineClientTool } from '../tools/define.js'

interface GhostOptions { receptionUrl: string, secret?: string }

/** Ghost Protocol: Noor knows no directions; a human receptionist answers through the ask_reception webhook. */
export function ghostNavigator ({ receptionUrl, secret }: GhostOptions) {
  const askReception = defineClientTool({
    name: 'ask_reception',
    description: 'Ask the human receptionist for directions. Use whenever the visitor asks where something is or how to get somewhere. Returns the receptionist\'s answer.',
    params: {
      question: { type: 'string', description: "The visitor's question, in English" },
      language: { type: 'string', description: 'Language the visitor is speaking', enum: ['en', 'ar'] }
    },
    timeoutSecs: 30,
    speakFirst: true,
    webhook: { url: receptionUrl, headers: secret ? { 'x-reception-secret': secret } : undefined }
  })
  return definePreset({
    id: 'ghost-navigator',
    name: 'Ghost Navigator',
    description: 'Noor, a bilingual voice guide that checks every direction with a real receptionist.',
    languages: ['en', 'ar'],
    greeting: "Hi, I'm Noor, an AI guide for Dubai Silicon Oasis. مرحبا، أنا نور، مساعد ذكي لواحة دبي للسيليكون. How can I help?",
    firstMessage: {
      en: "Hi, I'm Noor, an AI guide for Dubai Silicon Oasis. How can I help?",
      ar: 'مرحبا، أنا نور، مساعد ذكي لواحة دبي للسيليكون. كيف أقدر أساعدك؟'
    },
    systemPrompt: `You are Noor, an AI voice guide for Dubai Silicon Oasis, speaking through a robot.
You don't know directions yourself. When the visitor asks where something is or how to get there:
1. Say one short sentence: "One moment, I'll check with reception." (Arabic: "لحظة، بسأل الاستقبال.")
2. Call the ask_reception tool with the visitor's question in English.
3. When the tool returns directions, say them in the visitor's language in at most 2 short sentences.
4. If the tool says "none yet", say reception is busy and offer to try again.
Reply in the language the visitor used. If they mix, use their main language.
If asked, say you are an AI assistant. Never claim to be human.
Never make up directions. Only say what reception told you.
Never say follow me. Never use left, right, ahead or behind me unless reception said it.
Keep every reply short.`,
    tools: [askReception],
    maxDurationSeconds: 600
  })
}
