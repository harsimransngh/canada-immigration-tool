const $=id=>document.getElementById(id);
const fields=["age","marital","education","langTest","langL","langR","langW","langS","lang2L","lang2R","lang2W","lang2S","canWork","foreignWork","canWorkMonths","canWorkHours","foreignWorkMonths","foreignWorkHours","wageBonus","certQual","canEdu","nocTeer","frenchNCLC","sibling","pnp","offer","relocate","testDate","permitDate","funds","spouseEdu","spouseLangL","spouseLangR","spouseLangW","spouseLangS","spouseCanWork"];
function val(id){const e=$(id);return e?e.value:"";}
function num(id){return parseFloat(val(id))||0;}
const R=window.CRS_RULES;
const DRAWS=(window.DRAWS&&window.DRAWS.cec&&window.DRAWS.cec.length)? window.DRAWS : {cec:[{date:"2026-10-15",round:449,cutoff:519,itas:2500}],updated:"2026-11-15",status:""};
const LAST_CEC=DRAWS.cec[0];
function fmtDate(iso){ const d=new Date(iso+"T00:00:00"); return isNaN(d.getTime())? iso : d.toLocaleDateString("en-CA",{month:"short",day:"numeric",year:"numeric"}); }
const EDU_ORDER=R.eduOrder;
const EDU_SINGLE=R.eduSingle;
const EDU_SPOUSE=R.eduSpouse;
function clbLookup(table,score){ const c=Math.max(0,Math.min(12,Math.floor(score)||0)); return table[c]; }
function clbPoints(score,spouse){ return clbLookup(spouse?R.langFirstSpouse:R.langFirstSingle, score); }
function secondLangPoints(score){ return clbLookup(R.langSecond, score); }
function spouseLangPoints(score){ return clbLookup(R.spouseLang, score); }
function agePoints(a,spouse){ const t=spouse?R.ageSpouse:R.ageSingle; return (a>=0&&a<t.length)? t[a] : 0; }
function canWorkPoints(y,spouse){ const t=spouse?R.canWorkSpouse:R.canWorkSingle; const i=Math.max(0,Math.min(5,Math.floor(y)||0)); return t[i]; }
const SKILLS=["listening","reading","writing","speaking"];
const LANG_IDS=["langL","langR","langW","langS"];
function convertScore(test, skill, raw){
  const v=parseFloat(raw)||0;
  if(!test||test==="clb"||test==="celpip"){ return Math.max(0, Math.min(12, Math.floor(v))); }
  const table=(R.conversions[test]||{})[skill]; if(!table) return 0;
  const levels=Object.keys(table).map(Number).sort((a,b)=>b-a);
  for(const lvl of levels){ if(v>=table[lvl]) return lvl; }
  return 0;
}
function compute(overrides){
  const get=(id,def)=> (overrides&&id in overrides)? overrides[id] : (["age","langL","langR","langW","langS","lang2L","lang2R","lang2W","lang2S","funds","spouseLangL","spouseLangR","spouseLangW","spouseLangS"].includes(id)? num(id) : val(id));
  const marriedAcc=get("marital")==="married_acc";
  const age=Math.floor(parseFloat(get("age"))||0);
  const eduIdx=Math.max(0, EDU_ORDER.indexOf(get("education")));
  const edu=(marriedAcc?EDU_SPOUSE:EDU_SINGLE)[eduIdx];
  const langTest=get("langTest");
  const scores=SKILLS.map((sk,i)=>{ const v=parseFloat(get(LANG_IDS[i]))||0; return (overrides && LANG_IDS[i] in overrides) ? Math.max(0,Math.min(12,Math.floor(v))) : convertScore(langTest, sk, v); });
  const langPts=scores.reduce((s,x)=>s+clbPoints(x,marriedAcc),0);
  const scores2=[parseFloat(get("lang2L"))||0,parseFloat(get("lang2R"))||0,parseFloat(get("lang2W"))||0,parseFloat(get("lang2S"))||0];
  const lang2Pts=Math.min(marriedAcc?R.meta.caps.secondLangSpouse:R.meta.caps.secondLangSingle, scores2.reduce((s,x)=>s+secondLangPoints(x),0));
  const canMonths=parseFloat(get("canWorkMonths"))||0, canHours=parseFloat(get("canWorkHours"))||30;
  const canY= canMonths>0 ? Math.min(5, Math.floor((canMonths/12)*(Math.min(canHours,30)/30))) : (parseFloat(get("canWork"))||0);
  const workLength=canWorkPoints(canY,marriedAcc);
  const wageBonus=canY>=1? (parseFloat(get("wageBonus"))||0) : 0;
  const workRoute=workLength+wageBonus;
  const offerRoute=parseFloat(get("offer"))||0;
  const lmi=Math.min(marriedAcc?R.meta.caps.lmiSpouse:R.meta.caps.lmiSingle, Math.max(workRoute, offerRoute));
  const coreAge=agePoints(age,marriedAcc);
  const core=coreAge+edu+langPts+lang2Pts+lmi;
  let spousePts=0, spEdu=0, spLang=0, spWork=0;
  if(marriedAcc){ spEdu=parseFloat(get("spouseEdu"))||0; spLang=[parseFloat(get("spouseLangL"))||0,parseFloat(get("spouseLangR"))||0,parseFloat(get("spouseLangW"))||0,parseFloat(get("spouseLangS"))||0].reduce((s,x)=>s+spouseLangPoints(x),0); spWork=parseFloat(get("spouseCanWork"))||0; spousePts=spEdu+spLang+spWork; }
  const allCLB7=scores.every(x=>Math.floor(x)>=7), allCLB9=scores.every(x=>Math.floor(x)>=9), allCLB5=scores.every(x=>Math.floor(x)>=5);
  const isTopTier=["twoplus","master","phd"].includes(get("education")), isPostSec=eduIdx>=2;
  const T=R.transfer;
  let g1a=0; if(isPostSec&&allCLB7) g1a=(isTopTier?T.eduLangTop:T.eduLangLow)[0]; if(isPostSec&&allCLB9) g1a=(isTopTier?T.eduLangTop:T.eduLangLow)[1];
  let g1b=0; if(isPostSec&&canY>=1) g1b=(isTopTier?T.eduWorkTop:T.eduWorkLow)[0]; if(isPostSec&&canY>=2) g1b=(isTopTier?T.eduWorkTop:T.eduWorkLow)[1];
  const g1=Math.min(T.groupCap, g1a+g1b);
  const fMonths=parseFloat(get("foreignWorkMonths"))||0, fHours=parseFloat(get("foreignWorkHours"))||30;
  const fEquiv= fMonths>0 ? (fMonths/12)*(Math.min(fHours,30)/30) : 0;
  const fY= fMonths>0 ? (fEquiv>=3?3 : (fEquiv>=1?1:0)) : (parseFloat(get("foreignWork"))||0);
  let g2a=0; if(fY>=1&&allCLB7) g2a=(fY>=3?T.foreignLang3:T.foreignLang12)[0]; if(fY>=1&&allCLB9) g2a=(fY>=3?T.foreignLang3:T.foreignLang12)[1];
  let g2b=0; if(fY>=1&&canY>=1) g2b=(fY>=3?T.foreignWork3:T.foreignWork12)[0]; if(fY>=1&&canY>=2) g2b=(fY>=3?T.foreignWork3:T.foreignWork12)[1];
  const g2=Math.min(T.groupCap, g2a+g2b);
  const certPts=(get("certQual")==="1")? (allCLB7?T.cert[1] : (allCLB5?T.cert[0]:0)) : 0;
  const transferFinal=Math.min(R.meta.caps.transferability, g1+g2+certPts);
  const canEdu=parseFloat(get("canEdu"))||0, sibling=parseFloat(get("sibling"))||0, pnp=parseFloat(get("pnp"))||0;
  const french=(get("frenchNCLC")==="1")? (allCLB5?50:25) : 0;
  const additional=Math.min(R.meta.caps.additional, canEdu+french+sibling+pnp);
  const total=core+spousePts+transferFinal+additional;
  return {total,core,coreAge,edu,langPts,lang2Pts,lmi,workRoute,offerRoute,spousePts,spEdu,spLang,spWork,transfer:transferFinal,g1,g2,certPts,additional,canEdu,french,sibling,pnp,offer:offerRoute,scores,canY,fY,allCLB7,allCLB9,allCLB5,marriedAcc};
}

