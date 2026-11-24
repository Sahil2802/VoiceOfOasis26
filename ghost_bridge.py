#!/usr/bin/env python3
"""Ghost Protocol bridge = organisers' elevenlabs_robot_bridge.py (unchanged)
  + robot body via AimDK SDK (gestures, face, volume, mic) for the agent's client tools
  + head touch -> greeting
  + operator arrival events.

Copy BOTH files (and ghost_events.py) into /home/agi/<team folder> on PC2, then:
  export ELEVENLABS_AGENT_ID=...
  export GHOST_SERVER=https://<our server>     # optional: enables operator "Arrived" taps
  export ROBOT_TOKEN=...                        # matches the server's ROBOT_TOKEN
  python3 ghost_bridge.py                       # same flags as the original (HALF_DUPLEX=1, MIC_STREAM=2, VERBOSE=1)

  export ENABLE_GESTURES=1                      # ONLY after MangoBot approves arm gestures (robot in Stable Stand)

Copy ghost_actions.py and ghost_sdk.py too. Without GHOST_SERVER, taps are off; without
ENABLE_GESTURES, the arms never move (face, volume and mic still work)."""
import os
import sys
import threading
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import elevenlabs_robot_bridge as base  # noqa: E402
from ghost_actions import dispatch  # noqa: E402
from ghost_events import EventPoller, http_fetch  # noqa: E402
from ghost_sdk import AimdkSDK  # noqa: E402

SERVER = os.environ.get("GHOST_SERVER", "").strip()
TOKEN = os.environ.get("ROBOT_TOKEN", "").strip()
GESTURES = os.environ.get("ENABLE_GESTURES", "0") == "1"
TOUCH_COOLDOWN = 8.0


class GhostBridge(base.Bridge):
    def __init__(self):
        super().__init__()
        self.sdk = AimdkSDK(self)
        self._last_touch = 0.0
        try:
            from aimdk_msgs.msg import TouchState
            self._touch_ok = (TouchState.TOUCH, TouchState.PAT_ONCE, TouchState.PAT_TWICE)
            self.create_subscription(TouchState, "/aima/hal/sensor/touch_head", self._on_touch, 10)
            base.log("ghost: head touch enabled")
        except Exception as e:
            base.log("ghost: head touch unavailable:", e)
        base.log("ghost: gestures", "ON" if GESTURES else "OFF (set ENABLE_GESTURES=1 after MangoBot OK)")

    def _on_touch(self, msg):
        now = time.monotonic()
        if msg.event_type in self._touch_ok and now - self._last_touch > TOUCH_COOLDOWN and self.connected:
            self._last_touch = now
            self.send({"type": "user_message", "text": "[ROBOT EVENT] Someone just touched my head to get my attention. "
                       "Greet them warmly in one short sentence and ask where they want to go."})

    def on_tool_call(self, call):
        name, params, tid = call.get("tool_name"), call.get("parameters") or {}, call.get("tool_call_id")
        base.log("tool call:", name, params)

        def run():
            r = dispatch(name, params, self.sdk, GESTURES)
            base.log("tool result:", r)
            self.send({"type": "client_tool_result", "tool_call_id": tid,
                       "result": r["message"], "is_error": not r["ok"]})
        threading.Thread(target=run, daemon=True).start()

    def on_open(self, ws):
        super().on_open(ws)
        if SERVER and TOKEN and not getattr(self, "_poller", None):
            self._poller = EventPoller(http_fetch(SERVER, TOKEN), self._send_event)
            self._poller.prime()
            threading.Thread(target=self._poll_loop, daemon=True).start()
            base.log("ghost: listening for operator taps on", SERVER)

    def _send_event(self, msg):
        if self.connected:
            base.log("ghost:", msg["text"][:80])
            self.send(msg)

    def _poll_loop(self):
        while self.running:
            self._poller.poll_once()
            time.sleep(0.5)


base.Bridge = GhostBridge  # main() looks up Bridge at call time

if __name__ == "__main__":
    base.main()
