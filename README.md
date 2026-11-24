# Ghost robot SDK layer (AgiBot X2, AimDK v1.0.0)

Runs on the robot's dev computer, in your own folder on the host (no Docker container at the moment). Connects the robot's mic and speaker to our ElevenLabs agent, and lets the agent use the robot's body through AimDK.

| File | What it does |
|---|---|
| `elevenlabs_robot_bridge.py` | Organisers' audio bridge, **unchanged** |
| `ghost_bridge.py` | Our entry point: original bridge + body tools + head touch + operator taps |
| `ghost_sdk.py` | AimDK v1.0.0 calls: `SetMcPresetMotion`, `/face_ui_proxy/play_emoji`, `SetVolume`/`GetVolume`, `SetMicSourceRequest` |
| `ghost_actions.py` | Agent tool → SDK mapping (gesture/motion ids from the AgiBot docs) |
| `ghost_events.py` | Polls our server for operator "Arrived" taps |
| `ghost_audio.py` | Mixes the robot's raw 6-channel microphone to mono (no wake word needed) |
| `run_on_robot.sh` | One-command launcher for PC2 (env checks, deps, fallback) |
| `docs/robot-runbook.md` | Step-by-step for the robot slot |

## Run (on the robot, in your own folder; the robot user is shared, so no `pip --user`)
```bash
export ELEVENLABS_AGENT_ID=<agent id>
export GHOST_SERVER=<server url> ROBOT_TOKEN=<robot token>   # optional: operator taps
./run_on_robot.sh                       # raw mic, HALF_DUPLEX=1, arms stay still
./run_on_robot.sh --gestures            # only after the engineers approve (Stable Stand)
```
Full steps, including switching the built-in assistant off and restoring the robot afterwards, are in `docs/robot-runbook.md`.
If `ghost_bridge.py` fails at startup the launcher falls back to `elevenlabs_robot_bridge.py` (voice only, wake word needed).

**Status:** the audio path follows the organisers' recipe tested on the robot on 24.11 (AimDK 1.1.0). The body calls were written against the AimDK v1.0.0 docs and have not run on this robot. Check the services exist first: `ros2 service list | grep -E "SetMcPresetMotion|play_emoji|SetVolume|SetMicSourceRequest"`.