let scenario={};
function currentProfile(){ const p={}; fields.forEach(f=>p[f]=val(f)); return p; }
function daysUntil(dateStr){ if(!dateStr) return null; const now=new Date(); now.setHours(0,0,0,0); const d=new Date(dateStr+"T00:00:00"); if(isNaN(d.getTime())) return null; return Math.round((d-now)/86400000); }
function render(){
  const r=compute(scenario);
  $("crsScore").textContent=r.total;
  $("crsBar").style.width=Math.min(100,Math.round(r.total/1270*100))+"%";
  const gap=LAST_CEC.cutoff-r.total;
  $("gapKpi").textContent=gap>0?gap:"0";
  $("crsGap").textContent= gap>0 ? ("Out of 1,270 on the November 3, 2026 grid. You are "+gap+" points below the last CEC cutoff of "+LAST_CEC.cutoff+".") : "Out of 1,270 on the November 3, 2026 grid. You are at or above the last CEC cutoff of "+LAST_CEC.cutoff+".";
  if($("lastCutoff")) $("lastCutoff").textContent=LAST_CEC.cutoff;
  if($("lastCutoffMeta")) $("lastCutoffMeta").textContent=fmtDate(LAST_CEC.date)+(LAST_CEC.itas? ", "+LAST_CEC.itas.toLocaleString("en-CA")+" ITAs" : "");
  if($("mobileScoreVal")) $("mobileScoreVal").textContent=r.total;
  if($("mobileScoreGap")) $("mobileScoreGap").textContent= gap>0 ? gap+" below last CEC cutoff" : "at or above last CEC cutoff";
  if($("progressBar")&&typeof DEFAULTS!=="undefined"){ const changed=fields.filter(f=>{ const e=$(f); return e && DEFAULTS[f]!==undefined && e.value!==DEFAULTS[f]; }).length; $("progressBar").style.width=Math.round(changed/fields.length*100)+"%"; if($("progressText")) $("progressText").textContent="Your score updates live as you fill the form. You have adjusted "+changed+" of "+fields.length+" fields from the sample profile. Nothing is saved unless you create an account below."; }
  $("breakdown").innerHTML=
   ((val("langTest")&&val("langTest")!=="clb")? "<tr><td>Converted to CLB / NCLC (L, R, W, S)</td><td>"+r.scores.join(", ")+"</td></tr>" : "")+
   "<tr><td>Age</td><td>"+r.coreAge+"</td></tr>"+
   "<tr><td>Education</td><td>"+r.edu+"</td></tr>"+
   "<tr><td>First language</td><td>"+r.langPts+"</td></tr>"+
   "<tr><td>Second language</td><td>"+r.lang2Pts+"</td></tr>"+
   "<tr><td>Labour Market Integration (work route "+r.workRoute+" vs offer route "+r.offerRoute+", higher counts)</td><td>"+r.lmi+"</td></tr>"+
   (r.marriedAcc? "<tr><td>Spouse factors (education "+r.spEdu+", language "+r.spLang+", Canadian work "+r.spWork+")</td><td>"+r.spousePts+"</td></tr>" : "")+
   "<tr><td>Skill transferability: education group</td><td>"+r.g1+"</td></tr>"+
   "<tr><td>Skill transferability: foreign work group</td><td>"+r.g2+"</td></tr>"+
   "<tr><td>Skill transferability: certificate of qualification</td><td>"+r.certPts+"</td></tr>"+
   "<tr><td>Additional: Canadian education</td><td>"+r.canEdu+"</td></tr>"+
   "<tr><td>Additional: French bonus</td><td>"+r.french+"</td></tr>"+
   "<tr><td>Additional: Sibling in Canada</td><td>"+r.sibling+"</td></tr>"+
   "<tr><td>Additional: Provincial nomination</td><td>"+r.pnp+"</td></tr>"+
   "<tr><td><b>Total</b></td><td>"+r.total+"</td></tr>";
  const base=compute({});
  const sc=[
    ["All language to CLB 9", compute({langL:9,langR:9,langW:9,langS:9}).total],
    ["All language to CLB 10", compute({langL:10,langR:10,langW:10,langS:10}).total],
    ["Second year of Canadian work", compute({canWork:Math.min(5,(parseFloat(val("canWork"))||0)+1)}).total],
    ["Provincial nomination", compute({pnp:600}).total],
    ["French to NCLC 7+ (with CLB 5+ first language)", compute({french:50}).total]
  ];
  $("scenarios").innerHTML=sc.map(x=>"<p class='small'><b>"+x[0]+":</b> "+x[1]+" ("+(x[1]-base.total>=0?"+":"")+(x[1]-base.total)+" vs today)</p>").join("");
  const rows=[];
  const teer=val("nocTeer"); const cecLangOk = teer==="1"? r.allCLB7 : (teer==="2"? r.allCLB5 : false);
  const cec = r.canY>=1 && cecLangOk;
  rows.push(["Express Entry: CEC", cec?"pass":(r.canY>=1?"close":"fail"), cec?"1+ year Canadian skilled work, with the language level your TEER needs (CLB 7 for TEER 0/1, CLB 5 for TEER 2/3).":"Needs 1+ year Canadian skilled work in a TEER 0 to 3 role, plus CLB 7 (TEER 0/1) or CLB 5 (TEER 2/3) in all skills."]);
  const fsw = r.scores.every(x=>x>=7) && r.edu>=84 && (r.fY>=1||r.canY>=1);
  rows.push(["Express Entry: FSW", fsw?"pass":"close", fsw?"Language, education and skilled work basics met in this estimate. Funds and the 67 point grid still need a full check.":"Check language CLB 7+, ECA, skilled work and settlement funds."]);
  rows.push(["Category-based draws", (val("frenchNCLC")!=="0"||val("nocTeer")==="2")?"close":"fail", "French speakers and listed occupation categories draw far below CEC cutoffs. French rounds in 2026: 382 to 435."]);
  rows.push(["Provincial Nominee Program", r.pnp>0?"pass":"close", r.pnp>0?"Nomination adds 600 points.":"No nomination yet. A nomination is the single largest lever (+600) but is employer and province dependent."]);
  const rc = val("relocate")==="yes" && (r.fY>=3||r.canY>=1);
  rows.push(["RCIP (now a permanent program)", rc?"close":"fail", rc?"You meet the work experience base in this estimate. You still need a full-time, non-seasonal offer from a designated employer in a priority occupation, plus a community recommendation. Language needed: CLB 5 for TEER 2/3.":"Needs willingness to relocate, 1,560 hours of related work in the last 3 years, and a designated employer offer."]);
  $("eligibility").innerHTML=rows.map(x=>"<tr><td>"+x[0]+"</td><td><span class='pill "+x[1]+"'>"+x[1].toUpperCase()+"</span></td><td>"+x[2]+"</td></tr>").join("");
  const rec=[];
  if(!r.allCLB9) rec.push(["Raise language to CLB 9 in every skill", "Worth about "+(compute({langL:9,langR:9,langW:9,langS:9}).total-base.total)+" points in your case, fully in your control, and it lifts transferability too. This is usually the fastest honest route over a CEC cutoff."]);
  if(r.pnp===0) rec.push(["Chase a provincial nomination in parallel", "+600 points ends the CRS race, but it depends on a province and often an employer, so run it in parallel, never as your only plan."]);
  if(rc) rec.push(["Test RCIP communities you would actually live in", "RCIP does not rank by CRS. A designated employer offer plus a community recommendation is a direct PR route, but only use it if you genuinely intend to live there."]);
  if(r.french===0) rec.push(["Consider French only as a long game", "NCLC 7+ adds up to 50 points and unlocks French draws at much lower cutoffs, but it is a multi-year lever for most English first speakers."]);
  rec.push(["Keep your profile document-true", "Your NOC duties, employment letters and ECA must all tell the same story. A score you cannot document is not a score."]);
  $("recommendations").innerHTML=rec.map(x=>"<li><b>"+x[0]+".</b> "+x[1]+"</li>").join("");
  let outlook="<p>CEC cutoffs held a 507 to 523 band through 2026, with no general draws since April 2024. IRCC paused rounds from November 3, 2026 to recalculate profiles under the new grid, and early estimates put the first post-pause CEC cutoffs higher than "+LAST_CEC.cutoff+". Treat any forecast as a range, not a promise.</p>";
  outlook+="<p>"+(gap>0?("At "+r.total+", you need a lever worth at least "+gap+" points to clear the last cutoff, and more if cutoffs rise after the pause. The language lever above is the only one on this page that clears that gap on its own, without an employer or a province."):"At "+r.total+", you sit above the last cutoff. Your job now is speed and accuracy: be ready to file a complete application inside the ITA window.")+"</p>";
  outlook+="<p>Age matters quietly: your age points start falling after 29, so every year of delay costs points that language gains then have to replace.</p>";
  $("outlook").innerHTML=outlook;
  const cd=[];
  const td=daysUntil(val("testDate")); if(td!==null) cd.push("Language test date: "+(td>=0? td+" days from now." : Math.abs(td)+" days ago. Results stay valid for 2 years."));
  const pd=daysUntil(val("permitDate")); if(pd!==null) cd.push("Work permit expiry: "+pd+" days from now. Plan your status well before this date.");
  cd.push("Language results expire 2 years after the test date. ECA reports are valid for 5 years for immigration.");
  $("countdowns").innerHTML=cd.map(x=>"<li>"+x+"</li>").join("");
}
fields.forEach(f=>{ const e=$(f); if(e) e.addEventListener("input",()=>{scenario={};render();}); });
function syncSpouseBlock(){ const b=$("spouseBlock"); if(b) b.style.display=(val("marital")==="married_acc")? "block":"none"; }
function applyTestUI(){
  const t=val("langTest")||"clb";
  const cfg={ clb:{step:"1",max:[12,12,12,12]}, celpip:{step:"1",max:[12,12,12,12]},
    ielts:{step:"0.5",max:[9,9,9,9]}, pte:{step:"1",max:[90,90,90,90]},
    tef:{step:"1",max:[360,300,450,450]}, tcf:{step:"1",max:[699,699,20,20]} }[t] || {step:"1",max:[12,12,12,12]};
  LANG_IDS.forEach((id,i)=>{ const el=$(id); if(el){ el.step=cfg.step; el.max=cfg.max[i]; el.min=0; } });
  const note=$("tefNote"); if(note) note.style.display = t==="tef" ? "block" : "none";
}
$("langTest").addEventListener("change",()=>{ applyTestUI(); scenario={}; render(); });
applyTestUI();
$("marital").addEventListener("input",syncSpouseBlock); syncSpouseBlock();
const DEFAULTS={}; fields.forEach(f=>{ const e=$(f); if(e) DEFAULTS[f]=e.value; });
document.querySelectorAll("[data-scenario]").forEach(b=>b.addEventListener("click",()=>{
  const k=b.getAttribute("data-scenario");
  if(k==="clb9") scenario={langL:9,langR:9,langW:9,langS:9};
  if(k==="clb10") scenario={langL:10,langR:10,langW:10,langS:10};
  if(k==="can2") scenario={canWork:Math.min(5,(parseFloat(val("canWork"))||0)+1)};
  if(k==="pnp") scenario={pnp:600};
  if(k==="reset") scenario={};
  render();
}));
render();

