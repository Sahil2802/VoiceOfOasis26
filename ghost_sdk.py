"""AimDK v1.0.0 calls for Ghost, made from the bridge's existing ROS node (no extra nodes).
Interfaces: docs/aimdk-v1.0.0-interfaces.md. UNTESTED on hardware until the first robot slot;
every call is wrapped so a missing service never breaks the audio bridge."""
import elevenlabs_robot_bridge as base


def _try_import():
    try:
        from aimdk_msgs import msg, srv
        return msg, srv
    except Exception as e:  # pragma: no cover - only on robot
        base.log("ghost: aimdk_msgs import failed:", e)
        return None, None


class AimdkSDK:
    def __init__(self, node):
        self.node = node
        self.msg, self.srv = _try_import()
        self.clients = {}

    def _client(self, srv_name: str, path: str):
        if self.srv is None or not hasattr(self.srv, srv_name):
            raise RuntimeError(f"{srv_name} not available in this SDK")
        if path not in self.clients:
            self.clients[path] = self.node.create_client(getattr(self.srv, srv_name), path)
        return self.clients[path]

    def _stamp(self):
        return self.node.get_clock().now().to_msg()

    def preset_motion(self, motion: int, area: int) -> bool:
        S, m = self.srv.SetMcPresetMotion, self.msg
        req = S.Request()
        req.header = m.RequestHeader()
        req.header.stamp = self._stamp()
        req.motion = m.McPresetMotion(value=motion)
        req.area = m.McControlArea(value=area)
        req.interrupt = False
        res = self.node.call(self._client("SetMcPresetMotion", "/aimdk_5Fmsgs/srv/SetMcPresetMotion"), req)
        return res is not None and (res.response.header.code == 0
                                    or res.response.state.value == m.CommonState.RUNNING)

    def play_emoji(self, emotion_id: int, mode: int = 1) -> bool:
        req = self.srv.PlayEmoji.Request()
        req.emotion_id, req.mode, req.priority = int(emotion_id), int(mode), 10
        req.header.header.stamp = self._stamp()
        res = self.node.call(self._client("PlayEmoji", "/face_ui_proxy/play_emoji"), req)
        return bool(res is not None and res.success)

    def get_volume(self):
        req = self.srv.GetVolume.Request()
        req.request = self.msg.CommonRequest()
        res = self.node.call(self._client("GetVolume", "/aimdk_5Fmsgs/srv/GetVolume"), req, tries=3)
        return None if res is None else int(res.audio_volume)

    def set_volume(self, v: int) -> bool:
        req = self.srv.SetVolume.Request()
        req.request = self.msg.CommonRequest()
        req.audio_volume = int(v)
        return self.node.call(self._client("SetVolume", "/aimdk_5Fmsgs/srv/SetVolume"), req) is not None

    def set_mic(self, source: int) -> bool:
        req = self.srv.SetMicSourceRequest.Request()
        req.header = self.msg.CommonRequest()
        req.header.header.stamp = self._stamp()
        req.mic_source = int(source)
        res = self.node.call(self._client("SetMicSourceRequest", "/aimdk_5Fmsgs/srv/SetMicSourceRequest"), req)
        return res is not None and res.header.status.value == self.msg.CommonState.SUCCESS
