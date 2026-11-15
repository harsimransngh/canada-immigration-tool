// Golden test suite for the CRS engine and language converters.
// Run: node audit/engine-tests.js   (exit code 0 = all pass)
// Cases are anchored to IRCC's official CRS criteria and equivalency charts.
// Every "report a mismatch" issue should become a new case here.
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const rules = fs.readFileSync(path.join(root, "rules.js"), "utf8");
const appjs = fs.readFileSync(path.join(root, "app.js"), "utf8");

// --- DOM stub built from the real form ---
const elements = {};
const re = /<(\w+)[^>]*id="([^"]+)"([^>]*)>/g; let m;
while ((m = re.exec(html))) {
  const tag = m[1], id = m[2], attrs = m[3];
  const el = { id, tagName: tag.toUpperCase(), value: "", textContent: "", innerHTML: "", style: {},
    listeners: {}, addEventListener(k, f) { this.listeners[k] = f; }, classList: { add() {}, remove() {} } };
  const vm = attrs.match(/value="([^"]*)"/); if (vm) el.value = vm[1];
  if (tag === "select") {
    const seg = html.slice(m.index, html.indexOf("</select>", m.index));
    const opts = [...seg.matchAll(/<option value="([^"]*)"([^>]*)>/g)].map(o => ({ v: o[1], sel: /selected/.test(o[2]) }));
    const chosen = opts.find(o => o.sel) || opts[0]; el.value = chosen ? chosen.v : "";
  }
  elements[id] = el;
}
global.document = { getElementById: id => elements[id] || null, querySelectorAll: () => [], addEventListener() {} };
global.window = {}; global.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
eval(rules);
const engineSrc = appjs.split("let scenario")[0];
eval(engineSrc);
function setForm(obj) { for (const k in obj) { if (elements[k]) elements[k].value = String(obj[k]); } }
const BASE = { age: 28, marital: "single", education: "master", langTest: "clb", langL: 9, langR: 9, langW: 7, langS: 7,
  lang2L: 0, lang2R: 0, lang2W: 0, lang2S: 0, canWork: 1, foreignWork: 3, wageBonus: 0, certQual: "0",
  canEdu: 15, nocTeer: "2", frenchNCLC: "0", sibling: 0, pnp: 0, offer: 0, spouseEdu: "0",
  spouseLangL: 0, spouseLangR: 0, spouseLangW: 0, spouseLangS: 0, spouseCanWork: "0",
  canWorkMonths: "", canWorkHours: "", foreignWorkMonths: "", foreignWorkHours: "" };
function total(over) { setForm(Object.assign({}, BASE, over)); return compute({}).total; }

let pass = 0, fail = 0;
function check(name, got, exp) { const ok = got === exp; if (ok) pass++; else { fail++; console.log("FAIL " + name + ": got " + got + ", expected " + exp); } }
function checkTrue(name, cond) { if (cond) pass++; else { fail++; console.log("FAIL " + name); } }

// --- Golden anchors (hand-verified against IRCC tables) ---
check("anchor: his profile = 496", total({}), 496);
check("all CLB 9 = 524", total({ langL: 9, langR: 9, langW: 9, langS: 9 }), 524);
check("all CLB 10 = 536", total({ langL: 10, langR: 10, langW: 10, langS: 10 }), 536);
check("LMI either/or (F3) = 510", total({ canWork: 3, offer: 100, education: "bachelor", langL: 8, langR: 8, langW: 8, langS: 8, foreignWork: 3, canEdu: 0 }), 510); // hand-derived: core 422 (offer route 100 beats work route 64) + transfer 88
check("one-year credential (F1) = 334", total({ education: "one", langL: 7, langR: 7, langW: 7, langS: 7, canWork: 1, foreignWork: 0, canEdu: 0 }), 334); // hand-derived: core 308 + transfer 26
check("CLB 4 floor (F2) = 307", total({ education: "bachelor", langL: 4, langR: 4, langW: 4, langS: 4, canWork: 1, foreignWork: 0, canEdu: 0 }), 307); // hand-derived: core 294 + transfer 13 (education + Canadian work)
check("spouse accompanying = 491", total({ marital: "married_acc", spouseEdu: "8", spouseLangL: 7, spouseLangR: 7, spouseLangW: 7, spouseLangS: 7, spouseCanWork: "5" }), 491); // hand-derived: core 351 + spouse 25 + transfer 100 + canEdu 15
check("second language = 520", total({ lang2L: 9, lang2R: 9, lang2W: 9, lang2S: 9 }), 520);
check("french bonus = 546", total({ frenchNCLC: "1" }), 546);
check("PNP + offer (F4) = 1141", total({ pnp: 600, offer: 100 }), 1141);
check("high-wage bonus = 566", total({ wageBonus: 70 }), 566);
check("fractional age floors = 472", total({ age: 30.9, langL: 8, langR: 8, langW: 8, langS: 8, canEdu: 0 }), 472); // hand-derived: age 30.9 floors to 30 (105 pts), core 372 + transfer 100

