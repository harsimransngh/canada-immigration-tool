# Language test score to CLB / NCLC conversion tables (IRCC official)

Researched 2026-11-15 for Phase 1 (accuracy pack) of the Canada Immigration Tool.
These tables convert a raw test score, per skill, to the CLB (English) or NCLC (French)
level IRCC uses for Express Entry. A score between two rows takes the lower level.

## Sources (both are IRCC / Canada.ca, fetched and read in full on 2026-11-15)

1. **Express Entry: Language test results** (primary source, the page the tool's
   converters must match):
   https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/language-test.html
2. **Language test equivalency charts** (IRCC operational bulletins manual,
   cross-check source; every value shared by both pages matched exactly):
   https://www.canada.ca/en/immigration-refugees-citizenship/corporate/publications-manuals/operational-bulletins-manuals/standard-requirements/language-requirements/test-equivalency-charts.html

## How to read these tables

- Each value is the **minimum test score that reaches that CLB/NCLC level** for that skill.
- `10` means "CLB/NCLC 10 and above" (the top CRS band).
- "Below 4" means any score under the CLB/NCLC 4 minimum. IRCC does not print a
  "below 4" row for IELTS, TEF or TCF, so those cut-offs are arithmetic (one step
  below the verified CLB 4 minimum) and are flagged as derived. IRCC does print a
  CLB 3 row for PTE Core, which is included.
- IELTS scores move in 0.5 band steps; all other tests use whole numbers.

---

## 1. IELTS General Training to CLB (verified on both IRCC pages)

Only the General Training test is accepted. IELTS One Skill Retake is NOT accepted
for Express Entry. Per-skill conversion; the overall band is never used.

| Skill | 10 | 9 | 8 | 7 | 6 | 5 | 4 | Below 4 (derived) |
|---|---|---|---|---|---|---|---|---|
| Listening | 8.5 | 8.0 | 7.5 | 6.0 | 5.5 | 5.0 | 4.5 | 4.0 or less |
| Reading | 8.0 | 7.0 | 6.5 | 6.0 | 5.0 | 4.0 | 3.5 | 3.0 or less |
| Writing | 7.5 | 7.0 | 6.5 | 6.0 | 5.5 | 5.0 | 4.0 | 3.5 or less |
| Speaking | 7.5 | 7.0 | 6.5 | 6.0 | 5.5 | 5.0 | 4.0 | 3.5 or less |

Machine usable form (minimum score per CLB level):

```json
"ielts": {
  "listening": { "10": 8.5, "9": 8.0, "8": 7.5, "7": 6.0, "6": 5.5, "5": 5.0, "4": 4.5 },
  "reading":   { "10": 8.0, "9": 7.0, "8": 6.5, "7": 6.0, "6": 5.0, "5": 4.0, "4": 3.5 },
  "writing":   { "10": 7.5, "9": 7.0, "8": 6.5, "7": 6.0, "6": 5.5, "5": 5.0, "4": 4.0 },
  "speaking":  { "10": 7.5, "9": 7.0, "8": 6.5, "7": 6.0, "6": 5.5, "5": 5.0, "4": 4.0 }
}
```

Full ranges as printed by IRCC, for reference: CLB 10 = Listening 8.5-9.0,
Reading 8.0-9.0, Writing 7.5-9.0, Speaking 7.5-9.0. All other levels are single
bands in the IRCC chart except Reading at CLB 9, which some IRCC program tables
print as the single band 7.0 (a 7.5 in Reading is still CLB 9, since CLB 10 starts
at 8.0).

---

## 2. PTE Core to CLB (verified on both IRCC pages)

PTE Core scores run 10 to 90 per skill. Only PTE Core is accepted (not PTE Academic).

| Skill | 10 | 9 | 8 | 7 | 6 | 5 | 4 | 3 (IRCC manual only) |
|---|---|---|---|---|---|---|---|---|
| Listening | 89 | 82 | 71 | 60 | 50 | 39 | 28 | 18 |
| Reading | 88 | 78 | 69 | 60 | 51 | 42 | 33 | 24 |
| Writing | 90 | 88 | 79 | 69 | 60 | 51 | 41 | 32 |
| Speaking | 89 | 84 | 76 | 68 | 59 | 51 | 42 | 34 |

Machine usable form (minimum score per CLB level):

```json
"pteCore": {
  "listening": { "10": 89, "9": 82, "8": 71, "7": 60, "6": 50, "5": 39, "4": 28, "3": 18 },
  "reading":   { "10": 88, "9": 78, "8": 69, "7": 60, "6": 51, "5": 42, "4": 33, "3": 24 },
  "writing":   { "10": 90, "9": 88, "8": 79, "7": 69, "6": 60, "5": 51, "4": 41, "3": 32 },
  "speaking":  { "10": 89, "9": 84, "8": 76, "7": 68, "6": 59, "5": 51, "4": 42, "3": 34 }
}
```

