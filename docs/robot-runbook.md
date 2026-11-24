# Robot runbook (AgiBot X2, PC2)

## Before the slot (laptop)
1. Deploy `voice-kit` to Render (`ghost-protocol` service). Set env: `ELEVENLABS_API_KEY`, `RECEPTION_SECRET`,
   `ROBOT_TOKEN` (any long random string), `AGENT_ID_GHOST_NAVIGATOR`. Keep it at **one instance** (queues are in memory).
2. Provision the agent: `cd voice-kit && npx tsx --env-file=.env.local scripts/provision-ghost.mts`
   (needs `RECEPTION_URL=https://<render>/api/reception/ask`, `RECEPTION_SECRET`). It prints `ROBOT_AGENT_ID=...`.
3. Check the robot endpoint:
   `curl "https://<render>/robot/events?after=0&k=$ROBOT_TOKEN"` -> `{"seq":0,"events":[]}`
   Wrong token -> 401.
4. Copy `elevenlabs_robot_bridge.py ghost_bridge.py ghost_sdk.py ghost_actions.py ghost_events.py run_on_robot.sh`
   to `/home/agi/<team folder>` on PC2 (never PC1, 10.0.1.40; save only under `/home/agi`).

## On the robot
```bash
export ELEVENLABS_AGENT_ID=<ROBOT_AGENT_ID> ELEVENLABS_API_KEY=<key if private>
export GHOST_SERVER=https://<render> ROBOT_TOKEN=<same as Render>
export AIMDK_SETUP=<aimdk>/install/setup.bash
chmod +x run_on_robot.sh && ./run_on_robot.sh          # arms stay still
```
Say the wake word once, then talk. If the robot hears itself: `HALF_DUPLEX=1 ./run_on_robot.sh`.

## Checks
- Services exist: `ros2 service list | grep -E "SetMcPresetMotion|play_emoji|SetVolume|SetMicSourceRequest"`
  (`ghost_sdk.py` is untested on hardware; a missing service only disables that tool, audio keeps working).
- Operator tap: `curl -X POST https://<render>/robot/events -H "x-reception-secret: $RECEPTION_SECRET" -H "content-type: application/json" -d '{"stop":"Techno Point","finished":false}'`
  The bridge log should print `ghost: [ROBOT EVENT] ...` within ~1 s.
- Gestures: only `./run_on_robot.sh --gestures`, after MangoBot approves and the robot is in Stable Stand.
- Movement is never ours: no motion topics are published.
