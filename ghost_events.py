"""Pure helpers for the robot: turn operator taps from the Ghost server into agent messages.
No ROS imports, so it can be tested anywhere."""
import json
import urllib.request


def event_to_message(ev: dict) -> dict:
    tail = " This is the destination." if ev.get("finished") else ""
    return {"type": "user_message",
            "text": f"[ROBOT EVENT] The operator confirms we arrived at: {ev['stop']}.{tail} "
                    "Narrate this stop to the visitor now, briefly, in their language."}


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
