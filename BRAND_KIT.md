# LocusQuant — Brand & Design System

A single reference for anyone (human or AI) producing anything for
LocusQuant going forward: the website, decks, one-pagers, emails, new
product pages. Read this before generating copy or UI. If a future
request conflicts with something here, flag the conflict rather than
silently picking one.

This file describes the system as implemented in this repo (`theme.css`,
`app.js`, and the pages: `/`, `/instruments/` + `assay|tare|scribe`,
`/loqos/`, `/maths/`, `/research/`, `/roadmap/`; `/whats-next/` redirects
to `/roadmap/`). If the live site and this file ever disagree,
treat the live site as the source of truth and update this file to match.

---

## 0. The six rules (read these first)

1. **Blackletter is a seal, not a typeface.** Only the LocusQuant wordmark,
   the LoQOS mark, and at most one word per page (e.g. "operating system").
2. **Ink means evidence.** The dark ink panel is reserved for proof: report
   specimens, the maths, claim checks. Never for decoration or hover states.
3. **Colour is status.** Muted green = passed / live, muted red = held /
   denied. Nothing else gets colour.
4. **The quill follows, never gates.** The ink trail lives in the homepage
   hero only. Every word is visible at rest; motion may nudge position or
   draw a rule, never hide text.
5. **Tabular figures, always.** Every count, version and number uses
   `font-variant-numeric: tabular-nums`.
6. **Typography carries the hierarchy.** One display size per screen, 65ch
   lines, no icons where a word will do, no stock imagery.

**The ledger line** (`hr.ledger`, a thin double rule like the line under a
total) is the only section divider on the site.

**Disclosure test for every sentence:** does it tell a buyer what they get,
or a competitor what to build? Only the first goes public. No prices
anywhere, including metadata.

---

## 1. Brand identity

- **Name**: LocusQuant (company). **LoQOS** is the product — an AI
  investment operating system.
- **Wordmark**: "LocusQuant" set in a blackletter display face
  (`UnifrakturCook`, fallback `Pinyon Script`). This typeface is used
  **only** for the brand name and the product name "LoQOS" — never for
  body copy, headings, or UI labels. Mixing an old-world blackletter mark
  with a clean modern sans body is the core visual tension of the brand;
  don't dilute it by using the blackletter face anywhere else.
- **Mobile monogram**: "LQ" (plain sans, not blackletter) replaces the
  full wordmark under ~680px viewport width.
- **Positioning line**: *"LocusQuant builds the operating system for
  AI-run investing, and sells the parts that make any fund's AI
  provable."* Homepage headline: *"Every AI decision in your fund,
  provable."*
- **Instruments** (public): **Assay** (backtest integrity), **Tare** (data
  feed value), **Scribe** (verified filing extraction). Pair with the house
  name ("Assay by LocusQuant") where space allows. Status labels: Available,
  Pilot, In build.
- **In build** (sneak peek only, on `/instruments/#in-build`): Folio,
  Charter, Keystone, Hourglass, Notary, plus the add-ons Quorum and Bursar.
  Each gets its name, one outcome line and a "Details shared with partners"
  hatch. Never a mechanism, a timeline or a price; the full detail stays in
  the partner deck. Dashed outlines only, never ink.
- **Tone in one phrase**: a calm, institutional operating system for
  people who have to defend their decisions to someone else (an
  investor, an auditor, a regulator) — not a flashy AI product.

---

## 2. Color

Single theme (no dark-mode toggle). Warm, aged-parchment cream as the
base, near-black ink as text, with occasional full-bleed black "bands"
for emphasis and a single multi-hue gradient reserved for brand
flourishes only.

### 2.1 Core palette (CSS custom properties)

```css
--bg:          #efe6d1;   /* page background — warm cream, not pure white */
--bg-elevated: #f7f0e0;   /* cards, panels, inputs sitting "above" the page */
--bg-sunken:   #e2d5b6;   /* wells, tables, badges sitting "below" the page */
--ink:         #17140d;   /* primary text, primary button fill, near-black (never pure #000) */
--ink-soft:    #4c4840;   /* secondary body text */
--ink-mute:    #666052;   /* tertiary text — eyebrows, captions, labels (still ~5.2:1 on --bg, AA) */
--line:        rgba(23, 20, 13, 0.12);  /* visible dividers */
--line-soft:   rgba(23, 20, 13, 0.06);  /* faint dividers, card borders */
```

