"""Turn a picture into dense colour ASCII art for the site background (static/img/ascii/).
   python3 scripts/ascii-art.py in.png out.webp [cell_px=9] [width=2560] [wash=0.3]
One glyph per cell: glyph from brightness, colour from the pixels under it, over a dim wash of
the picture. The current background is the "earthrise" painting from the oasis drawings with
Pioneer rendered from the pioneer_humanoid URDF."""
import sys
from PIL import Image, ImageDraw, ImageFont, ImageEnhance, ImageFilter

src, out = sys.argv[1], sys.argv[2]
cell = int(sys.argv[3]) if len(sys.argv) > 3 else 9  # cell height in px
W = int(sys.argv[4]) if len(sys.argv) > 4 else 2560
wash = float(sys.argv[5]) if len(sys.argv) > 5 else 0.28

RAMP = " .,:;+*oxX#%&@"  # fuller glyphs, no long horizontal strokes
cell_h = cell
cell_w = round(cell * 0.62)
im = Image.open(src).convert('RGB')
H = round(W * im.height / im.width)
im = im.resize((W, H), Image.LANCZOS)
cols, rows = W // cell_w, H // cell_h
vivid = ImageEnhance.Color(im).enhance(1.3)
small = vivid.resize((cols, rows), Image.LANCZOS)
lum = small.convert('L')

font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf', int(cell_h * 1.0))

# background: a dim, slightly blurred copy of the painting so gaps aren't pure black
bg = ImageEnhance.Brightness(im.filter(ImageFilter.GaussianBlur(cell_h * 0.6))).enhance(wash)
canvas = bg.copy()
d = ImageDraw.Draw(canvas)
px, lp = small.load(), lum.load()
for r in range(rows):
    for c in range(cols):
        l = lp[c, r] / 255
        g = RAMP[min(len(RAMP) - 1, max(1, round(l ** 0.75 * (len(RAMP) - 1))))]
        R, G, B = px[c, r]
        k = 1.2 + (1 - l) * 0.6
        d.text((c * cell_w, r * cell_h - 1), g, fill=(min(255, int(R * k)), min(255, int(G * k)), min(255, int(B * k))), font=font)

glow = canvas.filter(ImageFilter.GaussianBlur(cell_h * 0.8))
out_im = Image.blend(canvas, glow, 0.22)
out_im = Image.eval(out_im, lambda v: min(255, int(v * 1.2)))
out_im.save(out, quality=86)
print(out, out_im.size, f'{cols}x{rows} cells')
