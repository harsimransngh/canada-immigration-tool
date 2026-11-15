# CRS Engine Accuracy Audit

**App audited:** `index.html` (the `compute()` function and its points tables) and `README.md` in this repository
**Audit date:** November 15, 2026
**Rules baseline:** IRCC Comprehensive Ranking System criteria in force since **November 3, 2026**
**Primary source:** IRCC, "Express Entry: Comprehensive Ranking System (CRS) criteria", Canada.ca
https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score/crs-criteria.html
(fetched and read in full on the audit date; all "official value" entries below come from this page unless noted)

**Method:** Every table and rule in the code was compared line by line against the official page. The three test anchors were calculated by hand from the official tables and also run through the code's own logic (extracted and executed) to confirm what the code actually produces.

---

## Verdict summary

| Area | Verdict |
|---|---|
| CRS maximum 1,270 and section caps (core 570, transferability 100, additional 600) | MATCH (stated values) |
| Age table (no spouse) | MATCH |
| Education table (no spouse) | MISMATCH on one row: 1-year credential |
| First official language per CLB (no spouse) | MISMATCH on one row: CLB 4 |
| Second official language points | MISSING (gap, up to 24 points) |
| Canadian work experience length table | MATCH on values, WRONG STRUCTURE since Nov 3, 2026 (see LMI finding) |
| Labour Market Integration factor (either/or rule, high-wage work bonus) | MISMATCH, the largest scoring error in the app |
| Skill transferability combinations and caps | MATCH for the two implemented groups |
| Certificate of qualification | MISSING (gap, up to 50 points) |
| Additional points: sibling, French, Canadian education, PNP, 600 cap | MATCH on values; job offer is placed in the wrong section |
| Spouse factors and with-spouse point columns | MISSING entirely (gap, both directions) |
| Test anchors 496 / 524 / 536 | All three reproduced exactly by hand and by the code |

---

## 1. Section maximums and CRS maximum

| Item | Code | Official | Verdict |
|---|---|---|---|
| CRS maximum | 1,270 (progress bar divides by 1270; copy says "out of 1,270") | 1,270 = core 570 + transferability 100 + additional 600 | MATCH |
| Core / human capital cap, no spouse | No cap applied in code. Code's own tables max out at 476 (110 age + 150 education + 136 language + 80 Canadian work), so the missing cap never binds for a single applicant as coded | 570 (includes the Labour Market Integration factor) | MATCH in effect for singles; structural note only |
| Core cap, with spouse | Not implemented | 530 for the principal applicant, and sections A + B together capped at 570 | GAP (see section 8) |
| Skill transferability cap | `Math.min(100, ...)` | 100 | MATCH |
| Additional points cap | `Math.min(600, canEdu+french+sibling+pnp+offer)` | 600 | MATCH on the cap value; WRONG COMPOSITION, because the job offer does not belong in this section since Nov 3, 2026 (see section 5) |

Source: CRS criteria page, section A summary table and section D breakdown ("Additional points: Maximum 600 points").

---

## 2. Age (no spouse column)

Code (`agePoints`): 17 or less 0; 18 = 99; 19 = 105; 20 to 29 = 110; 30 = 105; 31 = 99; 32 = 94; 33 = 88; 34 = 83; 35 = 77; 36 = 72; 37 = 66; 38 = 61; 39 = 55; 40 = 50; 41 = 39; 42 = 28; 43 = 17; 44 = 6; 45 or more 0.

Official (without spouse): identical, value for value.

**Verdict: MATCH** for every age 17 to 45+.

The with-spouse age column (18 = 90, 19 = 95, 20 to 29 = 100, 30 = 95, 31 = 90, 32 = 85, 33 = 80, 34 = 75, 35 = 70, 36 = 65, 37 = 60, 38 = 55, 39 = 50, 40 = 45, 41 = 35, 42 = 25, 43 = 15, 44 = 5) is not implemented. See section 8.

Source: CRS criteria page, Age table.

---

## 3. Level of education (no spouse column)

Values are stored as the option values of the `education` select.

