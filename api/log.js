// Activity logging endpoint for the Canada Immigration Tool.
// Receives small event beacons from track.js, enriches them server side with
// the visitor's IP and Vercel geo headers, and inserts them into the Supabase
// events table using the service role key (server only, never shipped to the
// browser). The simulator answers people type are never sent here by design:
// only event names, a random session id, the test selected, and a CRS band.
//
// Env required in Vercel: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
// Retention: rows older than 90 days are deleted opportunistically.

const ALLOWED_EVENTS = new Set([
  "page_view", "score_computed", "lang_test_selected", "scenario_click",
  "print_report", "sign_up", "sign_in", "profile_saved", "profile_loaded",
  "mismatch_click"
]);
const BANDS = ["under 300", "300-399", "400-449", "450-499", "500-519", "520-549", "550+"];
const TESTS = ["clb", "celpip", "ielts", "pte", "tef", "tcf"];

function clean(v, max) {
  if (typeof v !== "string") return null;
  const s = v.trim().slice(0, max);
  return s.length ? s : null;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "method not allowed" }); return; }
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { res.status(500).json({ error: "logging not configured" }); return; }

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  if (!body || typeof body !== "object") body = {};

  const event = clean(body.event, 40);
  if (!event || !ALLOWED_EVENTS.has(event)) { res.status(400).json({ error: "unknown event" }); return; }

  const fwd = (req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  const ip = fwd || req.headers["x-real-ip"] || null;
  const row = {
    session_id: clean(body.session, 64),
    event,
    score_band: BANDS.includes(body.band) ? body.band : null,
    test: TESTS.includes(body.test) ? body.test : null,
    meta: (body.meta && typeof body.meta === "object" && !Array.isArray(body.meta)) ? body.meta : {},
    ip,
    country: clean(req.headers["x-vercel-ip-country"] || "", 8) || (body.country ? clean(body.country, 8) : null),
    region: clean(req.headers["x-vercel-ip-country-region"] || "", 60),
    city: clean(decodeURIComponent(req.headers["x-vercel-ip-city"] || ""), 80),
    ua: clean(req.headers["user-agent"] || "", 300)
  };

  const headers = { "apikey": key, "Authorization": "Bearer " + key, "Content-Type": "application/json", "Prefer": "return=minimal" };
  try {
    const r = await fetch(url + "/rest/v1/events", { method: "POST", headers, body: JSON.stringify(row) });
    if (!r.ok) { res.status(502).json({ error: "store failed" }); return; }
    // Opportunistic 90 day retention cleanup, about 1 in 100 requests.
    if (Math.random() < 0.01) {
      const cutoff = new Date(Date.now() - 90 * 86400000).toISOString();
      fetch(url + "/rest/v1/events?created_at=lt." + encodeURIComponent(cutoff), { method: "DELETE", headers }).catch(() => {});
    }
    res.status(204).end();
  } catch (e) {
    res.status(502).json({ error: "store failed" });
  }
};