// --- Converter cases: raw scores equal to CLB 9/9/7/7 must reproduce 496 ---
check("IELTS 8/7/6/6 = 496", total({ langTest: "ielts", langL: 8, langR: 7, langW: 6, langS: 6 }), 496);
check("PTE 82/78/69/68 = 496", total({ langTest: "pte", langL: 82, langR: 78, langW: 69, langS: 68 }), 496);
check("TEF ancien 298/248/310/310 = 496", total({ langTest: "tef", langL: 298, langR: 248, langW: 310, langS: 310 }), 496);
check("TCF 523/524/10/10 = 496", total({ langTest: "tcf", langL: 523, langR: 524, langW: 10, langS: 10 }), 496);
checkTrue("TCF asymmetry: Reading 523 is NCLC 8, not 9", convertScore("tcf", "reading", 523) === 8 && convertScore("tcf", "listening", 523) === 9);
checkTrue("IELTS Reading 7.5 stays CLB 9", convertScore("ielts", "reading", 7.5) === 9);
checkTrue("PTE Writing 89 is CLB 9, 90 is CLB 10", convertScore("pte", "writing", 89) === 9 && convertScore("pte", "writing", 90) === 10);
checkTrue("below CLB 4 converts to 0", convertScore("ielts", "listening", 4.0) === 0 && convertScore("tcf", "writing", 3) === 0);

// --- Hours-based work entry ---
check("24 months full time = 2 year band", total({ canWork: 0, canWorkMonths: 24, canWorkHours: 30 }), total({ canWork: 2 }));
check("48 months at 15 h/week = 2 year band", total({ canWork: 0, canWorkMonths: 48, canWorkHours: 15 }), total({ canWork: 2 }));
check("11 months full time = 0 years", total({ canWork: 0, canWorkMonths: 11, canWorkHours: 40, foreignWork: 0 }), total({ canWork: 0, foreignWork: 0 }));

// --- Property sweeps ---
let mono = true, prev = -1;
for (let c = 3; c <= 12; c++) { const t = total({ langL: c, langR: c, langW: c, langS: c }); if (t < prev) mono = false; prev = t; }
checkTrue("monotonic in uniform CLB 3..12", mono);
let caps = true;
for (const age of [18, 25, 30, 40, 50]) for (const edu of ["none", "bachelor", "master", "phd"])
  for (const cw of [0, 1, 3, 5]) for (const pnp of [0, 600]) {
    setForm(Object.assign({}, BASE, { age, education: edu, canWork: cw, pnp, langL: 10, langR: 10, langW: 10, langS: 10 }));
    const r = compute({}); if (r.total > 1270 || r.transfer > 100 || r.total < 0) caps = false;
  }
checkTrue("caps hold across sweep (total <= 1270, transfer <= 100)", caps);
check("PNP adds exactly 600 when no other additional points", total({ pnp: 600, canEdu: 0 }) - total({ pnp: 0, canEdu: 0 }), 600);

// --- Full app smoke test (catches render crashes like the first release bug) ---
global.window = {}; eval(rules);
let smoke = "PASS";
try { eval(appjs); if (!String(elements.crsScore.textContent).match(/^\d+$/)) smoke = "FAIL score not numeric"; }
catch (e) { smoke = "FAIL " + e.message; }
checkTrue("full app render smoke", smoke === "PASS");

console.log(pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
