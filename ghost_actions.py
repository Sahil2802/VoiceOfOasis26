"""Map the agent's robot tools to AimDK v1.0.0 calls. Pure logic, no ROS; the SDK object is injected.
IDs from docs/aimdk-v1.0.0-interfaces.md."""

GESTURES = {  # name -> (motion, area); right hand = area 2
    "wave": (1002, 2), "handshake": (1003, 2), "raise_hand": (1001, 2),
    "blow_kiss": (1004, 2), "salute": (1013, 2), "clap": (3017, 11),
}
EMOTIONS = {"blink": 1, "bored": 60, "sleeping": 80, "happy": 90, "adore": 200}
MICS = {"internal": 0, "external": 1}
STEP = 20


def _ok(msg):
    return {"ok": True, "message": msg}


def _err(msg):
    return {"ok": False, "message": msg}


def dispatch(tool: str, params: dict, sdk, gestures_enabled: bool) -> dict:
    try:
        if tool == "robot_gesture":
            g = str(params.get("gesture", "")).lower()
            if g not in GESTURES:
                return _err(f"unknown gesture {g}; use one of {', '.join(GESTURES)}")
            if not gestures_enabled:
                return _err("gestures are switched off on this robot; just keep talking")
            return _ok(f"doing {g}") if sdk.preset_motion(*GESTURES[g]) else _err(f"{g} failed")
        if tool == "robot_expression":
            e = str(params.get("emotion", "")).lower()
            if e not in EMOTIONS:
                return _err(f"unknown emotion {e}; use one of {', '.join(EMOTIONS)}")
            return _ok(f"showing {e}") if sdk.play_emoji(EMOTIONS[e], 1) else _err("expression failed")
        if tool == "robot_volume":
            lvl = str(params.get("level", "")).lower()
            cur = sdk.get_volume()
            if lvl == "louder":
                v = (cur if cur is not None else 60) + STEP
            elif lvl == "softer":
                v = (cur if cur is not None else 60) - STEP
            else:
                v = int(float(lvl))
            v = max(10, min(100, v))
            return _ok(f"volume {v}") if sdk.set_volume(v) else _err("volume failed")
        if tool == "robot_microphone":
            s = str(params.get("source", "")).lower()
            if s not in MICS:
                return _err("source must be internal or external")
            return _ok(f"using {s} microphone") if sdk.set_mic(MICS[s]) else _err("mic switch failed")
        return _err(f"unknown tool {tool}")
    except Exception as e:  # never crash the audio bridge because of a body action
        return _err(f"{tool} error: {e}")