On full-bleed dark bands (see §2.3), invert to:

```css
cream text:        #f5f2ea   /* body text on black */
cream text bright:  #f7f4ee  /* headings on black */
cream text muted:   rgba(245, 242, 234, 0.5–0.72)  /* secondary text on black, by opacity */
```

### 2.2 Status colors (use sparingly, functional only — not decorative)

```
positive / "ok" / pass:  #1f7a48  (dark bg variant: #4ade80)
negative / "blocked":    #b02a1e  (dark bg variant: #f87171)
form success:            #2f8f5b
form failure:            #c0392b
```

### 2.3 The one accent: a multi-hue gradient, used rarely

A single animated gradient sweep is the brand's only departure from
ink/cream. It exists in exactly one place on the whole site: the giant
blackletter footer wordmark. **Do not introduce it elsewhere** — it stops being
special if it's everywhere, and it must never leak into buttons, links,
or body text as a generic "AI purple" accent.

```css
background: linear-gradient(100deg,
    rgb(150, 128, 204) 0%,   /* violet */
    rgb(110, 178, 200) 22%,  /* teal */
    rgb(150, 196, 132) 44%,  /* green */
    rgb(220, 156, 120) 66%,  /* peach */
    rgb(212, 142, 184) 84%,  /* rose */
    rgb(150, 128, 204) 100%  /* back to violet */
);
background-size: 260% auto;
-webkit-background-clip: text;
background-clip: text;
color: transparent;
animation: gradWord 18s ease-in-out infinite alternate; /* background-position 0%→100% */
```

**Rule of thumb**: if you're tempted to reach for purple/blue "AI
gradient" styling anywhere else on the site, don't. Ink and cream carry
the brand; this gradient is a rare flourish, not a system color.

### 2.4 Full-bleed dark "bands"

The page alternates cream sections with occasional full-bleed black
sections (`background: var(--ink)`, text inverted to cream) for scroll
rhythm and emphasis — a hero statement, the footer, a "moments with the
product" section. Use dark bands as **punctuation**, not as the default
— most of the page should stay cream. When you add one, invert every
child element explicitly (eyebrow, heading, body, borders, links,
buttons) — don't rely on inheritance, dark bands need their own
`.eyebrow`/`.section-title`/etc. overrides colocated with the rest of the
component's CSS.

### 2.5 What NOT to do with color

- No pure black (`#000`) or pure white (`#fff`) — always the warm ink/cream tones above.
- No gradients on buttons, links, or UI chrome — flat `--ink` fill, flat cream text.
- No more than the one accent gradient described in §2.3.
- No neon glows / drop-shadow halos on text or buttons — they're expensive to render (see §6) and read as generic "AI product" styling this brand deliberately avoids.

---

## 3. Typography

```css
--font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text",
    "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
--font-frak: 'UnifrakturCook', 'Pinyon Script', serif;  /* brand/product name ONLY */
```

- Body text: system sans stack, `line-height: 1.6`, `letter-spacing: -0.011em`.
- Headings use `clamp()` for fluid sizing, always with tight negative
  letter-spacing (`-0.03em` to `-0.04em`) and `font-weight: 600–700`.
  Typical scale: hero H1 `clamp(2.2rem, 4.7vw, 3.7rem)`, section H2
  `clamp(2rem, 3.9vw, 3.1rem)`, tentpole/statement text
  `clamp(2.1rem, 5vw, 4rem)`.
- Eyebrows (small section labels above a heading): `0.78rem`, `600`
  weight, `0.15em` letter-spacing, uppercase, `--ink-mute`.
- Body copy inside cards: `0.95–1.02rem`, `--ink-soft`, `line-height: 1.6`.
- "Why this matters" / "What this means for you" lines: smaller
  (`0.88–0.9rem`), `--ink-mute`, sometimes italic — visually one step
  quieter than the surrounding body copy. This is a deliberate pattern:
  a plain-English translation line under anything technical, for a
  non-technical reader.

