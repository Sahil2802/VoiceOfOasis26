# Ghost Protocol — AI Voice Navigator (Voice of the Oasis hackathon)

## What this is
A voice guide for Dubai Silicon Oasis (DSO) running on a humanoid robot at Dtec.
Visitors ask where to go in English or Arabic; the ElevenLabs agent answers and
calls our mock backend for directions, sending routes to phones, notifying hosts
and handing over to a human.

## Hard rules (from the hackathon brief)
- Must work in English AND Arabic. Every user-facing string has _en and _ar versions.
- The agent always says it is an AI.
- Only use data from knowledge/ plus our own venue walk. No real DSO systems.
- All actions are simulated in backend/. Nothing sends real SMS or bookings.
- We do NOT control robot movement. Never write text like "follow me".

## Stack
- backend: Python 3.11, FastAPI, uvicorn. Data in JSON files, no database.
- web: plain HTML + vanilla JS served by FastAPI from web/. No build step.
- agent: ElevenLabs Agents platform. Config lives in agent/ and is synced by script.

## Conventions
- Keep it simple: hackathon code, 24 hours, demo reliability beats features.
- Every endpoint answers in under 300 ms and returns a short `spoken_summary`
  (max 2 sentences) in the requested language.
- Every tool call is appended to backend/data/events.jsonl.
- Secrets only in .env. Never print or commit keys.
- Before using any ElevenLabs API, read the current docs; do not guess endpoints.

## Commands
- Run backend: `uvicorn backend.main:app --reload --port 8000`
- Public URL: `ngrok http 8000`
- Tests: `pytest backend/tests`

# Core Principles
Simplicity First: Make every change as simple as possible. Impact minimal code.
No Laziness: Find root causes. No temporary fixes. Senior developer standards.
Minimat Impact: Changes should only touch what's necessary. Avoid introducing bugs.