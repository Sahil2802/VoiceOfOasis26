## Run the demo

Requirements: Node.js 20+ and an ElevenLabs API key.

```bash
git clone <our-repo-url>
cd <our-repo>/voice-kit
npm install
```

Create the env file and add your key:

```bash
# Windows (Command Prompt)
copy .env.example .env.local

# Mac / Linux
cp .env.example .env.local
```

Open `.env.local` and set:

```
ELEVENLABS_API_KEY=sk_your_key_here
```

Start the app:

```bash
npm run dev -w apps/demo
```

Open http://localhost:3005, click start, allow the microphone, and say "Hello" or "مرحبا".

Optional checks:

```bash
npm test                                        # library unit tests
curl "http://localhost:3005/api/token?preset=navigator"   # should return a token and an agentId
```