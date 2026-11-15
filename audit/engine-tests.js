const fs=require('fs');
const appjs=fs.readFileSync('/home/hatch/workspace/canada-immigration-tool-public/app.js','utf8');
const enginePart=appjs.split('let scenario=')[0];
let profile={age:"28",marital:"single",education:"master",langL:"9",langR:"9",langW:"7",langS:"7",lang2L:"0",lang2R:"0",lang2W:"0",lang2S:"0",canWork:"1",foreignWork:"3",wageBonus:"0",certQual:"0",canEdu:"15",nocTeer:"2",frenchNCLC:"0",sibling:"0",pnp:"0",offer:"0",relocate:"yes",testDate:"2026-12-19",permitDate:"2029-01-28",funds:"15000",spouseEdu:"0",spouseLangL:"0",spouseLangR:"0",spouseLangW:"0",spouseLangS:"0",spouseCanWork:"0"};
global.document={ getElementById:(id)=>({ value: profile[id] !== undefined ? profile[id] : "" }) };
eval(enginePart);
function run(p, ov){ profile=p; return compute(ov||{}); }
const base={...profile};
const cases=[
 ["anchor", base, null, 496],["CLB9", base, {langL:9,langR:9,langW:9,langS:9}, 524],["CLB10", base, {langL:10,langR:10,langW:10,langS:10}, 536],
 ["F3 556", {...base,canWork:"5",offer:"100"}, null, 556],["F1 349", {...base,education:"one",langW:"9",langS:"9",canWork:"0",foreignWork:"0",canEdu:"0"}, null, 349],
 ["F2 374", {...base,langL:"4",langR:"4",langW:"4",langS:"4"}, null, 374],["spouse 474", {...base,marital:"married_acc",spouseEdu:"8"}, null, 474],
 ["lang2 520", {...base,lang2L:"9",lang2R:"9",lang2W:"9",lang2S:"9"}, null, 520],["cert 496", {...base,foreignWork:"0",certQual:"1"}, null, 496],
 ["french 546", {...base,frenchNCLC:"1"}, null, 546],["PNP+offer 1141", {...base,pnp:"600",offer:"100"}, null, 1141],["wage 566", {...base,wageBonus:"70"}, null, 566],
 ["frac age 30.9 floors to 30: 491", {...base,age:"30.9"}, null, 491],
];
let fails=0;
for(const [n,p,ov,exp] of cases){ const r=run(p,ov); const ok=r.total===exp; if(!ok)fails++; console.log((ok?"PASS":"FAIL"),n,r.total,"exp",exp); }
console.log(fails===0?"ALL ENGINE PASS":fails+" FAIL");
// Full app.js runtime smoke test with DOM stub
const els={};
function el(id){ if(!els[id]) els[id]={ id, value: profile[id]!==undefined?profile[id]:"", textContent:"", innerHTML:"", style:{}, addEventListener:()=>{} }; return els[id]; }
global.document={ getElementById: el, querySelectorAll: ()=>[] };
global.window={};
try{ eval(appjs); console.log("FULL APP RENDER SMOKE: PASS (no throw)"); console.log("score el:", els.crsScore.textContent, "| breakdown has Total:", String(els.breakdown.innerHTML).includes("Total"), "| eligibility rows:", String(els.eligibility.innerHTML).split("<tr>").length-1); }
catch(e){ console.log("FULL APP RENDER SMOKE: FAIL", e.message); }