| Credential | Code | Official (without spouse) | Verdict |
|---|---|---|---|
| Less than high school | 0 | 0 | MATCH |
| High school diploma | 30 | 30 | MATCH |
| One-year postsecondary credential | **84** | **90** | **MISMATCH, code is 6 points low** |
| Two-year postsecondary credential | 98 | 98 | MATCH |
| Bachelor degree / 3+ year program | 120 | 120 | MATCH |
| Two or more credentials (one 3+ years) | 128 | 128 | MATCH |
| Master degree / professional degree | 135 | 135 | MATCH |
| PhD | 150 | 150 | MATCH |

**Finding F1 (bug):** The code's 84 for a one-year credential is the official **with-spouse** value. Every other value in the select is the without-spouse value, so the table mixes the two official columns. Correct value for the single-applicant table the app uses: **90**. Any user whose highest credential is a one-year program is understated by 6 points. Note this does not affect the transferability education tier, which only tests "postsecondary of one year or longer".

The with-spouse education column (28 / 84 / 91 / 112 / 119 / 126 / 140) is not implemented. See section 8.

Source: CRS criteria page, Level of Education table.

---

## 4. Official languages, first official language (per ability, no spouse)

Code (`clbPoints`, input treated as a CLB level): CLB 10+ = 34; CLB 9 = 31; CLB 8 = 23; CLB 7 = 17; CLB 6 = 9; CLB 5 = 6; CLB 4 or less = 0.

| CLB level per ability | Code | Official (without spouse) | Verdict |
|---|---|---|---|
| CLB 10 or more | 34 | 34 | MATCH |
| CLB 9 | 31 | 31 | MATCH |
| CLB 8 | 23 | 23 | MATCH |
| CLB 7 | 17 | 17 | MATCH |
| CLB 6 | 9 | 9 | MATCH |
| CLB 5 | 6 | 6 (row is "CLB 4 or 5") | MATCH |
| CLB 4 | **0** | **6** | **MISMATCH, code is 6 points low per ability** |
| Below CLB 4 | 0 | 0 | MATCH |

**Finding F2 (bug):** The official row is "CLB 4 or 5 = 6 points". The code gives CLB 4 zero. Impact: up to 24 points understated (6 x 4 abilities) for a low-language profile. It does not affect the three test anchors (all abilities CLB 7+).

Input caveats (not table errors, but accuracy limits):
- The inputs are raw numbers with no test-to-CLB conversion. CELPIP scores map 1 to 1 onto CLB levels for this purpose and scores of 10, 11, 12 all correctly land on the 34-point CLB 10+ row. IELTS, PTE, TEF and TCF scores do **not** equal CLB levels; the UI note tells IELTS users to enter their CLB equivalent themselves, so an uninformed IELTS user entering raw band scores gets a wrong result.
- Fractional input (for example 8.5) falls through every strict equality test in `clbPoints` and returns 0 for that ability.
- The with-spouse first-language column (CLB 4 or 5 = 6, 6 = 8, 7 = 16, 8 = 22, 9 = 29, 10+ = 32; max 128) is not implemented. See section 8.

Source: CRS criteria page, "Official languages proficiency, first official language" table.

---

## 5. Labour Market Integration factor (new November 3, 2026) — the largest error

Official structure (CRS criteria page, section A): points are given for **either** Canadian work experience **or** a high-wage job offer, **but not both**. The factor is one component of core points, capped at 150 without a spouse (140 with a spouse). It has two routes, and IRCC takes the higher one:

**Route 1, Canadian work experience** = work-length points **plus** high-wage occupation points:
- Work length (without spouse): none/<1 yr 0; 1 yr 40; 2 yrs 53; 3 yrs 64; 4 yrs 72; 5+ yrs 80. (With spouse: 0 / 35 / 46 / 56 / 63 / 70, max 70.)
- High-wage occupation bonus (same with or without spouse): at least 12 months in high-wage occupations at **2x** the median wage = **70**; failing that, 12 months combined at **1.5x** = **40**; failing that, 12 months combined at **1.3x** = **20**; otherwise 0.

**Route 2, high-wage job offer:** occupation at 2x median = **100**; 1.5x = **70**; 1.3x = **50**; occupation not on the high-wage list = 0.

