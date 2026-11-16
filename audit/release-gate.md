# Release gate for the Canada Immigration Tool

Standing instruction from Harsimran (2026-11-15): this tool is sensitive. Wrong
information can cost a user an immigration outcome, so NO build ships on a
quick check. Every build, without exception, passes the full battery below
before it is reported as done, and the report states the results in detail.

Honesty note: no test battery can prove 100 percent accuracy. The only
official CRS score is the one IRCC calculates inside an Express Entry profile.
What this gate proves is narrower and real: the engine reproduces IRCC's
published tables on every anchored case, its arithmetic invariants hold across
the whole input space, it cannot be crashed or pushed out of range by hostile
input, and the exact code deployed live passes the same tests.

## The battery (all five, every build)

1. **Golden suite** — `node audit/engine-tests.js`
   Anchored cases hand-derived from IRCC's CRS criteria and equivalency
   charts: the 496 / 524 / 536 anchors, every past audit finding (F1 to F9) as
   a regression case, converter equivalence cases for IELTS, PTE Core, TEF
   Canada and TCF Canada, hours-based work cases, cap and monotonicity
   sweeps, and a full-app render smoke test.

2. **Stress suite** — `node audit/stress-tests.js`
   Converter boundary tests at every threshold on both sides for every test
   and skill; rules-data structure checks; a seeded fuzz of 200,000 random
   profiles (including negative, fractional, oversized and empty inputs)
   asserting no throws, integer totals inside 0 to 1,270, all caps respected,
   and that the published breakdown recomposes to the total exactly;
   20,000-case monotonicity fuzz; and a 5,000-state DOM chaos run through the
   real render path.

3. **Live verification** — after deployment, download index.html, app.js and
   rules.js from the production URL and run BOTH suites against the deployed
   files. A local pass is not a release. (Fetch the root URL for index.html;
   /index.html redirects.)

4. **Rules-change audit** — if the build touched rules.js values, the changed
   values are re-verified line by line against IRCC's CRS criteria page and
   equivalency charts before pushing, and the "verified" date in rules.js is
   bumped only after that check. The weekly watchdog cron flags page changes
   between builds.

5. **Security and headers spot check** — confirm the production response still
   carries the CSP, HSTS, X-Frame-Options and nosniff headers, and that the
   Supabase script tag is still pinned with its integrity hash.

## Reporting standard

The completion report for every build states: what changed, the golden suite
result, the stress suite result (including fuzz counts), the live verification
result, and any known limitation that remains. A failure anywhere stops the
release; it is fixed and the whole battery reruns, never just the failed case.

## 6. Auth flow check (added 2026-11-15 after the localhost redirect miss)
Any build that touches auth, plus every new Supabase project setup, must verify:
- Supabase Authentication URL Configuration: Site URL equals the production URL (never localhost), and the production origin is in the redirect allow list.
- One real end to end pass: sign up with a test address, open the confirmation email, click the link, and confirm it lands on the production site and the account confirms. Delete the test user after.
