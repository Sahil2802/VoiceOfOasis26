"""Pure helpers for the robot: turn operator taps from the Ghost server into agent messages.
No ROS imports, so it can be tested anywhere."""
import json
import urllib.request


def event_to_message(ev: dict) -> dict:
    if ev.get("finished"):
        text = (f"[ROBOT EVENT] The operator confirms we arrived at the destination: {ev['stop']}. "
                "Announce it to the visitor with energy, in their language, then ask if they need anything else.")
    else:
        text = (f"[ROBOT EVENT] The operator confirms we arrived at: {ev['stop']}. This is a staff member or reception, "
                "not the final destination. Now do your ARRIVAL AT STAFF step: introduce yourself and ask them for the directions.")
    return {"type": "user_message", "text": text}


def http_fetch(base: str, token: str):
    def fetch(after: int) -> dict:
        url = f"{base.rstrip('/')}/robot/events?after={after}&k={token}"
        with urllib.request.urlopen(url, timeout=3) as r:
            return json.loads(r.read())
    return fetch


class EventPoller:
    def __init__(self, fetch, send):
        self.fetch, self.send, self.seq = fetch, send, 0

    def prime(self) -> None:
        try:
            self.seq = self.fetch(0).get("seq", 0)
        except Exception:
            pass

    def poll_once(self) -> None:
        try:
            data = self.fetch(self.seq)
        except Exception:
            return
        for ev in data.get("events", []):
            if ev["seq"] > self.seq:
                self.send(event_to_message(ev))
                self.seq = ev["seq"]
