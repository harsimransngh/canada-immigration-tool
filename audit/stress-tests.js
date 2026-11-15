// Stress and robustness suite for the Canada Immigration Tool.
// Run: node audit/stress-tests.js   (exit code 0 = all pass)
// Purpose: prove the engine cannot be broken by hostile, random, or edge inputs,
// and that its internal arithmetic invariants hold across the whole input space.
// Deterministic: the PRNG is seeded, so every run tests the exact same profiles.
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const rules = fs.readFileSync(path.join(root, "rules.js"), "utf8");
const draws = fs.readFileSync(path.join(root, "draws.js"), "utf8");
const appjs = fs.readFileSync(path.join(root, "app.js"), "utf8");

// ---------- DOM stub + form model ----------
const elements = {}; const selectOptions = {};
const re = /<(\w+)[^>]*id="([^"]+)"([^>]*)>/g; let m;
while ((m = re.exec(html))) {
  const tag = m[1], id = m[2], attrs = m[3];
  const el = { id, tagName: tag.toUpperCase(), value: "", textContent: "", innerHTML: "", style: {},
    listeners: {}, addEventListener(k, f) { (this.listeners[k] = this.listeners[k] || []).push(f); }, classList: { add() {}, remove() {} } };
  const vm = attrs.match(/value="([^"]*)"/); if (vm) el.value = vm[1];
  if (tag === "select") {
    const seg = html.slice(m.index, html.indexOf("</select>", m.index));
    const opts = [...seg.matchAll(/<option value="([^"]*)"([^>]*)>/g)].map(o => ({ v: o[1], sel: /selected/.test(o[2]) }));
    selectOptions[id] = opts.map(o => o.v);
    const chosen = opts.find(o => o.sel) || opts[0]; el.value = chosen ? chosen.v : "";
  }
  elements[id] = el;
}
global.document = { getElementById: id => elements[id] || null, querySelectorAll: () => [], addEventListener() {} };
global.window = {}; global.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
eval(rules); eval(draws);
const R = global.window.CRS_RULES;
eval(appjs.split("let scenario")[0]);