| Element | Code | Official | Verdict |
|---|---|---|---|
| Work-length values 0/40/53/64/72/80 | `canWorkPoints` table | Same | MATCH on values |
| High-wage Canadian work bonus 20/40/70 | **Not present anywhere** | 20 / 40 / 70 as above | **MISSING, gap up to 70 points** |
| Job offer tiers 50/70/100 | `offer` select: 50 / 70 / 100 | 50 / 70 / 100 | MATCH on values |
| Either/or rule (never add the two routes) | **Violated.** Code adds Canadian work points into core AND adds the offer on top | Higher of the two routes only | **MISMATCH, overstates any profile that has both** |
| Section the offer sits in | Additional points (it is summed into the 600-capped section D) | Core, inside the LMI factor | **MISMATCH, wrong section** |
| LMI cap 150 (140 with spouse) | Not applied | 150 / 140 | MISMATCH (only reachable once the bonus exists, but the structure is absent) |

**Finding F3 (critical bug, overstatement):** A profile with both Canadian work and a qualifying offer is double counted. Worked example, run through the code's own logic: age 28, Masters, language 9/9/7/7, **5 years** Canadian work, 3+ years foreign work, Canadian 1 to 2 year credential, **job offer at the 100 tier**. Code total: **636**. Official calculation: core before LMI = 110 + 135 + 96 = 341; LMI = max(work route 80 + 0 bonus, offer 100) = 100; transferability 100; additional 15; total = **556**. The code overstates this profile by **80 points**, exactly the work-length points it should have displaced.

**Finding F4 (critical bug, understatement in the opposite case):** Because the offer is summed inside the 600-capped additional section, a nominated candidate (PNP = 600) with a qualifying offer gets **zero** for the offer in the code, since the cap is already full. Officially the offer sits in core and would still count (subject to the either/or rule). Understatement up to 100 points for PNP + offer profiles.

**Finding F5 (missing factor):** The high-wage Canadian work experience bonus (20/40/70) does not exist in the app at all. A candidate with 12+ months in a listed 2x-median occupation is understated by up to 70 points, and the app has no input that could capture it (the `nocTeer` select does not ask about the high-wage list).

What the code gets right here: the plain work-length table is correct, so a single applicant with Canadian work and **no** offer and **no** high-wage bonus (the anchor profile, NOC 72204, which is not a listed high-wage occupation) is scored correctly. That is why the anchors pass while the factor is still structurally wrong.

Source: CRS criteria page, "Labour Market Integration factor" section, both tables.

---

## 6. Second official language

Official (core, per ability): CLB 4 or less = 0; CLB 5 or 6 = 1; CLB 7 or 8 = 3; CLB 9 or more = 6; combined maximum **24** without a spouse, **22** with a spouse. Official languages proficiency overall is worth up to 160 points without a spouse (136 first language + 24 second language).

Code: there is **no second-language input and no second-language points anywhere**. The only place a second language appears is the French additional-points bonus (section 9), which is a separate official item.

**Finding F6 (gap):** Up to **24 points** missing for any bilingual candidate. A French speaker with NCLC 9+ as a second language officially earns up to 24 core points **plus** the 50-point French additional bonus; the app awards only the bonus. An English second language (for a French-first applicant) earns nothing in the app at all.

Source: CRS criteria page, "Official languages proficiency, second official language" table.

---

## 7. Skill transferability factors

Official structure: three groups, each capped at 50, overall maximum 100.
- **Education group (max 50):** education + first-language proficiency, and education + Canadian work experience.
- **Foreign work experience group (max 50):** foreign work + first-language proficiency, and foreign work + Canadian work experience.
- **Certificate of qualification group (max 50):** certificate + first-language proficiency (see section 7.3).

### 7.1 Education group, code vs official

Code computes `g1a` (education + language) and `g1b` (education + Canadian work), then takes `Math.min(50, g1a+g1b)`.

