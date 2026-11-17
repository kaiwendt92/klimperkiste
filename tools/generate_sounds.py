#!/usr/bin/env python3
"""
Erzeugt die 9 Musik-Jingles der Klimperkiste.

Alle Melodien sind gemeinfreie Volks- und Kinderlieder (bzw. klassische Werke
von Komponisten, die vor über 70 Jahren gestorben sind). Die Klänge werden hier
komplett synthetisch erzeugt – es gibt also keinerlei Lizenzfragen.

Aufruf:  python3 tools/generate_sounds.py
Ergebnis: public/sounds/*.mp3  (benötigt ffmpeg)
"""
from __future__ import annotations

import os
import subprocess
import tempfile
import wave

import numpy as np
from scipy.signal import fftconvolve

SR = 44100
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "sounds")

NOTE_INDEX = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6,
              "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}


def midi(name: str) -> int:
    pitch, octave = name[:-1], int(name[-1])
    return 12 * (octave + 1) + NOTE_INDEX[pitch]


def freq(m: float) -> float:
    return 440.0 * 2 ** ((m - 69) / 12)


def parse(seq: str) -> list[tuple[str, float]]:
    """'C4:1 D4:0.5 R:1' -> [(note, beats), ...]; R = Pause"""
    out = []
    for tok in seq.split():
        n, d = tok.split(":")
        out.append((n, float(d)))
    return out


# --------------------------------------------------------------------------
# Instrumente
# --------------------------------------------------------------------------
def env_exp(n: int, decay: float, attack: float = 0.004) -> np.ndarray:
    t = np.arange(n) / SR
    a = np.minimum(1.0, t / attack)
    return a * np.exp(-t / decay)


def partials(f: float, n: int, spec: list[tuple[float, float, float]],
             attack: float = 0.004) -> np.ndarray:
    """spec: (Frequenzverhältnis, Amplitude, Abklingzeit)"""
    t = np.arange(n) / SR
    sig = np.zeros(n)
    for ratio, amp, decay in spec:
        if f * ratio > SR / 2.2:
            continue
        sig += amp * np.sin(2 * np.pi * f * ratio * t) * env_exp(n, decay, attack)
    return sig


def inst_musicbox(f, dur):
    n = int(SR * (dur + 1.4))
    return partials(f, n, [(1, 1.0, 0.9), (2, 0.35, 0.4), (3.01, 0.12, 0.25), (5.2, 0.05, 0.1)])


def inst_xylophone(f, dur):
    n = int(SR * (dur + 0.8))
    return partials(f, n, [(1, 1.0, 0.35), (3.93, 0.25, 0.08), (9.8, 0.06, 0.03)], attack=0.002)


def inst_glockenspiel(f, dur):
    n = int(SR * (dur + 1.6))
    return partials(f, n, [(1, 1.0, 1.1), (2.76, 0.3, 0.35), (5.4, 0.12, 0.15)], attack=0.002)


def inst_marimba(f, dur):
    n = int(SR * (dur + 0.9))
    return partials(f, n, [(1, 1.0, 0.5), (4.0, 0.18, 0.1)], attack=0.006)


def inst_flute(f, dur):
    n_note = int(SR * dur * 0.92)
    rel = int(SR * 0.12)
    n = n_note + rel
    t = np.arange(n) / SR
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.0 * t) * np.minimum(1, t / 0.3)
    phase = 2 * np.pi * f * np.cumsum(vib) / SR
    sig = np.sin(phase) + 0.18 * np.sin(2 * phase) + 0.05 * np.sin(3 * phase)
    env = np.ones(n)
    a = int(SR * 0.05)
    env[:a] = np.linspace(0, 1, a)
    env[n_note:] = np.linspace(1, 0, n - n_note)
    return sig * env * 0.8


def inst_pluck(f, dur):
    """Karplus-Strong – klingt wie eine kleine Ukulele"""
    n = int(SR * (dur + 1.0))
    period = int(SR / f)
    rng = np.random.default_rng(int(f * 100))
    buf = rng.uniform(-1, 1, period)
    buf = np.convolve(buf, np.ones(4) / 4, mode="same")  # weicher Anschlag
    out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % period]
        buf[i % period] = 0.996 * 0.5 * (buf[i % period] + buf[(i + 1) % period])
    return out * 0.9


def inst_softpiano(f, dur):
    n = int(SR * (dur + 1.2))
    return partials(f, n, [(1, 1.0, 0.8), (2, 0.4, 0.5), (3, 0.15, 0.3), (4, 0.06, 0.2)], attack=0.005)


INSTRUMENTS = {
    "musicbox": inst_musicbox,
    "xylophone": inst_xylophone,
    "glockenspiel": inst_glockenspiel,
    "marimba": inst_marimba,
    "flute": inst_flute,
    "pluck": inst_pluck,
    "softpiano": inst_softpiano,
}

