export function Notes() {
  return (
    <article className="prose-sm flex max-w-prose flex-col gap-4 text-sm leading-relaxed [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-medium">
      <h2>Notation</h2>
      <p>
        A Munsell colour is written <code>hue value/chroma</code>, for example <code>5R 4/14</code>. Greys drop the hue and
        chroma and are written <code>N 5/</code>.
      </p>
      <p>
        <strong>Hue</strong> is one of ten families, R, YR, Y, GY, G, BG, B, PB, P, RP, each split into steps. This data uses
        2.5, 5, 7.5 and 10, so 40 hue pages around the circle. 5 is the middle of a family; 10R sits right next to 2.5YR.
        Opposite hues are 20 pages apart: 5R faces 5BG.
      </p>
      <p>
        <strong>Value</strong> is lightness, 0 for black to 10 for white. The chips run 1 to 9. Every chip with the same value
        has the same luminance Y, whatever its hue, so a value row looks evenly light. Value is close to CIE L* / 10. 0 and 10
        are theoretical: no physical sample is pure black or pure white, and printed books don't carry value 1 either.
      </p>
      <p>
        <strong>Chroma</strong> is how far a colour is from the grey of the same value. It has no fixed maximum. Each hue
        reaches its peak at a different value: yellow peaks light, purple-blue peaks dark. That's why the Munsell solid is a
        lopsided tree and not a sphere or cylinder. The highest chip in the data is 7.5PB 1/38; a "vivid" everyday surface sits
        around chroma 8. The Solid and Limits tabs show this.
      </p>

      <h2>Where the numbers come from</h2>
      <p>
        Munsell built the system by eye around 1905. In 1943 the Optical Society of America remeasured it and published the
        "renotation" tables: xyY chromaticity for every chip, under Illuminant C. The "real" subset used here has 2734
        chips, the ones that can exist as surface colours. The 1943 tables give Y relative to magnesium oxide; this app takes Y
        from the ASTM D1535 value function instead (value 5 is Y 19.27, not 19.77), like colour-science does. Neutrals N1
        to N9 are added the same way.
      </p>

      <h2>Getting to screen colour</h2>
      <p>
        xyY to XYZ, adapt from Illuminant C to D65 with a Bradford transform, then the sRGB matrix and gamma. Skipping the
        adaptation is the bug the 2024 version of Werth's wheel had: greys come out slightly blue. The header switch lets you
        flip between the two.
      </p>
      <p>
        1536 of the 2743 chips (56%) fit in sRGB with the Bradford conversion. The rest are hidden by default. Turn on "Show out of gamut" to see them
        clipped and hatched; their hex is the nearest sRGB colour, not the real one.
      </p>

      <h2>Compared with other systems</h2>
      <p>
        <strong>HSL</strong> is a reshuffle of RGB bytes. Its L is not perceptual, so <code>hsl(60 100% 50%)</code> yellow is
        far lighter than <code>hsl(240 100% 50%)</code> blue. See the Compare tab.
      </p>
      <p>
        <strong>CIELAB / LCh</strong> (1976) was fitted partly to Munsell data, which is why L* lines up with value. Its hue
        spacing is less even than Munsell's, especially in blues. CIELAB and CIECAM02 have replaced Munsell for most
        measurement work, but both build on the idea of separate, perceptually spaced lightness, hue and colourfulness.
      </p>
      <p>
        <strong>OKLCH</strong> (2020) is a newer fit with better hue uniformity than LCh and is usable directly in CSS. It is
        the closest thing to a Munsell-like space you can type into a stylesheet.
      </p>

      <h2>Sources</h2>
      <ul className="list-disc pl-5">
        <li>
          <a className="underline" href="https://www.andrewwerth.com/aboutmunsell/">Andrew Werth, About the Munsell wheel</a>
        </li>
        <li>
          <a className="underline" href="https://en.wikipedia.org/wiki/Munsell_color_system">Wikipedia, Munsell color system</a>
        </li>
        <li>
          <a className="underline" href="https://www.colour-science.org/">colour-science</a>, renotation dataset and reference
          conversions
        </li>
      </ul>
    </article>
  )
}