Notes:
- Writing at CLB 10 is exactly 90 (the IRCC range is the single value 90).
- Below CLB 3 (derived): Listening 17 or less, Reading 23 or less, Writing 31 or
  less, Speaking 33 or less.
- Full IRCC ranges, e.g. Listening: CLB 9 = 82-88, CLB 8 = 71-81, CLB 7 = 60-70,
  CLB 6 = 50-59, CLB 5 = 39-49, CLB 4 = 28-38, CLB 3 = 18-27.

---

## 3. TEF Canada to NCLC (verified on both IRCC pages) — READ THE SCALE NOTE FIRST

### Which scale Express Entry uses

TEF Canada changed its scoring. Current TEF Canada results statements show two
score columns:

- **"Score / 699"** — the new raw score scale (in use for tests taken after
  December 10, 2023).
- **"Équivalence ancien score"** (previous score equivalency) — the same results
  expressed on the old scale (Listening /360, Reading /300, Writing /450,
  Speaking /450).

**For Express Entry, IRCC's current published chart is the Équivalence ancien
score chart.** The Express Entry language test results page states, verbatim in
substance: your language level will be based on the "Équivalence ancien score";
only enter the scores from that column; do NOT enter the "Score / 699" results,
they are not compatible with the Express Entry system at this time, and entering
the wrong scores may lead to a refusal. This applies regardless of test date.

So the converter for Express Entry must ask for (or be fed) the Équivalence
ancien score values and apply this chart:

