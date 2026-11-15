# Canada Immigration Tool

A public CRS simulator and pathway advisor for Canadian immigration, built on the CRS grid in force since November 3, 2026 (max 1,270).

## What it does
- Collects a visitor profile: age, education and ECA, language scores, Canadian and foreign work, Canadian education, French, sibling in Canada, provincial nomination, and high-wage job offer tier.
- Calculates an estimated CRS score with a full breakdown, including skill transferability groups capped at 50 each and additional points capped at 600.
- Shows what-if scenarios: language to CLB 9 or CLB 10, a second year of Canadian work, a provincial nomination, and French.
- Checks pathway eligibility for CEC, FSW, category-based draws, PNP and RCIP, with reasons.
- Gives ranked recommendations and a future outlook with 2026 draw ranges, expiry countdowns and a 30 / 60 / 90 day plan.
- Optional free account: visitors can sign up with Supabase Auth and save / load their profile. Profiles are stored in the `profiles` table and protected by Row Level Security, so each user can only access their own.

## Stack
- Static site (HTML, CSS, JavaScript), no build step.
- GitHub for code, Vercel for deployment, Supabase for auth and saved profiles.

## Supabase setup
Run `supabase/schema.sql` in the Supabase SQL Editor. Put the project URL and anon (publishable) key in `config.js`. The anon key is a public client key; data is protected by RLS policies in the schema.

## Disclaimer
Unofficial planning estimate only. Not legal or immigration advice, and not affiliated with IRCC or the Government of Canada. Official scores are calculated by IRCC inside a candidate's Express Entry profile.
