# -*- coding: utf-8 -*-
"""从原作破解包里批量导出网页用素材。

源目录：D:/_lan_drop/solaris_extract
  img_all/    5680 张 PNG
  audio_all/  378 个 WAV
产出：D:/solaris_web/assets/{foe_anim,fx,zone,status,item,gear,portrait_hd,bgm,sfx}

用法：python tools/build_assets.py [模块名...]
不带参数 = 全跑。模块：foe fx zone status item gear bgm sfx
"""
import os
import re
import sys
import glob
import json
from PIL import Image

SRC = r"D:/_lan_drop/solaris_extract"
IMG = os.path.join(SRC, "img_all")
AUD = os.path.join(SRC, "audio_all")
OUT = r"D:/solaris_web/assets"

# 11 只敌人的日文名 → 我们的英文 id
FOES = [
    ("ツメドリ", "clawbird"),
    ("ハサミムシ", "scissorbug"),
    ("ハイウロコ", "scale_beast"),
    ("ハイカイジュ", "vine_beast"),
    ("スライムゴーレム", "slime_golem"),
    ("ハイゴーレム", "hi_golem"),
    ("レッドラゴン", "red_dragon"),
    ("バルタ", "balthasar"),
    ("テティア", "tetia"),
    ("クロワゼ", "croise"),
    ("ホムクロ", "homukuro"),
]

# 状态 → (源前缀, 每套帧数, 取哪几帧)
STATES = {
    "idle": ("待機", 8, None),          # 全取，8 帧循环
    "warn": ("予兆", 8, [0, 2, 4, 6]),  # 预警动作
    "hit": ("被ダメ", 16, [0, 1, 2, 4, 6, 9, 12, 15]),
    "down": ("倒れ", 16, [0, 2, 5, 8, 11, 15]),
    "buff": ("バフ", 16, [0, 3, 6, 9, 12, 15]),
}


def src_of(prefix, idx, size="417x286"):
    return os.path.join(IMG, "%s_%04d_%s.png" % (prefix, idx, size))


def save_webp(im, dst, quality=82):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    im.save(dst, "WEBP", quality=quality, method=4)


