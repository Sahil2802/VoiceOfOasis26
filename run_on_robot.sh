#!/usr/bin/env bash
# Start the Ghost bridge on the robot's dev computer, from YOUR OWN folder. Usage: ./run_on_robot.sh [--gestures]
# Needs: ELEVENLABS_AGENT_ID (required), ELEVENLABS_API_KEY (private agents), GHOST_SERVER + ROBOT_TOKEN (operator "Arrived" taps).
# Optional: AIMDK_ROOT (default /agibot/software/common), RAW_MIC=0 (wake-word mic), HALF_DUPLEX=0, MIC_STREAM=1|2, VERBOSE=1.
# The user on the robot is shared by every team: nothing is installed outside this folder (no pip --user).
set -uo pipefail
cd "$(dirname "$0")"

: "${ELEVENLABS_AGENT_ID:?set ELEVENLABS_AGENT_ID}"
[ -n "${GHOST_SERVER:-}" ] && [ -z "${ROBOT_TOKEN:-}" ] && echo "WARN: GHOST_SERVER set without ROBOT_TOKEN, operator taps stay off"
[ "${1:-}" = "--gestures" ] && export ENABLE_GESTURES=1   # only after the engineers approve (Stable Stand)

# AimDK 1.1.0 is already built on the robot; /home/agi/aimdk is source only. ROS setup scripts use unset vars, so no -u here.
AIMDK_ROOT="${AIMDK_ROOT:-/agibot/software/common}"
set +u
source /opt/ros/humble/setup.bash || { echo "ROS setup failed"; exit 1; }
export PYTHONPATH="$AIMDK_ROOT/local/lib/python3.10/dist-packages:$PWD/pylib:${PYTHONPATH:-}"
export LD_LIBRARY_PATH="$AIMDK_ROOT/lib:${LD_LIBRARY_PATH:-}"
export AMENT_PREFIX_PATH="$AIMDK_ROOT:${AMENT_PREFIX_PATH:-}"
set -u

python3 -c "import numpy" 2>/dev/null || { echo "numpy missing: ask the engineers"; exit 1; }
python3 -c "import websocket" 2>/dev/null || python3 -m pip install --no-deps --target ./pylib websocket-client || exit 1
python3 -c "import aimdk_msgs" 2>/dev/null || { echo "aimdk_msgs not found under $AIMDK_ROOT"; exit 1; }

# The raw microphone has no echo cancellation: without this the robot answers itself.
export HALF_DUPLEX="${HALF_DUPLEX:-1}"

echo "Who else is publishing to the speaker? Only your bridge should be listed after you start:"
ros2 topic info -v --no-daemon /aima/hal/audio/playback | grep -E "Node name|Publisher count" || true

# ghost_bridge.py reconnects the WebSocket itself; this only covers a crash at startup.
python3 ghost_bridge.py && exit 0
echo "ghost_bridge.py exited non-zero, falling back to the plain audio bridge (voice only, wake word needed)"
unset ENABLE_GESTURES
exec python3 elevenlabs_robot_bridge.py
