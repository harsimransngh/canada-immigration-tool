# Security and Bug Audit: Canada Immigration Tool (static app)

Date: November 15, 2026
Scope: `index.html`, `config.js`, `vercel.json`, `supabase/schema.sql`, `README.md` in this repo.
Method: full code read, plus the live `compute()` extracted and run in Node against hand-checked cases (anchors, fractional inputs, out-of-range inputs, invalid dates). No app files were edited by this audit.

## State note: a Critical bug was found and fixed during this audit window

The build first read by this audit contained leftover draft transferability lines in `compute()` that reassigned a `const` variable. That throws a TypeError on every `compute()` call, so in the browser `render()` died on page load: the page showed the hard-coded 496 and the breakdown, eligibility, scenarios, recommendations, outlook and countdown sections never populated. The deployed page looked fine on a text fetch, which is how it slipped through.

That block has since been replaced with clean grouped logic (`g1 = min(50, g1a+g1b)`, `g2 = min(50, g2a+g2b)`, `transfer = min(100, g1+g2)`), documented in `audit/test-results.md`. This audit re-verified the current on-disk file (284 lines): anchors reproduce exactly (default profile 496, all-CLB-9 = 524, all-CLB-10 = 536) and the valid-case suite passes. Everything below is about the current, fixed code. Severity counts for open findings: Critical 0, High 1, Medium 6, Low 9.

## What is sound (verified, not findings)

- **The Supabase publishable key in `config.js` is not a secret leak.** `sb_publishable_...` keys are designed to ship in client code. Protection comes from Row Level Security, and the RLS here is correct (see below). No service_role key, database password, or other real secret appears anywhere in the repo.
- **RLS policies in `supabase/schema.sql` are correct in substance.** RLS is enabled; SELECT uses `auth.uid() = user_id`; INSERT checks `auth.uid() = user_id`; UPDATE and DELETE are scoped the same way. Anonymous callers get nothing (`auth.uid()` is null, never equal to a row owner). One user cannot read, insert as, update, or delete another user's profiles through the API.
- **Password handling in app code is clean.** The password value goes only to `supa.auth.signInWithPassword` / `signUp`. It is never logged, never put in a URL, never written to localStorage or the database by app code, and error/status text is written with `textContent`, not `innerHTML`.
- **No exploitable XSS in the current code.** Every `innerHTML` sink was traced (inventory in finding L4): all of them interpolate only numbers produced by `compute()` or hard-coded strings and internal status constants. The one user-derived string that is displayed, the signed-in email, goes through `textContent`. Saved profile values are loaded into inputs via the `.value` property, which does not parse HTML.
- **Empty inputs do not crash the score.** Blank age, language, and select fields coerce through `parseFloat(...) || 0`, so no NaN reaches the score, breakdown, or scenario sections. (Dates are the exception, finding L2.)
- **Core CRS tables are right.** Age, education, language-per-ability, and Canadian-work point tables, the two transferability groups with their 50-point caps, the 100-point transferability cap, and the 600-point additional-points cap all match the grid the site claims to implement, confirmed by the anchor tests above.

## High

### H1. Supabase library loads from a floating CDN URL with no integrity check, on the page that collects passwords
File: `index.html` line 167: `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>`

Why it matters: `@2` is a floating range. Every visitor's browser downloads whatever the newest 2.x release on jsdelivr is that day, with no Subresource Integrity hash and no pinned version. If that CDN path or a future 2.x publish is compromised, the injected script runs with full page privileges: it can read the email and password fields as they are typed and read the Supabase session (access and refresh tokens, which supabase-js stores in `localStorage` by default) and send both anywhere. There is also no Content-Security-Policy (finding M4) to limit where stolen data could be sent. The same floating load is a stability risk: an upstream breaking change ships to production with no deploy on this side.

Fix: pin an exact version and add SRI, e.g. `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@<exact-version>" integrity="sha384-<hash of the served file>" crossorigin="anonymous"></script>`, and re-pin deliberately when upgrading. Better still for a one-file site: download the UMD bundle once, commit it to this repo, and load it as a same-origin file, which removes the third-party runtime dependency entirely.

## Medium

### M1. Fractional age and language inputs silently zero out whole factors
File: `index.html` lines 47, 59 to 62 (number inputs with no `step`), line 173 `clbPoints()`, line 174 `agePoints()`, line 180.