| Skill | 10 | 9 | 8 | 7 | 6 | 5 | 4 | Below 4 (derived) |
|---|---|---|---|---|---|---|---|---|
| Listening (compréhension de l'oral) | 316 | 298 | 280 | 249 | 217 | 181 | 145 | 144 or less |
| Reading (compréhension de l'écrit) | 263 | 248 | 233 | 207 | 181 | 151 | 121 | 120 or less |
| Writing (expression écrite) | 393 | 371 | 349 | 310 | 271 | 226 | 181 | 180 or less |
| Speaking (expression orale) | 393 | 371 | 349 | 310 | 271 | 226 | 181 | 180 or less |

Machine usable form (minimum Équivalence ancien score per NCLC level):

```json
"tefCanada_ancienScore": {
  "listening": { "10": 316, "9": 298, "8": 280, "7": 249, "6": 217, "5": 181, "4": 145 },
  "reading":   { "10": 263, "9": 248, "8": 233, "7": 207, "6": 181, "5": 151, "4": 121 },
  "writing":   { "10": 393, "9": 371, "8": 349, "7": 310, "6": 271, "5": 226, "4": 181 },
  "speaking":  { "10": 393, "9": 371, "8": 349, "7": 310, "6": 271, "5": 226, "4": 181 }
}
```

Full IRCC ranges (ancien score): Listening 10 = 316-360, 9 = 298-315, 8 = 280-297,
7 = 249-279, 6 = 217-248, 5 = 181-216, 4 = 145-180. Reading 10 = 263-300,
9 = 248-262, 8 = 233-247, 7 = 207-232, 6 = 181-206, 5 = 151-180, 4 = 121-150.
Writing and Speaking 10 = 393-450, 9 = 371-392, 8 = 349-370, 7 = 310-348,
6 = 271-309, 5 = 226-270, 4 = 181-225.

### Supplementary: the /699 scale charts (IRCC manual page only — do NOT use for Express Entry profile entry)

The IRCC equivalency charts manual also publishes charts keyed to the raw
/699 scores, by test date. These are reproduced here because the tool may meet
them in other program contexts, but per the Express Entry page above they must
not be used to fill an Express Entry profile.

Tests taken **after December 10, 2023** (raw Score / 699), minimums:

```json
"tefCanada_score699_after_2023-12-10": {
  "listening": { "10": 546, "9": 503, "8": 462, "7": 434, "6": 393, "5": 352, "4": 306 },
  "reading":   { "10": 546, "9": 503, "8": 462, "7": 434, "6": 393, "5": 352, "4": 306 },
  "writing":   { "10": 558, "9": 512, "8": 472, "7": 428, "6": 379, "5": 330, "4": 268 },
  "speaking":  { "10": 556, "9": 518, "8": 494, "7": 456, "6": 422, "5": 387, "4": 328 }
}
```

Tests taken **October 1, 2019 to December 10, 2023** (raw Score / 699): the
bands are uniform across all four skills — NCLC 10 = 566-699, 9 = 533-565,
8 = 500-532, 7 = 450-499, 6 = 400-449, 5 = 350-399, 4 = 300-349.
Minimums: 10 = 566, 9 = 533, 8 = 500, 7 = 450, 6 = 400, 5 = 350, 4 = 300.

Historical note from the Express Entry page: for TEF Canada tests taken between
December 11, 2023 and May 6, 2024, CCI Paris Île-de-France temporarily modified
the NCLC scoring, then reverted to the grid above; affected candidates were
emailed updated scores and told to update their profiles.

---

## 4. TCF Canada to NCLC (verified on both IRCC pages)

Listening and Reading are scored /699; Writing and Speaking are scored /20.

| Skill | 10 | 9 | 8 | 7 | 6 | 5 | 4 | Below 4 (derived) |
|---|---|---|---|---|---|---|---|---|
| Listening | 549 | 523 | 503 | 458 | 398 | 369 | 331 | 330 or less |
| Reading | 549 | 524 | 499 | 453 | 406 | 375 | 342 | 341 or less |
| Writing | 16 | 14 | 12 | 10 | 7 | 6 | 4 | 3 or less |
| Speaking | 16 | 14 | 12 | 10 | 7 | 6 | 4 | 3 or less |

Machine usable form (minimum score per NCLC level):

```json
"tcfCanada": {
  "listening": { "10": 549, "9": 523, "8": 503, "7": 458, "6": 398, "5": 369, "4": 331 },
  "reading":   { "10": 549, "9": 524, "8": 499, "7": 453, "6": 406, "5": 375, "4": 342 },
  "writing":   { "10": 16, "9": 14, "8": 12, "7": 10, "6": 7, "5": 6, "4": 4 },
  "speaking":  { "10": 16, "9": 14, "8": 12, "7": 10, "6": 7, "5": 6, "4": 4 }
}
```

Note the one-point asymmetry: NCLC 9 starts at 523 for Listening but 524 for
Reading, and NCLC 8 starts at 503 for Listening but 499 for Reading. Transcribe
exactly; do not harmonise them.

Full IRCC ranges: Listening 10 = 549-699, 9 = 523-548, 8 = 503-522, 7 = 458-502,
6 = 398-457, 5 = 369-397, 4 = 331-368. Reading 10 = 549-699, 9 = 524-548,
8 = 499-523, 7 = 453-498, 6 = 406-452, 5 = 375-405, 4 = 342-374.
Writing and Speaking 10 = 16-20, 9 = 14-15, 8 = 12-13, 7 = 10-11, 6 = 7-9,
5 = 6, 4 = 4-5.

---

## 5. CELPIP-General to CLB (identity, verified on both IRCC pages)

Only the CELPIP-General test is accepted (not CELPIP-General LS).

The CELPIP level in each skill **is** the CLB level, one to one, for every skill:

```json
"celpip": {
  "listening": { "10": 10, "9": 9, "8": 8, "7": 7, "6": 6, "5": 5, "4": 4 },
  "reading":   { "10": 10, "9": 9, "8": 8, "7": 7, "6": 6, "5": 5, "4": 4 },
  "writing":   { "10": 10, "9": 9, "8": 8, "7": 7, "6": 6, "5": 5, "4": 4 },
  "speaking":  { "10": 10, "9": 9, "8": 8, "7": 7, "6": 6, "5": 5, "4": 4 }
}
```

Notes:
- CELPIP reports levels 3 to 12 plus "M". Levels 10, 11 and 12 all count as
  "CLB 10 and above" for CRS (the IRCC chart's top row reads "10+").
- Below 7 the identity still holds on IRCC's chart: CELPIP 6 = CLB 6,
  5 = CLB 5, 4 = CLB 4.
- **Flag (not printed on the fetched IRCC charts):** the IRCC charts on both
  pages start at CLB 4. CELPIP level 3 (= CLB 3) and level "M" (minimal
  proficiency, below CLB 3) come from the CELPIP scale design, not from a row
  on the fetched IRCC pages. Treat a CELPIP 3 as CLB 3 and "M" as below CLB 3,
  but this one mapping was not directly verified on canada.ca in this pass.

---

## Verification summary

- IELTS, PTE Core, TEF Canada (ancien score) and TCF Canada minimums for
  CLB/NCLC 4 to 10: **verified**, identical on both IRCC pages fetched
  2026-11-15 (the Express Entry language test results page and the IRCC
  equivalency charts manual page).
- TEF Canada /699 charts (both date bands): verified on the IRCC equivalency
  charts manual page only. The Express Entry page does not print them; it
  instructs applicants not to use /699 scores for Express Entry. The manual
  page copy available to the fetch tool was crawled 2026-05-06, older than the
  Express Entry page copy (crawled 2026-11-15); if exact /699 bands ever become
  load-bearing for the tool, re-verify them on a fresh fetch.
- "Below 4" cut-offs for IELTS, TEF and TCF, and "below CLB 3" for PTE: derived
  arithmetically from the verified CLB 4 (or CLB 3) minimums, not printed rows.
- CELPIP identity for CLB 4 to 10 and "10+" top band: verified on both pages.
  CELPIP 3 and "M" handling: flagged above, not directly verified on canada.ca.
- No other numbers in this file were taken from third-party sources.
