// Express Entry draw data. Source: IRCC rounds of invitations page.
// https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/submit-profile/rounds-invitations.html
// Checked: 2026-11-15. Refreshed when the weekly IRCC watchdog flags a change
// on the rounds page, or when a build verifies the page again.
// Rounds are paused since 2026-11-03 while IRCC recalculates profiles under
// the November 3, 2026 grid, so post-pause cutoffs may not compare directly.
window.DRAWS = {
  updated: "2026-11-15",
  source: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/submit-profile/rounds-invitations.html",
  status: "Rounds paused since November 3, 2026 for profile recalculation under the new CRS grid.",
  cec: [
    { date: "2026-10-15", round: 449, cutoff: 519, itas: 2500 },
    { date: "2026-09-29", round: 446, cutoff: 518, itas: 2000 },
    { date: "2026-09-15", round: 443, cutoff: 519, itas: 2000 },
    { date: "2026-09-01", round: null, cutoff: 521, itas: null },
    { date: "2026-08-18", round: null, cutoff: 523, itas: null }
  ],
  cecRange2026: "507 to 523",
  latestOverall: "October 28, 2026: Transport category round, cutoff 477, 150 invitations."
};