CHORDS = {
    "C": ["C3", "E3", "G3"],
    "F": ["F3", "A3", "C4"],
    "G": ["G2", "B2", "D3"],
}


def pad(chord: str, dur: float) -> np.ndarray:
    n = int(SR * (dur + 0.4))
    t = np.arange(n) / SR
    sig = np.zeros(n)
    for nm in CHORDS[chord]:
        f = freq(midi(nm))
        sig += np.sin(2 * np.pi * f * t) + 0.1 * np.sin(4 * np.pi * f * t)
    env = np.ones(n)
    a = int(SR * 0.08)
    env[:a] = np.linspace(0, 1, a)
    r = int(SR * 0.4)
    env[-r:] = np.linspace(1, 0, r)
    return sig * env / 3


def bass(chord: str, dur: float) -> np.ndarray:
    f = freq(midi(CHORDS[chord][0]) - 12 if chord != "G" else midi(CHORDS[chord][0]))
    n = int(SR * (dur + 0.3))
    return partials(f, n, [(1, 1.0, 0.45), (2, 0.25, 0.25)], attack=0.01)


def mix_into(buf: np.ndarray, sig: np.ndarray, start: int, gain: float):
    end = min(len(buf), start + len(sig))
    buf[start:end] += gain * sig[: end - start]


def reverb(sig: np.ndarray, length=0.9, wet=0.18) -> np.ndarray:
    n = int(SR * length)
    rng = np.random.default_rng(7)
    ir = rng.standard_normal(n) * np.exp(-np.arange(n) / SR / (length / 5))
    ir /= np.sqrt(np.sum(ir ** 2))
    w = fftconvolve(sig, ir)[: len(sig)]
    return (1 - wet) * sig + wet * w


def render(song: dict) -> np.ndarray:
    bpm = song["bpm"]
    spb = 60.0 / bpm
    notes = parse(song["melody"])
    chords = parse(song["chords"])
    total_beats = sum(d for _, d in notes)
    buf = np.zeros(int(SR * (total_beats * spb + 2.0)))
    instr = INSTRUMENTS[song["instrument"]]
    shift = song.get("transpose", 0)

    beat = song.get("pickup_offset", 0.0)
    for nm, d in notes:
        if nm != "R":
            sig = instr(freq(midi(nm) + shift), d * spb)
            mix_into(buf, sig, int(beat * spb * SR), 1.0)
        beat += d

    beat = 0.0
    for ch, d in chords:
        if ch != "R":
            mix_into(buf, pad(ch, d * spb), int(beat * spb * SR), 0.10)
            mix_into(buf, bass(ch, d * spb), int(beat * spb * SR), 0.22)
        beat += d

    buf = reverb(buf)
    # Ausblenden & Lautstärke angleichen (bewusst eher leise, für Babyohren)
    fade = int(SR * 0.6)
    buf[-fade:] *= np.linspace(1, 0, fade)
    rms = np.sqrt(np.mean(buf[: int(len(buf) * 0.8)] ** 2))
    buf *= 0.11 / (rms + 1e-9)
    peak = np.max(np.abs(buf))
    if peak > 0.7:
        buf *= 0.7 / peak
    return buf


def write_mp3(sig: np.ndarray, path: str):
    pcm = (np.clip(sig, -1, 1) * 32767).astype(np.int16)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        wav_path = tmp.name
    with wave.open(wav_path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav_path,
                    "-codec:a", "libmp3lame", "-b:a", "128k", path], check=True)
    os.remove(wav_path)


