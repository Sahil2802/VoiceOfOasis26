# Robot runbook (AgiBot X2)

Based on the organisers' tested recipe (24.11, ElevenLabs agent talking on the robot without an engineer). The robot's user is
**shared by every team and by the robot's own software**: work only in your own folder, never `pip --user`, and put everything back when you leave.

## Before the slot (laptop)
1. Provision the agent (it needs only `ELEVENLABS_API_KEY`; the key must allow Conversational AI read + write):
   `cd voice-kit && npx tsx --env-file=.env.local scripts/provision-ghost.mts`. It prints `ROBOT_AGENT_ID=...`. Use that one on the robot.
   **Re-run this after every change to Noor's prompt** (`ghost-navigator.ts`): the robot keeps the old behaviour until you do. The ID stays the same.
   Check the knowledge base is attached to the **robot** agent too (web and robot are separate agents).
2. Optional, only for operator "Arrived" taps: deploy `voice-kit` (Render, one instance) with `RECEPTION_SECRET` and `ROBOT_TOKEN`, then
   `curl "https://<render>/robot/events?after=0&k=$ROBOT_TOKEN"` -> `{"seq":0,"events":[]}`. Without it Noor still works: the operator just says "Noor, we're at reception".

## Connect
- Cable: `ssh run@10.0.1.41` (cable addresses 10.0.1.40 / .41 / .42). Password is on the engineers' screen.
- Hall Wi-Fi (Mac): `dns-sd -B _agibot._tcp local`, then `dns-sd -L <name from the list> _agibot._tcp local` to find the robot's address.
- No Docker container: work on the host, in your own folder:
  `mkdir -p ~/<team>`, then from the laptop `scp elevenlabs_robot_bridge.py ghost_*.py run_on_robot.sh run@<robot>:~/<team>/`, then `cd ~/<team>`.

## Before you start (shared robot)
Run these in a shell on the robot (the three `export`s are the same ones `run_on_robot.sh` sets; the `ros2 service call`s need them):
```bash
source /opt/ros/humble/setup.bash
export PYTHONPATH=/agibot/software/common/local/lib/python3.10/dist-packages:$PYTHONPATH
export LD_LIBRARY_PATH=/agibot/software/common/lib:$LD_LIBRARY_PATH
export AMENT_PREFIX_PATH=/agibot/software/common:$AMENT_PREFIX_PATH

# switch off the built-in assistant ("Lumi") for your slot, otherwise it answers too
ros2 service call /aimdk_5Fmsgs/srv/SetAgentPropertiesRequest aimdk_msgs/srv/SetAgentPropertiesRequest "{contents: {properties: [{key: {value: 2}, value: only_voice}]}}"
aima em stop-app agent
aima em start-app agent

# loud room: volume was 72, 95 worked
ros2 service call /aimdk_5Fmsgs/srv/SetVolume aimdk_msgs/srv/SetVolume "{audio_volume: 95}"

# nobody else's bridge may be talking to the speaker
ros2 topic info -v --no-daemon /aima/hal/audio/playback
```

## Run
```bash
export ELEVENLABS_AGENT_ID=<ROBOT_AGENT_ID> ELEVENLABS_API_KEY=<key if private>
export GHOST_SERVER=https://<render> ROBOT_TOKEN=<same as Render>     # optional, operator taps
chmod +x run_on_robot.sh && ./run_on_robot.sh                          # arms stay still
```
- It uses the **raw microphone** (`/aima/hal/audio/capture`, no wake word) with `HALF_DUPLEX=1` (the raw mic has no echo cancellation).
  `RAW_MIC=0` goes back to the wake-word microphone.
- It installs `websocket-client` into `./pylib` only. numpy and AimDK 1.1.0 are already on the robot.
- Noor has no tools: the whole visit is spoken. In a text test use the tags `[visitor]`, `[operator]`, `[staff]`.

## Checks
- Log shows `ghost: raw microphone (no wake word)`. Speak and the agent answers without a wake word and without answering itself.
- `ros2 service list | grep -E "SetMcPresetMotion|play_emoji|SetVolume|SetMicSourceRequest"`: `ghost_sdk.py` was written for AimDK 1.0.0 docs and the robot has 1.1.0,
  so a missing service only disables that body action, audio keeps working.
- Operator tap (only with `GHOST_SERVER`): `curl -X POST https://<render>/robot/events -H "x-reception-secret: $RECEPTION_SECRET" -H "content-type: application/json" -d '{"stop":"Reception","finished":false}'`
  The log shows `ghost: [ROBOT EVENT] ...` within ~1 s and Noor asks the staff member.
- Gestures: only `./run_on_robot.sh --gestures`, after the engineers approve and the robot is in Stable Stand.
- Movement is never ours: no motion topics are published.

## Before you leave (put the robot back)
Stop the bridge with Ctrl+C, then:
```bash
ros2 service call /aimdk_5Fmsgs/srv/SetVolume aimdk_msgs/srv/SetVolume "{audio_volume: 72}"
ros2 service call /aimdk_5Fmsgs/srv/SetAgentPropertiesRequest aimdk_msgs/srv/SetAgentPropertiesRequest "{contents: {properties: [{key: {value: 2}, value: normal}]}}"
aima em stop-app agent
aima em start-app agent
```
