import subprocess, sys, numpy as np
from PIL import Image, ImageDraw, ImageFont

W, H, FPS = 1280, 720, 30
V = '/home/user/humanoid-docs/wato-humanoid-wiki/static/img/humanoid/videos/'
U = '/root/.claude/uploads/55962481-3e5d-5a05-8be4-2aad8a44c881/'
S = '/tmp/claude-0/-home-user-humanoid-docs/55962481-3e5d-5a05-8be4-2aad8a44c881/scratchpad/'
HERO = U + 'f74f0a6b-pioneer-hero-appear.mp4'
MUSIC = S + 'music/EDM_Detection_Mode.mp3'
OUT = sys.argv[1]
FD = '/usr/share/fonts/opentype/inter/'
import glob, os
def font(name, size):
    p = glob.glob('/usr/share/fonts/**/' + name, recursive=True)[0]
    return ImageFont.truetype(p, size)

BEAT = 60 / 128.0
DROP_SRC = 135.05
INTRO = 12 * BEAT            # 5.625 s before the drop
OUTRO = 5.2


def tracked(draw, xy, text, f, fill, track, anchor='l'):
    widths = [draw.textlength(c, font=f) for c in text]
    total = sum(widths) + track * (len(text) - 1)
    x, y = xy
    if anchor == 'm': x -= total / 2
    if anchor == 'r': x -= total
    for c, w in zip(text, widths):
        draw.text((x, y), c, font=f, fill=fill)
        x += w + track
    return total


_cap_cache = {}
def caption(tag, sub=None):
    """bottom-left caption overlay -> premultiplied (rgb float, alpha float)"""
    key = (tag, sub)
    if key in _cap_cache: return _cap_cache[key]
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    # soft gradient at the bottom for legibility
    g = np.zeros((H, W, 4), np.uint8)
    ramp = np.clip((np.arange(H) - (H - 190)) / 190.0, 0, 1) ** 1.6
    g[..., 3] = (ramp * 185)[:, None]
    im = Image.alpha_composite(im, Image.fromarray(g))
    d = ImageDraw.Draw(im)
    y = H - 74 if sub else H - 62
    d.rectangle([56, y + 3, 59, y + 25], fill=(255, 255, 255, 255))
    tracked(d, (74, y), tag, font('Inter-SemiBold.otf', 24), (255, 255, 255, 255), 5.5)
    if sub:
        tracked(d, (74, y + 36), sub, font('Inter-Light.otf', 17), (255, 255, 255, 215), 2.2)
    a = np.asarray(im).astype(np.float32) / 255
    _cap_cache[key] = (a[..., :3] * a[..., 3:], a[..., 3:])
    return _cap_cache[key]