| Combination | Code | Official | Verdict |
|---|---|---|---|
| Postsecondary 1 yr+ (lower tier) + CLB 7+ on all abilities, one or more under CLB 9 | 13 | 13 | MATCH |
| Postsecondary 1 yr+ (lower tier) + CLB 9+ on all abilities | 25 | 25 | MATCH |
| Top tier (two or more credentials with one 3+ yrs, Master/professional, or PhD) + CLB 7+, one or more under 9 | 25 | 25 | MATCH |
| Top tier + CLB 9+ on all abilities | 50 | 50 | MATCH |
| Postsecondary 1 yr+ (lower tier) + 1 yr Canadian work | 13 | 13 | MATCH |
| Postsecondary 1 yr+ (lower tier) + 2+ yrs Canadian work | 25 | 25 | MATCH |
| Top tier + 1 yr Canadian work | 25 | 25 | MATCH |
| Top tier + 2+ yrs Canadian work | 50 | 50 | MATCH |
| High school or less | 0 (code requires `edu >= 84`) | 0 | MATCH |
| Group cap | 50 | 50 | MATCH |

Tier assignment in code: `edu >= 135 || edu === 128` is the top tier, which correctly captures the 128 (two or more), 135 (Master/professional) and 150 (PhD) rows, and correctly leaves a Bachelor degree (120) in the lower tier. The CLB condition also matches the official wording: the lower language column applies when all abilities are CLB 7+ with one or more under CLB 9, which is exactly what the code's overwrite order produces.

### 7.2 Foreign work experience group, code vs official

Code computes `g2a` (foreign work + language) and `g2b` (foreign work + Canadian work), then `Math.min(50, g2a+g2b)`.

| Combination | Code | Official | Verdict |
|---|---|---|---|
| 1 to 2 yrs foreign + CLB 7+ all, one or more under 9 | 13 | 13 | MATCH |
| 1 to 2 yrs foreign + CLB 9+ all | 25 | 25 | MATCH |
| 3+ yrs foreign + CLB 7+ all, one or more under 9 | 25 | 25 | MATCH |
| 3+ yrs foreign + CLB 9+ all | 50 | 50 | MATCH |
| 1 to 2 yrs foreign + 1 yr Canadian work | 13 | 13 | MATCH |
| 1 to 2 yrs foreign + 2+ yrs Canadian work | 25 | 25 | MATCH |
| 3+ yrs foreign + 1 yr Canadian work | 25 | 25 | MATCH |
| 3+ yrs foreign + 2+ yrs Canadian work | 50 | 50 | MATCH |
| Group cap | 50 | 50 | MATCH |

### 7.3 Certificate of qualification (trades)

Official: certificate of qualification + CLB 5+ on all first-language abilities with one or more under CLB 7 = **25**; certificate + CLB 7+ on all four abilities = **50**. Group cap 50, inside the overall 100 transferability cap.

Code: **no certificate input, no certificate points.**

**Finding F7 (gap):** Up to **50 points** missing for trades candidates with a certificate of qualification (actual gain depends on how much room is left under the 100-point transferability cap).

### 7.4 Grouping verdict (asked for explicitly)

The code's grouping, education group capped at 50, foreign work group capped at 50, total capped at 100 via `transferFinal = Math.min(100, Math.min(50, g1a+g1b) + Math.min(50, g2a+g2b))`, **matches the official grouping** for the two groups it implements. The official system has a third group (certificate of qualification, cap 50) feeding the same 100-point overall cap; the code omits that group but its cap arithmetic for the other two is correct.

Code hygiene note, not a scoring error: `compute()` also builds three unused variables (`group1`, `group2`, `transfer`) with convoluted expressions before settling on `transferFinal`. Only `transferFinal` is used in the total and in the displayed breakdown, and it is correct. The dead code is a maintenance risk only.

One structural point the code gets right: Canadian work experience still counts in the transferability combinations even though it also sits inside the LMI factor. Officially, section C is independent of the LMI either/or rule, which applies only inside section A. The code is consistent with that.

Source: CRS criteria page, section C, all tables.

---

## 8. Spouse or common-law partner factors