// ---------- PRNG (mulberry32, seeded) ----------
let seed = 20261115;
function rnd() { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
function pick(arr) { return arr[Math.floor(rnd() * arr.length)]; }
function num(lo, hi) { return Math.floor(rnd() * (hi - lo + 1)) + lo; }

let pass = 0, fail = 0; const failures = [];
function checkTrue(name, cond, detail) { if (cond) pass++; else { fail++; if (failures.length < 15) failures.push(name + (detail ? " :: " + detail : "")); } }

// ---------- 1. Converter boundary tests: every threshold, both sides ----------
const STEPS = { ielts: 0.5, pte: 1, tef: 1, tcf: 1 };
for (const test of Object.keys(R.conversions)) {
  for (const skill of Object.keys(R.conversions[test])) {
    const table = R.conversions[test][skill]; const step = STEPS[test];
    const levels = Object.keys(table).map(Number).sort((a, b) => b - a);
    for (const lvl of levels) {
      checkTrue(test + "/" + skill + " at threshold " + table[lvl] + " = " + lvl, convertScore(test, skill, table[lvl]) === lvl);
      const below = table[lvl] - step;
      const expectedBelow = levels.filter(l => l < lvl && table[l] <= below).sort((a, b) => b - a)[0] || 0;
      checkTrue(test + "/" + skill + " just below " + table[lvl] + " = " + expectedBelow, convertScore(test, skill, below) === expectedBelow, "got " + convertScore(test, skill, below));
    }
    // monotonic across the whole raw range
    let prev = -1, mono = true; const maxRaw = Math.max(...Object.values(table)) + 50;
    for (let v = 0; v <= maxRaw; v += step) { const c = convertScore(test, skill, v); if (c < prev) mono = false; prev = c; }
    checkTrue(test + "/" + skill + " monotonic over raw range", mono);
  }
}

// ---------- 2. Rules data structure checks ----------
checkTrue("age table peaks at 110 for 20-29 (single)", R.ageSingle.slice(20, 30).every(v => v === 110));
checkTrue("age table zero at 45+ and under 18", R.ageSingle[45] === 0 && R.ageSingle[17] === 0 && R.ageSpouse[45] === 0);
checkTrue("language tables non-decreasing in CLB", [R.langFirstSingle, R.langFirstSpouse, R.langSecond, R.spouseLang].every(t => t.every((v, i) => i === 0 || v >= t[i - 1])));
checkTrue("canadian work tables non-decreasing", R.canWorkSingle.every((v, i) => i === 0 || v >= R.canWorkSingle[i - 1]) && R.canWorkSpouse.every((v, i) => i === 0 || v >= R.canWorkSpouse[i - 1]));
checkTrue("caps sane", R.meta.caps.transferability === 100 && R.meta.caps.additional === 600 && R.meta.maxCRS === 1270);

// ---------- 3. Fuzz compute(): invariants over 200k random profiles ----------
const SELECT_FIELDS = Object.keys(selectOptions);
const TESTS = ["clb", "celpip", "ielts", "pte", "tef", "tcf"];
const RAW_MAX = { clb: 14, celpip: 14, ielts: 9.5, pte: 95, tef: 460, tcf: 710 };
function randomProfile() {
  const p = {};
  for (const f of SELECT_FIELDS) { if (elements[f]) p[f] = pick(selectOptions[f]); }
  const test = pick(TESTS); p.langTest = test;
  p.age = pick([num(-5, 120), num(17, 50), 999, 0]);
  for (const id of ["langL", "langR", "langW", "langS"]) p[id] = Math.round(rnd() * RAW_MAX[test] * 2) / 2;
  for (const id of ["lang2L", "lang2R", "lang2W", "lang2S", "spouseLangL", "spouseLangR", "spouseLangW", "spouseLangS"]) p[id] = num(0, 13);
  p.canWorkMonths = pick(["", num(0, 700)]); p.foreignWorkMonths = pick(["", num(0, 700)]);
  p.canWorkHours = pick(["", num(0, 90)]); p.foreignWorkHours = pick(["", num(0, 90)]);
  return p;
}
function setForm(p) { for (const k in p) { if (elements[k]) elements[k].value = String(p[k]); } }
const t0 = Date.now(); let fuzzBad = 0, firstBad = "";
for (let i = 0; i < 200000; i++) {
  const p = randomProfile(); setForm(p);
  let r;
  try { r = compute({}); } catch (e) { fuzzBad++; firstBad = "threw " + e.message + " on " + JSON.stringify(p); break; }
  const addSum = Math.min(600, (r.canEdu || 0) + (r.french || 0) + (r.sibling || 0) + (r.pnp || 0));
  const recomposed = r.coreAge + r.edu + r.langPts + r.lang2Pts + r.lmi + r.spousePts + r.transfer + addSum;
  const ok = Number.isInteger(r.total) && r.total >= 0 && r.total <= 1270 && r.transfer <= 100 && r.lmi <= 150 && recomposed === r.total;
  if (!ok) { fuzzBad++; firstBad = "invariant broken: total " + r.total + " recomposed " + recomposed + " on " + JSON.stringify(p); break; }
}
const fuzzMs = Date.now() - t0;
checkTrue("fuzz 200k profiles: no throw, integer totals in [0,1270], caps hold, breakdown recomposes exactly", fuzzBad === 0, firstBad);
console.log("fuzz compute: 200,000 profiles in " + fuzzMs + "ms");

// ---------- 4. Monotonicity fuzz: raising a language skill never lowers the total ----------
let monoBad = 0;
for (let i = 0; i < 20000; i++) {
  const p = randomProfile(); p.langTest = "clb"; setForm(p);
  const base = compute({}).total;
  const id = pick(["langL", "langR", "langW", "langS"]);
  const bumped = Object.assign({}, p); bumped[id] = Math.min(12, (parseFloat(p[id]) || 0) + 1);
  setForm(bumped);
  if (compute({}).total < base) { monoBad++; break; }
}
checkTrue("monotonicity fuzz 20k: +1 CLB in any skill never lowers total", monoBad === 0);

// ---------- 5. DOM chaos: random mutations through the real render path ----------
global.window = {}; eval(rules); eval(draws);
let domBad = "";
try {
  eval(appjs);
  const fieldIds = Object.keys(elements).filter(id => elements[id].listeners && (elements[id].listeners.input || elements[id].listeners.change));
  for (let i = 0; i < 5000; i++) {
    const p = randomProfile(); setForm(p);
    for (const id of fieldIds) { const ls = elements[id].listeners; (ls.input || []).forEach(f => f()); (ls.change || []).forEach(f => f()); }
    const s = String(elements.crsScore.textContent);
    if (!/^\d+$/.test(s) || parseInt(s) > 1270) { domBad = "score element showed '" + s + "'"; break; }
  }
} catch (e) { domBad = "render threw: " + e.message; }
checkTrue("DOM chaos 5k random form states: render never throws, score always numeric and <= 1270", domBad === "", domBad);

console.log(pass + " passed, " + fail + " failed");
if (failures.length) console.log(failures.join("\n"));
process.exit(fail ? 1 : 0);
