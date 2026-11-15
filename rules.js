// CRS rules as data. Every value below comes from IRCC's official CRS criteria.
// Source: https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score/crs-criteria.html
// Rules in force since: 2026-11-03. Last verified against the source: 2026-11-15.
// If IRCC changes a table, update it here in one place and bump "verified".
window.CRS_RULES = (function(){
  function ageTable(map){ const t=[]; for(let a=0;a<=60;a++){ t[a]= map[a]!==undefined? map[a] : 0; } return t; }
  const ageSingleMap={18:99,19:105,30:105,31:99,32:94,33:88,34:83,35:77,36:72,37:66,38:61,39:55,40:50,41:39,42:28,43:17,44:6};
  for(let a=20;a<=29;a++) ageSingleMap[a]=110;
  const ageSpouseMap={18:90,19:95,30:95,31:90,32:85,33:80,34:75,35:70,36:65,37:60,38:55,39:50,40:45,41:35,42:25,43:15,44:5};
  for(let a=20;a<=29;a++) ageSpouseMap[a]=100;
  return {
    meta:{ effective:"2026-11-03", verified:"2026-11-15", maxCRS:1270,
      source:"https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score/crs-criteria.html",
      caps:{ transferability:100, additional:600, lmiSingle:150, lmiSpouse:140, secondLangSingle:24, secondLangSpouse:22 } },
    ageSingle: ageTable(ageSingleMap),
    ageSpouse: ageTable(ageSpouseMap),
    eduOrder:["none","hs","one","two","bachelor","twoplus","master","phd"],
    eduSingle:[0,30,90,98,120,128,135,150],
    eduSpouse:[0,28,84,91,112,119,126,140],
    // Index by CLB level 0..12
    langFirstSingle:[0,0,0,0,6,6,9,17,23,31,34,34,34],
    langFirstSpouse:[0,0,0,0,6,6,8,16,22,29,32,32,32],
    langSecond:[0,0,0,0,0,1,1,3,3,6,6,6,6],
    spouseLang:[0,0,0,0,0,1,1,3,3,5,5,5,5],
    // Index by years 0..5
    canWorkSingle:[0,40,53,64,72,80],
    canWorkSpouse:[0,35,46,56,63,70],
    transfer:{
      eduLangLow:[13,25], eduLangTop:[25,50],
      eduWorkLow:[13,25], eduWorkTop:[25,50],
      foreignLang12:[13,25], foreignLang3:[25,50],
      foreignWork12:[13,25], foreignWork3:[25,50],
      cert:[25,50], groupCap:50
    },
    lmi:{ wageBonus:[0,20,40,70], offerTiers:[0,50,70,100] },
    additional:{ sibling:15, frenchLow:25, frenchHigh:50, pnp:600 },
    // Minimum raw score per CLB/NCLC level, per skill. Source: IRCC Express Entry language test
    // results page and equivalency charts manual, verified 2026-11-15. See audit/conversion-tables.md.
    // TEF uses the "Equivalence ancien score" columns only, as IRCC instructs for Express Entry.
    conversions:{
      ielts:{ listening:{"10":8.5,"9":8.0,"8":7.5,"7":6.0,"6":5.5,"5":5.0,"4":4.5},
              reading:{"10":8.0,"9":7.0,"8":6.5,"7":6.0,"6":5.0,"5":4.0,"4":3.5},
              writing:{"10":7.5,"9":7.0,"8":6.5,"7":6.0,"6":5.5,"5":5.0,"4":4.0},
              speaking:{"10":7.5,"9":7.0,"8":6.5,"7":6.0,"6":5.5,"5":5.0,"4":4.0} },
      pte:{ listening:{"10":89,"9":82,"8":71,"7":60,"6":50,"5":39,"4":28,"3":18},
            reading:{"10":88,"9":78,"8":69,"7":60,"6":51,"5":42,"4":33,"3":24},
            writing:{"10":90,"9":88,"8":79,"7":69,"6":60,"5":51,"4":41,"3":32},
            speaking:{"10":89,"9":84,"8":76,"7":68,"6":59,"5":51,"4":42,"3":34} },
      tef:{ listening:{"10":316,"9":298,"8":280,"7":249,"6":217,"5":181,"4":145},
            reading:{"10":263,"9":248,"8":233,"7":207,"6":181,"5":151,"4":121},
            writing:{"10":393,"9":371,"8":349,"7":310,"6":271,"5":226,"4":181},
            speaking:{"10":393,"9":371,"8":349,"7":310,"6":271,"5":226,"4":181} },
      tcf:{ listening:{"10":549,"9":523,"8":503,"7":458,"6":398,"5":369,"4":331},
            reading:{"10":549,"9":524,"8":499,"7":453,"6":406,"5":375,"4":342},
            writing:{"10":16,"9":14,"8":12,"7":10,"6":7,"5":6,"4":4},
            speaking:{"10":16,"9":14,"8":12,"7":10,"6":7,"5":6,"4":4} }
    }
  };
})();
