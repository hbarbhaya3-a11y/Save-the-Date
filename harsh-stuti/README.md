# Save the Date: Harsh & Stuti

Live: https://hbarbhaya3-a11y.github.io/Save-the-Date/harsh-stuti/

This invitation uses the same structure and flow as the original reel (see the [main README](../README.md)). It has two scenes, about 26 s, at 9:16:

1. **Calendar:** "Save the Date" appears letter by letter on an arc. Then NOVEMBER 2026 and the calendar come in, a heart hops across the dates onto the **30th**, and "FOR THE WEDDING OF / Harsh & Stuti" reveals. The illustrated couple stands in front of the Jain temple and Roots Cafe photos.
2. **Monogram:** the H & S logo draws in. "Save the Date" and "30 . NOV . 2026" type out over the same temple and cafe backdrop.

Theme: the same watercolour paper and florals as the main invitation. The bride wears a dusty-rose lehenga and the groom an ivory sherwani.

Assets in `assets/`:
- `art/couple.webp`: the painted couple. To swap it, run `python3 ../tools/cutout_paper.py <file> mask.png`, then apply the mask as the alpha channel.
- `art/background.webp`, `art/florals.webp`: the watercolour paper and florals, the same as the main invitation.
- `temple.jpg`, `cafe.jpg`: the venue photos used along the bottom.

Add `#reel` to the URL for a clean, looping frame for screen recording.
