#!/usr/bin/env bash
# Start the Ghost bridge on the robot's PC2. Usage: ./run_on_robot.sh [--gestures]
# Needs: ELEVENLABS_AGENT_ID (required), ELEVENLABS_API_KEY (private agents),
#        GHOST_SERVER + ROBOT_TOKEN (operator "Arrived" taps), AIMDK_SETUP (path to <aimdk>/install/setup.bash).
# Optional: HALF_DUPLEX=1, MIC_STREAM=1|2, VERBOSE=1. Falls back to the plain audio bridge if ghost_bridge.py can't start.
set -uo pipefail
cd "$(dirname "$0")"

: "${ELEVENLABS_AGENT_ID:?set ELEVENLABS_AGENT_ID}"
: "${AIMDK_SETUP:?set AIMDK_SETUP to <aimdk>/install/setup.bash (ask MangoBot)}"
[ -n "${GHOST_SERVER:-}" ] && [ -z "${ROBOT_TOKEN:-}" ] && echo "WARN: GHOST_SERVER set without ROBOT_TOKEN, operator taps stay off"
[ "${1:-}" = "--gestures" ] && export ENABLE_GESTURES=1   # only after MangoBot approves (Stable Stand)

# ROS setup scripts reference unset vars, so source them without -u
set +u
source /opt/ros/humble/setup.bash && source "$AIMDK_SETUP" || { echo "ROS/AimDK setup failed"; exit 1; }
set -u

python3 -c "import websocket, numpy" 2>/dev/null || pip3 install --user websocket-client numpy

# ghost_bridge.py reconnects the WebSocket itself; this only covers a crash at startup.
python3 ghost_bridge.py && exit 0
echo "ghost_bridge.py exited non-zero, falling back to the plain audio bridge (voice only)"
unset ENABLE_GESTURES
exec python3 elevenlabs_robot_bridge.py