Why it matters: the number inputs accept decimals (no `step="1"`), and the point functions use strict equality for individual bands (`score===9`, `a===30`, `a===31`, ...). A value between bands matches nothing and falls through to 0. Verified by running the code: Listening 9.5 scores 0 for that skill instead of 31 (total drops 496 to 465); age 30.5 and age 19.5 both score 0 age points instead of about 105. The failure is silent, the page still shows a confident total, and the transferability checks (`x>=7`, `x>=9`) use the raw fractional values, so the same input is treated as CLB 9 for one factor and as zero for another. Users typing a half band, or pasting a decimal, get a materially wrong score with no warning.

Fix: normalise once at read time. Floor and clamp language scores to integers 0 to 12 and age to an integer 0 to 120 before scoring (or make `clbPoints`/`agePoints` range-based instead of equality-based), and add `step="1"` to the inputs. Show the normalised value back so the user sees what was scored.

### M2. `compute()` never returns `nocTeer`, so the Category-based draws row ignores the TEER selection
File: `index.html` line 197 (return object has no `nocTeer`), line 238 (`r.nocTeer==="2"`).

Why it matters: `render()` tests `r.nocTeer`, which is always `undefined` (verified in Node). The Category-based draws row therefore behaves as if the TEER dropdown does not exist: a TEER 2/3 user with no French always sees FAIL, and changing the TEER select changes nothing anywhere on the page. A form field that silently does nothing erodes trust in every other result.

Fix: include `nocTeer: get("nocTeer")` in the object `compute()` returns, and use the returned value in the eligibility row. Longer term, drive the row from actual category membership (occupation lists), not TEER alone.

### M3. A failed sign-in hides its own error message
File: `index.html` line 277, with `refreshAuth()` at line 275.

Why it matters: the handler sets `authStatus` to the Supabase error (for example "Invalid login credentials"), then unconditionally calls `refreshAuth()`, which awaits `getSession()` and overwrites `authStatus` with "Not signed in." The user never sees why sign-in failed and cannot tell a wrong password from a network problem or an unconfirmed email. Support-wise this guarantees confusion at the exact moment the app handles credentials.

Fix: only call `refreshAuth()` when there is no error, or have `refreshAuth()` accept and preserve an error message. Same pattern should be checked anywhere a status element is written twice in one flow.

### M4. No Content-Security-Policy and no framing protection in `vercel.json`
File: `vercel.json` (single line; only `X-Content-Type-Options: nosniff` and `Referrer-Policy` are set).

Why it matters: this page takes credentials and holds session tokens, yet any origin can iframe it (no `frame-ancestors`, no `X-Frame-Options`), enabling clickjacking overlays around the sign-in form. And with no CSP, if any script injection ever lands (see H1 and L4), nothing restricts where it can exfiltrate data or what it can load. CSP is the seatbelt that makes the other findings cheaper.

Fix: add headers in `vercel.json`. A policy compatible with the current page (same-origin files, jsdelivr script, inline style and script blocks, Supabase REST/auth/realtime endpoints):

- `Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://iopdhwnxgwhmbvewgced.supabase.co wss://iopdhwnxgwhmbvewgced.supabase.co; img-src 'self' data:; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`
- `X-Frame-Options: DENY` (for older browsers)
- `Strict-Transport-Security: max-age=63072000; includeSubDomains`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

Note: `'unsafe-inline'` is needed only because the app logic lives in inline `<script>` blocks. Moving those to a same-origin `.js` file lets `script-src` drop `'unsafe-inline'` entirely, which is the version worth having. If H1 is fixed by self-hosting the Supabase bundle, jsdelivr can come out of `script-src` too.

### M5. Marital status is collected but ignored: married users are silently scored on the single-applicant grid
File: `index.html` line 48 (marital select), `compute()` never reads `marital`.

Why it matters: CRS scoring for a candidate with an accompanying spouse uses different (lower) principal-applicant tables plus spouse factors. Here, choosing "Married / common-law" changes nothing at all: the same single-grid total is presented with no warning in the results area. The only hint is inside the dropdown's own option text. A married user can walk away with an inflated number and plan around it.

Fix: either implement the with-spouse tables and spouse factor inputs, or, when "married" is selected, show a persistent notice beside the score stating the estimate uses the single / non-accompanying grid and will overstate an accompanying-spouse case.

### M6. Job-offer points are simply added, which contradicts the Labour Market Integration rule the page itself states
File: `index.html` line 195 (`additional` sums `offer` in full), footer text on the same page, `README.md`.

Why it matters: the page footer says the offer earns points under the Labour Market Integration factor as "whichever is higher between that offer and your Canadian work experience points, not both added together." The code does the opposite of that sentence: it keeps the full Canadian-work points in the core total and adds the full offer tier (50, 70, or 100) on top, and it never models the other LMI variant (points for high-wage Canadian work experience itself). For any user with a listed high-wage offer, the total can diverge from the rule the site claims to implement, in the user's favour, which is the dangerous direction for a planning tool.