def build_foe():
    """11 只敌人 × 5 套动作帧动画。"""
    manifest = {}
    total = 0
    for jp, en in FOES:
        info = {}
        for st, (suffix, nframe, picks) in STATES.items():
            idxs = picks if picks else range(nframe)
            kept = []
            for k, i in enumerate(idxs):
                p = src_of(jp + suffix, i)
                if not os.path.exists(p):
                    continue
                im = Image.open(p).convert("RGBA")
                dst = os.path.join(OUT, "foe_anim", en, "%s_%d.webp" % (st, k))
                save_webp(im, dst)
                kept.append("%s_%d.webp" % (st, k))
                total += 1
            if kept:
                info[st] = kept
        manifest[en] = info
    with open(os.path.join(OUT, "foe_anim", "index.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=1)
    print("foe_anim: %d 帧 / %d 只" % (total, len(manifest)))


def build_fx():
    """招式特效：8 套 × 6 帧，750x606 缩到 480x388。"""
    sets = ["一振り", "二振り", "三振り", "大振り", "強パン", "無双連撃", "落下", "貫通"]
    mapping = {
        "一振り": "slash1", "二振り": "slash2", "三振り": "slash3",
        "大振り": "slash_big", "強パン": "punch", "無双連撃": "combo",
        "落下": "fall", "貫通": "pierce",
    }
    total = 0
    for jp in sets:
        en = mapping[jp]
        for i in range(6):
            p = src_of(jp, i, "750x606")
            if not os.path.exists(p):
                print("  miss", p)
                continue
            im = Image.open(p).convert("RGBA").resize((480, 388), Image.LANCZOS)
            save_webp(im, os.path.join(OUT, "fx", en, "%d.webp" % i), 80)
            total += 1
    print("fx: %d 帧 / %d 套" % (total, len(sets)))


def build_zone():
    """6 个区域的场景动画（探索用），740x400 缩到 592x320。"""
    zones = {
        "荒野": "wasteland", "森": "forest", "森洞窟": "forest_cave",
        "試しの儀": "trial", "火山": "volcano", "海洞窟": "sea_cave",
    }
    manifest = {}
    total = 0
    for jp, en in zones.items():
        # 有 アニメ 后缀的用动画帧，没有的用单图
        anim = os.path.join(IMG, "%sアニメ_%04d_740x400.png" % (jp, 0))
        if os.path.exists(anim):
            frames = sorted(glob.glob(os.path.join(IMG, "%sアニメ_*_740x400.png" % jp)))
        else:
            frames = sorted(glob.glob(os.path.join(IMG, "%s_*_740x400.png" % jp)))
        kept = []
        for i, p in enumerate(frames):
            im = Image.open(p).convert("RGBA").resize((592, 320), Image.LANCZOS)
            save_webp(im, os.path.join(OUT, "zone", en, "%d.webp" % i), 78)
            kept.append("%d.webp" % i)
            total += 1
        manifest[en] = kept
        print("  %-12s %d 帧" % (en, len(kept)))
    # 分层视差背景（天空 + 树叶三层 + 地面）
    layers = {
        "sky": "Bg_top", "ground": "Bg_ground",
        "leaf1": "Bg_leaf1", "leaf2": "Bg_leaf2", "leaf3": "Bg_leaf3",
    }
    lay_manifest = {}
    for en, jp in layers.items():
        frames = sorted(glob.glob(os.path.join(IMG, "%s_*_740x400.png" % jp)))
        kept = []
        for i, p in enumerate(frames):
            im = Image.open(p).convert("RGBA").resize((592, 320), Image.LANCZOS)
            save_webp(im, os.path.join(OUT, "zone", "_layer", en, "%d.webp" % i), 78)
            kept.append("%d.webp" % i)
        lay_manifest[en] = kept
    manifest["_layer"] = lay_manifest
    with open(os.path.join(OUT, "zone", "index.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=1)
    print("zone: %d 帧" % total)


def build_status():
    """战斗状态图标（220x220 → 72x72）+ 动画帧。"""
    names = {
        "毒": "poison", "炎上": "burn", "負傷": "wound", "軟化": "soften",
        "装甲": "armor", "鉄塊": "iron", "筋力": "strength", "狂奔": "rush",
        "集中": "focus", "高揚": "uplift", "防火": "fireproof", "解毒": "cure",
        "脱力": "weaken", "魔封じ": "mute", "魔吸収": "absorb",
        "魔装甲": "magic_armor", "魔阻害": "jam", "魔鉄塊": "magic_iron",
        "毒継続": "poison_t", "炎上継続": "burn_t", "負傷継続": "wound_t",
        "軟化継続": "soften_t", "毒反撃": "poison_r", "炎上反撃": "burn_r",
        "脱力反撃": "weaken_r", "祝福": "bless", "呪い": "curse",
    }
    ok = 0
    for jp, en in names.items():
        frames = sorted(glob.glob(os.path.join(IMG, "%s_*_220x220.png" % jp)))
        if not frames:
            continue
        # 取首帧做静态图标
        im = Image.open(frames[0]).convert("RGBA").resize((72, 72), Image.LANCZOS)
        save_webp(im, os.path.join(OUT, "status", en + ".webp"), 86)
        ok += 1
    print("status: %d 个" % ok)


def build_item():
    """道具图标 38 个（48x48 → 64x64）。"""
    files = sorted(glob.glob(os.path.join(IMG, "アイテム*_48x48.png")))
    n = 0
    for i, p in enumerate(files):
        im = Image.open(p).convert("RGBA").resize((64, 64), Image.LANCZOS)
        save_webp(im, os.path.join(OUT, "item", "%02d.webp" % i), 88)
        n += 1
    print("item: %d 个" % n)


def build_gear():
    """武器（杖）与饰品（指轮/护身符）图，553x178 取首帧，缩到 220x71。"""
    files = [f for f in os.listdir(IMG) if re.match(r"^(.+)_\d{4}_553x178\.png$", f)]
    groups = {}
    for f in files:
        base = re.sub(r"_(\d{4})_553x178\.png$", "", f)
        groups.setdefault(base, []).append(f)
    n = 0
    for base, fs in groups.items():
        fs.sort()
        im = Image.open(os.path.join(IMG, fs[0])).convert("RGBA")
        im = im.resize((220, 71), Image.LANCZOS)
        safe = re.sub(r"[^\w]", "_", base)
        save_webp(im, os.path.join(OUT, "gear", safe + ".webp"), 86)
        n += 1
    print("gear: %d 件（源组 %d）" % (n, len(groups)))


def main():
    mods = sys.argv[1:] or ["foe", "fx", "zone", "status", "item", "gear"]
    for m in mods:
        fn = globals().get("build_" + m)
        if fn:
            print("== %s ==" % m)
            fn()


if __name__ == "__main__":
    main()
