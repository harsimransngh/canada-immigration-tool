# Design System: Canada Immigration Tool (public CRS simulator)

Status: recommendation document, researched 2026-11-15. Nothing in `index.html` was changed by this document.
Scope: one static HTML file, no frameworks, no build step. Every rule below must be implementable in the single `<style>` block plus small markup changes.
Current live styling audited: `index.html` lines 8 to 36 (CSS custom properties, dark header, two column grid, cards, pills, KPI tiles).

## 1. What the research says

### 1.1 How leading CRS calculators present themselves

Checked 2026-11-15: CRS Meter (crsmeter.com), CRS Tool (crstool.com), PointTally / CRS Calculator Canada (crscalculatorcanada.com), ee26.ca, and IRCC's own CRS tool pattern on canada.ca. Common, proven patterns:

- The score is labelled an estimate at the score itself, not only in the footer. CRS Meter puts "An estimate, not a decision on eligibility or an invitation guarantee" directly under the score heading. PointTally repeats "Unofficial estimate, not immigration advice" above the fold and again in the footer.
- A visible freshness signal: "Last reviewed: November 13, 2026", "Grid and draw data last verified [date] against IRCC sources", "Updated after every draw". Users trust a dated tool more than an undated one.
- A privacy line near the form: "Your answers stay in this browser. Nothing is sent to a server" (CRS Tool, CRS Meter). Our tool has an optional account save, so our line must be exact: simulation runs locally, saving only happens if the visitor signs in and clicks Save.
- An FAQ or short answer to "Is this the official calculator?" Answer: no, independent, not affiliated with IRCC or the Government of Canada, official score lives in the Express Entry profile, with a link to the official CRS criteria on canada.ca.
- Layout: single intake flow with the result updating live, a section by section breakdown table with the cap for each section, and the result panel kept visible (sticky on desktop) while the user edits answers.
- Trust is carried by restraint: white background, one accent colour, plain language, no stock photos of flags or skylines, no countdown timers or sales pressure. Law firm calculators that add lead capture forms and popups read as less trustworthy, not more.

### 1.2 Government of Canada design: borrow cues, do not impersonate

Sources: design.canada.ca (Canada.ca content and design specifications, typography and colour styles), design-system.canada.ca (GC Design System, GCDS tokens), WET/GCWeb footer and header specs.

Facts about the GC system:

- Typography: Lato for headings, Noto Sans for body. Canada.ca body text is 20px on desktop, 18px on small screens, line height about 1.6. H1 is Lato bold, 41px desktop, 37px mobile, with a short red bar under the title (72px wide, 6px thick, colour #A62A1E).
- Colours: text primary #333333, secondary #595959 (GCDS) ; structural dark blue #26374A (footer band, accents, primary buttons in GCWeb); link default #284162, link hover and focus #0535D2, visited #7834BC; error and required indicator red #D3080C; GCDS danger text #B3192E; the bright FIP red is reserved for the Government of Canada signature (the flag and the Canada wordmark).
- Spacing: GCDS uses an 8px based spacing scale exposed as tokens.
- GC components are built to WCAG 2.1 AA, including visible focus states on every interactive element.

Recommendation: borrow the cues, not the identity. This is the right call for three reasons.

1. Legal and platform risk: the Canada wordmark, the flag signature bar, the coat of arms and the official bilingual signature are federal identity (FIP) assets. Reproducing them on a private tool implies government endorsement that does not exist, and IRCC related scams are common enough that mimicking the signature actively harms trust once noticed.
2. Trust: what makes canada.ca feel trustworthy is discipline, not the logo. White dominant pages, dark blue structure, restrained red used sparingly, generous type sizes, plain language, dated content. All of that is borrowable without copying identity assets.
3. Differentiation: the tool needs its own product identity (it has accounts, saved profiles and what-if scenarios that canada.ca does not offer). A dark blue header of our own, with our own name and a clear "independent tool" line, reads as a serious Canadian product next to canada.ca, not a copy of it.

Hard rules that follow from this:

- Never use: the Canada wordmark, the national flag as a logo, the coat of arms, the black signature bar, a fake EN/FR toggle, the domain style "canada.ca" in our name or title, or the exact H1 red bar treatment as a brand device.
- Always carry: an "Independent tool, not affiliated with IRCC or the Government of Canada" line in the header area and the full disclaimer in the footer (see section 7).
- Safe to borrow: dark blue #26374A for header and footer structure, link blue family, Lato/Noto Sans style typography pairing (or a close system equivalent), 8px spacing discipline, large readable body text, plain language labels.

### 1.3 Accessible design basics applied to this tool

- WCAG 2.1 AA is the target (the standard GC sites commit to, and the practical legal reference point in Canada).
- Text contrast: 4.5:1 minimum for normal text, 3:1 for large text (24px and up, or 19px bold and up).
- Non-text contrast (WCAG 1.4.11): input borders, focus indicators, and the meaningful parts of the score bar need 3:1 against adjacent colours. This is the current site's biggest failure (see section 2).
- Focus visible (WCAG 2.4.7): every link, button, input and select needs a clear focus indicator. A 2px to 3px solid outline in a high contrast blue, offset from the element, is the GC pattern.
- Touch targets: minimum 44px height for buttons and tappable rows (Apple and Material guidance; WCAG 2.2 AA floor is 24px, which is too small for a form used on phones in the field).
- Inputs at 16px font size minimum on mobile, or iOS Safari auto-zooms the page on focus.
- Status must never be colour alone: the PASS / CLOSE / FAIL pills already carry text labels, keep that and never reduce them to dots.
- Live results: the score updates on every keystroke. Screen reader users need a polite live region on the score total only (aria-live="polite" on the score number, debounced by the natural pause in typing), not on the whole breakdown table.
- Respect prefers-reduced-motion for any transition on the score bar.

## 2. Audit of the current CSS (what is wrong today)

Measured with a contrast checker against the current tokens in `index.html`:

| Element | Current value | Measured contrast | Verdict |
|---|---|---|---|
| Body text #17202A on white | slate near black | 16.45:1 | Pass, excellent |
| Body text on page bg #F6F8FA | | 15.45:1 | Pass |
| Muted text #5B6B7A on white | notes, sub text, 13 to 14px | 5.48:1 | Pass AA, but tight at 13px |
| Muted text #5B6B7A on #F6F8FA | footer, notes on cards | 5.15:1 | Pass AA, tight |
| Header sub text #C8D3DD on #17202A | header paragraph | 10.82:1 | Pass |
| Red #D80621 on white | score bar fill, red button | 5.29:1 | Pass AA even for text; fine as accent |
| Input border #DFE6EC on white | every input and select edge | 1.26:1 | FAIL. WCAG 1.4.11 needs 3:1 for the boundary of a form control |
| Card border #DFE6EC on #F6F8FA | card edges | 1.18:1 | Decorative only, acceptable if cards also have the white fill difference, but too faint to read as structure |
| Link #0B5CAD on white | footer links | 6.67:1 | Pass |
| Pill PASS #137547 on #E3F4EA | 12px bold | 5.02:1 | Pass |
| Pill CLOSE #B7791F on #FDF0D5 | 12px bold | 3.22:1 | FAIL for small text (needs 4.5:1) |
| Pill FAIL #B42318 on #FDE8E5 | 12px bold | 5.59:1 | Pass |
| Score bar fill vs track | #D80621 vs #EDF1F4 | 4.66:1 | Pass |

Structural gaps, not colour:

1. No `:focus` or `:focus-visible` styles anywhere in the stylesheet. Keyboard users get inconsistent browser defaults, and the near invisible input borders make the focused field hard to find.
2. No grouping in the intake form. Sixteen fields sit in one card with no sections. Competitors and GC forms group with headings or fieldsets (About you, Language, Work experience, Extra points).
3. On mobile the result card stacks below the entire form (grid collapses at 860px, form first in source order). A phone user answers sixteen questions before seeing any score. The score needs to be sticky or summarised at the top on small screens.
4. Input font size is 15px: triggers auto-zoom on iOS Safari. Buttons are about 38 to 40px tall: under the 44px touch target guidance.
5. Radii are ad hoc: cards 14px, KPI tiles 10px, inputs and buttons 9px, pills and bar 99px. Spacing is ad hoc: 4, 6, 10, 16, 18, 20, 28px all in use with no scale.
6. Numbers in the breakdown table are not tabular: proportional digits make the points column jitter as values change. Add `font-variant-numeric: tabular-nums` to score, KPI and table number cells.
7. The score bar has no accessible name or value. The adjacent gap text covers the meaning for sighted users; add `role="progressbar"` with aria values, or `aria-hidden="true"` on the bar since the text already carries it. Pick one, do not double announce.
8. The disclaimer exists only in the footer and one note under the breakdown. There is no estimate label attached to the score itself and no "last checked" date near the result, which is the pattern every credible competitor uses.
9. The header dark slate #17202A is a generic tech colour. Swapping to the GC structural blue #26374A costs nothing and buys the Canadian public sector familiarity described in section 1.2.
10. No `prefers-reduced-motion` handling, no print consideration, and link styling relies on colour alone in body text (add underline for in-text links).

## 3. Colour tokens (recommended)

Replace the current `:root` block with semantic tokens. Values are chosen to pass WCAG 2.1 AA in their intended pairings; the measured ratio is listed for each intended use.

```css
:root{
  /* Surfaces */
  --bg:#f6f8fa;            /* page background */
  --surface:#ffffff;       /* cards */
  --surface-alt:#eef2f5;   /* KPI tiles, table header row */
  /* Text */
  --ink:#1a1a1a;           /* primary text, 16.4:1 area on white; use #333 if matching GC exactly is preferred, both pass easily */
  --ink-strong:#17202a;    /* score digits and headings, keep current */
  --muted:#52616e;         /* secondary text: darken current #5b6b7a one step for small text headroom (about 6.3:1 on white) */
  --muted-on-dark:#c8d3dd; /* header paragraph on dark blue, 10.8:1 on #17202a, similar on #26374a */
  /* Structure */
  --brand-dark:#26374a;    /* header and footer band, white text on it is 12.15:1 */
  --line:#c9d3db;          /* card borders and table rules, decorative */
  --field-border:#6f6f6f;  /* input and select borders, 5.02:1 on white, passes 1.4.11 with room */
  /* Action */
  --accent:#d80621;        /* primary action and score bar only, white text on it 5.29:1 */
  --link:#284162;          /* links, 10.38:1 on white */
  --link-hover:#0535d2;    /* also the focus colour, 8.58:1 on white */
  --focus:#0535d2;         /* focus outline, 3px solid */
  /* Status (text on tint pairs, all pass 4.5:1 at 12px bold) */
  --pass-ink:#0e5c38;  --pass-bg:#e3f4ea;  /* 7.06:1 */
  --close-ink:#8a5a00; --close-bg:#fdf0d5; /* 5.25:1, fixes the current failing amber */
  --fail-ink:#b42318;  --fail-bg:#fde8e5;  /* 5.59:1, unchanged */
  --danger:#b3192e;        /* form errors and destructive text, 6.78:1 on white */
}
```

Rules for colour use:

- Red (--accent) is rationed: primary button, score bar fill, nothing else. It is the FIP-adjacent colour; overuse both cheapens it and edges toward government mimicry.
- Dark blue (--brand-dark) carries structure: header, footer, secondary buttons. This is the colour users will associate with the product.
- Status colours appear only in the eligibility pills and inline status text. Never use status green or amber as decoration.
- Every text colour must be used only in its tested pairing. If a new pairing is introduced, measure it before shipping; the pass bar is 4.5:1 for text under 18px, 3:1 for large text and for control borders.
- Do not add a dark mode in v1. The audience uses this in daylight, offices and settlement agencies; a single well tested light theme beats two half tested themes. (Canada.ca is light only for the same reason.)

## 4. Typography

Font stack. Two options, pick one and commit:

- Option A (recommended, zero network cost, instant load): keep the current system stack and drop Inter (it is named first today but is not loaded anywhere, so it silently falls back). Use: `font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;`
- Option B (closer to Canada.ca): load Lato (700 only, headings) and Noto Sans (400, 600) from Google Fonts with `font-display: swap`. This matches the GC pairing and reads as familiar to anyone who uses canada.ca. Cost: one external request and a flash of fallback text. Only take this if the familiarity win is worth it; never load more than three font files.

Type scale (1.25 ratio, rem based, root 16px):

| Token | Size | Weight | Use |
|---|---|---|---|
| --text-score | 52px / 3.25rem | 800 | CRS total only |
| --text-h1 | 32px / 2rem | 700 | Page title in header (current 30px, close enough, formalise it) |
| --text-h2 | 22px / 1.375rem | 700 | Card titles |
| --text-h3 | 17px / 1.0625rem | 700 | Card sub sections |
| --text-body | 16px / 1rem | 400 | Body, table cells, buttons |
| --text-input | 16px / 1rem | 400 | Inputs and selects (16px is mandatory, see iOS zoom rule) |
| --text-label | 14px / 0.875rem | 600 | Field labels (up from 13px) |
| --text-small | 13px / 0.8125rem | 400 | Notes, hints, footer. Never below 13px anywhere |
| --text-pill | 12px / 0.75rem | 700 | Pills only, uppercase, letter-spacing 0.02em |

Line heights: headings 1.2, body 1.5 (current value, keep), notes 1.45.
Numbers: `font-variant-numeric: tabular-nums` on the score, KPI values, and the points column of every table.
Reading width: body copy inside cards is fine at the current 1080px container; long explanatory paragraphs (outlook, plan) should cap at about 70ch so lines stay readable.

## 5. Spacing, radius, layout tokens

```css
:root{
  --space-1:4px;  --space-2:8px;  --space-3:12px; --space-4:16px;
  --space-5:24px; --space-6:32px; --space-7:48px;
  --radius-sm:8px;   /* inputs, buttons, KPI tiles */
  --radius-lg:12px;  /* cards */
  --radius-pill:999px;
  --container:1080px;
}
```

- Base unit 4px, rhythm steps as above (mirrors the GCDS 8px-based discipline at a finer grain). Replace the current ad hoc values (9, 10, 14, 18, 28px) with tokens.
- Card padding: --space-5 (24px) desktop, --space-4 (16px) under 560px. Current 18px sits between steps.
- Vertical rhythm: cards separated by --space-4; sections inside cards by --space-4; label to input gap --space-1; input groups separated by --space-3.
- Layout breakpoints: keep the two breakpoints, rename by intent: 860px (form and result stack), 560px (field pairs stack, KPI tiles stack). Add one behaviour at 860px: the result card gets `position: sticky; top: 0` is wrong for a full card; instead add a compact sticky score strip on mobile (score total plus gap, one line, --brand-dark background) that appears once the user scrolls past the header. If that is too much JS for v1, the cheaper fix is source order: on mobile only, use flex order to show a slim score summary above the form while the full result card stays below it.
- Header: padding --space-6 vertical. Footer: same dark band as header for bookend structure (GC footer pattern), with disclaimer text in white at 13px minimum (white on #26374A is 12.15:1, so small text is safe there).

## 6. Component rules

### Cards
- White surface, 1px solid --line, radius --radius-lg, no shadow (shadows read as consumer fintech; GC and the credible competitors use flat bordered cards).
- One card, one job: Profile, Result, Eligibility, Recommendations, Outlook, Save, Draws. Card title is an h2, sub sections h3. Never nest cards; KPI tiles inside the result card are tiles, not cards (no border, --surface-alt fill).

### Form (intake)
- Group the sixteen fields into four fieldsets with visible legends styled as h3: "About you", "Language", "Work experience", "Extra points". Fieldset and legend give screen readers the grouping for free.
- Label above input, always visible, never placeholder-as-label. Label 14px 600 weight, hint text below the label (not below the input) in --text-small --muted, following the GC and GOV.UK pattern.
- Inputs and selects: height 44px minimum, padding 10px 12px, border 1px solid --field-border, radius --radius-sm, background white. On focus: border stays, plus 3px outline --focus with 2px offset (outline, not box-shadow, so it survives forced-colors mode).
- Number inputs for the four language scores stay as a 4-across row on desktop, 2 by 2 on mobile (current behaviour, keep).
- Error pattern (for future validation): red left border is not enough; use --danger text message under the field, `aria-describedby` pointing at it, and an error summary at the top of the card if more than one field fails (GC pattern). No field currently validates, but the pattern must exist before any required-field logic is added.
- The form recalculates live; say so once, in one line under the card title: "Your score updates as you answer." Do not add a Calculate button.
- Do not mark fields required or optional when every field has a working default, as today. If defaults are ever removed, mark optional fields "(optional)" in the label (GC pattern) rather than starring required ones.

### Buttons
- Primary (Save profile, Create account): --accent background, white text, radius --radius-sm, min-height 44px, padding 12px 20px, 16px font.
- Secondary (Sign in, Sign out, scenario buttons, Load): white background, 1px solid --brand-dark border, --brand-dark text.
- Scenario (what-if) buttons are toggles in effect: the active scenario must look active (filled --brand-dark, white text) and expose `aria-pressed`. Today they are indistinguishable after a click.
- One primary button per card section. The current Save card has five buttons in a row; group account actions (Create account, Sign in, Sign out) separately from profile actions (Save, Load) with a divider and small group labels.
- Disabled state: 50% opacity is not enough on its own; also `cursor: not-allowed` and never rely on colour alone.
- All buttons and links get the same :focus-visible treatment: 3px solid --focus outline, 2px offset.

### Score display
- The score block is the product. Order inside it: label "Your estimated CRS score" (the word estimated is part of the label, not a footnote), the number at --text-score, "out of 1,270" beside or under it, the bar, then one plain sentence stating the gap to the last cutoff with the draw date.
- Bar: height 12px, track --surface-alt darkened one step for separation, fill --accent, radius --radius-pill. Add `role="progressbar"`, `aria-valuemin="0"`, `aria-valuemax="1270"`, `aria-valuenow` updated in the same render function, and `aria-label="Estimated CRS score"`.
- The score number gets `aria-live="polite"` so screen reader users hear the new total after they change a field. Do not put the whole card in a live region.
- KPI tiles (last cutoff, 2026 range, gap): label on top in --text-small --muted, value 20px 700 tabular, context line under. The gap tile should turn its value --fail-ink when the gap is large and --pass-ink at or above the cutoff, but the number and the word "points below/above" always carry the meaning in text.
- Animate the bar width with a 200ms transition, disabled under prefers-reduced-motion. Never animate the number counting up; it delays the answer and annoys repeat users.

### Pills (eligibility status)
- Text is mandatory: PASS, CLOSE, FAIL in uppercase 12px 700, on the tint pairs from section 3. Add a leading symbol for a second, non-colour channel: check mark for pass, tilde or half circle for close, cross for fail (plain text glyphs are fine: ✓, ~, ✕). Keep pill width consistent by using a fixed min-width and centred text so the status column does not jitter.
- Never use the pill colours for anything else on the page.

### Tables (breakdown, eligibility, draws)
- Header row: --surface-alt background, 13px uppercase labels, left aligned except the points column.
- Points column: right aligned, 700 weight, tabular numbers. Row rules 1px --line. Row padding 8px vertical (current 7px, move to token).
- Total row in the breakdown: top border 2px --ink-strong, bold both cells. Subtotal rows (core, transferability, additional) get --surface-alt background so the structure of the grid is visible.
- On mobile, tables stay tables (do not card-ify them); allow horizontal scroll on the draws table only, wrapped in a div with `overflow-x:auto` and a visible focus outline when it scrolls by keyboard.

### Header and footer
- Header: --brand-dark band, product name as h1 in white, one sentence value proposition in --muted-on-dark, and the independence line in the same band (see section 7). No flag, no wordmark, no red bar under the title.
- Footer: --brand-dark band, white text: full disclaimer, sources with links (IRCC CRS criteria, official CRS tool), data freshness date, and "Built by" line if wanted. Links in the footer are white and underlined; --link blue does not work on dark blue.

## 7. Trust and disclaimer placement rules

Four placements, all mandatory, in this order of visibility:

1. Header strip (always visible, first screen): one line under the value proposition. Wording: "Independent tool. Not affiliated with IRCC or the Government of Canada." Style: --text-small, --muted-on-dark. This mirrors what CRS Meter and PointTally do with their unofficial labels, moved up to the header where it cannot be missed.
2. At the score: the word "Estimated" in the score label itself, plus one sentence under the bar: "Estimate only, for planning. Your official score is the one in your Express Entry profile." The current page has this sentence only under the breakdown table; move a copy up to the score.
3. Freshness line at the result card: "Rules and draw data checked [date] against IRCC sources." Update the date every time draw data changes; a stale date is worse than none. Current page has this in a note; promote it to sit directly under the score gap sentence.
4. Footer (full text): the existing disclaimer, kept and expanded with: not legal or immigration advice; scores are estimates from the answers given; IRCC's assessment of documents is final; link to the official CRS tool and CRS criteria on canada.ca; privacy line stating simulation is local and profiles are saved only for signed-in users who click Save, stored under row level security.

Additional trust rules:

- Every draw figure on the page carries its date (the draws table already does this; keep it as a rule for future edits).
- No testimonial, success story, or "X people got ITAs" claims without a verifiable source. None exist today; keep it that way.
- No urgency devices: no countdowns to draws, no "limited" anything. The countdowns to the user's own test and permit dates are factual and stay.
- Sources are linked, not just named: "IRCC rounds of invitations" should link to the canada.ca rounds page, "CRS criteria" to the criteria page.

## 8. Accessibility requirements (ship checklist)

Target WCAG 2.1 AA. Each item is testable in the single file:

- [ ] All text pairings at 4.5:1 or better (3:1 for 24px+ text). Use the token table in section 3; re-measure any new pairing.
- [ ] Input and select borders at 3:1 or better against the card background (--field-border passes at 5.02:1).
- [ ] `:focus-visible` style on links, buttons, inputs, selects: 3px solid --focus, 2px outline offset. Nothing interactive may remove the outline without a replacement.
- [ ] All interactive targets at least 44px tall (buttons, selects, inputs). Pills are display only and exempt.
- [ ] Inputs and selects at 16px font size (stops iOS auto-zoom).
- [ ] Every input has a programmatic label (already true via `for` attributes; keep it true for any new field) and grouped fields use fieldset and legend.
- [ ] Score total in an aria-live polite region; score bar with progressbar role and values, or aria-hidden if the live text is judged sufficient. One mechanism, not both.
- [ ] Status never by colour alone: pills keep text labels and gain a glyph.
- [ ] Heading order is strict: one h1, card titles h2, sub sections h3, no skipped levels, no heading styling on non-headings.
- [ ] Page works at 200% zoom and at 320px width with no horizontal scroll except the draws table wrapper.
- [ ] `prefers-reduced-motion` media query removes the bar transition.
- [ ] Forced colors mode: outlines and borders carry the layout (this is why focus uses outline, and card borders must not drop below visibility when shadows are absent; there are no shadows, good).
- [ ] Language of page declared (`lang="en"`, already true). If a French version is ever added it needs its own page and lang, not a machine translated toggle pretending to be the GC bilingual pattern.
- [ ] Keyboard walk test: tab order follows visual order (form, result actions, save actions), the scenario toggle state is reachable and announced, and there are no keyboard traps.

## 9. Concrete changes to the current index.html, in priority order

P0: accessibility failures and trust gaps (do first)

1. Add global focus styles: `:focus-visible{outline:3px solid var(--focus); outline-offset:2px}` for links, buttons, inputs, selects. There are currently no focus styles at all.
2. Fix the input border: change control borders from --line (#DFE6EC, 1.26:1) to --field-border (#6F6F6F, 5.02:1). Keep --line for card edges and table rules only, and darken --line one step to #C9D3DB so cards read as structure.
3. Fix the failing CLOSE pill: change --warn text colour from #B7791F to #8A5A00 (3.22:1 becomes 5.25:1 on the same #FDF0D5 tint).
4. Add the independence line to the header and the word "Estimated" to the score label; move one copy of the estimate sentence and the "rules checked" date to directly under the score bar.
5. Raise input font size from 15px to 16px and button min-height to 44px (padding 12px 20px on primary actions).

P1: structure and readability

6. Swap the header (and new footer band) colour from #17202A to --brand-dark #26374A; keep white and #C8D3DD text, both pass with room.
7. Group the intake form into four fieldsets with legends: About you, Language, Work experience, Extra points. Move hint text under labels.
8. Mobile result visibility: add a compact sticky score strip for viewports under 860px (score plus gap, one line), or reorder so a slim score summary appears above the form on mobile.
9. Introduce the spacing and radius tokens from section 5 and replace ad hoc values (card radius 14 to 12, KPI 10 to 8, input and button radius 9 to 8, card padding 18 to 24/16).
10. Darken --muted from #5B6B7A to #52616E for 13px notes and footer text, and set a floor of 13px for any text on the page.
11. Add `font-variant-numeric: tabular-nums` to the score, KPI values and table points columns; add the 2px total row treatment and subtotal row shading in the breakdown table.

P2: polish and completeness

12. Make scenario buttons real toggles: filled state for the active scenario plus `aria-pressed`, and group the Save card buttons into Account and Profile groups with small labels.
13. Add glyphs to the status pills (✓, ~, ✕) and a min-width so the status column is stable.
14. Give the score bar the progressbar role and values (or aria-hidden, per section 6), and put aria-live polite on the score total.
15. Link the sources in the draws table note and footer (IRCC rounds page, CRS criteria page, official CRS tool), underline in-text links, and add the footer privacy line about local simulation and optional saving.
16. Add the `prefers-reduced-motion` query, cap long outlook paragraphs at 70ch, and if Option B fonts are adopted, load Lato 700 and Noto Sans 400/600 with font-display swap and apply Lato to headings only.

## Sources

- Canada.ca design specifications, typography style (Lato headings, Noto Sans body, H1 red bar #A62A1E): design.canada.ca/styles/typography.html
- Canada.ca colour style and GC Design System colour foundations (link #284162, hover/focus #0535D2, visited #7834BC, accent #26374A, error #D3080C, text #333333): design.canada.ca/styles/colours.html and design-system.canada.ca foundations
- GC Design System tokens (text primary #333, secondary #595959, focus border #0535D2, danger text #B3192E, 8px spacing scale, Lato/Noto Sans tokens): design-system.canada.ca, @cdssnc/gcds-tokens
- Canada.ca global footer main band (background #26374A, white text): design.canada.ca/common-design-patterns/site-footer-main.html
- Competitor presentation and disclaimer patterns, checked 2026-11-15: crsmeter.com, crstool.com, crscalculatorcanada.com, ee26.ca
- Contrast ratios in sections 2 and 3 were measured with the WCAG relative luminance formula against the current index.html tokens.
