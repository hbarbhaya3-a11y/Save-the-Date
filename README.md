# Save the Date: Abhishek & Deepa

An animated, mobile-first (9:16) wedding "Save the Date" invitation. It is built with plain HTML, CSS, JavaScript and hand-drawn SVG. There are no build steps and no dependencies.

## Run it

Open `index.html` in a browser, or publish the repo with **GitHub Pages**: *Settings → Pages → Deploy from branch*.

## Mobile & reels

- **Phones:** the invitation fills the screen edge to edge on phones, including inside the Instagram and WhatsApp browsers. On desktop it sits centred on a blurred watercolour backdrop.
- **Link preview:** sharing the link on WhatsApp, Instagram or iMessage shows a card with the monogram (`assets/og.jpg`).
- **Reel video:** `save-the-date-reel.mp4` is a 1080×1920, 30 fps, ~25 s MP4 ready to upload as an Instagram Reel, WhatsApp Status or YouTube Short. Add the music in the Instagram editor.
- **Recording mode:** open the page with `#reel` at the end of the URL for a clean 9:16 frame that loops and hides the buttons, which is useful for screen recording.

## Timeline (~25 s)

| Time | Scene 1: calendar |
|------|-------------------|
| 0–1.2 s | "Save the Date" letters appear one by one along an arc |
| 0.9–1.5 s | Month and year fade up |
| 1.5 s | Calendar grid fades in from a blur |
| 3.9 s | A heart pops in below the calendar and starts beating |
| 6.3–12 s | The heart hops across the dates, up to the weekday row, then down onto the wedding date |
| 12.6 s | "FOR THE WEDDING OF" reveals letter by letter |
| 13.7 s | The couple's names write on (left-to-right wipe) |
| 16.2 s | Scene 1 fades out with a staggered exit |

| Time | Scene 2: monogram |
|------|-------------------|
| 17.3 s | A & D monogram, ring, florals and the Chhattisgarh skyline fade and zoom in |
| 18 s | "Save the Date" types out |
| 19.5 s | "25 . NOV . 2026" types out |
| 24 s | Fade out, then a Replay button appears |

The background florals and watercolour washes sway gently the whole time.

## Customise

Edit `CONFIG` at the top of `script.js`. It holds the names, initials, date, place, week start and looping. The calendar and the heart's path are generated from the date, so they stay correct for any date.

## Painted artwork

The page uses painted watercolour artwork from `assets/art/` when those files are present. Until then it shows the SVG drawings in `assets/`.

| File | What it is |
|------|------------|
| `background.webp` | watercolour paper background (9:16) |
| `couple.webp` | bride and groom |
| `skyline.webp` | temple and Bhilai steel-plant skyline |
| `florals.webp` | peach flower corner |

To turn a painting on a white background into a transparent PNG:

```
python3 tools/prepare_art.py couple-from-canva.jpg assets/art/couple.webp
```

## Music (optional)

Put an mp3 at `assets/music.mp3`. A sound toggle appears automatically. Browsers only allow audio after the first tap. Use music you have the rights to.

## Files

```
index.html         markup for both scenes and the inline monogram SVG
styles.css         layout, theme and CSS animations
script.js          timeline engine, arc text, calendar, heart path, typewriter
assets/            SVG illustrations: couple, temple, steel-plant skyline,
                   bushes, line-art flower, leaves, Chhattisgarh map
```