Official: an applicant with an accompanying spouse is scored on a separate, lower set of principal-applicant columns (age max 100, education max 140, first language max 128, LMI work length max 70, LMI cap 140, core cap 530), and the spouse adds section B points, maximum 40:
- Spouse education (max 10): less than high school 0; high school 2; one-year program 6; two-year 7; Bachelor 8; two or more 9; Master/professional 10; PhD 10.
- Spouse first-language proficiency (max 20, max 5 per ability): CLB 4 or less 0; CLB 5 or 6 = 1; CLB 7 or 8 = 3; CLB 9+ = 5 per ability.
- Spouse Canadian work experience (max 10): none/<1 yr 0; 1 yr 5; 2 yrs 7; 3 yrs 8; 4 yrs 9; 5+ yrs 10.

Official nuance: a candidate whose spouse is not accompanying, or who is a Canadian citizen or permanent resident, is scored on the without-spouse columns.

Code: the form collects `marital` ("Single / never married" or "Married / common-law (spouse not accompanying in v1 scoring)"), but **`compute()` never reads the marital field at all**. Every user is scored on the without-spouse columns and receives zero spouse points.

**Finding F8 (gap, both directions):** For a married applicant with an accompanying spouse, the code simultaneously:
- **overstates** the principal applicant's core, by up to 10 (age) + 10 (education) + 8 (language) + 10 (LMI work length) = up to roughly 38 points, because it uses the higher single columns; and
- **understates** by the entire spouse section, up to **40 points** never awarded.
The net error varies by profile and can reach several dozen points either way. The UI label is also misleading: it implies the married option means "spouse not accompanying", but selecting it changes nothing in the calculation.

Source: CRS criteria page, section A summary and with-spouse columns, and section B tables.

---

## 9. Additional points (section D)

| Item | Code | Official | Verdict |
|---|---|---|---|
| Sibling in Canada (brother/sister, 18+, citizen or PR) | 15 | 15 | MATCH |
| French: NCLC 7+ on all four skills, English CLB 4 or less or no English test | 25 | 25 | MATCH on value |
| French: NCLC 7+ on all four skills, English CLB 5+ on all four skills | 50 | 50 | MATCH on value |
| Post-secondary education in Canada, 1 to 2 year credential | 15 | 15 | MATCH |
| Post-secondary education in Canada, 3+ year credential | 30 | 30 | MATCH |
| Provincial or territorial nomination | 600 | 600 | MATCH |
| Section cap | 600 | 600 | MATCH |
| Job offer 50/70/100 inside this section | Included in the capped sum | Not in this section since Nov 3, 2026; it sits in core under LMI | MISMATCH (see Finding F4) |

**Finding F9 (minor logic gap):** The French tier is a free user choice in the `french` select and is never checked against the language scores the user entered. A user with CLB 9 English who picks the 25-point tier is understated by 25; a user who picks the 50-point tier without CLB 5+ on all four English skills is overstated by 25. The values are right; the condition is unenforced.

Also note the French bonus and the second-language points (Finding F6) are cumulative in the official system. The app models only the bonus.

Source: CRS criteria page, section D breakdown.

---

## 10. Test anchor verification (by hand, from the official tables)

Common inputs: single, no spouse factors; Masters ECA (135); 1 year Canadian work; 3+ years foreign work; Canadian credential of 1 to 2 years (additional 15); no sibling, no French, no nomination, no job offer; Canadian occupation (NOC 72204) is **not** on the high-wage occupation list, so the LMI high-wage bonus is 0 and the LMI work route is just the length points, 40.

### Anchor 1: language 9 / 9 / 7 / 7, expected 496

- Age 28: 110
- Education (Masters): 135
- First language: CLB 9 = 31, CLB 9 = 31, CLB 7 = 17, CLB 7 = 17 → 96
- LMI (Canadian work route, 1 year, no bonus, no offer): 40
- Core total: 110 + 135 + 96 + 40 = **381**
- Transferability, education group: Masters + CLB 7+ on all (one or more under 9) = 25; Masters + 1 yr Canadian work = 25; group = min(50, 50) = 50
- Transferability, foreign group: 3+ yrs + CLB 7+ (one or more under 9) = 25; 3+ yrs + 1 yr Canadian = 25; group = min(50, 50) = 50
- Transferability total: min(100, 100) = **100**
- Additional: Canadian education 15
- **Total: 381 + 100 + 15 = 496. Official hand calculation MATCHES the anchor.**
- Code output for the same inputs (executed): core 381, transferability 100, additional 15, **total 496. MATCH.**

