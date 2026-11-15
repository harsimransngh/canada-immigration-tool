# Engine test results, Nov 15, 2026

Harness: audit/engine-tests.js runs the live compute() from index.html in Node against hand-computed official-grid expectations.

Critical bug found and fixed before testing could even run: compute() reassigned a const variable in leftover transferability draft lines, which threw a TypeError on every call. In the browser this meant render() died on load: the page showed the hardcoded 496 but the breakdown, eligibility, scenarios, recommendations and outlook sections never populated. Fixed by replacing the transferability block with clean grouped logic (education group min(50, g1a+g1b), foreign group min(50, g2a+g2b), total min(100, g1+g2)).

Results after the fix: 10 of 10 valid cases pass.
- Anchor profile (Harsimran defaults): 496 (core 381, transferability 100, additional 15)
- All language CLB 9: 524
- All language CLB 10: 536
- Bachelor, CLB 9, no work experience: 379
- Default + PNP: 1081 (additional points correctly capped at 600 including the 15 Canadian education points)
- Near-max profile: 1176 (additional capped at 600)
- Age 30: 491 (age points 105)
- Age 45: 386 (age points 0)
- Zero language scores: 350 (work-experience transferability combinations still count, they do not require language)
- Second Canadian work year: 509

Two early "failures" were errors in the test expectations, not the code: both forgot the 600 additional-points cap interaction and the language-independent transferability combinations. Verified by hand against the grid.

## Fix pass, Nov 15, 2026 (after accuracy audit)

Accuracy audit findings F1 to F9 fixed in the engine and verified with an expanded 16-case harness (audit/engine-tests.js), all passing:
- F1: one-year credential now 90 (single column).
- F2: CLB 4 now scores 6 per ability.
- F3/F4/F5: Labour Market Integration rebuilt to the Nov 3, 2026 structure. Core takes max(work route, offer route); work route = length points + high-wage occupation bonus (new input, 20/40/70); offer moved out of additional points into core. Audit's worked example now gives 556 (was 636). PNP + offer case gives 1141 with the offer counted in core.
- F6: second official language inputs added (per ability 0/1/3/6, cap 24, or 22 with accompanying spouse).
- F7: certificate of qualification input added (25 at CLB 5+ all, 50 at CLB 7+ all, inside the 100 transferability cap).
- F8: spouse scoring implemented. Non-accompanying spouse scores on the single columns (official rule); accompanying spouse switches the principal to the with-spouse columns and adds section B spouse factors (education, language, Canadian work, max 40). Test case: anchor profile with accompanying spouse and a Bachelor spouse = 474.
- F9: French bonus tier is now automatic from first language scores (50 when all CLB 5+, else 25) once the user confirms NCLC 7+ in French.
- Fractional language inputs now floor to the band below instead of scoring 0.

## Security fix pass, Nov 15, 2026 (after security and bug audit)

- H1 fixed: Supabase JS is pinned to version 2.119.0 with a Subresource Integrity hash (sha384) and crossorigin attribute, no longer a floating @2 URL.
- All inline scripts moved to a same-origin app.js, so the Content Security Policy in vercel.json can run without script-src 'unsafe-inline'. CSP, HSTS, X-Frame-Options DENY, nosniff and Referrer-Policy are now set for all routes.
- M1 fixed: fractional inputs floor to the band below (language and age), and integer inputs carry step="1".
- M2 fixed: category draw row now reads the TEER select directly (compute never returned nocTeer).
- M3 fixed: a failed sign-in now keeps the real error message instead of overwriting it with "Not signed in."
- M7 fixed: CEC eligibility uses the right language threshold, CLB 7 for TEER 0/1 and CLB 5 for TEER 2/3.
- Lows fixed: daysUntil guards invalid dates (no more NaN countdowns), profile load only writes known form fields (email and password fields can no longer be populated from stored JSON), saving replaces the previous saved profile instead of piling up duplicates, schema.sql is re-runnable with an index on user_id and sanity checks on label and CRS.
- Full app smoke test: the complete app.js now executes end to end in a DOM stub with no errors, and the breakdown and eligibility sections populate. This is the regression test for the original critical crash.
