# Ghost robot SDK layer (AgiBot X2, AimDK v1.0.0)

Runs on the robot's PC2 inside the MangoBot container. Connects the robot's mic and speaker to our ElevenLabs agent, and lets the agent use the robot's body through AimDK.

| File | What it does |
|---|---|
| `elevenlabs_robot_bridge.py` | Organisers' audio bridge, **unchanged** |
| `ghost_bridge.py` | Our entry point: original bridge + body tools + head touch + operator taps |
| `ghost_sdk.py` | AimDK v1.0.0 calls: `SetMcPresetMotion`, `/face_ui_proxy/play_emoji`, `SetVolume`/`GetVolume`, `SetMicSourceRequest` |
| `ghost_actions.py` | Agent tool → SDK mapping (gesture/motion ids from the AgiBot docs) |
| `ghost_events.py` | Polls our server for operator "Arrived" taps |
| `run_on_robot.sh` | One-command launcher for PC2 (env checks, deps, fallback) |
| `docs/robot-runbook.md` | Step-by-step for the robot slot |

## Run (on PC2, save under /home/agi only)
```bash
pip3 install websocket-client numpy
source /opt/ros/humble/setup.bash && source <aimdk>/install/setup.bash
export ELEVENLABS_AGENT_ID=<agent id>
export GHOST_SERVER=<server url> ROBOT_TOKEN=<robot token>   # optional: operator taps
python3 ghost_bridge.py                 # arms stay still
ENABLE_GESTURES=1 python3 ghost_bridge.py   # only after MangoBot approves (Stable Stand)
```
If anything fails, fall back to `python3 elevenlabs_robot_bridge.py`. Voice keeps working.

**Status:** written against the official AimDK v1.0.0 docs. It has not yet run on this robot. Check the services exist first: `ros2 service list | grep -E "SetMcPresetMotion|play_emoji|SetVolume|SetMicSourceRequest"`.