def decode(path, ss, dur, n, vf, w=W, h=H):
    """decode [ss, ss+dur] of path retimed to exactly n frames at w x h"""
    speed = dur / (n / FPS)
    f = f"setpts=(PTS-STARTPTS)/{speed:.6f},fps={FPS},{vf},format=rgb24"
    cmd = ['ffmpeg', '-v', 'error', '-ss', f'{ss}', '-t', f'{dur + 0.5}', '-i', path,
           '-vf', f, '-frames:v', str(n), '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    a = np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3)
    if len(a) < n:
        a = np.concatenate([a, np.repeat(a[-1:], n - len(a), 0)])
    return a.copy()


def cover(w=W, h=H, pre=''):
    return f"{pre}scale={w}:{h}:force_original_aspect_ratio=increase:flags=lanczos,crop={w}:{h}"

def contain(w=W, h=H, pre=''):
    return (f"{pre}scale={w}:{h}:force_original_aspect_ratio=decrease:flags=lanczos,"
            f"pad={w}:{h}:(ow-iw)/2:(oh-ih)/2:black")


def photo(path, box0, box1, n):
    """ken-burns from crop box0 to box1 (x, y, w as fractions; h from 16:9)"""
    im = Image.open(path).convert('RGB')
    iw, ih = im.size
    out = []
    for i in range(n):
        t = i / max(n - 1, 1)
        t = 1 - (1 - t) ** 2
        x, y, w = [a + (b - a) * t for a, b in zip(box0, box1)]
        cw = w * iw; ch = cw * H / W
        out.append(np.asarray(im.resize((W, H), Image.BICUBIC,
                   box=(x * iw, y * ih, x * iw + cw, y * ih + ch))))
    return np.stack(out)


def grid(cells, n, cols, gap=6):
    rows = (len(cells) + cols - 1) // cols
    cw = (W - gap * (cols + 1)) // cols; ch = (H - gap * (rows + 1)) // rows
    cw -= cw % 2; ch -= ch % 2
    fr = np.zeros((n, H, W, 3), np.uint8)
    for i, (p, ss, dur) in enumerate(cells):
        a = decode(p, ss, dur, n, cover(cw, ch), cw, ch)
        r, c = divmod(i, cols)
        x = gap + c * (cw + gap) + (W - gap - cols * (cw + gap)) // 2
        y = gap + r * (ch + gap) + (H - gap - rows * (ch + gap)) // 2
        fr[:, y:y + ch, x:x + cw] = a
    return fr


# ---------------------------------------------------------------- timeline
segs = []   # (beats, maker(n) -> frames, caption, flash)
def add(beats, mk, cap=None, flash=0.0):
    segs.append((beats, mk, None, flash))   # no on-screen captions

P = lambda name: U + name
ph_close, ph_torso, ph_tall, ph_wide = (P('b715934d-image.jpg'), P('c588fd5c-image.jpg'),
                                        P('dd4cf9b1-image.jpg'), P('f973be88-image.jpg'))
C_HW = ('PIONEER', "CANADA'S FIRST UNDERGRAD HUMANOID")
add(.5, lambda n: photo(ph_close, (.00, .16, 1.0), (.04, .19, .92), n), C_HW, flash=1.0)
add(.5, lambda n: photo(ph_torso, (.42, .22, .52), (.45, .24, .46), n), C_HW)
add(.5, lambda n: photo(ph_tall,  (.03, .46, .90), (.07, .47, .82), n), C_HW)
add(.5, lambda n: photo(ph_close, (.00, .22, .52), (.03, .25, .46), n), C_HW)
add(.5, lambda n: photo(ph_torso, (.00, .30, .60), (.03, .32, .54), n), C_HW)
add(.5, lambda n: photo(ph_wide,  (.14, .22, .62), (.18, .25, .54), n), C_HW)
add(.5, lambda n: photo(ph_close, (.36, .20, .60), (.40, .23, .52), n), C_HW)
add(.5, lambda n: photo(ph_torso, (.04, .04, .92), (.10, .08, .80), n), C_HW)

RTC = V + 'ditx-prompted-pick-place-async-rtc.mp4'
rtc_vf = contain(pre='crop=640:246:0:18,')
for ss, dur, prompt, fl in [(0.6, 9.8, 'stacking toy', .9), (21.6, 10.6, 'fire truck', .35),
                            (33.0, 12.0, 'green lion', .35)]:
    add(4, lambda n, ss=ss, dur=dur: decode(RTC, ss, dur, n, rtc_vf),
        ('PIONEER-1  ·  ASYNC REAL-TIME CHUNKING',
         f'“PUT THE {prompt.upper()} IN THE RED BOWL”  ·  UNSEEN LAYOUT'), fl)

C_CL = ('PIONEER-1  ·  CLOTH FOLDING', 'ONE POLICY  ·  T-SHIRTS AND PANTS, PICKED BY PROMPT')
add(4, lambda n: decode(V + 'cloth-fold-tshirt.mp4', 1.0, 18.5, n, contain()), C_CL, .9)
add(2, lambda n: decode(V + 'cloth-fold-pants.mp4', 0.2, 5.6, n, contain()), C_CL, .35)

C_LO = ('LOCOMOTION', 'REINFORCEMENT LEARNING  ·  WALKING, ROUGH TERRAIN, STAIRS, SNOW')
add(2, lambda n: decode(V + 'locomotion-walking.mp4', 2.0, 2.4, n, cover()), C_LO, .9)
add(4, lambda n: grid([(V + 'locomotion-walking.mp4', 5.0, 5.0),
                       (V + 'locomotion-rough-terrain.mp4', 40.0, 6.0),
                       (V + 'locomotion-stairs-height-scan.mp4', 6.0, 6.0),
                       (V + 'locomotion-snow-night.mp4', 1.0, 5.0)], n, 2), C_LO, .35)
add(2, lambda n: decode(V + 'locomotion-snow-night.mp4', 6.0, 2.6, n, cover()), C_LO, .35)
add(2, lambda n: decode(V + 'humanoid-boxing-rl.mp4', 4.0, 2.4, n, cover()),
    ('HUMANOID BOXING', 'REINFORCEMENT LEARNING'), .35)

C_MI = ('MOTION IMITATION', 'ONE POLICY  ·  RUN, DANCE, SPAR, HOP, SHUFFLE')
MI = V + 'motion-imitation-supermimic.mp4'
for i, ss in enumerate([1.0, 8.0, 18.5, 23.5, 47.0, 57.0]):
    add(1, lambda n, ss=ss: decode(MI, ss, 1.1, n, cover()), C_MI, .9 if i == 0 else .25)

rapid = [
    ('sim-hands-bench-vise.mp4', 12.0, 2.4, 'DEXTEROUS MANIPULATION'),
    ('sim-hands-parts-cabinet.mp4', 10.0, 2.4, 'DEXTEROUS MANIPULATION'),
    ('quest-teleop-drawer-stow.mp4', 14.0, 3.0, 'VR TELEOPERATION'),
    ('quest-teleop-bowling.mp4', 6.0, 3.0, 'VR TELEOPERATION'),
    ('pi05-leader-arm-teleop.mp4', 4.0, 1.6, 'LEADER-ARM DATA COLLECTION'),
    ('deformable-object-grasp.mp4', 1.0, 3.0, 'SOFT GRIPPER  ·  DEFORMABLE GRASP'),
    ('badminton-shuttlecock-tracking.mp4', 2.0, 1.4, 'SHUTTLECOCK TRACKING'),
    ('../badminton/blog/demo.mp4', 8.0, 3.0, 'BADMINTON  ·  SIM SERVE RETURNS'),
]
for i, (f, ss, dur, cap) in enumerate(rapid):
    add(1, lambda n, f=f, ss=ss, dur=dur: decode(V + f, ss, dur, n, cover()), (cap, None),
        .9 if i == 0 else .25)

add(2, lambda n: grid([(V + 'locomotion-rough-terrain.mp4', 60, 4), (RTC, 22, 6),
                       (V + 'locomotion-snow-night.mp4', 2, 3), (V + 'cloth-fold-tshirt.mp4', 4, 10),
                       (V + 'motion-imitation-supermimic.mp4', 56, 3),
                       (V + 'sim-hands-bench-vise.mp4', 14, 4),
                       (V + 'quest-teleop-drawer-stow.mp4', 14, 4), (V + 'humanoid-boxing-rl.mp4', 8, 3),
                       (V + 'locomotion-stairs-height-scan.mp4', 30, 4)], n, 3), None, .5)

# ---------------------------------------------------------------- render
enc = subprocess.Popen(
    ['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}',
     '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17',
     '-pix_fmt', 'yuv420p', S + 'video_only.mp4'], stdin=subprocess.PIPE)

fr_of = lambda t: int(round(t * FPS))
# intro: hero clip stretched to land exactly on the drop
n0 = fr_of(INTRO)
hero = decode(HERO, 0, 4.92, n0, cover())
for i in range(n0):
    f = hero[i].astype(np.float32)
    k = min(1, i / 12)                       # fade from black
    j = n0 - 1 - i
    if j < 5: f = f + (255 - f) * (1 - j / 5) * .85   # ramp to white into the drop
    enc.stdin.write(np.clip(f * k, 0, 255).astype(np.uint8).tobytes())

t = INTRO
total = n0
for beats, mk, cap, flash in segs:
    a, b = fr_of(t), fr_of(t + beats * BEAT)
    n = b - a
    fr = mk(n)
    assert fr.shape == (n, H, W, 3), fr.shape
    for i in range(n):
        f = fr[i].astype(np.float32)
        if cap:
            rgb, al = caption(*cap)
            f = f * (1 - al) + rgb * 255
        if flash and i < 5:
            f = f + (255 - f) * flash * (1 - i / 5) ** 1.5
        enc.stdin.write(np.clip(f, 0, 255).astype(np.uint8).tobytes())
    t += beats * BEAT
    total += n
POST = t - INTRO
print('post-drop beats', POST / BEAT, 'frames so far', total)

# outro: hero end frame, slow push-in, tagline
last = Image.fromarray(hero[-8])
n_out = fr_of(OUTRO)
ov = Image.new('RGBA', (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(ov)
tracked(d, (W / 2, 548), "CANADA'S FIRST UNDERGRAD HUMANOID", font('Inter-Regular.otf', 27),
        (255, 255, 255, 245), 10, 'm')
tracked(d, (W / 2, 604), 'WATONOMOUS  ·  UNIVERSITY OF WATERLOO', font('Inter-Light.otf', 17),
        (255, 255, 255, 200), 6, 'm')
tracked(d, (W / 2, 690), 'MUSIC: “EDM DETECTION MODE” BY KEVIN MACLEOD (INCOMPETECH.COM)  ·  CC BY 4.0',
        font('Inter-Light.otf', 10), (255, 255, 255, 110), 1.5, 'm')
ov = Image.new('RGBA', (W, H), (0, 0, 0, 0))   # no outro text
ova = np.asarray(ov).astype(np.float32) / 255
for i in range(n_out):
    z = 1 + 0.035 * i / n_out
    cw, ch = W / z, H / z
    f = np.asarray(last.resize((W, H), Image.BICUBIC,
                   box=((W - cw) / 2, (H - ch) / 2, (W + cw) / 2, (H + ch) / 2))).astype(np.float32)
    ta = np.clip((i - 12) / 20, 0, 1)
    a = ova[..., 3:] * ta
    f = f * (1 - a) + ova[..., :3] * 255 * a
    if i < 8: f = f + (255 - f) * (1 - i / 8) ** 1.5
    k = np.clip((n_out - i) / 24, 0, 1)      # fade to black
    enc.stdin.write(np.clip(f * k, 0, 255).astype(np.uint8).tobytes())
total += n_out
enc.stdin.close(); enc.wait()

dur = total / FPS
fade_st = INTRO + POST + 0.6
af = (f"afade=t=in:d=0.4,afade=t=out:st={fade_st:.3f}:d={dur - fade_st:.3f},"
      f"loudnorm=I=-14:TP=-1.5:LRA=11")
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', S + 'video_only.mp4',
                '-ss', f'{DROP_SRC - INTRO:.3f}', '-t', f'{dur:.3f}', '-i', MUSIC,
                '-af', af, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
                '-shortest', '-movflags', '+faststart', OUT], check=True)
print('wrote', OUT, dur)