Fix: model the LMI factor explicitly as the page describes it: compute the offer-based value and the Canadian-work-based value, take the higher, and show it as its own breakdown line instead of folding the offer into the generic additional-points sum.

### M7. CEC eligibility demands CLB 7 from everyone, which is the wrong threshold for TEER 2/3
File: `index.html` lines 235 to 236 (`cec = r.canY>=1 && r.allCLB7`, and the explanatory text).

Why it matters: the CEC language minimum is CLB 7 for TEER 0/1 occupations and CLB 5 for TEER 2/3 occupations. This check requires CLB 7 in all four skills regardless of the TEER the user selected (the TEER value is not even reachable, finding M2), and the row text tells TEER 2/3 users they need CLB 7. A TEER 2/3 user with CLB 5 or 6 across the board is told they fall short of a program they actually qualify for, which can push them into months of unnecessary test prep or away from applying.

Fix: threshold by TEER: all skills at CLB 7+ for TEER 0/1, CLB 5+ for TEER 2/3, and correct the row text to state the threshold that was applied.


## Low

### L1. No validation layer on numeric ranges; `min`/`max` attributes are decorative
File: `index.html` lines 47, 59 to 62, 87, and `compute()` throughout.

Why it matters: nothing clamps or rejects out-of-range values. Negative ages, ages above the stated max of 60, language scores above 12, and negative settlement funds are all accepted silently (most happen to score 0 or cap by luck of the tables). There is no total ceiling check either: the 1,270 maximum exists only as display text. The score paths are protected today only because every free-typed field is numeric-coerced; any future field added without the same care reopens wrong totals. Fix: one sanitise step in `compute()`'s getter (floor, clamp, and whitelist select values against their known option sets), plus `step="1"` and `inputmode="numeric"` on the inputs.

### L2. Invalid dates render as "NaN days ago" in the countdowns
File: `index.html` line 203 `daysUntil()`, lines 255 to 256.

Why it matters: `daysUntil("")` correctly returns null, but a non-empty invalid string produces an Invalid Date and returns NaN, which is not null, so the countdown prints "Language test date: NaN days ago." Browser date inputs sanitise their own values, so the reachable path is a crafted or corrupted saved profile loaded from Supabase (the `profile` JSON is user-writable through the API). Fix: `if (isNaN(d)) return null;` after parsing.

### L3. Profile load has no key whitelist and misreports the signed-out case
File: `index.html` line 280.

Why it matters, three small issues in one handler. (1) `Object.keys(p).forEach(k => { if ($(k)) $(k).value = p[k]; })` applies any key in the stored JSON to any element with a matching id. The JSON is fully user-controlled (RLS restricts which rows a user can write, not what the JSON contains), so a stored profile can also populate the `email` and `password` fields, or any future element id that collides with a key. It is not exploitable as XSS today (`.value` does not parse HTML), but it is an unnecessary trust in stored data. (2) A stored select value that matches no option silently becomes empty and zeroes that factor on the next render, with no message. (3) Clicking Load while signed out returns zero rows under RLS and reports "No saved profile found yet," which is misleading; Save checks the session first, Load should too. Fix: iterate the known `fields` whitelist instead of the stored keys, validate select values against existing options, and check the session before querying.

### L4. Latent stored-XSS posture: safe today, one feature away from unsafe
File: `index.html` lines 211, 232, 242, 249, 253, 258 (all `innerHTML` sinks), line 279 (profile `label` is stored).

Sink inventory, all verified: breakdown (numbers only), scenarios (hard-coded labels, numbers), eligibility (hard-coded strings, status class from the internal set pass/close/fail), recommendations (hard-coded strings, one computed number), outlook (hard-coded text, numbers), countdowns (numbers from `daysUntil`, see L2). No user-controlled string reaches any sink today, and the signed-in email is rendered with `textContent`. The risk is forward-looking: profiles carry a `label` in the database, the app just never displays it. The day a profile list renders labels, or any saved value is interpolated into these template strings, this becomes stored XSS with session tokens in `localStorage` as the prize. Fix (guardrail, cheap now): keep the rule "user-derived strings only ever via `textContent` or DOM node creation," and if labels are ever rendered, escape them or build nodes. Note it in the README so the next editor knows the rule exists.

### L5. `schema.sql` robustness gaps (policies themselves are correct, see "What is sound")
File: `supabase/schema.sql`, `README.md` setup section.

