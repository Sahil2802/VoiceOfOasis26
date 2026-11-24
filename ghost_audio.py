"""Pure audio helper for the robot's raw microphone (/aima/hal/audio/capture). No ROS imports, so it can be tested anywhere.
The raw topic carries interleaved S16LE channels at 16 kHz: the first `mic_channels` are the microphones, the rest are speaker reference."""
import numpy as np


def mix_to_mono(data: bytes, channels: int, mic_channels: int) -> bytes:
    """Average the microphone channels into mono 16-bit little-endian PCM (what the ElevenLabs bridge expects)."""
    if channels < 1 or mic_channels < 1:
        return b""
    frame = 2 * channels
    a = np.frombuffer(data[: len(data) // frame * frame], dtype="<i2").reshape(-1, channels)[:, :mic_channels]
    return np.clip(a.astype(np.int32).mean(axis=1), -32768, 32767).astype("<i2").tobytes()


if __name__ == "__main__":
    # 6 channels: 4 mics (100, 200, 300, 400 -> mean 250) + 2 speaker reference (ignored); a trailing partial frame is dropped.
    frame = np.array([100, 200, 300, 400, 9999, 9999], dtype="<i2").tobytes()
    out = np.frombuffer(mix_to_mono(frame * 3 + b"\x01\x02", 6, 4), dtype="<i2")
    assert out.tolist() == [250, 250, 250], out
    loud = np.array([32767, 32767, 32767, 32767, 0, 0], dtype="<i2").tobytes()
    assert np.frombuffer(mix_to_mono(loud, 6, 4), dtype="<i2").tolist() == [32767]
    assert mix_to_mono(frame, 0, 4) == b"" and mix_to_mono(b"", 6, 4) == b""
    print("ghost_audio ok")
