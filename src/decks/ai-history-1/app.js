(() => {
"use strict";
const Y="#ffc20e", BLUE="#6ab8ff", GREEN="#5fd68a", RED="#ff5a4e", INK="#f3f1ea", MUTE="#9b988f";
const stage=document.getElementById("stage");
const slides=[...document.querySelectorAll(".slide")];
const $=id=>document.getElementById(id);
const NS="http://www.w3.org/2000/svg";
const svgEl=(tag,attrs={},parent)=>{ const e=document.createElementNS(NS,tag); for(const k in attrs) e.setAttribute(k,attrs[k]); if(parent) parent.appendChild(e); return e; };
const rnd=(a,b)=>a+Math.random()*(b-a), pick=a=>a[(Math.random()*a.length)|0];
const ease=t=>1-Math.pow(1-Math.min(1,Math.max(0,t)),3);
let cur=-1;

/* ---------- stage + canvas sizing ---------- */
function fitStage(){
  const s=Math.min(innerWidth/1600,innerHeight/900);
  stage.style.transform=`translate(-50%,-50%) scale(${s})`;
  document.querySelectorAll("canvas").forEach(fitCanvas);
}
function fitCanvas(c){
  if(!c.offsetWidth) return;
  const r=c.getBoundingClientRect(), dpr=devicePixelRatio||1;
  const w=Math.max(1,Math.round(r.width*dpr)), h=Math.max(1,Math.round(r.height*dpr));
  if(c.width!==w||c.height!==h){ c.width=w; c.height=h; }
  c._k=c.width/c.offsetWidth;
}
function ctxOf(c){ const x=c.getContext("2d"); x.setTransform(c._k||1,0,0,c._k||1,0,0); return x; }
const A={};

/* ---------- 1 title: drifting network ---------- */
(() => {
  const cv=$("bgNet"); let N=[], P=[];
  A.title={
    enter(){ N=Array.from({length:80},()=>({x:rnd(0,1600),y:rnd(0,900),vx:rnd(-.25,.25),vy:rnd(-.25,.25),g:0})); P=[]; },
    tick(dt){
      const x=ctxOf(cv), f=dt/16.7; x.fillStyle="#121214"; x.fillRect(0,0,1600,900);
      for(const n of N){ n.x+=n.vx*f; n.y+=n.vy*f; if(n.x<0||n.x>1600) n.vx*=-1; if(n.y<0||n.y>900) n.vy*=-1; n.g*=.95; }
      x.lineWidth=1;
      for(let i=0;i<N.length;i++) for(let j=i+1;j<N.length;j++){
        const a=N[i], b=N[j], d=Math.hypot(a.x-b.x,a.y-b.y);
        if(d<190){ x.strokeStyle=`rgba(255,194,14,${(1-d/190)*.22})`; x.beginPath(); x.moveTo(a.x,a.y); x.lineTo(b.x,b.y); x.stroke();
          if(Math.random()<.0008*f) P.push({a,b,t:0}); }
      }
      P=P.filter(p=>{ p.t+=dt/700; if(p.t>=1){ p.b.g=1; return false; } const px=p.a.x+(p.b.x-p.a.x)*p.t, py=p.a.y+(p.b.y-p.a.y)*p.t;
        x.fillStyle=Y; x.beginPath(); x.arc(px,py,3,0,7); x.fill(); return true; });
      for(const n of N){ x.fillStyle=n.g>.05?`rgba(255,194,14,${.4+n.g*.6})`:"rgba(243,241,234,.35)"; x.beginPath(); x.arc(n.x,n.y,2.5+n.g*4,0,7); x.fill(); }
    }
  };
})();

/* ---------- 3 aristotle: euler diagram ---------- */
(() => {
  const svg=$("euler"), lines=[...document.querySelectorAll("#sylA .l")];
  svg.innerHTML=`
    <defs><filter id="glow" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    <circle id="eM" cx="320" cy="296" r="245" fill="rgba(106,184,255,.06)" stroke="${BLUE}" stroke-width="3"/>
    <text id="eMl" x="320" y="98" text-anchor="middle" fill="${BLUE}" font-family="JetBrains Mono, Consolas, monospace" font-size="20" letter-spacing="3">MORTAL THINGS</text>
    <circle id="eH" cx="320" cy="346" r="140" fill="rgba(255,194,14,.08)" stroke="${Y}" stroke-width="3"/>
    <text id="eHl" x="320" y="256" text-anchor="middle" fill="${Y}" font-family="JetBrains Mono, Consolas, monospace" font-size="20" letter-spacing="3">HUMANS</text>
    <g id="eS"><circle cx="320" cy="376" r="18" fill="${GREEN}" filter="url(#glow)"/><text x="320" y="428" text-anchor="middle" fill="${GREEN}" font-family="Space Grotesk, system-ui, sans-serif" font-size="24" font-weight="700">Socrates</text></g>`;
  const M=$("eM"), H=$("eH"), S=$("eS"), Ml=$("eMl"), Hl=$("eHl");
  const circ=(el,r)=>{ const L=2*Math.PI*r; el.style.strokeDasharray=L; return L; };
  const LM=circ(M,245), LH=circ(H,140);
  // click-through build: 0 = nothing, 1 = premise 1, 2 = premise 2, 3 = therefore
  const cap=$("eulerCap"), slide=svg.closest(".slide");
  const HINTS=["click to show premise 1","click to show premise 2","click for the conclusion","the classic example, drawn as sets"];
  let stage=0, since=[0,0,0,0], now=0;
  function setStage(n,instant){ stage=Math.max(0,Math.min(3,n)); for(let k=1;k<=3;k++) since[k]=k<=stage?(instant?-1e9:(since[k]>-1e8&&k<stage?since[k]:now)):Infinity; cap.textContent=HINTS[stage]; }
  slide.addEventListener("click",e=>{ if(e.target.closest("a,button")) return; if(stage<3) setStage(stage+1); });
  A.aristotle={
    enter(dir){ now=0; setStage(dir<0?3:0,true); },
    step(){ if(stage>=3) return false; setStage(stage+1); return true; },
    back(){ if(stage<=0) return false; setStage(stage-1,true); return true; },
    tick(dt){
      now+=dt;
      const el=k=>(now-since[k])/1000;               // seconds since stage k began (negative = not yet)
      const pm=ease(el(1)/1.1), ph=ease((el(1)-.7)/1.0), ps=ease(el(2)/.9), pc=stage>=3;
      M.style.strokeDashoffset=LM*(1-pm); M.style.fillOpacity=pm; Ml.style.opacity=pm;
      H.style.strokeDashoffset=LH*(1-ph); H.style.fillOpacity=ph; Hl.style.opacity=ph;
      S.style.opacity=ps; S.style.transform=`translateY(${(1-ps)*-360}px)`;
      const pulse = pc ? Math.max(0,1-Math.max(0,el(3))/1.6)*(.5+.5*Math.sin(el(3)*7)) : 0;  // a few pulses, then settles
      M.setAttribute("stroke-width", 3+(pc?2:0)+pulse*3); M.setAttribute("fill", `rgba(106,184,255,${.06+(pc?.05:0)+pulse*.06})`);
      lines.forEach((l,i)=>l.classList.toggle("on", stage>i));
    }
  };
})();

/* ---------- 4 form ---------- */
(() => {
  const EX=[
    {a:"humans",a1:"a human",b:"mortal",c:"Socrates",ok:true},
    {a:"birds",a1:"a bird",b:"feathered",c:"A penguin",ok:true},
    {a:"squares",a1:"a square",b:"rectangles",b1:"a rectangle",c:"This tile",ok:true},
    {a:"cats",a1:"a cat",b:"robots",b1:"a robot",c:"Tom",ok:false},
    {a:"students",a1:"a student",b:"sleepy",c:"Sam",ok:null},
  ];
  let i=0, t=0; const b1=$("fb1"), b2=$("fb2"), b3=$("fb3"), v=$("fverdict");
  const T=(cls,w)=>`<span class="term ${cls} flip">${w}</span>`;
  function show(){
    const e=EX[i];
    b1.innerHTML=`All ${T("tA",e.a)} are ${T("tB",e.b)}.`;
    b2.innerHTML=`${T("tC",e.c)} is ${T("tA",e.a1)}.`;
    b3.innerHTML=`${T("tC",e.c)} is ${T("tB",e.b1||e.b)}.`;
    v.innerHTML=`<span class="tag t-green">✓ VALID FORM</span>`+(e.ok===true?`<span class="tag t-green">premises true → conclusion true</span>`:e.ok===false?`<span class="tag t-red">premise 1 is false → conclusion not guaranteed</span>`:`<span class="tag t-y">premise 1 is… debatable</span>`);
  }
  $("fnext").onclick=()=>{ i=(i+1)%EX.length; t=0; show(); };
  A.form={ enter(){ i=0; t=0; show(); }, tick(dt){ t+=dt; if(t>5200){ t=0; i=(i+1)%EX.length; show(); } } };
})();

/* ---------- 5 boole ---------- */
(() => {
  const sa=$("swA"), sb=$("swB"), tt=$("tt"); let a=0,b=0, auto=true, t=0, k=0;
  const rows=[[0,0],[0,1],[1,0],[1,1]].map(([x,y])=>{ const r=document.createElement("tr"); r.innerHTML=[x,y,x&y,x|y,1-x].map(v=>`<td class="${v?"one":""}">${v}</td>`).join(""); tt.appendChild(r); return r; });
  function render(){
    sa.classList.toggle("on",!!a); sb.classList.toggle("on",!!b); sa.querySelector(".val").textContent=a; sb.querySelector(".val").textContent=b;
    const g=[["gAND",a&b],["gOR",a|b],["gNOT",1-a]];
    g.forEach(([id,v])=>{ $(id).classList.toggle("on",!!v); $(id).querySelector(".bulb").textContent=v; });
    rows.forEach((r,i)=>r.classList.toggle("hi", i===a*2+b));
  }
  sa.onclick=()=>{ auto=false; a^=1; render(); }; sb.onclick=()=>{ auto=false; b^=1; render(); };
  A.boole={ enter(){ a=0;b=0;auto=true;t=0;k=0; render(); },
    tick(dt){ if(!auto) return; t+=dt; if(t>1600){ t=0; k=(k+1)%4; a=k>>1; b=k&1; render(); } } };
})();

/* ---------- 6 shannon: circuits ---------- */
(() => {
  const svg=$("circ");
  const st={andA:0,andB:0,orA:0,orB:0};
  const W="#4a4a52";
  svg.innerHTML=`<style>
    .cw{stroke:${W};stroke-width:5;fill:none;stroke-linecap:round}
    .cflow{stroke:${Y};stroke-width:5;fill:none;stroke-dasharray:14 16;opacity:0;transition:opacity .3s;stroke-linecap:round}
    .cflow.on{opacity:1;animation:cfl .8s linear infinite}
    @keyframes cfl{to{stroke-dashoffset:-30}}
    .clever{stroke:${INK};stroke-width:6;stroke-linecap:round;transition:transform .35s cubic-bezier(.3,1.4,.5,1)}
    .chit{fill:transparent;cursor:pointer}
    .clbl{font-family:'JetBrains Mono',Consolas,monospace;font-size:20px;fill:${MUTE}}
    .cbig{font-family:'Space Grotesk',system-ui,sans-serif;font-size:26px;font-weight:700;fill:${INK}}
    .cbulb{transition:fill .3s,filter .3s}
  </style>`;
  function battery(x,y){ svgEl("rect",{x:x-20,y:y-26,width:40,height:52,rx:6,fill:"#1c1c20",stroke:INK,"stroke-width":2},svg); svgEl("text",{x,y:y+8,"text-anchor":"middle",class:"clbl",fill:INK},svg).textContent="+"; }
  function sw(key,x1,x2,y,label){
    svgEl("circle",{cx:x1,cy:y,r:6,fill:INK},svg); svgEl("circle",{cx:x2,cy:y,r:6,fill:INK},svg);
    const l=svgEl("line",{x1,y1:y,x2,y2:y,class:"clever"},svg); l.style.transformOrigin=`${x1}px ${y}px`; l.style.transformBox="view-box";
    svgEl("text",{x:(x1+x2)/2,y:y+38,"text-anchor":"middle",class:"clbl"},svg).textContent=label;
    const h=svgEl("rect",{x:x1-10,y:y-60,width:x2-x1+20,height:110,class:"chit"},svg);
    h.addEventListener("click",()=>{ st[key]^=1; render(); });
    return l;
  }
  function bulb(x,y){ const b=svgEl("circle",{cx:x,cy:y,r:28,fill:"#2a2a30",stroke:INK,"stroke-width":2,class:"cbulb"},svg); return b; }
  // AND (series)
  svgEl("text",{x:80,y:60,class:"cbig"},svg).textContent="AND · series";
  svgEl("text",{x:680,y:60,class:"clbl","text-anchor":"end"},svg).textContent="lamp = A AND B";
  for(const d of ["M80 150 V100 H240","M320 100 H400","M480 100 H680 V147","M680 203 V250 H80 V200"]) svgEl("path",{d,class:"cw"},svg);
  const fAnd=svgEl("path",{d:"M80 150 V100 H680 V250 H80 Z",class:"cflow"},svg);
  battery(80,175);
  const lAA=sw("andA",240,320,100,"A"), lAB=sw("andB",400,480,100,"B"), bA=bulb(680,175);
  // OR (parallel)
  svgEl("text",{x:80,y:340,class:"cbig"},svg).textContent="OR · parallel";
  svgEl("text",{x:680,y:340,class:"clbl","text-anchor":"end"},svg).textContent="lamp = A OR B";
  for(const d of ["M80 444 V390 H300","M380 390 H680 V442","M680 498 V570 H80 V496","M200 390 V480 H300","M380 480 H520 V390"]) svgEl("path",{d,class:"cw"},svg);
  const fOrA=svgEl("path",{d:"M80 444 V390 H680 V570 H80 Z",class:"cflow"},svg);
  const fOrB=svgEl("path",{d:"M80 444 V390 H200 V480 H520 V390 H680 V570 H80 Z",class:"cflow"},svg);
  battery(80,470);
  const lOA=sw("orA",300,380,390,"A"), lOB=sw("orB",300,380,480,"B"), bO=bulb(680,470);
  // keep levers + bulbs above flow lines
  [lAA,lAB,lOA,lOB,bA,bO].forEach(e=>svg.appendChild(e));
  function render(){
    [[lAA,"andA"],[lAB,"andB"],[lOA,"orA"],[lOB,"orB"]].forEach(([l,k])=>l.style.transform=st[k]?"none":"rotate(-32deg)");
    const and=st.andA&&st.andB, or=st.orA||st.orB;
    fAnd.classList.toggle("on",!!and); fOrA.classList.toggle("on",!!st.orA); fOrB.classList.toggle("on",!!st.orB);
    for(const [b,on] of [[bA,and],[bO,or]]){ b.setAttribute("fill",on?Y:"#2a2a30"); b.style.filter=on?"drop-shadow(0 0 18px rgba(255,194,14,.9))":"none"; }
  }
  A.shannon={ enter(){ st.andA=1; st.andB=0; st.orA=0; st.orB=1; render(); } };
})();

/* ---------- 7 talos ---------- */
(() => {
  const cv=$("talos"), cap=$("talosCap"); let W,H,isl=[],path=[],plen=0,ships=[],rocks=[],splash=[],pos=0,cool=0,lap=0,t=0;
  function build(){
    W=cv.offsetWidth; H=cv.offsetHeight; isl=[]; path=[];
    const cx=W/2, cy=H/2, rx=W*.3, ry=H*.13;
    for(let i=0;i<120;i++){ const a=i/120*Math.PI*2; const r=1+.08*Math.sin(3*a+1)+.06*Math.sin(5*a)+.04*Math.sin(9*a+2);
      isl.push([cx+Math.cos(a)*rx*r, cy+Math.sin(a)*ry*r*(1+.25*Math.sin(2*a))]); }
    for(const [x,y] of isl){ const dx=x-cx, dy=y-cy, d=Math.hypot(dx,dy); path.push([x+dx/d*22, y+dy/d*22]); }
    plen=path.length;
  }
  function talosXY(){ const i=Math.floor(pos)%plen, f=pos-Math.floor(pos), a=path[i], b=path[(i+1)%plen]; return [a[0]+(b[0]-a[0])*f, a[1]+(b[1]-a[1])*f]; }
  function spawn(){ const side=Math.random()<.5?-1:1; const y=rnd(H*.12,H*.88); ships.push({x:side<0?-30:W+30,y,vx:side*-rnd(.22,.38),vy:(H/2-y)*.0006,alive:1,sink:0,dir:-side}); }
  A.talos={
    enter(){ build(); ships=[]; rocks=[]; splash=[]; pos=0; cool=0; lap=0; t=0; for(let i=0;i<3;i++){ spawn(); ships[i].x+=ships[i].vx*-400; } },
    tick(dt){
      if(!W) build();
      const x=ctxOf(cv), f=dt/16.7; t+=dt;
      // sea
      const g=x.createLinearGradient(0,0,0,H); g.addColorStop(0,"#0b1622"); g.addColorStop(1,"#0a1018"); x.fillStyle=g; x.fillRect(0,0,W,H);
      x.strokeStyle="rgba(106,184,255,.08)"; x.lineWidth=1.5;
      for(let r=0;r<14;r++){ x.beginPath(); const yy=r*H/13; for(let xx=0;xx<=W;xx+=20) x.lineTo(xx, yy+Math.sin(xx*.02+t*.0012+r)*4); x.stroke(); }
      // island
      x.beginPath(); isl.forEach(([a,b],i)=>i?x.lineTo(a,b):x.moveTo(a,b)); x.closePath();
      x.fillStyle="#2b2721"; x.fill(); x.strokeStyle="rgba(255,194,14,.35)"; x.lineWidth=3; x.stroke();
      x.fillStyle="rgba(243,241,234,.35)"; x.font="600 22px 'JetBrains Mono',Consolas,monospace"; x.textAlign="center"; x.fillText("CRETE",W/2,H/2+8);
      // patrol path
      x.setLineDash([4,10]); x.strokeStyle="rgba(255,194,14,.25)"; x.lineWidth=2; x.beginPath(); path.forEach(([a,b],i)=>i?x.lineTo(a,b):x.moveTo(a,b)); x.closePath(); x.stroke(); x.setLineDash([]);
      // talos
      const prev=pos; pos+=dt*.022; if(pos>=plen){ pos-=plen; lap=(lap+1)%3; } cap.textContent=`patrol lap ${lap+1} of 3`;
      const [tx,ty]=talosXY();
      const rg=x.createRadialGradient(tx,ty,0,tx,ty,30); rg.addColorStop(0,"rgba(255,194,14,.9)"); rg.addColorStop(1,"rgba(255,194,14,0)"); x.fillStyle=rg; x.beginPath(); x.arc(tx,ty,30,0,7); x.fill();
      x.fillStyle="#ffe7a3"; x.beginPath(); x.arc(tx,ty,8,0,7); x.fill();
      // ships
      if(Math.random()<.006*f && ships.filter(s=>s.alive).length<5) spawn();
      cool-=dt;
      for(const s of ships){
        if(s.alive){ s.x+=s.vx*f; s.y+=s.vy*f;
          const d=Math.hypot(s.x-tx,s.y-ty);
          if(d<260 && cool<=0 && !s.targeted){ s.targeted=1; cool=700; const T=1100; rocks.push({x0:tx,y0:ty,s,t:0,T,x1:s.x+s.vx*T/16.7,y1:s.y+s.vy*T/16.7}); }
        } else s.sink+=dt/1200;
        if(s.sink>=1) continue;
        x.save(); x.translate(s.x,s.y); x.globalAlpha=1-s.sink; x.rotate(s.sink*.6*s.dir); const sc=1-s.sink*.5; x.scale(sc*s.dir,sc);
        x.fillStyle="#8a6b45"; x.beginPath(); x.moveTo(-18,0); x.lineTo(18,0); x.lineTo(12,8); x.lineTo(-14,8); x.closePath(); x.fill();
        x.fillStyle=INK; x.beginPath(); x.moveTo(0,-2); x.lineTo(0,-26); x.lineTo(14,-4); x.closePath(); x.fill();
        x.restore();
      }
      ships=ships.filter(s=>s.sink<1 && s.x>-60 && s.x<W+60);
      // rocks
      rocks=rocks.filter(r=>{ r.t+=dt; const p=Math.min(1,r.t/r.T); const rx=r.x0+(r.x1-r.x0)*p, ry=r.y0+(r.y1-r.y0)*p-Math.sin(p*Math.PI)*140;
        x.fillStyle="#b9b2a5"; x.beginPath(); x.arc(rx,ry,6+Math.sin(p*Math.PI)*4,0,7); x.fill();
        if(p>=1){ splash.push({x:r.x1,y:r.y1,t:0}); if(r.s.alive && Math.hypot(r.s.x-r.x1,r.s.y-r.y1)<40) r.s.alive=0; else r.s.targeted=0; return false; } return true; });
      splash=splash.filter(s=>{ s.t+=dt/700; x.strokeStyle=`rgba(243,241,234,${1-s.t})`; x.lineWidth=2; x.beginPath(); x.arc(s.x,s.y,8+s.t*34,0,7); x.stroke(); return s.t<1; });
    }
  };
})();

/* ---------- 8 automaton: gears + bird ---------- */
(() => {
  const svg=$("gears");
  function gearPath(n,ro,ri,rh){
    let d=""; for(let i=0;i<n;i++){ const a=i/n*Math.PI*2, s=Math.PI*2/n;
      const pts=[[a-s*.25,ri],[a-s*.15,ro],[a+s*.15,ro],[a+s*.25,ri],[a+s*.75,ri]];
      pts.forEach(([ang,r],k)=>d+=(i===0&&k===0?"M":"L")+(Math.cos(ang)*r).toFixed(1)+" "+(Math.sin(ang)*r).toFixed(1)+" "); }
    d+="Z M"+rh+" 0 A"+rh+" "+rh+" 0 1 0 "+(-rh)+" 0 A"+rh+" "+rh+" 0 1 0 "+rh+" 0Z"; return d;
  }
  svg.innerHTML=`<style>.gr{fill:#2a2a30;stroke:${Y};stroke-width:2.5;fill-rule:evenodd}</style>`;
  const G=[{cx:230,cy:400,n:18,ro:132,ri:116,rh:22},{cx:416,cy:420,n:10,ro:74,ri:58,rh:14},{cx:500,cy:300,n:8,ro:60,ri:46,rh:12}];
  G.forEach(g=>{ g.el=svgEl("g",{},svg); svgEl("path",{d:gearPath(g.n,g.ro,g.ri,g.rh),class:"gr"},g.el);
    for(let k=0;k<4;k++) svgEl("line",{x1:0,y1:0,x2:Math.cos(k*Math.PI/2)*(g.ri-6),y2:Math.sin(k*Math.PI/2)*(g.ri-6),stroke:Y,"stroke-width":2,opacity:.4},g.el); });
  const rod=svgEl("line",{stroke:INK,"stroke-width":5,"stroke-linecap":"round"},svg);
  const pin=svgEl("circle",{r:9,fill:INK},svg);
  svgEl("rect",{x:110,y:180,width:260,height:12,rx:4,fill:"#3a3a42"},svg);
  const bird=svgEl("g",{},svg);
  svgEl("ellipse",{cx:220,cy:140,rx:62,ry:36,fill:Y},bird);
  svgEl("path",{d:"M160 130 L118 112 L132 146Z",fill:"#d9a20a"},bird);
  svgEl("line",{x1:212,y1:174,x2:212,y2:182,stroke:INK,"stroke-width":4},bird); svgEl("line",{x1:232,y1:174,x2:232,y2:182,stroke:INK,"stroke-width":4},bird);
  const head=svgEl("g",{},bird);
  svgEl("circle",{cx:292,cy:112,r:26,fill:Y},head); svgEl("circle",{cx:300,cy:106,r:5,fill:"#121214"},head);
  svgEl("path",{d:"M314 108 L346 116 L314 124Z",fill:"#ff8a1f"},head);
  let a=0;
  A.automaton={ enter(){}, tick(dt){
    a+=dt*.0011;
    const r=[a,-a*18/10+Math.PI/10,a*18/8+Math.PI/8];
    G.forEach((g,i)=>g.el.setAttribute("transform",`translate(${g.cx} ${g.cy}) rotate(${r[i]*180/Math.PI})`));
    const px=230+Math.cos(a)*78, py=400+Math.sin(a)*78; pin.setAttribute("cx",px); pin.setAttribute("cy",py);
    rod.setAttribute("x1",px); rod.setAttribute("y1",py); rod.setAttribute("x2",276); rod.setAttribute("y2",186+Math.sin(a)*14);
    const peck=Math.max(0,Math.sin(a))*38;
    head.setAttribute("transform",`rotate(${peck} 270 128)`);
  } };
})();

/* ---------- 9 gulliver ---------- */
(() => {
  const V={D:["the","a","every","no"],A:["wise","bronze","silent","ancient","golden","mad","tiny"],N:["machine","king","scholar","island","star","truth","number","word","mind","ship","giant","horse"],V:["thinks","rules","eats","builds","writes","loves","sees","fears","counts"],O:["of","and","why","not"]};
  const Wt=[["D",.22],["A",.14],["N",.34],["V",.24],["O",.06]];
  const grid=$("lagado"), found=$("lagFound"), cnt=$("lagCount"), COLS=7, ROWS=6;
  const tiles=[]; let words=[], turns=0, busy=false, hist=[];
  for(let i=0;i<COLS*ROWS;i++){ const d=document.createElement("div"); d.style.cssText="font-family:var(--mono);font-size:17px;text-align:center;padding:12px 4px;border-radius:8px;background:#2a2620;border:1px solid #3a342a;color:#e8dcc0;transition:background .3s,border-color .3s,color .3s"; grid.appendChild(d); tiles.push(d); }
  function rw(){ let r=Math.random(), p; for(const [k,w] of Wt){ r-=w; if(r<=0){ p=k; break; } } p=p||"N"; return {p,w:pick(V[p])}; }
  function scan(){
    const hits=[];
    for(let r=0;r<ROWS;r++){ const row=words.slice(r*COLS,(r+1)*COLS);
      for(let i=0;i<COLS;i++){ let j=i; if(row[j]?.p!=="D") continue; j++; if(row[j]?.p==="A") j++; if(row[j]?.p!=="N") continue; j++; if(row[j]?.p!=="V") continue; j++;
        let k=j; if(row[k]?.p==="D"){ k++; if(row[k]?.p==="A") k++; if(row[k]?.p==="N") j=k+1; } else if(row[k]?.p==="N") j=k+1;
        hits.push({r,i,j}); i=j-1; } }
    return hits;
  }
  function crank(){
    if(busy) return; busy=true; turns++; cnt.textContent=`${turns} turn${turns>1?"s":""}`;
    words=tiles.map(()=>rw());
    tiles.forEach((d,k)=>{ d.style.background="#2a2620"; d.style.borderColor="#3a342a"; d.style.color="#e8dcc0";
      setTimeout(()=>{ d.classList.remove("flip"); void d.offsetWidth; d.classList.add("flip"); d.textContent=words[k].w; }, (k%COLS)*60+((k/COLS)|0)*30); });
    setTimeout(()=>{
      const hits=scan();
      hits.forEach(h=>{ for(let c=h.i;c<h.j;c++){ const d=tiles[h.r*COLS+c]; d.style.background="rgba(255,194,14,.2)"; d.style.borderColor=Y; d.style.color=Y; } });
      if(hits.length){ hits.forEach(h=>{ const s=words.slice(h.r*COLS+h.i,h.r*COLS+h.j).map(w=>w.w).join(" "); hist.unshift(s.charAt(0).toUpperCase()+s.slice(1)+"."); }); hist=hist.slice(0,4); }
      found.innerHTML = hist.length ? hist.map((s,i)=>`<div style="opacity:${1-i*.2}">${i===0&&hits.length?"<span class='y'>+ </span>":"· "}${s}</div>`).join("") : "<span class='muted'>Nothing meaningful yet. Turn again!</span>";
      if(!hits.length && hist.length) found.insertAdjacentHTML("afterbegin","<div class='muted'>(nothing this turn)</div>");
      busy=false;
    }, 900);
  }
  $("crank").onclick=crank;
  A.gulliver={ enter(){ if(!turns) setTimeout(crank,700); } };
})();

/* ---------- timeline ---------- */
const AVATARS={"1950":"{{IMG:turing.jpg}}","1956":"{{IMG:mccarthy.jpg}}","1957":"{{IMG:rosenblatt.jpg}}"};
const EVENTS=[
  ["1950","Alan Turing publishes “Computing Machinery and Intelligence” and proposes the Turing Test."],
  ["1956","John McCarthy coins “Artificial Intelligence” at the Dartmouth Conference. AI becomes a field."],
  ["1957","Frank Rosenblatt invents the Perceptron, an early artificial neural network."],
  ["1965","Joseph Weizenbaum at MIT builds ELIZA, a natural-language chatbot."],
  ["1970s","The first “AI Winter”: unmet expectations and reduced funding."],
  ["1980","Expert systems such as DENDRAL and MYCIN find commercial success. The winter ends."],
  ["1986","Rumelhart, Hinton & Williams publish backpropagation, a breakthrough for training neural networks."],
  ["1997","IBM’s Deep Blue defeats world chess champion Garry Kasparov."],
];
document.querySelectorAll(".slide.tl").forEach(sl=>{
  const k=+sl.dataset.upto, n=EVENTS.length, xp=i=>(i+.5)/n*100;
  const hd=document.createElement("div");
  hd.innerHTML=`<h2 class="rise" style="--i:0"><span class="n">TIMELINE</span>The road to AI</h2>`;
  sl.appendChild(hd);
  const wrap=document.createElement("div"); wrap.className="tlwrap";
  wrap.innerHTML=`<div class="tlaxis"></div><div class="tlfill"></div><div class="tlarrow"></div>`;
  EVENTS.forEach(([yr,tx],i)=>{
    const e=document.createElement("div");
    e.className="ev "+(i%2?"dn":"up")+" "+(i<k?"done":i===k?"now new":"future")+(i===4&&i<=k?" winter":"");
    e.style.left=xp(i)+"%"; e.style.top="0"; e.style.height="100%";
    e.innerHTML=`<div class="stem"></div><div class="dot"></div><div class="box"><div class="yrow">${AVATARS[yr]?`<img class="av" src="${AVATARS[yr]}" alt="">`:""}<div class="yr">${yr}</div></div><div class="tx">${tx}</div></div>`;
    wrap.appendChild(e);
  });
  sl.appendChild(wrap);
  const fill=wrap.querySelector(".tlfill");
  const prev = k>0 ? xp(k-1) : 0;
  const snow = sl.querySelector(".snow");
  let flakes=[];
  A[sl.dataset.id]={
    enter(){ fill.style.transition="none"; fill.style.width=prev+"%"; void fill.offsetWidth; fill.style.transition=""; fill.style.width=xp(k)+"%";
      if(snow) flakes=Array.from({length:160},()=>({x:rnd(0,1600),y:rnd(-900,900),r:rnd(1,3.2),v:rnd(.4,1.3),s:rnd(0,6)})); },
    tick(dt,now){ if(!snow) return; const x=ctxOf(snow), f=dt/16.7; x.clearRect(0,0,1600,900);
      for(const p of flakes){ p.y+=p.v*f; p.x+=Math.sin(now*.001+p.s)*.4*f; if(p.y>910){ p.y=-10; p.x=rnd(0,1600); }
        x.fillStyle=`rgba(200,225,255,${.35+p.r*.15})`; x.beginPath(); x.arc(p.x,p.y,p.r,0,7); x.fill(); } }
  };
});

/* ---------- turing ---------- */
(() => {
  const mA=$("mA"), mB=$("mB"), rA=$("revA"), rB=$("revB"); let timers=[], guessed=false;
  const S=[
    [600,"j","Hi! What did you have for breakfast?"],
    [1900,"A","Toast. Burnt it again, as usual."],[2700,"B","nothing lol, overslept. running on coffee"],
    [4400,"j","What’s 3,487 × 29?"],
    [5800,"A","Hmm, give me a sec… roughly 101,000?"],[6500,"B","dude I’m not a calculator"],
    [8200,"j","Describe the smell of rain."],
    [9600,"A","Earthy. Like warm concrete after a storm."],[10400,"B","wet dirt? kinda nice honestly"],
  ];
  function add(box,cls,txt){ const m=document.createElement("div"); m.className="msg "+cls; m.textContent=txt; box.appendChild(m); while(box.children.length>7) box.removeChild(box.firstChild); return m; }
  function run(){
    timers.forEach(clearTimeout); timers=[]; mA.innerHTML=""; mB.innerHTML=""; guessed=false;
    [rA,rB].forEach(r=>{ r.textContent="?"; r.className="reveal"; });
    S.forEach(([t,who,txt])=>{
      if(who==="j"){ timers.push(setTimeout(()=>{ add(mA,"j",txt); add(mB,"j",txt); },t)); }
      else { const box=who==="A"?mA:mB; let typing;
        timers.push(setTimeout(()=>{ typing=add(box,"a typing","typing…"); },t-800));
        timers.push(setTimeout(()=>{ typing&&typing.remove(); add(box,"a",txt); },t)); }
    });
  }
  document.querySelectorAll("[data-guess]").forEach(b=>b.onclick=()=>{
    if(guessed) { run(); return; } guessed=true;
    rA.textContent="MACHINE"; rA.className="reveal tag t-red"; rB.textContent="HUMAN"; rB.className="reveal tag t-green";
    add(mA,"a",b.dataset.guess==="A"?"You got me. 🤖":"Fooled you. I was the machine.");
  });
  A.turing={ enter(){ run(); } };
})();

/* ---------- dartmouth ---------- */
(() => {
  const el=$("dq"), Q="Every aspect of learning or any other feature of intelligence can in principle be so precisely described that a machine can be made to simulate it.”";
  let t=0;
  A.dartmouth={ enter(){ t=-900; el.textContent=""; }, tick(dt){ t+=dt; const n=Math.max(0,Math.min(Q.length,Math.floor(t/32))); if(el.textContent.length!==n) el.textContent=Q.slice(0,n); } };
})();

/* ---------- neurons ---------- */
(() => {
  const cv=$("neuro"); let W,H,N=[],E=[],P=[],stim=0;
  function build(){
    W=cv.offsetWidth; H=cv.offsetHeight; N=[]; E=[]; P=[];
    const cols=4;
    for(let c=0;c<cols;c++){ const rows=c===0||c===cols-1?2:3;
      for(let r=0;r<rows;r++){ const n={x:W*(.13+c*.25)+rnd(-20,20), y:H*((r+1)/(rows+1))+rnd(-30,30), v:0, g:0, col:c, den:[]};
        for(let d=0;d<6;d++){ const a=rnd(0,Math.PI*2); let px=n.x, py=n.y; const seg=[]; for(let s=0;s<4;s++){ px+=Math.cos(a+rnd(-.5,.5))*rnd(10,16); py+=Math.sin(a+rnd(-.5,.5))*rnd(10,16); seg.push([px,py]); } n.den.push(seg); }
        N.push(n); } }
    N.forEach(a=>{ const next=N.filter(b=>b.col===a.col+1); next.forEach(b=>{ if(Math.random()<.75) E.push({a,b,cx:(a.x+b.x)/2+rnd(-40,40),cy:(a.y+b.y)/2+rnd(-60,60)}); }); });
  }
  const bez=(e,t)=>{ const u=1-t; return [u*u*e.a.x+2*u*t*e.cx+t*t*e.b.x, u*u*e.a.y+2*u*t*e.cy+t*t*e.b.y]; };
  function fire(n){ n.g=1; n.v=0; E.filter(e=>e.a===n).forEach(e=>P.push({e,t:0})); }
  A.neurons={
    enter(){ build(); stim=0; },
    tick(dt){
      const x=ctxOf(cv); x.fillStyle="#0d0d0f"; x.fillRect(0,0,W,H);
      stim-=dt; if(stim<=0){ stim=rnd(500,1100); fire(pick(N.filter(n=>n.col===0))); }
      for(const e of E){ x.strokeStyle="rgba(106,184,255,.22)"; x.lineWidth=2.5; x.beginPath(); x.moveTo(e.a.x,e.a.y); x.quadraticCurveTo(e.cx,e.cy,e.b.x,e.b.y); x.stroke(); }
      P=P.filter(p=>{ p.t+=dt/900; if(p.t>=1){ p.e.b.v+=.55; if(p.e.b.v>=.99) fire(p.e.b); return false; }
        for(let k=0;k<6;k++){ const [px,py]=bez(p.e,Math.max(0,p.t-k*.025)); x.fillStyle=`rgba(255,194,14,${1-k/6})`; x.beginPath(); x.arc(px,py,4.5-k*.5,0,7); x.fill(); }
        return true; });
      for(const n of N){
        n.v=Math.max(0,n.v-dt*.00035); n.g*=.93;
        x.strokeStyle=`rgba(243,241,234,${.25+n.g*.5})`; x.lineWidth=2;
        n.den.forEach(seg=>{ x.beginPath(); x.moveTo(n.x,n.y); seg.forEach(([a,b])=>x.lineTo(a,b)); x.stroke(); });
        if(n.g>.05){ const rg=x.createRadialGradient(n.x,n.y,0,n.x,n.y,50); rg.addColorStop(0,`rgba(255,194,14,${n.g*.7})`); rg.addColorStop(1,"rgba(255,194,14,0)"); x.fillStyle=rg; x.beginPath(); x.arc(n.x,n.y,50,0,7); x.fill(); }
        x.fillStyle=n.g>.3?Y:"#3a3a44"; x.beginPath(); x.arc(n.x,n.y,15,0,7); x.fill();
        x.strokeStyle=Y; x.lineWidth=3; x.beginPath(); x.arc(n.x,n.y,20,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,n.v)); x.stroke();
      }
    }
  };
})();

/* ---------- perceptron ---------- */
(() => {
  const grid=$("pgrid"), sum=$("psum"), res=$("pres");
  const IN=[{n:"It’s sunny",x:1,w:.8},{n:"I have free time",x:0,w:.6},{n:"Friends are going",x:1,w:.4}];
  let bias=-1;
  const fmt=v=>(v>=0?"+":"−")+Math.abs(v).toFixed(1);
  IN.forEach(inp=>{
    const r=document.createElement("div"); r.className="pin card";
    r.innerHTML=`<span class="nm">${inp.n}</span><span class="x"></span><input type="range" min="-1" max="1" step="0.1"><span class="w"></span>`;
    const xb=r.querySelector(".x"), sl=r.querySelector("input"), wv=r.querySelector(".w");
    sl.value=inp.w; xb.onclick=()=>{ inp.x^=1; upd(); }; sl.oninput=()=>{ inp.w=+sl.value; upd(); };
    inp.r={xb,wv}; grid.appendChild(r);
  });
  const br=document.createElement("div"); br.className="pin card";
  br.innerHTML=`<span class="nm">Bias</span><span></span><input type="range" min="-2" max="1" step="0.1"><span class="w"></span>`;
  const bs=br.querySelector("input"), bv=br.querySelector(".w"); bs.value=bias; bs.oninput=()=>{ bias=+bs.value; upd(); }; grid.appendChild(br);
  function upd(){
    let s=bias; IN.forEach(i=>{ s+=i.x*i.w; i.r.xb.textContent=i.x?"1":"0"; i.r.xb.classList.toggle("on",!!i.x); i.r.wv.textContent="w "+fmt(i.w); }); bv.textContent="b "+fmt(bias);
    sum.innerHTML=IN.map(i=>`${i.x}×${i.w.toFixed(1)}`).join(" + ")+` ${bias<0?"−":"+"} ${Math.abs(bias).toFixed(1)}<br>= <b>${s.toFixed(2)}</b> ${s>=0?"≥ 0 → 1":"< 0 → 0"}`;
    res.textContent=s>=0?"GO":"STAY"; res.classList.toggle("on",s>=0);
  }
  A.perceptron={ enter(){ upd(); } };
})();

/* ---------- activation functions ---------- */
(() => {
  const F={
    Step:[x=>x>=0?1:0,"1 if x ≥ 0, else 0 · the original perceptron"],
    Sigmoid:[x=>1/(1+Math.exp(-x)),"squashes any input into 0…1"],
    Tanh:[x=>Math.tanh(x),"squashes any input into −1…1"],
    ReLU:[x=>Math.max(0,x),"max(0, x) · the modern default"],
    Linear:[x=>x,"f(x) = x · no non-linearity at all"],
  };
  const cv=$("actPlot"), box=$("actBtns"), desc=$("actDesc"); let curF="Step", prevF="Step", m=1, t=0, auto=true, at=0;
  const names=Object.keys(F);
  names.forEach(k=>{ const b=document.createElement("button"); b.className="btn"; b.textContent=k; b.onclick=()=>{ auto=false; set(k); }; box.appendChild(b); });
  function set(k){ if(k===curF) return; prevF=curF; curF=k; m=0; desc.textContent=F[k][1]; [...box.children].forEach(b=>b.classList.toggle("on",b.textContent===k)); }
  A.activation={
    enter(){ curF="Step"; prevF="Step"; m=1; auto=true; at=0; desc.textContent=F.Step[1]; [...box.children].forEach(b=>b.classList.toggle("on",b.textContent==="Step")); },
    tick(dt){
      t+=dt; m=Math.min(1,m+dt/600); if(auto){ at+=dt; if(at>3200){ at=0; set(names[(names.indexOf(curF)+1)%names.length]); } }
      const x=ctxOf(cv), W=cv.offsetWidth, H=cv.offsetHeight, e=ease(m);
      const X0=-5,X1=5,Y0=-1.6,Y1=2.6, px=v=>60+(v-X0)/(X1-X0)*(W-100), py=v=>H-60-(v-Y0)/(Y1-Y0)*(H-110);
      const f=v=>{ const a=F[prevF][0](v), b=F[curF][0](v); return a+(b-a)*e; };
      x.fillStyle="#0d0d0f"; x.fillRect(0,0,W,H);
      x.strokeStyle="rgba(255,255,255,.06)"; x.lineWidth=1;
      for(let v=-5;v<=5;v++){ x.beginPath(); x.moveTo(px(v),py(Y0)); x.lineTo(px(v),py(Y1)); x.stroke(); }
      for(let v=-1;v<=2;v++){ x.beginPath(); x.moveTo(px(X0),py(v)); x.lineTo(px(X1),py(v)); x.stroke(); }
      x.strokeStyle="rgba(243,241,234,.5)"; x.lineWidth=1.5; x.beginPath(); x.moveTo(px(X0),py(0)); x.lineTo(px(X1),py(0)); x.moveTo(px(0),py(Y0)); x.lineTo(px(0),py(Y1)); x.stroke();
      x.fillStyle=MUTE; x.font="15px 'JetBrains Mono',Consolas,monospace"; x.textAlign="center";
      [-4,-2,2,4].forEach(v=>x.fillText(v,px(v),py(0)+22)); x.textAlign="right"; [-1,1,2].forEach(v=>x.fillText(v,px(0)-10,py(v)+5));
      x.textAlign="left"; x.fillText("input (weighted sum)",px(X1)-200,py(0)-12); x.fillText("output",px(0)+10,py(Y1)+16);
      x.save(); x.beginPath(); x.rect(px(X0),py(Y1),px(X1)-px(X0),py(Y0)-py(Y1)); x.clip();
      x.strokeStyle=Y; x.lineWidth=4; x.lineJoin="round"; x.beginPath();
      for(let i=0;i<=400;i++){ const v=X0+(X1-X0)*i/400; const yy=py(f(v)); i?x.lineTo(px(v),yy):x.moveTo(px(v),yy); } x.stroke(); x.restore();
      const vx=Math.sin(t*.0009)*4.2, vy=f(vx);
      x.setLineDash([5,6]); x.strokeStyle="rgba(106,184,255,.6)"; x.lineWidth=1.5; x.beginPath(); x.moveTo(px(vx),py(0)); x.lineTo(px(vx),py(Math.min(Y1,vy))); x.lineTo(px(0),py(Math.min(Y1,vy))); x.stroke(); x.setLineDash([]);
      x.fillStyle=BLUE; x.beginPath(); x.arc(px(vx),py(Math.min(Y1,vy)),9,0,7); x.fill();
      x.fillStyle=INK; x.font="600 18px 'JetBrains Mono',Consolas,monospace"; x.textAlign="left"; x.fillText(`in ${vx.toFixed(2)} → out ${vy.toFixed(2)}`,24,34);
    }
  };
})();

/* ---------- eliza ---------- */
(() => {
  const log=$("elog"), form=$("eform"), inp=$("ein");
  const REF={i:"you",me:"you",my:"your",am:"are",mine:"yours",myself:"yourself",you:"I",your:"my",yours:"mine",yourself:"myself","i'm":"you are","you're":"I am",are:"am"};
  const reflect=s=>s.split(/\s+/).map(w=>REF[w]??w).join(" ");
  const R=[
    [/\bi need (.+)/,["Why do you need {0}?","Would it really help you to get {0}?"]],
    [/\b(?:i am|i'm) (.+)/,["How long have you been {0}?","Why do you think you are {0}?","Do you enjoy being {0}?"]],
    [/\bi feel (.+)/,["Do you often feel {0}?","What makes you feel {0}?"]],
    [/\bi can'?t (.+)/,["How do you know you can't {0}?","Have you tried?"]],
    [/\bi want (.+)/,["What would it mean to you if you got {0}?","Why do you want {0}?"]],
    [/\b(?:you are|you're) (.+)/,["What makes you think I am {0}?","Does it please you to believe I am {0}?"]],
    [/\bbecause\b/,["Is that the real reason?","What other reasons come to mind?"]],
    [/\b(mother|father|mom|dad|sister|brother|family|parents)\b/,["Tell me more about your family.","How do you get along with your {0}?"]],
    [/\b(computers?|machines?|ai|robots?|bots?)\b/,["Do computers worry you?","Why do you mention machines?","Are you sure you're not talking to a human?"]],
    [/^(hello|hi|hey)\b/,["Hello. What's on your mind?"]],
    [/^(yes|yeah|yep)\b/,["You seem quite sure.","I see. Go on."]],
    [/^(no|nope)\b/,["Why not?","Are you saying no just to be negative?"]],
  ];
  const DEF=["Please tell me more.","How does that make you feel?","I see. Go on.","Can you elaborate on that?","Why do you say that?"];
  function reply(raw){
    const s=raw.toLowerCase().replace(/[.!,;]+/g,"").trim();
    for(const [re,outs] of R){ const m=s.match(re); if(m){ const g=m[1]?reflect(m[1].replace(/\?$/,"")):""; return pick(outs).replace("{0}",g); } }
    if(/\?\s*$/.test(raw)) return pick(["Why do you ask?","What do you think?","Does that question interest you?"]);
    return pick(DEF);
  }
  function line(who,txt){ const d=document.createElement("div"); d.className=who; d.innerHTML=`<b>${who==="e"?"ELIZA":"YOU"}:</b> `; d.appendChild(document.createTextNode(txt)); log.appendChild(d); while(log.children.length>13) log.removeChild(log.firstChild); return d; }
  function type(txt){ const d=line("e",""); const tn=d.lastChild; let i=0; const iv=setInterval(()=>{ tn.textContent=txt.slice(0,++i); if(i>=txt.length) clearInterval(iv); },22); }
  form.addEventListener("submit",e=>{ e.preventDefault(); const v=inp.value.trim(); if(!v) return; line("u",v); inp.value=""; setTimeout(()=>type(reply(v)),450); });
  let started=false;
  A.eliza={ enter(){ if(started) return; started=true;
    const demo=[["e","Hello. I am ELIZA. What is troubling you?"],["u","I am worried about my exams"],["e","How long have you been worried about your exams?"],["u","My mom says I work too hard"],["e","Tell me more about your family."],["e","(your turn: type below)"]];
    demo.forEach(([w,t],i)=>setTimeout(()=>w==="e"?type(t):line("u",t),400+i*1300)); } };
})();

/* ---------- expert systems ---------- */
(() => {
  const RULES=["IF fever AND cough THEN flu (0.7)","IF engine cranks AND no start THEN check fuel","IF no spark THEN check ignition coil","IF rash AND fever THEN see doctor (0.6)","IF mass peak = 43 THEN propyl group","IF battery < 12V THEN replace battery","IF enemy visible THEN attack"];
  const kbo=$("kbRules"); kbo.innerHTML=`<div class="in">${[...RULES,...RULES].map(r=>`<div>${r}</div>`).join("")}</div>`; const kb=kbo.firstChild;
  let t=0;
  A.expert={ enter(){}, tick(dt){ t+=dt; const lh=24.3, tot=RULES.length*lh; kb.style.transform=`translateY(${-((t*.02)%tot)}px)`; } };
})();

/* ---------- dendral + mycin ---------- */
(() => {
  const mol=$("mol"), myc=$("myc");
  const atoms=[], bonds=[];
  // butanol-ish: C-C-C-C-O with hydrogens
  const chain=[[-1.9,0,0],[-.65,.75,0],[.65,0,0],[1.9,.75,0]];
  chain.forEach(p=>atoms.push({p,e:"C"})); atoms.push({p:[3.1,0,0],e:"O"});
  for(let i=0;i<4;i++) bonds.push([i,i+1]);
  const addH=(i,v)=>{ atoms.push({p:atoms[i].p.map((c,k)=>c+v[k]),e:"H"}); bonds.push([i,atoms.length-1]); };
  addH(0,[-.6,-.9,0]); addH(0,[-.6,.4,.9]); addH(0,[-.6,.4,-.9]);
  addH(1,[0,.5,.9]); addH(1,[0,.5,-.9]); addH(2,[0,-.5,.9]); addH(2,[0,-.5,-.9]); addH(3,[0,.5,.9]); addH(3,[0,.5,-.9]); addH(4,[.7,-.7,0]);
  const COL={C:Y,O:RED,H:"#d8d5cc"}, RAD={C:15,O:16,H:9};
  let a=0, bars=[], bt=0;
  const ORG=["E. coli","Pseudomonas","Klebsiella","Proteus"];
  function newBars(){ const v=[rnd(.55,.85),rnd(.25,.5),rnd(.08,.3),rnd(.02,.15)].sort(()=>Math.random()-.5); bars=ORG.map((n,i)=>({n,v:v[i],c:0})).sort((p,q)=>q.v-p.v); }
  A.dendral={ enter(){ newBars(); bt=0; }, tick(dt){
    a+=dt*.0008; bt+=dt; if(bt>4200){ bt=0; newBars(); }
    { const x=ctxOf(mol), W=mol.offsetWidth, H=mol.offsetHeight; x.clearRect(0,0,W,H);
      const ca=Math.cos(a), sa=Math.sin(a), cb=Math.cos(a*.6), sb=Math.sin(a*.6);
      const P=atoms.map(at=>{ let [px,py,pz]=at.p; px-=.6; let x1=px*ca+pz*sa, z1=-px*sa+pz*ca; let y1=py*cb-z1*sb, z2=py*sb+z1*cb; const s=34/(1+z2*.08); return {x:W/2+x1*s,y:H/2+y1*s,z:z2,at}; });
      x.strokeStyle="rgba(243,241,234,.5)"; x.lineWidth=4; bonds.forEach(([i,j])=>{ x.beginPath(); x.moveTo(P[i].x,P[i].y); x.lineTo(P[j].x,P[j].y); x.stroke(); });
      [...P].sort((p,q)=>p.z-q.z).forEach(p=>{ const r=RAD[p.at.e]*(1-p.z*.05); const g=x.createRadialGradient(p.x-r*.35,p.y-r*.35,1,p.x,p.y,r); g.addColorStop(0,"#fff"); g.addColorStop(.35,COL[p.at.e]); g.addColorStop(1,"#222"); x.fillStyle=g; x.beginPath(); x.arc(p.x,p.y,r,0,7); x.fill(); });
    }
    { const x=ctxOf(myc), W=myc.offsetWidth; x.clearRect(0,0,W,250);
      x.fillStyle=MUTE; x.font="14px 'JetBrains Mono',Consolas,monospace"; x.textAlign="left"; x.fillText("likely organism · confidence",0,22);
      bars.forEach((b,i)=>{ b.c+=(b.v-b.c)*Math.min(1,dt/250); const y=50+i*50;
        x.fillStyle=i===0?INK:MUTE; x.font=(i===0?"600 ":"")+"16px 'JetBrains Mono',Consolas,monospace"; x.fillText(b.n,0,y);
        x.fillStyle="#2a2a30"; x.fillRect(0,y+8,W-60,12); x.fillStyle=i===0?Y:"rgba(255,194,14,.45)"; x.fillRect(0,y+8,(W-60)*b.c,12);
        x.fillStyle=i===0?Y:MUTE; x.textAlign="right"; x.fillText(b.c.toFixed(2),W,y+20); x.textAlign="left"; });
    }
  } };
})();

/* ---------- decision tree ---------- */
(() => {
  const svg=$("dtSvg"), factBox=$("dtFacts");
  const F={visible:{q:"Enemy visible?",v:1},audible:{q:"Enemy audible?",v:0},near:{q:"Enemy < 10 m away?",v:0},flank:{q:"Enemy on flank?",v:1}};
  const N={
    vis:{x:450,y:60,f:"visible",yes:"near",no:"aud"},
    aud:{x:210,y:220,f:"audible",yes:"creep",no:"idle"},
    near:{x:670,y:220,f:"near",yes:"atk1",no:"flank"},
    creep:{x:110,y:400,a:"Creep"}, idle:{x:310,y:400,a:"Do nothing"},
    atk1:{x:800,y:400,a:"Attack"}, flank:{x:560,y:400,f:"flank",yes:"move",no:"atk2"},
    move:{x:680,y:570,a:"Move"}, atk2:{x:440,y:570,a:"Attack"},
  };
  svg.innerHTML=`<style>.e{stroke:#3a3a42;stroke-width:3;fill:none;transition:stroke .3s}.e.on{stroke:${Y}}
    .nd rect{fill:#1c1c20;stroke:#3a3a42;stroke-width:2;transition:all .3s}.nd text{font-family:'Space Grotesk',system-ui,sans-serif;font-size:21px;fill:${MUTE};transition:fill .3s}
    .nd.on rect{stroke:${Y};fill:#2a2617}.nd.on text{fill:${INK}}.nd.act rect{fill:#24242a}.nd.act.on rect{fill:${Y}}.nd.act.on text{fill:#121214;font-weight:700}
    .el{font-family:'JetBrains Mono',Consolas,monospace;font-size:15px;fill:${MUTE}}</style>`;
  const eG=svgEl("g",{},svg), nG=svgEl("g",{},svg); const edges={}, nodes={};
  for(const [k,n] of Object.entries(N)){
    for(const b of ["yes","no"]) if(n[b]){ const c=N[n[b]]; const e=svgEl("path",{d:`M${n.x} ${n.y+27} C${n.x} ${(n.y+c.y)/2}, ${c.x} ${(n.y+c.y)/2}, ${c.x} ${c.y-27}`,class:"e"},eG); edges[k+b]=e;
      const t=svgEl("text",{x:(n.x+c.x)/2+(b==="yes"?14:-14),y:(n.y+c.y)/2+4,class:"el","text-anchor":b==="yes"?"start":"end"},eG); t.textContent=b; }
    const g=svgEl("g",{class:"nd"+(n.a?" act":"")},nG); const w=n.a?150:236;
    svgEl("rect",{x:n.x-w/2,y:n.y-27,width:w,height:54,rx:n.a?27:10},g);
    const t=svgEl("text",{x:n.x,y:n.y+7,"text-anchor":"middle"},g); t.textContent=n.a||F[n.f].q; nodes[k]=g;
  }
  const dot=svgEl("circle",{r:9,fill:Y},svg); let route=[], rt=0;
  const rows={};
  for(const [k,f] of Object.entries(F)){ const r=document.createElement("div"); r.className="fact card"; r.innerHTML=`<span>${f.q}</span><span class="yn"></span>`; r.onclick=()=>{ f.v^=1; render(); }; factBox.appendChild(r); rows[k]=r; }
  function render(){
    Object.values(edges).forEach(e=>e.classList.remove("on")); Object.values(nodes).forEach(n=>n.classList.remove("on"));
    let k="vis"; route=[]; const asked=new Set();
    while(true){ nodes[k].classList.add("on"); const n=N[k]; if(n.a) break; asked.add(n.f); const b=F[n.f].v?"yes":"no"; edges[k+b].classList.add("on"); route.push(edges[k+b]); k=n[b]; }
    for(const [key,f] of Object.entries(F)){ const yn=rows[key].querySelector(".yn"); yn.textContent=f.v?"YES":"NO"; yn.className="yn "+(f.v?"yes":"no"); rows[key].style.opacity=asked.has(key)?1:.4; }
    rt=0;
  }
  A.dtree={ enter(){ render(); }, tick(dt){ if(!route.length) return; rt+=dt; const per=900, tot=route.length*per+800; const tt=rt%tot; const i=Math.min(route.length-1,Math.floor(tt/per)); const p=Math.min(1,(tt-i*per)/per);
    const e=route[i], L=e.getTotalLength(), pt=e.getPointAtLength(ease(p)*L); dot.setAttribute("cx",pt.x); dot.setAttribute("cy",pt.y); dot.style.opacity=tt>route.length*per?0:1; } };
})();

/* ---------- are you sick ---------- */
(() => {
  const card=$("sickCard"), trail=$("sickTrail");
  const T={
    q0:{q:"Are you sick?",k:"sick",yes:"q1",no:"a0"},
    q1:{q:"Do you have a fever?",k:"fever",yes:"a1",no:"q2"},
    q2:{q:"Are you coughing or sneezing a lot?",k:"contagious",yes:"a2",no:"a3"},
    a0:{a:"Come to class!"}, a1:{a:"Stay home and rest. Email your instructor."}, a2:{a:"Stay home so you don’t spread it."}, a3:{a:"Come to class, but take it easy."},
  };
  let path=[];
  function show(id){
    const n=T[id];
    trail.innerHTML=path.map((p,i)=>`<div>${i?"AND":"IF&nbsp;"} ${p.k} = <b>${p.v}</b></div>`).join("")+(n.a?`<div>THEN <b>${n.a}</b></div>`:"");
    if(n.a){ card.innerHTML=`<div class="eyebrow">Conclusion</div><div class="ans flip">${n.a}</div><button class="btn" id="sickRe">Start over ↺</button>`; $("sickRe").onclick=()=>{ path=[]; show("q0"); }; return; }
    card.innerHTML=`<div class="eyebrow">Question ${path.length+1}</div><div class="qq flip">${n.q}</div><div class="yesno"><button class="btn b-yes">YES</button><button class="btn b-no">NO</button></div>`;
    card.querySelector(".b-yes").onclick=()=>{ path.push({k:n.k,v:"YES"}); show(n.yes); };
    card.querySelector(".b-no").onclick=()=>{ path.push({k:n.k,v:"NO"}); show(n.no); };
  }
  A.sick={ enter(){ path=[]; show("q0"); } };
})();

/* ---------- pong ---------- */
(() => {
  const cv=$("pong"); let b,p1,p2;
  A.games={
    enter(){ b={x:800,y:450,vx:7,vy:rnd(-4,4)}; p1={y:450}; p2={y:450}; },
    tick(dt){
      const x=ctxOf(cv), f=dt/16.7;
      b.x+=b.vx*f; b.y+=b.vy*f; if(b.y<20||b.y>880){ b.vy*=-1; b.y=Math.max(20,Math.min(880,b.y)); }
      const track=(p,side)=>{ const coming=side<0?b.vx<0:b.vx>0; const tgt=coming?b.y:450; p.y+=Math.max(-6.5,Math.min(6.5,(tgt-p.y)*.09))*f; };
      track(p1,-1); track(p2,1);
      if(b.x<80 && b.vx<0 && Math.abs(b.y-p1.y)<80){ b.vx*=-1; b.vy+=(b.y-p1.y)*.06; }
      if(b.x>1520 && b.vx>0 && Math.abs(b.y-p2.y)<80){ b.vx*=-1; b.vy+=(b.y-p2.y)*.06; }
      if(b.x<-40||b.x>1640){ b.x=800; b.y=450; b.vx=(b.vx>0?-7:7); b.vy=rnd(-4,4); }
      b.vy=Math.max(-9,Math.min(9,b.vy));
      x.fillStyle="rgba(18,18,20,.35)"; x.fillRect(0,0,1600,900);
      x.setLineDash([16,18]); x.strokeStyle="rgba(243,241,234,.12)"; x.lineWidth=4; x.beginPath(); x.moveTo(800,0); x.lineTo(800,900); x.stroke(); x.setLineDash([]);
      x.fillStyle="rgba(243,241,234,.55)"; x.fillRect(50,p1.y-70,16,140); x.fillRect(1534,p2.y-70,16,140);
      x.fillStyle=Y; x.fillRect(b.x-10,b.y-10,20,20);
    }
  };
})();

/* ---------- tic tac toe ---------- */
(() => {
  const board=$("tttBoard"), status=$("tttStatus"); let B, over, aiFirst=false, busy=false; const sc={Y:0,D:0,A:0};
  const L=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  const cells=[...Array(9)].map((_,i)=>{ const c=document.createElement("div"); c.className="cell"; c.onclick=()=>play(i); board.appendChild(c); return c; });
  const win=b=>{ for(const l of L) if(b[l[0]]&&b[l[0]]===b[l[1]]&&b[l[0]]===b[l[2]]) return {p:b[l[0]],l}; return b.every(Boolean)?{p:"D"}:null; };
  function mm(b,turn,d){ const w=win(b); if(w) return w.p==="O"?10-d:w.p==="X"?d-10:0;
    let best=turn==="O"?-99:99; for(let i=0;i<9;i++) if(!b[i]){ b[i]=turn; const v=mm(b,turn==="O"?"X":"O",d+1); b[i]=null; best=turn==="O"?Math.max(best,v):Math.min(best,v); } return best; }
  function aiMove(){ let best=-99, moves=[]; for(let i=0;i<9;i++) if(!B[i]){ B[i]="O"; const v=mm(B,"X",1); B[i]=null; if(v>best){ best=v; moves=[i]; } else if(v===best) moves.push(i); } return pick(moves); }
  function draw(i){ const p=B[i]; cells[i].innerHTML=p==="X"?`<svg viewBox="0 0 100 100" class="X"><line x1="22" y1="22" x2="78" y2="78"/><line x1="78" y1="22" x2="22" y2="78"/></svg>`:`<svg viewBox="0 0 100 100" class="O"><circle cx="50" cy="50" r="34"/></svg>`; }
  function end(){ const w=win(B); if(!w) return false; over=true;
    if(w.l) w.l.forEach(i=>cells[i].classList.add("win"));
    if(w.p==="X"){ sc.Y++; status.textContent="You win?! That shouldn’t happen."; } else if(w.p==="O"){ sc.A++; status.textContent="AI wins. It saw that coming."; } else { sc.D++; status.textContent="Draw. Minimax can’t lose."; }
    $("scY").textContent=sc.Y; $("scD").textContent=sc.D; $("scA").textContent=sc.A; return true; }
  function ai(){ busy=true; status.textContent="Thinking…"; setTimeout(()=>{ const m=aiMove(); B[m]="O"; draw(m); busy=false; if(!end()) status.textContent="Your move."; },480); }
  function play(i){ if(over||busy||B[i]) return; B[i]="X"; draw(i); if(!end()) ai(); }
  function reset(){ B=Array(9).fill(null); over=false; busy=false; cells.forEach(c=>{ c.innerHTML=""; c.classList.remove("win"); }); status.textContent="Your move."; if(aiFirst) ai(); }
  $("tttNew").onclick=reset; $("tttFirst").onclick=e=>{ aiFirst=!aiFirst; e.target.classList.toggle("on",aiFirst); reset(); };
  reset();
  A.ttt={ enter(){} };
})();

/* ---------- minimax tree ---------- */
(() => {
  const cv=$("mmTree"); let vals=[], t=0;
  const regen=()=>{ vals=Array.from({length:9},()=>Math.floor(rnd(-9,10))); };
  A.minimax={ enter(){ regen(); t=0; }, tick(dt){
    t+=dt; if(t>10500){ t=0; regen(); }
    const s=t/1000, x=ctxOf(cv), W=cv.offsetWidth, H=cv.offsetHeight;
    x.fillStyle="#0d0d0f"; x.fillRect(0,0,W,H);
    const root={x:W/2,y:90}, mins=[0,1,2].map(i=>({x:W*(.2+i*.3),y:H*.42})), leaves=vals.map((v,i)=>({x:W*(.2+Math.floor(i/3)*.3)+(i%3-1)*W*.085,y:H*.78,v}));
    const minV=[0,1,2].map(g=>Math.min(...vals.slice(g*3,g*3+3))), minIdx=[0,1,2].map(g=>g*3+vals.slice(g*3,g*3+3).indexOf(minV[g]));
    const maxV=Math.max(...minV), maxIdx=minV.indexOf(maxV);
    const leafOn=i=>s>.3+i*.17, minOn=g=>s>2.2+g*.8, rootOn=s>4.8;
    const edge=(a,b,on,col)=>{ x.strokeStyle=on?col:"#2e2e35"; x.lineWidth=on?4:2; x.beginPath(); x.moveTo(a.x,a.y); x.lineTo(b.x,b.y); x.stroke(); };
    mins.forEach((m,g)=>edge(root,m,rootOn&&g===maxIdx,Y));
    leaves.forEach((l,i)=>{ const g=Math.floor(i/3); edge(mins[g],l,minOn(g)&&i===minIdx[g],BLUE); });
    const tri=(p,up,col,fill,label)=>{ const r=34; x.beginPath(); if(up){ x.moveTo(p.x,p.y-r); x.lineTo(p.x+r*1.05,p.y+r*.7); x.lineTo(p.x-r*1.05,p.y+r*.7); } else { x.moveTo(p.x,p.y+r); x.lineTo(p.x+r*1.05,p.y-r*.7); x.lineTo(p.x-r*1.05,p.y-r*.7); } x.closePath();
      x.fillStyle=fill?col:"#1c1c20"; x.fill(); x.strokeStyle=col; x.lineWidth=2.5; x.stroke();
      if(label!==null){ x.fillStyle=fill?"#121214":INK; x.font="700 20px 'JetBrains Mono',Consolas,monospace"; x.textAlign="center"; x.fillText(label,p.x,p.y+(up?12:-2)); } };
    tri(root,true,Y,rootOn,rootOn?maxV:null);
    mins.forEach((m,g)=>tri(m,false,BLUE,minOn(g),minOn(g)?minV[g]:null));
    leaves.forEach((l,i)=>{ const on=leafOn(i), w=46; x.fillStyle=on?"#24242a":"#151518"; x.strokeStyle=on?MUTE:"#2e2e35"; x.lineWidth=2; x.beginPath(); x.roundRect(l.x-w/2,l.y-w/2,w,w,8); x.fill(); x.stroke();
      if(on){ x.fillStyle=INK; x.font="600 19px 'JetBrains Mono',Consolas,monospace"; x.textAlign="center"; x.fillText(l.v,l.x,l.y+7); } });
    x.font="15px 'JetBrains Mono',Consolas,monospace"; x.textAlign="left"; x.fillStyle=Y; x.fillText("MAX · my move",24,root.y+6); x.fillStyle=BLUE; x.fillText("MIN · their reply",24,mins[0].y-50); x.fillStyle=MUTE; x.fillText("scores",24,leaves[0].y+56);
    if(rootOn){ x.fillStyle=Y; x.font="600 18px 'JetBrains Mono',Consolas,monospace"; x.textAlign="center"; x.fillText(`best move → guarantees ${maxV}`,mins[maxIdx].x,mins[maxIdx].y-58); }
  } };
})();

/* ---------- deep blue chess ---------- */
(() => {
  const cv=$("chess"), cap=$("chessCap");
  const FEN="r1bq1rk1/pp2bppp/2n1pn2/3p4/2PP4/2N1PN2/PP2BPPP/R2QKB1R";
  const G={k:"♚",q:"♛",r:"♜",b:"♝",n:"♞",p:"♟"};
  const bd=[]; FEN.split("/").forEach((row,r)=>{ let c=0; for(const ch of row){ if(/\d/.test(ch)) c+=+ch; else { bd.push({r,c,p:ch}); c++; } } });
  let arrows=[], count=0, t=0, best=null, bt=0;
  function arrow(x,a,b,col,w){ const dx=b[0]-a[0], dy=b[1]-a[1], L=Math.hypot(dx,dy), ux=dx/L, uy=dy/L; x.strokeStyle=col; x.fillStyle=col; x.lineWidth=w; x.beginPath(); x.moveTo(a[0],a[1]); x.lineTo(b[0]-ux*16,b[1]-uy*16); x.stroke(); x.beginPath(); x.moveTo(b[0],b[1]); x.lineTo(b[0]-ux*20-uy*10,b[1]-uy*20+ux*10); x.lineTo(b[0]-ux*20+uy*10,b[1]-uy*20-ux*10); x.closePath(); x.fill(); }
  A.deepblue={ enter(){ arrows=[]; count=0; best=null; bt=0; }, tick(dt){
    t+=dt; bt+=dt; count+=Math.floor(dt*rnd(2600,3400));
    cap.textContent="positions evaluated: "+count.toLocaleString();
    const x=ctxOf(cv), W=cv.offsetWidth, H=cv.offsetHeight, S=Math.min(W,H)-80, sq=S/8, ox=(W-S)/2, oy=(H-S)/2-10;
    x.fillStyle="#0d0d0f"; x.fillRect(0,0,W,H);
    for(let r=0;r<8;r++) for(let c=0;c<8;c++){ x.fillStyle=(r+c)%2?"#26262d":"#383842"; x.fillRect(ox+c*sq,oy+r*sq,sq,sq); }
    x.textAlign="center"; x.textBaseline="middle"; x.font=`${sq*.78}px "Segoe UI Symbol","DejaVu Sans","Noto Sans Symbols 2",serif`;
    bd.forEach(p=>{ const w=p.p===p.p.toUpperCase(); x.fillStyle=w?INK:Y; x.fillText(G[p.p.toLowerCase()],ox+(p.c+.5)*sq,oy+(p.r+.5)*sq+2); });
    const ctr=(r,c)=>[ox+(c+.5)*sq,oy+(r+.5)*sq];
    if(Math.random()<dt/40){ const p=pick(bd.filter(q=>q.p===q.p.toUpperCase())); const k=p.p.toLowerCase(); let d;
      if(k==="n") d=pick([[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]]);
      else if(k==="p") d=pick([[-1,0],[-2,0],[-1,1],[-1,-1]]);
      else if(k==="k") d=pick([[0,1],[0,-1],[-1,0],[-1,1],[-1,-1]]);
      else { const dirs=k==="r"?[[0,1],[0,-1],[1,0],[-1,0]]:k==="b"?[[1,1],[1,-1],[-1,1],[-1,-1]]:[[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]]; const u=pick(dirs), n=1+((Math.random()*4)|0); d=[u[0]*n,u[1]*n]; }
      const tr=p.r+d[0], tc=p.c+d[1]; if(tr>=0&&tr<8&&tc>=0&&tc<8&&!bd.some(q=>q.r===tr&&q.c===tc&&q.p===q.p.toUpperCase())) arrows.push({a:ctr(p.r,p.c),b:ctr(tr,tc),life:1}); }
    arrows=arrows.filter(a=>{ a.life-=dt/450; if(a.life<=0) return false; arrow(x,a.a,a.b,`rgba(106,184,255,${a.life*.55})`,4); return true; });
    if(bt>2600){ bt=0; best={a:ctr(5,5),b:ctr(3,4)}; }
    if(best){ arrow(x,best.a,best.b,"rgba(255,194,14,.95)",7); }
    x.textBaseline="alphabetic";
  } };
})();

/* ---------- navigation ---------- */
const countEl=$("count"), prog=$("progress");
/*LIVE_CORE*/

function go(i,fromHash){
  i=Math.max(0,Math.min(slides.length-1,i));
  const capS=liveCap(); if(i>capS){ if(cur>=capS) toast("Waiting for your instructor…"); i=capS; }
  if(i===cur) return;
  const dir=i>cur?1:-1;
  if(cur>=0) slides[cur].classList.remove("active");
  cur=i; const s=slides[cur]; s.classList.add("active");
  s.querySelectorAll("canvas").forEach(fitCanvas);
  const a=A[s.dataset.id]; if(a&&a.enter) a.enter(dir);
  countEl.textContent=`${cur+1} / ${slides.length}`; prog.style.width=((cur+1)/slides.length*100)+"%";
  if(!fromHash){ try{ history.replaceState(null,"","#s"+(cur+1)); }catch(e){} }
  if(Live.role==="presenter"&&Live.locked) pushLive();
  if(Live.role!=="solo") renderLive();
}
function fromHash(){ const m=/^#s(\d+)$/.exec(location.hash); go(m?+m[1]-1:0,true); }
addEventListener("hashchange",fromHash);
function advance(){ const a=A[slides[cur].dataset.id]; if(a&&a.step&&a.step()) return; go(cur+1); }
function retreat(){ const a=A[slides[cur].dataset.id]; if(a&&a.back&&a.back()) return; go(cur-1); }
$("prev").onclick=retreat; $("next").onclick=advance;
function toggleFS(){ try{ if(document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(()=>{}); }catch(e){} }
$("fs").onclick=toggleFS;
addEventListener("keydown",e=>{
  if(e.target.tagName==="INPUT") return;
  const k=e.key;
  if(["ArrowRight","PageDown"].includes(k)||(k===" "&&e.target.tagName!=="BUTTON")){ advance(); e.preventDefault(); }
  else if(["ArrowLeft","PageUp"].includes(k)){ retreat(); e.preventDefault(); }
  else if(k==="Home") go(0); else if(k==="End") go(slides.length-1);
  else if(k==="f"||k==="F") toggleFS();
});
let sx=null; stage.addEventListener("touchstart",e=>{ if(e.target.closest("input,button,.cell,.switch,.fact,svg")) return; sx=e.touches[0].clientX; },{passive:true});
stage.addEventListener("touchend",e=>{ if(sx===null) return; const dx=e.changedTouches[0].clientX-sx; if(Math.abs(dx)>60) (dx<0?advance:retreat)(); sx=null; });
addEventListener("resize",fitStage);
fitStage(); fromHash(); claudeAdapter();
let last=performance.now();
function loop(now){ const dt=Math.min(100,now-last); last=now; const s=slides[cur], a=s&&A[s.dataset.id]; if(a&&a.tick){ try{ a.tick(dt,now); }catch(err){ console.error(err); } } requestAnimationFrame(loop); }
requestAnimationFrame(loop);
})();