- **Not idempotent.** The README tells the operator to run this file in the SQL Editor, but the four `create policy` statements have no drop-if-exists guard, so a second run errors partway through and leaves the operator unsure what applied. Add `drop policy if exists ... ;` before each, or wrap in the usual idempotent pattern.
- **UPDATE policy has `USING` with no explicit `WITH CHECK`.** Postgres reuses the USING expression as the new-row check when WITH CHECK is omitted, so this is safe today, but stating `with check (auth.uid() = user_id)` explicitly removes any doubt for future editors.
- **No index on `user_id`.** Every load query filters and orders by owner and recency. Add `create index on public.profiles (user_id, created_at desc);`
- **No size or shape constraints.** `profile` jsonb and `label` text accept anything an authenticated user sends, and every Save inserts a new row (finding L6), so one account can grow storage without bound. Add a sanity check constraint (for example `octet_length(profile::text) < 20000`) or enforce shape in a trigger if this ever matters at scale.

### L6. Save always inserts; profiles can never be updated, named, or deleted from the app
File: `index.html` line 279.

Why it matters: each Save creates a new row with the hard-coded label "My profile," Load silently takes the newest, and `updated_at` is never written by anything (no trigger in the schema either). Users accumulate invisible duplicates, and the saved `crs` can quietly disagree with the score on screen if a what-if scenario was active, because Save scores `compute({})` (the un-scenario'd profile) while the headline number may be showing a scenario. Fix: update the latest row instead of inserting (or keep insert but say "saved a new copy"), use the scenario-free total consistently and label it as such, and add an `updated_at` trigger in the schema if updates are introduced.

### L7. Accessibility gaps that affect function, not just compliance
File: `index.html` lines 58 (group label), 139 to 145 (auth block), 205 to 210 (score).

- The auth and save status messages (`authStatus`, `saveStatus`) and the CRS score itself have no `aria-live` region, so screen-reader users get no announcement when sign-in succeeds or fails, when a save completes, or when the score changes. These are the primary results of the page's actions. Add `aria-live="polite"` to the two status lines and to the score container (or a visually hidden live region for the total).
- The email/password controls are not inside a `<form>`, so pressing Enter in the password field does nothing, and password managers handle the pair less reliably. Wrap them in a form with the sign-in button as submit (keeping `preventDefault`).
- The password field uses `autocomplete="current-password"` for both actions; the Create account flow should use `new-password`, or managers will offer to save the sign-in credential over the new one and vice versa.
- The "First language test scores" caption is a `<label>` with no `for` and no wrapped control; use a `<fieldset>` with `<legend>` for the four score inputs.
- The warning pill (`.pill` close state, #b7791f on #fdf0d5, 12px bold) sits below the 4.5:1 contrast ratio for small text. Darken the text colour.

### L8. Scenario state is silently discarded, and one scenario is mislabelled
File: `index.html` line 260 (input listener), lines 227 and 264 (Canadian-work scenario).

Why it matters: any `input` event on any field, including funds and dates, resets `scenario` to empty with no visual indication, so a user who clicks "Add a provincial nomination" and then adjusts a date loses the scenario without noticing. Separately, the button and list entry say "Second year of Canadian work," but the override adds one year at any level (3 years becomes 4), so the label misdescribes the math for most users. Fix: only clear the scenario when a field the scenario depends on changes (or show an "scenario active" chip with a clear button, which the Reset button half-provides), and relabel to "Add one more year of Canadian work."

### L9. Collected-but-unused inputs beyond marital status: settlement funds
File: `index.html` line 87 (`funds`), `compute()` reads it in the numeric getter list and never uses it.

Why it matters: the FSW row says funds "still need a full check," but the app collects an exact funds figure and never compares it to anything, not even the published IRCC minimum for a single applicant. A user can reasonably believe their funds were assessed. Either compare against the current IRCC proof-of-funds table (with its own "checked on" date, like the draw data) or drop the field. (`marital` is the same pattern with higher stakes; see M5.)

## Fix order recommended

1. H1 (pin or self-host the Supabase bundle) and M4 (CSP and framing headers): the two changes that protect the credential form.
2. M1 (fractional inputs): the most likely way a real user gets a wrong number today.
3. M2 and M7 (TEER wiring and the CEC threshold): the eligibility matrix is currently wrong for the app's core audience of TEER 2/3 workers.
4. M3 (sign-in error), M5 and M6 (accuracy disclosures and the LMI rule): trust-critical correctness.
5. The Low batch, with L3 and L5 done before any feature that lists or names saved profiles.
