"""Build an animated signature GIF for email use.

Style: sans-serif (Inter SemiBold), typewriter reveal — characters appear
left to right. Final frame holds the full name so any client that ignores
animation still shows a clean static result.
"""

from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

TEXT = "Harry Winteringham"
FONT_PATH = str(Path(__file__).parent / "fonts" / "Inter-SemiBold.otf")
FONT_SIZE = 44

WIDTH, HEIGHT = 600, 80
PADDING_LEFT = 4
BASELINE_Y = 58

INK = (17, 17, 17)
BG = (255, 255, 255)

PER_CHAR_MS = 55
PRE_HOLD_MS = 180
POST_HOLD_MS = 1600

OUT = Path("/Users/harrywinteringham/Desktop/Projects/harrysite/images/signature.gif")
OUT_STATIC = Path("/Users/harrywinteringham/Desktop/Projects/harrysite/images/signature.png")


def render(text: str) -> Image.Image:
    img = Image.new("RGB", (WIDTH, HEIGHT), BG)
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype(FONT_PATH, FONT_SIZE)
    draw.text((PADDING_LEFT, BASELINE_Y), text, font=font, fill=INK, anchor="ls")
    return img


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)

    frames: list[Image.Image] = []
    durations: list[int] = []

    frames.append(render(""))
    durations.append(PRE_HOLD_MS)

    for i in range(1, len(TEXT) + 1):
        frames.append(render(TEXT[:i]))
        durations.append(PER_CHAR_MS)

    full = render(TEXT)
    frames.append(full)
    durations.append(POST_HOLD_MS)

    palette_frames = [f.convert("P", palette=Image.Palette.ADAPTIVE, colors=32) for f in frames]
    palette_frames[0].save(
        OUT,
        save_all=True,
        append_images=palette_frames[1:],
        duration=durations,
        loop=1,
        disposal=2,
        optimize=True,
    )

    full.save(OUT_STATIC, optimize=True)
    print(f"wrote {OUT} ({OUT.stat().st_size // 1024} KB)")
    print(f"wrote {OUT_STATIC} ({OUT_STATIC.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