if($("drawsTable")){ $("drawsTable").innerHTML=DRAWS.cec.map(x=>"<tr><td>"+fmtDate(x.date)+"</td><td>"+(x.round? "#"+x.round : "")+"</td><td>"+x.cutoff+"</td><td>"+(x.itas? x.itas.toLocaleString("en-CA") : "")+"</td></tr>").join(""); }
if($("drawsNote")){ $("drawsNote").textContent="Source: IRCC rounds of invitations, checked "+fmtDate(DRAWS.updated)+". "+(DRAWS.status||"")+" No general all-program draws have been held since April 2024."; }
if($("printBtn")){ $("printBtn").addEventListener("click",()=>window.print()); }

let supa=null;
try{ if(window.APP_CONFIG && window.APP_CONFIG.SUPABASE_URL.indexOf("http")===0){ supa=window.supabase.createClient(window.APP_CONFIG.SUPABASE_URL, window.APP_CONFIG.SUPABASE_ANON_KEY); } }catch(e){ supa=null; }
async function refreshAuth(){ if(!supa){ $("authStatus").textContent="Saving is being connected. Simulation works now."; return; } const {data}=await supa.auth.getSession(); $("authStatus").textContent=data.session? ("Signed in as "+data.session.user.email) : "Not signed in."; }
$("signUpBtn").addEventListener("click",async()=>{ if(!supa) return refreshAuth(); const {error}=await supa.auth.signUp({email:val("email"),password:val("password")}); $("authStatus").textContent=error? error.message : "Account created. Check your email to confirm, then sign in."; });
$("signInBtn").addEventListener("click",async()=>{ if(!supa) return refreshAuth(); const {error}=await supa.auth.signInWithPassword({email:val("email"),password:val("password")}); if(error){ $("authStatus").textContent=error.message; return; } refreshAuth(); });
$("signOutBtn").addEventListener("click",async()=>{ if(supa) await supa.auth.signOut(); refreshAuth(); });
$("saveBtn").addEventListener("click",async()=>{ if(!supa) return refreshAuth(); const {data}=await supa.auth.getSession(); if(!data.session){ $("saveStatus").textContent="Sign in first, then save."; return; } const r=compute({}); await supa.from("profiles").delete().eq("user_id",data.session.user.id); const {error}=await supa.from("profiles").insert({user_id:data.session.user.id, profile:currentProfile(), crs:r.total, label:"My profile"}); $("saveStatus").textContent=error? error.message : ("Saved. CRS "+r.total+"."); });
$("loadBtn").addEventListener("click",async()=>{ if(!supa) return refreshAuth(); const {data,error}=await supa.from("profiles").select("*").order("created_at",{ascending:false}).limit(1); if(error){ $("saveStatus").textContent=error.message; return; } if(!data||!data.length){ $("saveStatus").textContent="No saved profile found yet."; return; } const p=data[0].profile; if(p.education && EDU_ORDER.indexOf(p.education)===-1){ const map={"0":"none","30":"hs","84":"one","90":"one","98":"two","120":"bachelor","128":"twoplus","135":"master","150":"phd"}; if(map[p.education]) p.education=map[p.education]; } if(p.french!==undefined && p.frenchNCLC===undefined){ p.frenchNCLC=(parseFloat(p.french)>0)?"1":"0"; } Object.keys(p).forEach(k=>{ if(fields.includes(k) && $(k)) $(k).value=p[k]; }); syncSpouseBlock(); applyTestUI(); scenario={}; render(); $("saveStatus").textContent="Loaded your most recent saved profile."; });
refreshAuth();
