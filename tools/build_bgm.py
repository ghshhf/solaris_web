# -*- coding: utf-8 -*-
"""把原作 BGM 转成网页能播的 mp3（32000Hz / mono / 64kbps）。

源：D:/_lan_drop/solaris_extract/audio_all/*.wav
产出：D:/solaris_web/assets/bgm/*.mp3
"""
import os
import wave
import audioop
import lameenc

SRC = r"D:/_lan_drop/solaris_extract/audio_all"
OUT = r"D:/solaris_web/assets/bgm"

# 原文件 → 我们场景用的名字
TRACKS = {
    "op": "title",
    "bgm01": "day",
    "bgm02": "night",
    "bgm03": "forest",
    "main5card2": "shop",
    "main1battle": "battle",
    "battle_balthasar": "boss",
    "ending": "ending",
}

TARGET_SR = 32000


def convert(src_path, dst_path, bitrate=64):
    w = wave.open(src_path, "rb")
    nch, sw, sr, nframes = w.getnchannels(), w.getsampwidth(), w.getframerate(), w.getnframes()
    pcm = w.readframes(nframes)
    w.close()

    if sw != 2:  # 统一成 16bit
        pcm = audioop.lin2lin(pcm, sw, 2)
    if nch == 2:
        pcm = audioop.tomono(pcm, 2, 0.5, 0.5)
    if sr != TARGET_SR:
        pcm, _ = audioop.ratecv(pcm, 2, 1, sr, TARGET_SR, None)

    enc = lameenc.Encoder()
    enc.set_bit_rate(bitrate)
    enc.set_in_sample_rate(TARGET_SR)
    enc.set_channels(1)
    enc.set_quality(5)
    data = enc.encode(pcm)
    data += enc.flush()
    with open(dst_path, "wb") as f:
        f.write(data)
    return len(data)


def main():
    os.makedirs(OUT, exist_ok=True)
    total = 0
    for src, dst in TRACKS.items():
        p = os.path.join(SRC, src + ".wav")
        if not os.path.exists(p):
            print("  miss", src)
            continue
        n = convert(p, os.path.join(OUT, dst + ".mp3"))
        total += n
        print("  %-10s → %-8s %5.2f MB" % (src, dst, n / 1048576))
    print("bgm 合计 %.2f MB" % (total / 1048576))


if __name__ == "__main__":
    main()