---

## 4. Layout & spacing

```css
--maxw:      1160px;   /* content container max-width */
--margin-col: 168px;   /* left "folio" column holding section number + label */
--radius:    18px;     /* standard card/input radius */
--radius-lg: 28px;     /* large panel radius (forms, big cards) */
pill/button radius: 999px  /* buttons, badges — always fully rounded */
```

- Container pattern: `max-width: var(--maxw); margin: 0 auto; padding: 0 28px;` (`22–24px` on mobile).
- Section vertical rhythm: `padding: 72px 0` desktop, tighter on mobile.
- Grids: `display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;` for card collections. One card per row-group may span the full width (`grid-column: 1 / -1`) as an asymmetric "featured" lead — don't make every grid perfectly uniform; one broken rhythm per grid reads as considered, not sloppy.
- Sections use a two-column ledger layout: a narrow sticky margin column
  (folio number + eyebrow) and the content column. Below 900px it folds to
  one column with the folio inline above the heading.
- Never three equal cards in a row. Use an asymmetric lead + stack, or
  hairline-divided rows.
- Breakpoints: `900px` (header collapses to a Menu button that opens a
  full-screen, numbered ledger index of the five pages with one-line
  descriptions from `data-sub`, then Request Access; grids fold),
  `680px` (single column). Test every page at 375px.
- Tables: never let a wide table squeeze on mobile. Wrap in a
  `.table-scroll { overflow-x: auto; }` container with a `min-width` on
  the table itself, so it scrolls horizontally instead of crushing
  columns illegible.

---

## 5. Components

### 5.1 Buttons

- **Primary**: `background: var(--ink); color: var(--bg-elevated);` pill radius, `padding: 11px 22px`, `font-weight: 600`. Hover: `translateY(-1px)`, `opacity: 0.9`. On a dark band, invert: cream background, ink text.
- **Ghost**: transparent background, `border: 1px solid var(--line)`, ink text. Hover: faint ink wash background.
- One primary CTA per screen/section at most. Don't stack two primary buttons side by side — pair a primary with a ghost.
- Every CTA button site-wide should read the same ("Request Access") unless there's a real reason to differ — don't invent bespoke button copy per section.

### 5.2 Cards

- `background: var(--bg-elevated); border: 1px solid var(--line-soft); border-radius: var(--radius); padding: 30px 28px;`
- **Hover**: a 3px lift and a slightly darker hairline. Cards do **not** invert to ink on hover any more: ink is reserved for evidence (rule 2).
- Small uppercase "tag" label above the card heading (`.card-tag`): `0.72rem`, `0.1em` letter-spacing, uppercase, `--ink-mute`.

### 5.3 FAQ / accordions

Native `<details>`/`<summary>`, styled (not JS-built from scratch), with a `+`/`−` marker that swaps on `[open]`. Make accordions **true accordions**: opening one closes any other open item (see the `toggle` event listener in `app.js`) — don't let multiple items stay open simultaneously.

### 5.4 Forms

- Labels above inputs, never floating/placeholder-only labels.
- `border-radius: 12px` inputs, `var(--bg)` background, `var(--line)` border, focus state: ink border + soft `box-shadow` ring.
- The form markup lives once, in `app.js`, and is injected on every page. Product pages pass `data-modal="assay"` (or tare/scribe) so the message opens pre-filled with the instrument's name. The line "A founder replies within one business day." sits under the submit button and beside every Request Access.
- Keep forms short. This brand's one live form is name/email/message — resist the urge to add many qualifying fields (firm size, AUM brackets, etc.) unless a specific stakeholder explicitly asks; it was tried once and reverted as too much friction.
- Confirmation copy should be human and specific ("We'll be in touch"), never a generic "Thank you!".

### 5.5 Status/badge chips

`background: var(--bg-sunken); border-radius: 999px; padding: 6px 13px; font-size: 0.8rem;` — used for small metadata tags (stack badges, version tags). Not for anything that needs to grab attention.