# --------------------------------------------------------------------------
# Die 9 Lieder (Melodie in C-Dur, Dauer in Vierteln)
# --------------------------------------------------------------------------
SONGS = [
    {
        "id": "entchen", "title": "Alle meine Entchen",
        "instrument": "xylophone", "transpose": 12, "bpm": 176,
        "melody": "C4:1 D4:1 E4:1 F4:1 G4:2 G4:2 A4:1 A4:1 A4:1 A4:1 G4:4 "
                  "F4:1 F4:1 F4:1 F4:1 E4:2 E4:2 D4:1 D4:1 D4:1 D4:1 C4:4",
        "chords": "C:4 C:4 F:4 C:4 F:4 C:4 G:4 C:4",
    },
    {
        "id": "haenschen", "title": "Hänschen klein",
        "instrument": "musicbox", "transpose": 12, "bpm": 168,
        "melody": "G4:1 E4:1 E4:2 F4:1 D4:1 D4:2 C4:1 D4:1 E4:1 F4:1 G4:1 G4:1 G4:2 "
                  "G4:1 E4:1 E4:2 F4:1 D4:1 D4:2 C4:1 E4:1 G4:1 G4:1 C4:4",
        "chords": "C:4 G:4 C:4 C:4 C:4 G:4 C:4 C:4",
    },
    {
        "id": "sternchen", "title": "Morgen kommt der Weihnachtsmann",
        "instrument": "glockenspiel", "transpose": 12, "bpm": 112,
        "melody": "C4:1 C4:1 G4:1 G4:1 A4:1 A4:1 G4:2 F4:1 F4:1 E4:1 E4:1 D4:1 D4:1 C4:2",
        "chords": "C:4 F:2 C:2 F:2 C:2 G:2 C:2",
    },
    {
        "id": "jakob", "title": "Bruder Jakob",
        "instrument": "marimba", "transpose": 12, "bpm": 168,
        "melody": "C4:1 D4:1 E4:1 C4:1 C4:1 D4:1 E4:1 C4:1 E4:1 F4:1 G4:2 E4:1 F4:1 G4:2 "
                  "G4:0.5 A4:0.5 G4:0.5 F4:0.5 E4:1 C4:1 G4:0.5 A4:0.5 G4:0.5 F4:0.5 E4:1 C4:1 "
                  "C4:1 G3:1 C4:2 C4:1 G3:1 C4:2",
        "chords": "C:4 C:4 C:4 C:4 C:4 C:4 C:4 C:4",
    },
    {
        "id": "bauernhof", "title": "Old MacDonald",
        "instrument": "pluck", "transpose": 0, "bpm": 168,
        "melody": "C4:1 C4:1 C4:1 G3:1 A3:1 A3:1 G3:2 E4:1 E4:1 D4:1 D4:1 C4:3 G3:1 "
                  "C4:1 C4:1 C4:1 G3:1 A3:1 A3:1 G3:2 E4:1 E4:1 D4:1 D4:1 C4:4",
        "chords": "C:4 F:2 C:2 C:2 G:2 C:4 C:4 F:2 C:2 C:2 G:2 C:4",
    },
    {
        "id": "laemmchen", "title": "Mary hat ein kleines Lamm",
        "instrument": "softpiano", "transpose": 12, "bpm": 168,
        "melody": "E4:1 D4:1 C4:1 D4:1 E4:1 E4:1 E4:2 D4:1 D4:1 D4:2 E4:1 G4:1 G4:2 "
                  "E4:1 D4:1 C4:1 D4:1 E4:1 E4:1 E4:1 E4:1 D4:1 D4:1 E4:1 D4:1 C4:4",
        "chords": "C:4 C:4 G:4 C:4 C:4 C:4 G:4 C:4",
    },
    {
        "id": "freude", "title": "Ode an die Freude",
        "instrument": "flute", "transpose": 12, "bpm": 144,
        "melody": "E4:1 E4:1 F4:1 G4:1 G4:1 F4:1 E4:1 D4:1 C4:1 C4:1 D4:1 E4:1 E4:1.5 D4:0.5 D4:2 "
                  "E4:1 E4:1 F4:1 G4:1 G4:1 F4:1 E4:1 D4:1 C4:1 C4:1 D4:1 E4:1 D4:1.5 C4:0.5 C4:2",
        "chords": "C:4 G:4 C:4 C:2 G:2 C:4 G:4 C:4 G:2 C:2",
    },
    {
        "id": "gutenacht", "title": "Guten Abend, gut' Nacht",
        "instrument": "musicbox", "transpose": 12, "bpm": 116,
        "melody": "E4:0.5 E4:0.5 G4:2 E4:0.5 E4:0.5 G4:2 E4:0.5 G4:0.5 C5:1 B4:1.5 A4:0.5 "
                  "A4:1 G4:1 D4:0.5 E4:0.5 F4:1 D4:1 D4:0.5 E4:0.5 F4:2 D4:0.5 F4:0.5 "
                  "B4:0.5 A4:0.5 G4:1 B4:1 C5:3",
        "chords": "R:1 C:3 C:3 F:3 C:3 G:3 G:3 G:3 C:3",
    },
    {
        "id": "bruecke", "title": "London Bridge",
        "instrument": "xylophone", "transpose": 12, "bpm": 152,
        "melody": "G4:1.5 A4:0.5 G4:1 F4:1 E4:1 F4:1 G4:2 D4:1 E4:1 F4:2 E4:1 F4:1 G4:2 "
                  "G4:1.5 A4:0.5 G4:1 F4:1 E4:1 F4:1 G4:2 D4:2 G4:2 E4:1 C4:3",
        "chords": "C:4 C:4 G:4 C:4 C:4 C:4 G:4 C:4",
    },
]


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for i, song in enumerate(SONGS, 1):
        sig = render(song)
        path = os.path.join(OUT_DIR, f"{i:02d}-{song['id']}.mp3")
        write_mp3(sig, path)
        print(f"{path}  {len(sig) / SR:5.1f}s  ({song['title']}, {song['instrument']})")


if __name__ == "__main__":
    main()