### Anchor 2: same profile, all language CLB 9, expected 524

- First language: 31 x 4 = 124. Core: 110 + 135 + 124 + 40 = **409**
- Education group: Masters + CLB 9+ on all = 50; Masters + 1 yr Canadian = 25; group capped at 50
- Foreign group: 3+ yrs + CLB 9+ on all = 50; 3+ yrs + 1 yr Canadian = 25; group capped at 50
- Transferability: **100**. Additional: 15
- **Total: 409 + 100 + 15 = 524. MATCHES the anchor.**
- Code output (executed): **524. MATCH.**

### Anchor 3: same profile, all language CLB 10, expected 536

- First language: 34 x 4 = 136. Core: 110 + 135 + 136 + 40 = **421**
- Transferability: identical to Anchor 2 (CLB 9+ column already maxed) = **100**. Additional: 15
- **Total: 421 + 100 + 15 = 536. MATCHES the anchor.**
- Code output (executed): **536. MATCH.**

**Anchor verdict:** All three anchors are correct under the official November 3, 2026 tables, and the code reproduces all three exactly. The anchors pass because this profile exercises none of the broken or missing areas (no spouse, no second language, no certificate, no job offer, no high-wage bonus, no CLB 4 ability, education at the Masters row). They validate the core path only; they do not clear the findings below.

---

## 11. Consolidated findings and gaps

| # | Finding | Type | Point impact |
|---|---|---|---|
| F3 | LMI either/or rule violated: Canadian work points and job offer points are added together | Bug, overstates | Up to +80 too high (worked example: 636 shown vs 556 official) |
| F4 | Job offer placed in additional points, so the 600 cap can erase it for PNP candidates | Bug, understates | Up to 100 too low |
| F5 | High-wage Canadian work experience bonus (20/40/70) missing entirely, no input for it | Missing factor | Up to 70 too low |
| F8 | Spouse scoring missing entirely: with-spouse columns and section B (max 40) not implemented; marital field ignored | Missing factor | Several dozen points either direction |
| F6 | Second official language points missing (max 24; 22 with spouse) | Missing factor | Up to 24 too low |
| F7 | Certificate of qualification transferability (25/50) missing | Missing factor | Up to 50 too low (subject to the 100 cap) |
| F1 | One-year education credential coded 84, official single value 90 (84 is the with-spouse value) | Bug, understates | 6 too low for affected users |
| F2 | CLB 4 coded 0, official 6 per ability | Bug, understates | Up to 24 too low for low-language profiles |
| F9 | French bonus tier not validated against entered English scores | Logic gap | 25 either direction |
| (note) | No test-to-CLB conversion for IELTS/PTE/TEF/TCF raw scores; fractional language input returns 0 for that ability | Input handling | Varies; can be large for IELTS users entering raw bands |
| (note) | Dead code in `compute()` (`group1`, `group2`, `transfer` unused) | Hygiene only | None; `transferFinal` is correct |

**Bottom line:** For a single applicant with no spouse, no second language, no certificate of qualification, no job offer and no high-wage occupation, the engine is accurate, and it reproduces all three official anchors exactly. The November 3, 2026 Labour Market Integration restructure is only half implemented: the offer tiers and work-length values are right, but the either/or rule, the high-wage work bonus, and the offer's correct home in core are all wrong or missing, and spouse, second-language and certificate scoring are absent. Profiles touching any of those areas can be off by 50 to 100+ points.

## Sources

- IRCC, Express Entry: Comprehensive Ranking System (CRS) criteria, Canada.ca (rules in force since November 3, 2026; fetched in full for this audit):
  https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score/crs-criteria.html
- App copy and README claim checked against the same page: CRS maximum 1,270, job offer tiers 50/70/100, transferability groups capped at 50 each and 100 overall, additional points capped at 600.
