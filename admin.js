// Owner dashboard logic. Reads the events table through Supabase with the
// signed-in owner's session; row level security restricts reads to the
// owner account, so any other sign-in simply gets zero rows.
const $ = id => document.getElementById(id);
let supa = null;
try { if (window.APP_CONFIG && window.APP_CONFIG.SUPABASE_URL.indexOf("http") === 0) { supa = window.supabase.createClient(window.APP_CONFIG.SUPABASE_URL, window.APP_CONFIG.SUPABASE_ANON_KEY); } } catch (e) { supa = null; }

function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function countBy(rows, key) {
  const m = {};
  rows.forEach(r => { const k = r[key] || "(none)"; m[k] = (m[k] || 0) + 1; });
  return Object.entries(m).sort((a, b) => b[1] - a[1]);
}
function fillTable(id, pairs) {
  $(id).innerHTML = pairs.map(p => "<tr><td>" + esc(p[0]) + "</td><td style='text-align:right'><b>" + p[1] + "</b></td></tr>").join("") || "<tr><td>No data yet.</td><td></td></tr>";
}

async function load() {
  if (!supa) { $("loadNote").textContent = "Dashboard is not connected yet."; return; }
  const { data, error } = await supa.from("events").select("*").order("created_at", { ascending: false }).limit(500);
  if (error) { $("loadNote").textContent = error.message; return; }
  const rows = data || [];
  $("loadNote").textContent = "Loaded the latest " + rows.length + " events. Counts below cover this loaded window.";
  $("kEvents").textContent = rows.length;
  $("kSessions").textContent = new Set(rows.map(r => r.session_id).filter(Boolean)).size;
  $("kIps").textContent = new Set(rows.map(r => r.ip).filter(Boolean)).size;
  $("kScores").textContent = rows.filter(r => r.event === "score_computed").length;
  fillTable("byType", countBy(rows, "event"));
  fillTable("byBand", countBy(rows.filter(r => r.event === "score_computed"), "score_band"));
  fillTable("byCountry", countBy(rows, "country"));
  fillTable("byTest", countBy(rows.filter(r => r.test), "test"));
  $("feed").innerHTML = rows.slice(0, 100).map(r =>
    "<tr><td>" + esc(new Date(r.created_at).toLocaleString("en-CA")) + "</td><td>" + esc(r.event) + "</td><td>" + esc(r.ip) + "</td><td>" +
    esc([r.city, r.region, r.country].filter(Boolean).join(", ")) + "</td><td>" + esc([r.score_band, r.test].filter(Boolean).join(" / ")) +
    "</td><td>" + esc((r.session_id || "").slice(0, 8)) + "</td></tr>").join("");
}

async function refreshAuth() {
  if (!supa) { $("authStatus").textContent = "Saving is being connected."; return; }
  const { data } = await supa.auth.getSession();
  const user = data.session && data.session.user;
  $("authStatus").textContent = user ? ("Signed in as " + user.email) : "Not signed in.";
  $("dash").style.display = user ? "block" : "none";
  if (user) load();
}
$("signInBtn").addEventListener("click", async () => {
  if (!supa) return refreshAuth();
  const { error } = await supa.auth.signInWithPassword({ email: $("email").value, password: $("password").value });
  if (error) { $("authStatus").textContent = error.message; return; }
  refreshAuth();
});
$("signOutBtn").addEventListener("click", async () => { if (supa) await supa.auth.signOut(); refreshAuth(); });
$("refreshBtn").addEventListener("click", load);
refreshAuth();
