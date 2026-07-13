#!/usr/bin/env python3
"""
Revise the DMIU Building Contracting (S.P.S) L.L.C. undertaking letter to
Ajman Municipality so the stated workforce reads 168 labourers instead of 200.

The source is a flat, scanned/image PDF (no text layer), so the revision is
done as a localised image patch: the digits "200" are covered with a
reconstruction of the local paper/watermark background and "168" is rendered
in a Times-compatible serif (Liberation Serif) at the same size and position.
Everything else -- the DMIU logo, signature, UAE PASS digital-signature block,
company stamp and footer -- is preserved pixel-for-pixel.

Establishment context (from the Establishments app):
  Partner      : Dzhabrail Uruskhanov
  Establishment: D M I U BUILDING CONTRACTING S P S L L C (Ajman)
  Employees    : 168   (was stated as 200 in the original letter)
  MOHRE Code   : 2692457   (matches "Establishment No. 2692457" in the letter)

Usage:
  python3 scripts/revise_undertaking_168.py <source.pdf> <output.pdf>

Requires: pymupdf (fitz), pillow. The "200" bounding box below was located with
tesseract OCR on a 300 DPI render of the source page.
"""
import sys
import statistics
import fitz  # pymupdf
from PIL import Image, ImageDraw, ImageFont, ImageFilter

FONT = "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf"
DPI = 300
# "200" bounding box on the 300 DPI render (from OCR): left=1448 top=1801 w=60 h=30
OLD_BOX = (1448, 1801, 60, 30)
NEW_NUMBER = "168"


def render(src, dpi=DPI):
    page = fitz.open(src)[0]
    m = fitz.Matrix(dpi / 72, dpi / 72)
    pix = page.get_pixmap(matrix=m)
    return Image.frombytes("RGB", (pix.width, pix.height), pix.samples)


def patch_number(im):
    px = im.load()
    bx, by, bw, bh = OLD_BOX
    box = (bx - 6, by - 6, bx + bw + 6, by + bh + 6)
    x0, y0, x1, y1 = box

    # Reconstruct the background per-column from the surrounding light (paper +
    # watermark) pixels so the patch blends with the faint DMIU watermark.
    for x in range(x0, x1):
        lights = [px[x, y] for y in range(y0 - 33, y1 + 11) if min(px[x, y]) > 175]
        if len(lights) < 5:
            lights = [px[x, y] for y in range(y0 - 33, y1 + 11)]
        c = tuple(int(statistics.median([p[i] for p in lights])) for i in range(3))
        for y in range(y0, y1):
            px[x, y] = c
    im.paste(im.crop(box).filter(ImageFilter.GaussianBlur(0.6)), (x0, y0))

    # Render the replacement number, scaled to the original digit height.
    ink = (47, 47, 47)
    tmp = Image.new("RGBA", (300, 160), (0, 0, 0, 0))
    ImageDraw.Draw(tmp).text((10, 10), NEW_NUMBER, font=ImageFont.truetype(FONT, 90),
                             fill=ink + (255,))
    g = tmp.crop(tmp.getbbox())
    tw = int(g.width * bh / g.height)
    g = g.resize((tw, bh), Image.LANCZOS)
    im.paste(g, (bx + (bw - tw) // 2, by), g)
    return im


def main():
    src, out = sys.argv[1], sys.argv[2]
    im = patch_number(render(src))
    im.save(out, "PDF", resolution=float(DPI))
    print("wrote", out)


if __name__ == "__main__":
    main()