---

## 6. Motion & interaction

- **Standard ease**: `cubic-bezier(0.22, 1, 0.36, 1)` for everything — don't introduce other easing curves.
- **Scroll reveals**: `[data-reveal]` elements are fully visible at rest. With motion allowed, they rise 18px into place, and ledger lines draw from left to right. Never animate opacity from 0 or blur text; a skimmer must never see empty parchment. Respect `prefers-reduced-motion: reduce`.
- **The quill**: a canvas ink trail confined to the homepage hero (`[data-quill]`), fine pointers only. It follows the cursor, orbits the audit panel when idle, and pauses when the hero is off-screen.
- **Interactive canvas backgrounds** (e.g. the "fiber grass" hero effect): keep these paused via `IntersectionObserver` when scrolled off-screen. A canvas that redraws forever regardless of visibility is a real, previously-shipped performance bug on this site — don't repeat it.
- **Filters are expensive — use sparingly**: a `drop-shadow()` filter combined with a continuously animated element (e.g. an animated gradient-clip text) forces a full re-rasterize every frame and has previously caused visible jank. If you want a glow, prefer a static `box-shadow`/`filter` on a non-animating element, or drop the glow.
- **`position: fixed` + `mix-blend-mode`**: avoid combining these across a full-viewport element. A fixed, blended overlay has to be recomposited against newly-scrolled content every frame and has previously caused measurable scroll jank on this site. Prefer `position: absolute` (scrolls with the page, composited once) for full-page texture/overlay effects.

---

## 7. Voice & copy rules

- **Register**: calm, precise, institutional — written for a portfolio manager, CTO, or compliance officer who has to defend a decision to someone else. Never hype, never "AI-powered" marketing-speak.
- **Banned words/phrases**: "revolutionary", "game-changing", "cutting-edge", "next-gen", "unleash", "supercharge", "magic", "AI-powered alpha", "autonomous hedge fund". If a sentence could appear on a generic AI-startup landing page, rewrite it more specifically.
- **"Why this matters" pattern**: under any technical/architectural section, add one plain-English sentence starting "Why this matters:" for a non-technical reader. Keep it to one sentence, visually lighter than body copy (see §3).
- **"What this means for you" pattern**: same idea, used at the end of a maths/technical explainer card.
- **Numbers discipline**: never publish real production thresholds, limits, or performance figures (no backtest returns, win rates, Sharpe ratios, position-size maximums, drawdown triggers). Illustrative/toy numbers are fine **if explicitly labeled illustrative** and if they don't reveal how a real number is computed. When in doubt about whether a number reveals a design internal, leave it out rather than publish and redact later.
- **Status honesty**: always state plainly what's live vs. what's roadmap. Never imply something is in production if it isn't. "Paper trading only, no live capital at risk" is a standing disclosure, not optional fine print.
- **Legal/compliance framing**: the company builds software, not an investable fund — copy must never solicit investment or imply an offering. Keep this distinction explicit anywhere the product is described.

---

## 8. Accessibility baseline

Non-negotiable on every new page/component:

- Visible focus states on every interactive element (`:focus-visible` outline, not just a browser default).
- A skip-to-content link as the first focusable element on the page.
- All form fields have real `<label>` elements (not placeholder-only).
- Body text meets WCAG AA contrast against its background (the `--ink-mute` value in §2.1 is tuned to ~5.2:1 against `--bg` — don't lighten it further without rechecking).
- Respect `prefers-reduced-motion`.
- Decorative elements (canvas effects, brand marks used twice on a page) get `aria-hidden="true"`; functional icons/buttons get real `aria-label`s.

---

## 9. How to use this file

- Treat this as the first thing to read before generating any new
  LocusQuant page, section, deck slide, or UI mockup.
- If a request conflicts with something here (e.g., "make it purple",
  "add a big glowing drop-shadow everywhere"), say so explicitly and
  confirm before proceeding — don't silently override brand rules or
  silently comply and quietly erode the system.
- When the live site's `theme.css` changes in a way that should update
  this file (new component pattern, new color, new motion rule), update
  this file in the same change — don't let it drift out of sync.
