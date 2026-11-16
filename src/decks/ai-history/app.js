(() => {
"use strict";
const Y="#ffc20e", BLUE="#6ab8ff", GREEN="#5fd68a", RED="#ff5a4e", AMBER="#ff8a1f", INK="#f3f1ea", MUTE="#9b988f", LINE="#2e2e35";
const SANS='"Space Grotesk",system-ui,-apple-system,"Segoe UI",sans-serif', MONO='"JetBrains Mono",ui-monospace,Consolas,monospace';
const stage=document.getElementById("stage");
const slides=[...document.querySelectorAll(".slide")];
const $=id=>document.getElementById(id);
const NS="http://www.w3.org/2000/svg";
const svgEl=(tag,attrs={},parent)=>{ const e=document.createElementNS(NS,tag); for(const k in attrs) e.setAttribute(k,attrs[k]); if(parent) parent.appendChild(e); return e; };
const rnd=(a,b)=>a+Math.random()*(b-a), pick=a=>a[(Math.random()*a.length)|0];
const ease=t=>1-Math.pow(1-Math.min(1,Math.max(0,t)),3);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const fmt=n=>Math.round(n).toLocaleString("en-US");
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
// pointer position in a canvas's css pixels (the stage is scaled, so divide by the scale)
function ptr(e,c){ const r=c.getBoundingClientRect(), s=r.width/c.offsetWidth; return {x:(e.clientX-r.left)/s, y:(e.clientY-r.top)/s}; }
const A={};

/* ================= 1950s to Deep Blue ================= */
{
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
  const cap=$("eulerCap"), slide=svg.closest(".slide"), idea=$("aristIdea");
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
      idea.classList.toggle("on", stage>=3);
    }
  };
})();

/* ---------- lovelace: can a machine…? ---------- */
(() => {
  const C=[
    ["do math?","yes","YES","That’s what it was built for. Lovelace’s program computed Bernoulli numbers."],
    ["compose music?","yes","YES","Lovelace predicted it in 1843. Today, AI composes music."],
    ["beat a world chess champion?","yes","YES","IBM’s Deep Blue did it in 1997. You’ll see it at the end of today."],
    ["come up with something truly original?","maybe","STILL DEBATED","Lovelace said no. Turing said maybe. People still argue about it today."],
  ];
  const box=$("llCards"), idea=$("llIdea"); let seen=new Set();
  box.innerHTML=C.map(([q,c,v,t],i)=>`<div class="flip3" data-i="${i}"><div class="in"><div class="f"><span class="k">CAN A MACHINE…</span><span class="t">${q}</span></div><div class="b"><span class="v ${c}">${v}</span><span class="t">${t}</span></div></div></div>`).join("");
  box.querySelectorAll(".flip3").forEach(el=>el.onclick=()=>{ el.classList.toggle("on"); seen.add(el.dataset.i); idea.classList.toggle("on", seen.has("3")); });
  A.lovelace={ enter(){ seen=new Set(); idea.classList.remove("on"); box.querySelectorAll(".flip3").forEach(el=>el.classList.remove("on")); } };
})();

/* ---------- 5 boole ---------- */
(() => {
  const sa=$("swA"), sb=$("swB"), tt=$("tt"); let a=0,b=0, auto=true, t=0, k=0;
  const rows=[[0,0],[0,1],[1,0],[1,1]].map(([x,y])=>{ const r=document.createElement("tr"); r.innerHTML=[x,y,x&y,x|y].map(v=>`<td class="${v?"one":""}">${v}</td>`).join(""); tt.appendChild(r); return r; });
  function render(){
    sa.classList.toggle("on",!!a); sb.classList.toggle("on",!!b); sa.querySelector(".val").textContent=a; sb.querySelector(".val").textContent=b;
    const g=[["gAND",a&b],["gOR",a|b]];
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

/* ---------- talos: watch, or play as talos ---------- */
(() => {
  // idle: talos defends crete by himself. game: the player clicks ships to throw boulders,
  // 3 ships landing = game over, surviving 3 patrol laps (one day) = win.
  const cv=$("talos"), cap=$("talosCap"), hud=$("talosHud"), over=$("talosOver");
  let W,H,isl=[],path=[],plen=0,ships=[],rocks=[],splash=[],pos=0,cool=0,lap=0,t=0;
  let mode="idle", sunk=0, landed=0, spawnT=0, elapsed=0;
  const LAND_MAX=3, LAPS=3, GAME_SPEED=.0082, IDLE_SPEED=.022, COOL=320;
  function build(){
    W=cv.offsetWidth; H=cv.offsetHeight; isl=[]; path=[];
    const cx=W/2, cy=H/2, rx=W*.3, ry=H*.13;
    for(let i=0;i<120;i++){ const a=i/120*Math.PI*2; const r=1+.08*Math.sin(3*a+1)+.06*Math.sin(5*a)+.04*Math.sin(9*a+2);
      isl.push([cx+Math.cos(a)*rx*r, cy+Math.sin(a)*ry*r*(1+.25*Math.sin(2*a))]); }
    for(const [x,y] of isl){ const dx=x-cx, dy=y-cy, d=Math.hypot(dx,dy); path.push([x+dx/d*22, y+dy/d*22]); }
    plen=path.length;
  }
  function onIsland(px,py){ let inside=false; for(let i=0,j=isl.length-1;i<isl.length;j=i++){ const [xi,yi]=isl[i],[xj,yj]=isl[j];
    if(((yi>py)!==(yj>py))&&(px<(xj-xi)*(py-yi)/(yj-yi)+xi)) inside=!inside; } return inside; }
  function talosXY(){ const i=Math.floor(pos)%plen, f=pos-Math.floor(pos), a=path[i], b=path[(i+1)%plen]; return [a[0]+(b[0]-a[0])*f, a[1]+(b[1]-a[1])*f]; }
  function spawn(speed=1){
    const side=pick(["l","r","t","b"]); let x,y;
    if(side==="l"){ x=-30; y=rnd(H*.1,H*.9); } else if(side==="r"){ x=W+30; y=rnd(H*.1,H*.9); }
    else if(side==="t"){ x=rnd(W*.1,W*.9); y=-30; } else { x=rnd(W*.1,W*.9); y=H+30; }
    const tx=W/2+rnd(-W*.22,W*.22), ty=H/2+rnd(-H*.06,H*.06), d=Math.hypot(tx-x,ty-y), v=rnd(.27,.4)*speed;
    ships.push({x,y,vx:(tx-x)/d*v,vy:(ty-y)/d*v,alive:1,sink:0,landed:0,dir:tx>x?1:-1});
  }
  function throwAt(tx,ty,ship){ const [sx,sy]=talosXY(); const T=650;
    const px=ship?ship.x+ship.vx*T/16.7:tx, py=ship?ship.y+ship.vy*T/16.7:ty;
    rocks.push({x0:sx,y0:sy,t:0,T,x1:px,y1:py}); if(ship) ship.targeted=1; cool=COOL; }
  function setOverlay(html){ if(!html){ over.classList.add("hide"); return; } over.innerHTML=`<div class="box">${html}</div>`; over.classList.remove("hide");
    const b=over.querySelector("button"); if(b) b.onclick=start; }
  function idleOverlay(){ setOverlay(`<h3>Play as Talos</h3><p>Click the enemy ships to hurl boulders at them. If <b>3 ships</b> reach the shore, Crete falls. Survive <b>3 patrol laps</b> to win.</p><button class="btn on">Start ▶</button>`); }
  function start(){ mode="game"; ships=[]; rocks=[]; splash=[]; sunk=0; landed=0; lap=0; pos=0; cool=0; spawnT=600; elapsed=0; setOverlay(null); }
  function end(won){ mode="over";
    setOverlay(won?`<div class="big" style="color:var(--y)">Crete is safe!</div><p>You sank <b>${sunk}</b> ships and lasted a full day of patrols.</p><button class="btn on">Play again ↺</button>`
                  :`<div class="big" style="color:var(--red)">Crete has fallen</div><p>Three ships made it ashore during lap ${lap+1}. You sank <b>${sunk}</b>.</p><button class="btn on">Try again ↺</button>`); }
  function renderHud(){ hud.innerHTML = mode==="idle" ? "" : `<span>Lap <b>${Math.min(lap+1,LAPS)}</b> of ${LAPS}</span><span>Sunk <b>${sunk}</b></span><span class="${landed?"bad":""}">Landed <b>${landed}</b> / ${LAND_MAX}</span>`; }
  cv.addEventListener("pointerdown",e=>{
    if(mode!=="game"||cool>0) return;
    const r=cv.getBoundingClientRect(), x=(e.clientX-r.left)*W/r.width, y=(e.clientY-r.top)*H/r.height;
    let best=null, bd=46; for(const s of ships){ if(!s.alive||s.landed) continue; const d=Math.hypot(s.x-x,s.y-y); if(d<bd){ bd=d; best=s; } }
    throwAt(x,y,best);
  });
  cv._ships=()=>ships.filter(s=>s.alive&&!s.landed).map(s=>({x:s.x,y:s.y,W,H}));   // used by the automated test
  A.talos={
    enter(){ build(); mode="idle"; ships=[]; rocks=[]; splash=[]; pos=0; cool=0; lap=0; t=0; for(let i=0;i<3;i++){ spawn(); ships[i].x+=ships[i].vx*400; ships[i].y+=ships[i].vy*400; } idleOverlay(); renderHud(); },
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
      x.setLineDash([4,10]); x.strokeStyle="rgba(255,194,14,.25)"; x.lineWidth=2; x.beginPath(); path.forEach(([a,b],i)=>i?x.lineTo(a,b):x.moveTo(a,b)); x.closePath(); x.stroke(); x.setLineDash([]);
      // talos patrols: 3 laps = one day
      if(mode!=="over"){ pos+=dt*(mode==="game"?GAME_SPEED:IDLE_SPEED); if(pos>=plen){ pos-=plen; lap++; if(mode==="game"&&lap>=LAPS){ end(true); } else if(mode!=="game") lap%=3; } }
      cap.textContent = mode==="game" ? "click a ship to hurl a boulder" : `patrol lap ${lap%3+1} of 3`;
      const [tx,ty]=talosXY();
      const rg=x.createRadialGradient(tx,ty,0,tx,ty,30); rg.addColorStop(0,"rgba(255,194,14,.9)"); rg.addColorStop(1,"rgba(255,194,14,0)"); x.fillStyle=rg; x.beginPath(); x.arc(tx,ty,30,0,7); x.fill();
      x.fillStyle="#ffe7a3"; x.beginPath(); x.arc(tx,ty,8,0,7); x.fill();
      cool-=dt;
      if(mode==="game"&&cool>0){ x.strokeStyle="rgba(255,231,163,.8)"; x.lineWidth=3; x.beginPath(); x.arc(tx,ty,14,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-cool/COOL)); x.stroke(); }
      // ships: spawn faster as the day goes on
      if(mode==="game"){ elapsed+=dt; spawnT-=dt; const prog=Math.min(1,elapsed/40000);
        if(spawnT<=0){ spawn(1+prog*1.1); if(prog>.55&&Math.random()<prog*.5) spawn(1+prog*1.1);   // late in the day: faster, and often two at once
          spawnT=rnd(1500,2100)*(1-prog*.55); } }
      else if(mode==="idle"&&Math.random()<.006*f&&ships.filter(s=>s.alive&&!s.landed).length<5) spawn();
      for(const s of ships){
        if(s.alive&&!s.landed){ s.x+=s.vx*f; s.y+=s.vy*f;
          if(onIsland(s.x+s.vx*12,s.y+s.vy*12)){
            if(mode==="game"){ s.landed=1; landed++; if(landed>=LAND_MAX) end(false); }
            else s.alive=0;  // idle: talos never lets one through
          }
          if(mode==="idle"&&cool<=0&&!s.targeted&&Math.hypot(s.x-tx,s.y-ty)<260) throwAt(0,0,s);
        } else if(!s.alive) s.sink+=dt/1200;
        if(s.sink>=1) continue;
        x.save(); x.translate(s.x,s.y); x.globalAlpha=1-s.sink; x.rotate(s.sink*.6*s.dir); const sc=1-s.sink*.5; x.scale(sc*s.dir,sc);
        x.fillStyle=s.landed?"#6b5236":"#8a6b45"; x.beginPath(); x.moveTo(-18,0); x.lineTo(18,0); x.lineTo(12,8); x.lineTo(-14,8); x.closePath(); x.fill();
        x.fillStyle=s.landed?RED:INK; x.beginPath(); x.moveTo(0,-2); x.lineTo(0,-26); x.lineTo(14,-4); x.closePath(); x.fill();
        x.restore();
      }
      ships=ships.filter(s=>s.sink<1 && s.x>-60 && s.x<W+60 && s.y>-60 && s.y<H+60);
      // boulders
      rocks=rocks.filter(r=>{ r.t+=dt; const p=Math.min(1,r.t/r.T); const rx=r.x0+(r.x1-r.x0)*p, ry=r.y0+(r.y1-r.y0)*p-Math.sin(p*Math.PI)*120;
        x.fillStyle="#b9b2a5"; x.beginPath(); x.arc(rx,ry,6+Math.sin(p*Math.PI)*4,0,7); x.fill();
        if(p>=1){ splash.push({x:r.x1,y:r.y1,t:0});
          for(const s of ships){ if(s.alive&&!s.landed&&Math.hypot(s.x-r.x1,s.y-r.y1)<34){ s.alive=0; if(mode==="game") sunk++; } else if(s.targeted&&s.alive) s.targeted=0; }
          return false; } return true; });
      splash=splash.filter(s=>{ s.t+=dt/700; x.strokeStyle=`rgba(243,241,234,${1-s.t})`; x.lineWidth=2; x.beginPath(); x.arc(s.x,s.y,8+s.t*34,0,7); x.stroke(); return s.t<1; });
      renderHud();
    }
  };
})();

/* ---------- 8 automaton: three machines, auto or hand-cranked ---------- */
(() => {
  const svg=$("gears");
  function gearPath(n,ro,ri,rh){
    let d=""; for(let i=0;i<n;i++){ const a=i/n*Math.PI*2, s=Math.PI*2/n;
      const pts=[[a-s*.25,ri],[a-s*.15,ro],[a+s*.15,ro],[a+s*.25,ri],[a+s*.75,ri]];
      pts.forEach(([ang,r],k)=>d+=(i===0&&k===0?"M":"L")+(Math.cos(ang)*r).toFixed(1)+" "+(Math.sin(ang)*r).toFixed(1)+" "); }
    d+="Z M"+rh+" 0 A"+rh+" "+rh+" 0 1 0 "+(-rh)+" 0 A"+rh+" "+rh+" 0 1 0 "+rh+" 0Z"; return d;
  }
  svg.innerHTML=`<style>.gr{fill:#2a2a30;stroke:${Y};stroke-width:2.5;fill-rule:evenodd}.rod{stroke:${INK};stroke-width:5;stroke-linecap:round}.pin{fill:${INK}}</style>`;
  const D={x:170,y:440};                                   // drive gear (the crank turns this one)
  const gear=(parent,n,ro,ri,rh)=>{ const g=svgEl("g",{},parent); svgEl("path",{d:gearPath(n,ro,ri,rh),class:"gr"},g);
    for(let k=0;k<4;k++) svgEl("line",{x1:0,y1:0,x2:Math.cos(k*Math.PI/2)*(ri-6),y2:Math.sin(k*Math.PI/2)*(ri-6),stroke:Y,"stroke-width":2,opacity:.4},g); return g; };
  const place=(g,x,y,ang)=>g.setAttribute("transform",`translate(${x} ${y}) rotate(${ang*180/Math.PI})`);

  // --- spinner: a windmill. a small gear multiplies the crank's speed; a belt carries it up to the sails ---
  const m1=svgEl("g",{},svg);
  const PIN={x:298,y:440}, HUB={x:470,y:245}, PR=24;
  const w1g2=gear(m1,6,40,28,9);
  svgEl("rect",{x:350,y:398,width:250,height:12,rx:4,fill:"#3a3a42"},m1);
  svgEl("path",{d:`M${HUB.x-26} 398 L${HUB.x-12} ${HUB.y+18} L${HUB.x+12} ${HUB.y+18} L${HUB.x+26} 398Z`,fill:"#2f2a22",stroke:"#5a5040","stroke-width":2},m1);
  const beltA=svgEl("line",{stroke:"#77746d","stroke-width":4,"stroke-dasharray":"10 8"},m1), beltB=svgEl("line",{stroke:"#77746d","stroke-width":4,"stroke-dasharray":"10 8"},m1);
  const pulleyP=svgEl("circle",{cx:PIN.x,cy:PIN.y,r:PR,fill:"none",stroke:"#77746d","stroke-width":3},m1);
  const pulleyH=svgEl("circle",{cx:HUB.x,cy:HUB.y,r:PR,fill:"#1c1c20",stroke:"#77746d","stroke-width":3},m1);
  const sails=svgEl("g",{},m1);
  for(let k=0;k<4;k++){ const g=svgEl("g",{transform:`rotate(${k*90})`},sails);
    svgEl("line",{x1:0,y1:0,x2:0,y2:-122,stroke:INK,"stroke-width":5,"stroke-linecap":"round"},g);
    svgEl("rect",{x:2,y:-120,width:30,height:94,rx:3,fill:"rgba(255,194,14,.22)",stroke:Y,"stroke-width":2},g);
    for(let r=1;r<5;r++) svgEl("line",{x1:2,y1:-120+r*18.8,x2:32,y2:-120+r*18.8,stroke:Y,"stroke-width":1,opacity:.5},g); }
  svgEl("circle",{cx:0,cy:0,r:12,fill:INK},sails);
  const w1ratio=svgEl("text",{x:362,y:446,fill:MUTE,"font-family":"JetBrains Mono, Consolas, monospace","font-size":15},m1);
  // belt: two straight runs between the pulleys (equal radius, so the runs are parallel)
  (()=>{ const dx=HUB.x-PIN.x, dy=HUB.y-PIN.y, d=Math.hypot(dx,dy), nx=-dy/d*PR, ny=dx/d*PR;
    [[beltA,1],[beltB,-1]].forEach(([l,s])=>{ l.setAttribute("x1",PIN.x+nx*s); l.setAttribute("y1",PIN.y+ny*s); l.setAttribute("x2",HUB.x+nx*s); l.setAttribute("y2",HUB.y+ny*s); }); })();

  // --- machine 2: drawing machine (two wheels, two arms, one pen) ---
  const m2=svgEl("g",{},svg);
  svgEl("rect",{x:110,y:90,width:420,height:215,rx:6,fill:"#e9e4d6",opacity:.95},m2);
  const ink=svgEl("polyline",{fill:"none",stroke:"#1d1d24","stroke-width":1.6,"stroke-linejoin":"round",opacity:.9},m2);
  const idl=gear(m2,6,40,28,9), whB=gear(m2,13,80,66,16);
  const armA=svgEl("line",{class:"rod","stroke-width":4},m2), armB=svgEl("line",{class:"rod","stroke-width":4},m2);
  const pinA=svgEl("circle",{r:7,class:"pin"},m2), pinB=svgEl("circle",{r:7,class:"pin"},m2);
  const pen=svgEl("circle",{r:7,fill:RED,stroke:"#121214","stroke-width":2},m2);
  const IDL={x:298,y:440}, WB={x:406,y:440}, L=280;
  let trail=[];

  // --- machine 3: digesting duck ---
  const m3=svgEl("g",{},svg);
  const d3g2=gear(m3,10,62,48,13);
  svgEl("rect",{x:300,y:300,width:290,height:14,rx:4,fill:"#3a3a42"},m3);
  const plate=svgEl("ellipse",{cx:545,cy:298,rx:34,ry:6,fill:"#55534d"},m3);
  const d3rod=svgEl("line",{class:"rod"},m3), d3pin=svgEl("circle",{r:8,class:"pin"},m3);
  const duck=svgEl("g",{},m3);
  svgEl("path",{d:"M380 240 C380 205 420 190 470 198 C505 203 525 222 522 246 C518 272 480 282 430 280 C400 279 380 266 380 240Z",fill:"#e8e2d0"},duck);
  svgEl("line",{x1:430,y1:280,x2:426,y2:300,stroke:"#ff8a1f","stroke-width":5},duck); svgEl("line",{x1:460,y1:280,x2:462,y2:300,stroke:"#ff8a1f","stroke-width":5},duck);
  const neck=svgEl("g",{},duck);
  svgEl("path",{d:"M392 232 C380 210 372 180 372 160",stroke:"#e8e2d0","stroke-width":22,fill:"none","stroke-linecap":"round"},neck);
  svgEl("circle",{cx:368,cy:152,r:24,fill:"#e8e2d0"},neck); svgEl("circle",{cx:360,cy:146,r:4.5,fill:"#121214"},neck);
  svgEl("path",{d:"M348 154 L318 160 L348 166Z",fill:"#ff8a1f"},neck);
  const wing=svgEl("path",{d:"M420 222 C450 200 500 205 520 228 C495 236 450 240 420 222Z",fill:"#cfc7b0",stroke:"#121214","stroke-width":1.5},duck);
  let pellets=[], lastTurn=0;

  // --- shared drive gear + crank handle ---
  const drive=gear(svg,16,100,84,18);
  const crankArm=svgEl("line",{stroke:Y,"stroke-width":6,"stroke-linecap":"round"},svg);
  const crank=svgEl("g",{class:"crank"},svg);
  svgEl("circle",{r:26,fill:"rgba(255,194,14,.18)"},crank); svgEl("circle",{r:15,fill:Y,stroke:"#121214","stroke-width":3},crank);

  const M=[
    {key:"duck",g:m3,name:"Digesting Duck",note:"Vaucanson, 1739: it flapped, ate, and appeared to digest. (The digestion was faked.)",speed:.0013},
    {key:"spin",g:m1,name:"Windmill",note:"Gears multiply speed: one slow turn of the crank spins the sails almost 3 times.",speed:.0009},
    {key:"draw",g:m2,name:"Drawing machine",note:"Inspired by Jaquet-Droz’s Writer (1770s): two turning wheels guide one pen.",speed:.0024},
  ];
  let mi=0, a=0, auto=true, drag=null;
  const btn=$("amAuto"), dots=$("amDots");
  dots.innerHTML=M.map(()=>"<i></i>").join("");
  function show(i){ mi=(i+M.length)%M.length; M.forEach((m,k)=>m.g.style.display=k===mi?"":"none"); $("amName").textContent=`${mi+1} / ${M.length} · ${M[mi].name}`; $("amNote").textContent=M[mi].note;
    [...dots.children].forEach((d,k)=>d.classList.toggle("on",k===mi)); trail=[]; ink.setAttribute("points",""); pellets.forEach(p=>p.el.remove()); pellets=[]; lastTurn=Math.floor(a/(Math.PI*2)); }
  function setAuto(v){ auto=v; btn.textContent=v?"❚❚ Pause":"▶ Auto"; btn.classList.toggle("on",v); }
  $("amPrev").onclick=()=>show(mi-1); $("amNext").onclick=()=>show(mi+1); btn.onclick=()=>setAuto(!auto);
  // drag the crank: turn the drive gear by the change in angle around its center
  const toSvg=e=>{ const p=svg.createSVGPoint(); p.x=e.clientX; p.y=e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  const angAt=e=>{ const p=toSvg(e); return Math.atan2(p.y-D.y,p.x-D.x); };
  const startDrag=e=>{ e.preventDefault(); setAuto(false); drag=angAt(e); svg.setPointerCapture(e.pointerId); };
  crank.addEventListener("pointerdown",startDrag); drive.addEventListener("pointerdown",startDrag); drive.style.cursor="grab";
  svg.addEventListener("pointermove",e=>{ if(drag===null) return; const n=angAt(e); let d=n-drag; if(d>Math.PI) d-=2*Math.PI; if(d<-Math.PI) d+=2*Math.PI; a+=d; drag=n; });
  const end=()=>drag=null; svg.addEventListener("pointerup",end); svg.addEventListener("pointercancel",end);

  function circleX(p1,p2,r){ // upper intersection of two circles of radius r
    const dx=p2.x-p1.x, dy=p2.y-p1.y, d=Math.hypot(dx,dy), h=Math.sqrt(Math.max(0,r*r-d*d/4)), mx=(p1.x+p2.x)/2, my=(p1.y+p2.y)/2;
    return {x:mx+dy/d*h, y:my-dx/d*h};
  }
  function render(){
    place(drive,D.x,D.y,a);
    const hx=D.x+Math.cos(a)*74, hy=D.y+Math.sin(a)*74;
    crankArm.setAttribute("x1",D.x); crankArm.setAttribute("y1",D.y); crankArm.setAttribute("x2",hx); crankArm.setAttribute("y2",hy);
    crank.setAttribute("transform",`translate(${hx} ${hy})`);
    const key=M[mi].key;
    if(key==="spin"){
      const g2=-a*16/6+Math.PI/6; place(w1g2,PIN.x,PIN.y,g2);
      sails.setAttribute("transform",`translate(${HUB.x} ${HUB.y}) rotate(${g2*180/Math.PI})`);
      const off=(-g2*PR)%18; beltA.setAttribute("stroke-dashoffset",off); beltB.setAttribute("stroke-dashoffset",-off);
      w1ratio.textContent=`crank ${(a/(2*Math.PI)).toFixed(1)} turns · sails ${(-g2/(2*Math.PI)+1/12).toFixed(1)}`;
    } else if(key==="draw"){
      const ai=-a*16/6, bi=a*16/13; place(idl,IDL.x,IDL.y,ai); place(whB,WB.x,WB.y,bi);
      const pA={x:D.x+Math.cos(a+Math.PI)*62,y:D.y+Math.sin(a+Math.PI)*62}, pB={x:WB.x+Math.cos(bi)*52,y:WB.y+Math.sin(bi)*52};
      const P=circleX(pA,pB,L);
      [[pinA,pA],[pinB,pB]].forEach(([el,p])=>{ el.setAttribute("cx",p.x); el.setAttribute("cy",p.y); });
      [[armA,pA],[armB,pB]].forEach(([el,p])=>{ el.setAttribute("x1",p.x); el.setAttribute("y1",p.y); el.setAttribute("x2",P.x); el.setAttribute("y2",P.y); });
      pen.setAttribute("cx",P.x); pen.setAttribute("cy",P.y);
      const last=trail[trail.length-1]; if(!last||Math.hypot(last[0]-P.x,last[1]-P.y)>1.2){ trail.push([P.x.toFixed(1),P.y.toFixed(1)]); if(trail.length>6000) trail.splice(0,trail.length-6000); ink.setAttribute("points",trail.join(" ")); }
    } else {
      const g2=-a*16/10+Math.PI/10; place(d3g2,318,440,g2);
      const px=318+Math.cos(g2)*40, py=440+Math.sin(g2)*40; d3pin.setAttribute("cx",px); d3pin.setAttribute("cy",py);
      d3rod.setAttribute("x1",px); d3rod.setAttribute("y1",py); d3rod.setAttribute("x2",452); d3rod.setAttribute("y2",300);
      wing.setAttribute("transform",`rotate(${-12-22*Math.sin(g2)} 425 222)`);
      neck.setAttribute("transform",`translate(0 ${10*Math.sin(2*g2)}) rotate(${6*Math.sin(2*g2)} 392 232)`);
      const turn=Math.floor(a/(Math.PI*2)); if(turn>lastTurn && pellets.length<6){ pellets.push({el:svgEl("circle",{cx:516,cy:258,r:6,fill:"#8a6b45"},m3),y:258,v:0,x:516}); } lastTurn=turn;
    }
  }
  A.automaton={
    enter(){ setAuto(true); show(mi); },
    tick(dt){
      if(auto) a+=dt*M[mi].speed;
      if(M[mi].key==="duck") pellets.forEach(p=>{ if(p.y<292){ p.v+=dt*.002; p.y=Math.min(292,p.y+p.v*dt); p.x+= (545-p.x)*Math.min(1,dt*.004); p.el.setAttribute("cy",p.y); p.el.setAttribute("cx",p.x); } });
      render();
    }
  };
  show(0);
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
document.querySelectorAll(".slide.tl:not(.tl2)").forEach(sl=>{
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
  let flakes=[], winter=0, pile=null, cap=null;
  // the winter slide gets a second step: the timeline fades, the snow thickens and piles up
  if(snow){ cap=document.createElement("div"); cap.className="winterCap"; cap.innerHTML=`<div class="wt">The first AI Winter</div><div class="ws">1970s · unmet expectations, reduced funding</div>`; sl.appendChild(cap); }
  const flake=()=>({x:rnd(0,1600),y:rnd(-900,0),r:rnd(1,3.2),v:rnd(.4,1.3),s:rnd(0,6)});
  function setWinter(v){ winter=v; sl.classList.toggle("winterOnly",!!v);
    if(v) while(flakes.length<520) flakes.push(flake()); else flakes.length=Math.min(flakes.length,160); }
  A[sl.dataset.id]={
    enter(dir){ fill.style.transition="none"; fill.style.width=prev+"%"; void fill.offsetWidth; fill.style.transition=""; fill.style.width=xp(k)+"%";
      if(snow){ flakes=Array.from({length:160},()=>({...flake(),y:rnd(-900,900)})); pile=new Float32Array(161); setWinter(dir<0?1:0); } },
    step(){ if(!snow||winter) return false; setWinter(1); return true; },
    back(){ if(!snow||!winter) return false; setWinter(0); return true; },
    tick(dt,now){ if(!snow) return; const x=ctxOf(snow), f=dt/16.7; x.clearRect(0,0,1600,900);
      for(const p of flakes){ p.y+=p.v*f*(winter?1.25:1); p.x+=Math.sin(now*.001+p.s)*.4*f;
        const col=Math.max(0,Math.min(160,Math.round(p.x/10))), ground=900-(winter?pile[col]:0);
        if(p.y>ground){ if(winter&&pile[col]<130){ for(let d=-3;d<=3;d++){ const c=col+d; if(c>=0&&c<=160) pile[c]+=p.r*(d?0.9:2.2)*(1-Math.abs(d)*.15); } } p.y=-10; p.x=rnd(0,1600); }
        x.fillStyle=`rgba(200,225,255,${.35+p.r*.15})`; x.beginPath(); x.arc(p.x,p.y,p.r,0,7); x.fill(); }
      if(winter){ for(let c=0;c<=160;c++){ const shape=.75+.25*Math.sin(c*.11)+.15*Math.sin(c*.37+1); if(pile[c]<130*shape) pile[c]+=dt*.009*shape; }   // drift builds up over ~12 s
        x.fillStyle="rgba(225,238,255,.88)"; x.beginPath(); x.moveTo(0,900);
        for(let c=0;c<=160;c++) x.lineTo(c*10,900-pile[c]); x.lineTo(1600,900); x.closePath(); x.fill(); } }
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
  // 4 layers (2-3-3-2). a pulse adds to the target's charge; enough charge arriving close together makes it fire,
  // which sends pulses on to the next layer. charge leaks away slowly, and a neuron rests briefly after firing.
  const cv=$("neuro"); let W,H,N=[],E=[],P=[],stim=0, last=0;
  const LEAK=.00028, REST=450, TRAVEL=[750,1050];
  function build(){
    W=cv.offsetWidth; H=cv.offsetHeight; N=[]; E=[]; P=[]; cv._fires=[0,0,0,0];
    const sizes=[2,3,3,2];
    sizes.forEach((rows,c)=>{ for(let r=0;r<rows;r++){
      const n={x:W*(.13+c*.25)+rnd(-20,20), y:H*((r+1)/(rows+1))+rnd(-30,30), v:0, g:0, col:c, den:[], rest:0, ins:0};
      for(let d=0;d<6;d++){ const a=rnd(0,Math.PI*2); let px=n.x, py=n.y; const seg=[]; for(let k=0;k<4;k++){ px+=Math.cos(a+rnd(-.5,.5))*rnd(10,16); py+=Math.sin(a+rnd(-.5,.5))*rnd(10,16); seg.push([px,py]); } n.den.push(seg); }
      N.push(n); } });
    const link=(a,b)=>{ if(!E.some(e=>e.a===a&&e.b===b)){ E.push({a,b,cx:(a.x+b.x)/2+rnd(-40,40),cy:(a.y+b.y)/2+rnd(-60,60),ms:rnd(...TRAVEL)}); b.ins++; } };
    for(let c=0;c<3;c++){
      const A_=N.filter(n=>n.col===c), B_=N.filter(n=>n.col===c+1);
      A_.forEach(a=>B_.forEach(b=>{ if(Math.random()<.7) link(a,b); }));
      B_.forEach(b=>{ while(b.ins<2) link(pick(A_),b); });                    // every neuron listens to at least 2
      A_.forEach(a=>{ if(!E.some(e=>e.a===a)) link(a,pick(B_)); });           // and talks to at least 1
    }
    E.forEach(e=>e.w=1.35/e.b.ins);                                           // ~3/4 of a neuron's inputs make it fire
  }
  const bez=(e,t)=>{ const u=1-t; return [u*u*e.a.x+2*u*t*e.cx+t*t*e.b.x, u*u*e.a.y+2*u*t*e.cy+t*t*e.b.y]; };
  function fire(n){ n.g=1; n.v=0; n.rest=REST; cv._fires[n.col]++; E.filter(e=>e.a===n).forEach(e=>P.push({e,t:0})); }
  A.neurons={
    enter(){ build(); stim=300; last=-1; },
    tick(dt){
      const x=ctxOf(cv); x.fillStyle="#0d0d0f"; x.fillRect(0,0,W,H);
      // the inputs: both input neurons usually fire close together, sometimes only one does
      stim-=dt; if(stim<=0){ stim=rnd(1400,2300); const ins=N.filter(n=>n.col===0); const first=pick(ins); fire(first);
        if(Math.random()<.8){ const other=ins.find(n=>n!==first); setTimeout(()=>{ if(other) fire(other); },rnd(80,350)); } }
      for(const e of E){ x.strokeStyle="rgba(106,184,255,.22)"; x.lineWidth=2.5; x.beginPath(); x.moveTo(e.a.x,e.a.y); x.quadraticCurveTo(e.cx,e.cy,e.b.x,e.b.y); x.stroke(); }
      const arrived=[];   // fire after the sweep, so new pulses aren't dropped by the filter
      P=P.filter(p=>{ p.t+=dt/p.e.ms; if(p.t>=1){ const b=p.e.b; if(b.rest<=0){ b.v+=p.e.w; if(b.v>=1&&!arrived.includes(b)) arrived.push(b); } return false; }
        for(let k=0;k<6;k++){ const [px,py]=bez(p.e,Math.max(0,p.t-k*.025)); x.fillStyle=`rgba(255,194,14,${1-k/6})`; x.beginPath(); x.arc(px,py,4.5-k*.5,0,7); x.fill(); }
        return true; });
      arrived.forEach(fire);
      for(const n of N){
        n.v=Math.max(0,n.v-dt*LEAK); n.g*=.93; n.rest-=dt;
        x.strokeStyle=`rgba(243,241,234,${.25+n.g*.5})`; x.lineWidth=2;
        n.den.forEach(seg=>{ x.beginPath(); x.moveTo(n.x,n.y); seg.forEach(([a,b])=>x.lineTo(a,b)); x.stroke(); });
        if(n.g>.05){ const rg=x.createRadialGradient(n.x,n.y,0,n.x,n.y,50); rg.addColorStop(0,`rgba(255,194,14,${n.g*.7})`); rg.addColorStop(1,"rgba(255,194,14,0)"); x.fillStyle=rg; x.beginPath(); x.arc(n.x,n.y,50,0,7); x.fill(); }
        x.fillStyle=n.g>.3?Y:"#3a3a44"; x.beginPath(); x.arc(n.x,n.y,15,0,7); x.fill();
        x.strokeStyle=Y; x.lineWidth=3; x.beginPath(); x.arc(n.x,n.y,20,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,n.v)); x.stroke();
      }
    }
  };
})();

/* ---------- perceptron: a guided playground ---------- */
(() => {
  const T=0.75, MIN=-1, MAX=2;                                   // threshold and the sum bar's range
  const IN=[{n:"It’s sunny"},{n:"Friends are going"},{n:"I have to study"}];
  const START=[.2,.2,.2];
  const w=[...START], x=[1,1,0];
  // guided steps: each sets up a situation, gives a tip, and checks itself
  const out=xs=>xs.reduce((a,v,i)=>a+v*w[i],0)>=T-1e-9;
  const STEPS=[
    {goal:"It’s sunny and your friends are going. Make the neuron say GO.",
     tip:"Drag the weights for <b>sunny</b> and <b>friends</b> to the right until the bar crosses the <b>0.75</b> line.",
     setup:[1,1,0], done:()=>out([1,1,0])},
    {goal:"Now you also have to study. Make it say STAY.",
     tip:"Studying should push <i>against</i> going: drag the <b>study</b> weight to the left, below zero. Negative weights subtract.",
     setup:[1,1,1], done:()=>!out([1,1,1])},
    {goal:"Check your neuron: GO when you’re free, STAY when you have to study.",
     tip:"Click <b>I have to study</b> on and off. If it’s wrong either way, adjust the weights. The neuron has to get <b>both</b> right with the same weights.",
     setup:null, done:()=>seen.size===2&&out([1,1,0])&&!out([1,1,1])},
  ];
  let step=0, finished=false, seen=new Set();   // step 3: which study values the student has tried
  const rowsBox=$("ptRows"), goal=$("ptGoal");
  const rows=IN.map((inp,i)=>{
    const r=document.createElement("div"); r.className="prow card";
    r.innerHTML=`<span class="nm">${inp.n}</span><span class="x"></span><input type="range" min="-1" max="1" step="0.05" aria-label="weight for ${inp.n}"><span class="w"></span>`;
    const xb=r.querySelector(".x"), sl=r.querySelector("input");
    xb.onclick=()=>{ x[i]^=1; if(i===2) seen.add(x[2]); upd(); }; sl.value=w[i]; sl.oninput=()=>{ w[i]=+sl.value; upd(); };
    rowsBox.appendChild(r); return {r,xb,sl,wv:r.querySelector(".w")};
  });
  const pct=v=>(Math.max(MIN,Math.min(MAX,v))-MIN)/(MAX-MIN)*100;
  $("ptLine").style.left=pct(T)+"%";
  const f=v=>(v<0?"−":"+")+Math.abs(v).toFixed(2);
  function setup(i){ step=i; finished=false; seen=new Set([x[2]]); const s=STEPS[i].setup; if(s){ s.forEach((v,k)=>x[k]=v); rows.forEach((o,k)=>{ o.r.classList.remove("flash"); void o.r.offsetWidth; if(s[k]) o.r.classList.add("flash"); }); } upd(); }
  function renderGoal(){
    const st=STEPS[step], ok=st.done(), last=step===STEPS.length-1;
    const dots=STEPS.map((_,k)=>`<i class="${k<step||(k===step&&ok)?"done":k===step?"on":""}"></i>`).join("");
    goal.classList.toggle("win",ok);
    let status;
    if(!ok) status=`<span class="tag t-y">Not yet</span>`;
    else if(!last) status=`<span class="tag t-green">✓ Done!</span><button class="btn on" id="ptNextStep">Next step →</button>`;
    else status=`<span class="tag t-green">✓ You trained a neuron!</span><span class="muted" style="font-size:16px">Real training adjusts weights like this automatically, thousands of times.</span>`;
    goal.innerHTML=`<div class="gh"><span>YOUR GOAL · STEP ${step+1} OF ${STEPS.length}</span><span class="dots">${dots}</span></div><div class="gt">${st.goal}</div><div class="tip">💡 ${st.tip}</div><div class="gs">${status}${step>0||ok&&last?`<button class="btn" id="ptRestart" style="margin-left:auto">Start over</button>`:""}</div>`;
    const n=$("ptNextStep"); if(n) n.onclick=()=>setup(step+1);
    const r=$("ptRestart"); if(r) r.onclick=()=>{ START.forEach((v,k)=>{ w[k]=v; rows[k].sl.value=v; }); setup(0); };
  }
  function upd(){
    let s=0;
    rows.forEach((o,i)=>{ s+=x[i]*w[i]; o.xb.textContent=x[i]?"yes":"no"; o.xb.classList.toggle("on",!!x[i]); o.wv.textContent="w "+f(w[i]); o.wv.classList.toggle("neg",w[i]<0); });
    const go=s>=T-1e-9, z=pct(0), p=pct(s), fill=$("ptFill");
    fill.style.left=Math.min(z,p)+"%"; fill.style.width=Math.abs(p-z)+"%"; fill.classList.toggle("go",go);
    $("ptSum").textContent=(s<0?"−":"")+Math.abs(s).toFixed(2);
    const res=$("ptRes"); res.textContent=go?"GO":"STAY"; res.classList.toggle("on",go); res.classList.toggle("stay",!go);
    renderGoal();
  }
  A.perceptron={ enter(){ upd(); } };
  setup(0);
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

/* ---------- cold, flu, or allergies: a tiny MYCIN-style expert system ---------- */
(() => {
  const card=$("sickCard"), trail=$("sickTrail");
  // knowledge base: each answer adds evidence for (+) or against (−) each condition
  const Q=[
    {k:"fever",      q:"Do you have a fever?",               hint:"A temperature above normal",
     yes:{flu:3.5,cold:0,allergies:-4},  no:{flu:-1.5,cold:.5,allergies:.5}},
    {k:"body_aches", q:"Does your body ache?",               hint:"Sore muscles, achy all over",
     yes:{flu:2,cold:.5,allergies:-1},   no:{flu:-1,cold:0,allergies:.5}},
    {k:"itchy_eyes", q:"Are your eyes itchy or watery?",      hint:"",
     yes:{allergies:3,cold:-.5,flu:-1},  no:{allergies:-1.5,cold:.5,flu:0}},
    {k:"sudden",     q:"Did it come on suddenly?",            hint:"Fine one hour, sick the next",
     yes:{flu:2,allergies:.5,cold:-1},   no:{cold:1,flu:-1.5,allergies:0}},
    {k:"sneezing",   q:"Are you sneezing a lot?",             hint:"",
     yes:{cold:1.5,allergies:1.5,flu:-.5}, no:{flu:.5,cold:-.5,allergies:-1}},
  ];
  const NAMES={cold:"Cold",flu:"Flu",allergies:"Allergies"};
  let ans=[];
  const dots=()=>`<span class="qdots">${Q.map((_,i)=>`<i class="${i<ans.length?"done":i===ans.length?"on":""}"></i>`).join("")}</span>`;
  function diagnose(){
    const sc={cold:0,flu:0,allergies:0};
    ans.forEach((v,i)=>{ const ev=Q[i][v?"yes":"no"]; for(const c in ev) sc[c]+=ev[c]; });
    const ex=Object.fromEntries(Object.entries(sc).map(([c,v])=>[c,Math.exp(v*.45)])), tot=Object.values(ex).reduce((a,b)=>a+b,0);
    const conf=Object.entries(ex).map(([c,v])=>[c,v/tot]).sort((p,q)=>q[1]-p[1]);
    const none=ans.every(v=>!v);
    return {conf,none};
  }
  function render(){
    // the rule trail on the left
    let t=ans.map((v,i)=>`<div>${i?"AND":"IF&nbsp;"} ${Q[i].k} = <b>${v?"YES":"NO"}</b></div>`).join("");
    if(ans.length===Q.length){
      const {conf,none}=diagnose(), [top,p]=conf[0];
      t+= none?`<div>THEN <b>none of these</b></div>`:`<div>THEN <b>${NAMES[top].toUpperCase()}</b> (confidence ${p.toFixed(2)})</div>`;
      trail.innerHTML=t;
      card.innerHTML=`<div class="qn"><div class="eyebrow">Diagnosis</div>${dots()}</div>`+
        (none?`<div class="ans flip">Probably none of these. Maybe you’re just tired!</div>`:`<div class="ans flip">Most likely: ${NAMES[top]}</div>`)+
        `<div class="dx">${conf.map(([c,v],i)=>`<div class="row ${i===0&&!none?"top":""}"><span>${NAMES[c]}</span><span class="bar"><i data-w="${(v*100).toFixed(0)}"></i></span><span>${(v*100).toFixed(0)}%</span></div>`).join("")}</div>`+
        `<button class="btn" id="sickRe">Start over ↺</button>`;
      requestAnimationFrame(()=>requestAnimationFrame(()=>card.querySelectorAll(".bar i").forEach(i=>i.style.width=i.dataset.w+"%")));
      $("sickRe").onclick=()=>{ ans=[]; render(); };
      return;
    }
    trail.innerHTML=t||`<div class="muted">rules will appear here as you answer…</div>`;
    const q=Q[ans.length];
    card.innerHTML=`<div class="qn"><div class="eyebrow">Question ${ans.length+1} of ${Q.length}</div>${dots()}</div><div class="qq flip">${q.q}</div>${q.hint?`<div class="qhint">${q.hint}</div>`:""}<div class="yesno"><button class="btn b-yes">YES</button><button class="btn b-no">NO</button></div>`;
    card.querySelector(".b-yes").onclick=()=>{ ans.push(1); render(); };
    card.querySelector(".b-no").onclick=()=>{ ans.push(0); render(); };
  }
  A.sick={ enter(){ ans=[]; render(); } };
})();

/* ---------- the trouble with rules ---------- */
(() => {
  // one rule about birds, then exceptions pile up until two rules contradict each other
  const CASES=[
    {q:"a penguin", note:"Penguins are birds, but they can’t fly.", add:["penguin"]},
    {q:"an ostrich", note:"Also a bird. Also can’t fly. Neither can emus or kiwis.", add:["ostrich","emu","kiwi"]},
    {q:"a bird with a broken wing", note:"Normally it flies. Just not today.", add:["injured"]},
    {q:"a baby bird", note:"Chicks can’t fly yet.", add:["too_young"]},
    {q:"a bird in a cage", note:"It can fly, but it can’t go anywhere. Our rule needs a special case.", rule:["bird","in_cage","can_fly_but_stays_put"]},
    {q:"a bat", note:"Not a bird at all, but it flies. Our rules never even covered it.", rule:["bat",null,"can_fly"]},
    {q:"a penguin on an airplane", note:"Rule 1 says it can’t fly. But it’s flying at 35,000 feet. Now the rules contradict each other.", clash:true},
  ];
  let step=0, fixed=false, nots=[], extra=[], fresh=null;
  const kb=$("rtKb"), box=$("rtCase"), idea=$("rtIdea");
  const K=w=>`<span class="kw">${w}</span>`;
  function bump(id,v){ const el=$(id); if(el.textContent!==String(v)){ el.textContent=v; el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); } }
  function render(){
    const conds=["bird",...nots.map(n=>"NOT "+n)];
    const base=`${K("IF")} bird${nots.map(n=>` ${K("AND")} <span class="${fresh&&fresh.includes(n)?"new":""}">NOT ${n}</span>`).join("")} ${K("THEN")} <span class="th">can_fly</span>`;
    const clash=step>=CASES.length-1&&fixed;
    let html=`<div class="r ${clash?"clash":""}">${base}</div>`;
    html+=extra.map((r,i)=>`<div class="r ${fresh==="rule"&&i===extra.length-1?"newr":""}">${K("IF")} ${r[0]}${r[1]?` ${K("AND")} ${r[1]}`:""} ${K("THEN")} <span class="th">${r[2]}</span></div>`).join("");
    if(clash) html+=`<div class="r clash newr">${K("IF")} in_airplane ${K("THEN")} <span class="th">is_flying</span> <span style="color:var(--red)">⚠ conflicts with rule 1</span></div>`;
    kb.innerHTML=html;
    bump("rtRules",1+extra.length+(clash?1:0));
    bump("rtConds",conds.length+extra.reduce((a,r)=>a+(r[1]?2:1),0)+(clash?1:0));
    bump("rtFixes",step+(fixed?1:0));
    idea.classList.toggle("on",clash);
    if(step===0&&!fixed&&!box.dataset.started){
      box.innerHTML=`<div class="q">Seems reasonable.</div><div class="note">Birds fly. Done! Is one rule enough?</div><div class="acts"><button class="btn on" id="rtAsk">But what about…?</button></div>`;
    } else if(!fixed){
      const c=CASES[step];
      box.innerHTML=`<div class="eyebrow" style="font-size:14px">Exception ${step+1} of ${CASES.length}</div><div class="q flip">But what about <span>${c.q}</span>?</div><div class="note">${c.note}</div><div class="acts"><button class="btn on" id="rtFix">${c.clash?"Try to fix it…":"Fix the rules"}</button></div>`;
    } else if(step<CASES.length-1){
      box.innerHTML=`<div class="q">Patched.</div><div class="note">The rule works again… for now.</div><div class="acts"><button class="btn on" id="rtAsk">But what about…?</button></div>`;
    } else {
      box.innerHTML=`<div class="q" style="color:var(--red)">There’s no clean fix.</div><div class="note">Every patch makes the rules longer, and some situations just contradict each other. Real experts handle this with common sense, which is very hard to write down.</div><div class="acts"><button class="btn" id="rtRe">Start over ↺</button></div>`;
    }
    const ask=$("rtAsk"); if(ask) ask.onclick=()=>{ box.dataset.started=1; if(fixed){ step++; fixed=false; } fresh=null; render(); };
    const fix=$("rtFix"); if(fix) fix.onclick=()=>{ const c=CASES[step]; fixed=true;
      if(c.add){ nots.push(...c.add); fresh=c.add; } else if(c.rule){ extra.push(c.rule); fresh="rule"; } else fresh=null; render(); };
    const re=$("rtRe"); if(re) re.onclick=reset;
  }
  function reset(){ step=0; fixed=false; nots=[]; extra=[]; fresh=null; delete box.dataset.started; render(); }
  A["rules-trouble"]={ enter(){ if(!box.dataset.started) reset(); } };
  reset();
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

/* ---------- minimax: practice it by hand ---------- */
(() => {
  const svg=$("mmSvg"), msg=$("mmMsg");
  const ROOT={x:380,y:70}, MINS=[0,1,2].map(i=>({x:140+i*240,y:200})), LEAF_Y=330;
  let vals, mins, best, stage, done;
  // deal a tree whose biggest number is a trap: it sits in a branch the opponent would answer badly
  function deal(){
    for(;;){
      vals=Array.from({length:9},()=>1+Math.floor(Math.random()*9));
      mins=[0,1,2].map(g=>Math.min(...vals.slice(g*3,g*3+3)));
      const top=Math.max(...mins); best=mins.indexOf(top);
      const bigLeaf=vals.indexOf(Math.max(...vals)), trapGroup=Math.floor(bigLeaf/3);
      if(mins.filter(m=>m===top).length===1 && trapGroup!==best && Math.max(...vals)-mins[trapGroup]>=4 && vals.filter(v=>v===Math.max(...vals)).length===1) break;
    }
    stage="min"; done=[null,null,null]; draw(); say();
  }
  function tri(x,y,up,cls){ const r=34; return up?`M${x} ${y-r} L${x+r*1.05} ${y+r*.7} L${x-r*1.05} ${y+r*.7}Z`:`M${x} ${y+r} L${x+r*1.05} ${y-r*.7} L${x-r*1.05} ${y-r*.7}Z`; }
  function draw(){
    const L=i=>({x:MINS[Math.floor(i/3)].x+(i%3-1)*72,y:LEAF_Y});
    let s=`<text x="20" y="${ROOT.y+6}" fill="${Y}" font-family="JetBrains Mono, Consolas, monospace" font-size="15">MAX · you</text>
           <text x="20" y="${MINS[0].y-46}" fill="${BLUE}" font-family="JetBrains Mono, Consolas, monospace" font-size="15">MIN · opponent</text>`;
    MINS.forEach((m,g)=>{ const on=stage==="done"&&g===best; s+=`<line x1="${ROOT.x}" y1="${ROOT.y+24}" x2="${m.x}" y2="${m.y-24}" stroke="${on?Y:"#2e2e35"}" stroke-width="${on?5:2}"/>`; });
    vals.forEach((v,i)=>{ const g=Math.floor(i/3), p=L(i), on=done[g]===i; s+=`<line x1="${MINS[g].x}" y1="${MINS[g].y+24}" x2="${p.x}" y2="${p.y-24}" stroke="${on?BLUE:"#2e2e35"}" stroke-width="${on?4:2}"/>`; });
    s+=`<g><path d="${tri(ROOT.x,ROOT.y,true)}" fill="${stage==="done"?Y:"#1c1c20"}" stroke="${Y}" stroke-width="2.5"/>${stage==="done"?`<text x="${ROOT.x}" y="${ROOT.y+12}" text-anchor="middle" font-family="JetBrains Mono, Consolas, monospace" font-weight="700" font-size="20" fill="#121214">${mins[best]}</text>`:""}</g>`;
    MINS.forEach((m,g)=>{ const filled=done[g]!==null; s+=`<g class="mnode ${stage==="max"?"pick":""}" data-g="${g}"><path d="${tri(m.x,m.y,false)}" fill="${filled?BLUE:"#1c1c20"}" stroke="${BLUE}" stroke-width="2.5"/>${filled?`<text x="${m.x}" y="${m.y+4}" text-anchor="middle" font-family="JetBrains Mono, Consolas, monospace" font-weight="700" font-size="20" fill="#121214">${mins[g]}</text>`:""}</g>`; });
    vals.forEach((v,i)=>{ const p=L(i), g=Math.floor(i/3), on=done[g]===i;
      s+=`<g class="leaf" data-i="${i}"><rect x="${p.x-24}" y="${p.y-24}" width="48" height="48" rx="9" fill="${on?"rgba(106,184,255,.25)":"#24242a"}" stroke="${on?BLUE:MUTE}" stroke-width="2"/><text x="${p.x}" y="${p.y+8}" text-anchor="middle" font-family="JetBrains Mono, Consolas, monospace" font-weight="600" font-size="21" fill="${INK}">${v}</text></g>`; });
    svg.innerHTML=s;
    svg.querySelectorAll(".leaf").forEach(el=>el.onclick=()=>pickLeaf(+el.dataset.i,el));
    svg.querySelectorAll(".mnode").forEach(el=>el.onclick=()=>pickMove(+el.dataset.g,el));
  }
  function say(fb="",cls=""){
    const left=done.filter(d=>d===null).length;
    const st= stage==="min"?`STEP 1 · THEIR REPLY`: stage==="max"?`STEP 2 · YOUR MOVE`:`SOLVED`;
    const tx= stage==="min"?`Your opponent always picks the <b>lowest</b> score. Click the lowest number in each group. (${3-left} of 3)`
            : stage==="max"?`Which move should you make? Click the blue triangle with the <b>highest</b> guaranteed score.`
            : `That’s minimax: assume the opponent’s best reply, then pick the move with the best worst case.`;
    msg.innerHTML=`<div class="st">${st}</div><div class="tx">${tx}</div><div class="fb ${cls}">${fb}</div>`+(stage==="done"?`<button class="btn on" id="mmNew">New tree ↻</button>`:"");
    const n=$("mmNew"); if(n) n.onclick=deal;
  }
  function shake(el){ el.classList.remove("shake"); void el.getBBox(); el.classList.add("shake"); }
  function pickLeaf(i,el){
    if(stage!=="min") return; const g=Math.floor(i/3); if(done[g]!==null) return;
    if(vals[i]!==mins[g]){ shake(el); say(`Not quite. Your opponent wants the <b>lowest</b> score in that group.`,"bad"); return; }
    done[g]=i;
    if(done.every(d=>d!==null)) stage="max";
    draw(); say(stage==="max"?`✓ Now you know what your opponent will do in each case.`:`✓ They’d answer with ${mins[g]}.`,"good");
  }
  function pickMove(g,el){
    if(stage!=="max") return;
    if(g===best){ stage="done"; draw(); say(`✓ Best move! Even with their best reply, you’re guaranteed <b>${mins[g]}</b>.`,"good"); return; }
    shake(el);
    const grp=vals.slice(g*3,g*3+3), big=Math.max(...vals);
    if(grp.includes(big)) say(`Tempting! That branch has a ${big}, but your opponent would answer with <b>${mins[g]}</b>. Try again.`,"bad");
    else say(`That only guarantees ${mins[g]}. Is there a higher one?`,"bad");
  }
  A.minimax={ enter(){ if(!vals||stage==="done") deal(); } };
  deal();
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

}

/* ================= the deep learning era ================= */
{
/* ---------- timeline ---------- */
const EVENTS=[
  ["1986","Rumelhart, Hinton & Williams publish backpropagation, a breakthrough for training neural networks."],
  ["1997","IBM’s Deep Blue defeats world chess champion Garry Kasparov."],
  ["2002","iRobot introduces Roomba, the first mass-produced home robot vacuum that navigates on its own."],
  ["2012","AlexNet (Krizhevsky, Sutskever & Hinton) wins the ImageNet challenge by a huge margin. Deep learning takes off."],
  ["2016","DeepMind’s AlphaGo beats Go champion Lee Sedol 4–1, using deep learning and reinforcement learning."],
  ["2017","Google researchers publish “Attention Is All You Need”, introducing the Transformer."],
  ["2022","OpenAI releases ChatGPT (GPT-3.5) to the public on November 30."],
];
document.querySelectorAll(".slide.tl2").forEach(sl=>{
  const k=+sl.dataset.upto, n=EVENTS.length, xp=i=>(i+.5)/n*100;
  const hd=document.createElement("div");
  hd.innerHTML=`<h2 class="rise" style="--i:0"><span class="n">TIMELINE</span>The road to AI</h2>`;
  sl.appendChild(hd);
  const wrap=document.createElement("div"); wrap.className="tlwrap";
  wrap.innerHTML=`<div class="tlaxis"></div><div class="tlfill"></div><div class="tlarrow"></div>`;
  EVENTS.forEach(([yr,tx],i)=>{
    const e=document.createElement("div");
    e.className="ev "+(i%2?"dn":"up")+" "+(i<k?"done":i===k?"now new":"future");
    e.style.left=xp(i)+"%"; e.style.top="0"; e.style.height="100%";
    e.innerHTML=`<div class="stem"></div><div class="dot"></div><div class="box"><div class="yr">${yr}</div><div class="tx">${tx}</div></div>`;
    wrap.appendChild(e);
  });
  sl.appendChild(wrap);
  const fill=wrap.querySelector(".tlfill"), prev=k>0?xp(k-1):0;
  A[sl.dataset.id]={ enter(){ fill.style.transition="none"; fill.style.width=prev+"%"; void fill.offsetWidth; fill.style.transition=""; fill.style.width=xp(k)+"%"; } };
});

/* ---------- roomba: bump-and-turn vs map-and-plan ---------- */
(() => {
  const cv=$("rmCv"), cap=$("rmCap"), R=17, G=8;   // robot radius, coverage cell size
  let W=0,H=0, obs=[], cov=null, cols=0, rows=0, free=0, done=0, bot=null, mode="bounce", speed=1, trail=[];
  const furniture=()=>{ // x,y,w,h as fractions of the room (room starts below the buttons)
    const T=70, rw=W-40, rh=H-T-60;
    const f=(x,y,w,h,label)=>({x:20+x*rw,y:T+y*rh,w:w*rw,h:h*rh,label});
    return [f(0,0,.42,.16,"couch"),f(.36,.42,.26,.22,"table"),f(.8,0,.2,.3,"bookshelf"),f(.04,.78,.14,.22,"plant"),f(.74,.74,.18,.1,"dog bed")];
  };
  function room(){ return {x:20,y:70,w:W-40,h:H-130}; }
  function hits(x,y,r=R){
    const rm=room();
    if(x-r<rm.x||x+r>rm.x+rm.w||y-r<rm.y||y+r>rm.y+rm.h) return true;
    for(const o of obs){ const cx=clamp(x,o.x,o.x+o.w), cy=clamp(y,o.y,o.y+o.h); if((x-cx)**2+(y-cy)**2<r*r) return true; }
    return false;
  }
  function reset(){
    fitCanvas(cv); W=cv.offsetWidth; H=cv.offsetHeight;
    obs=furniture(); cols=Math.ceil(W/G); rows=Math.ceil(H/G); cov=new Uint8Array(cols*rows);
    free=0; done=0;
    for(let j=0;j<rows;j++) for(let i=0;i<cols;i++){ const x=i*G+G/2, y=j*G+G/2; if(hits(x,y,1)) cov[j*cols+i]=2; else free++; }
    bot={x:room().x+room().w*.5, y:room().y+room().h-40, a:-Math.PI/2, st:"spiral", t:0, sp:0, path:[], plan:null};
    while(hits(bot.x,bot.y)) bot.x+=10;
    trail=[]; planGrid=null;
  }
  function paint(x,y){
    const r=R-2;
    for(let j=Math.max(0,((y-r)/G)|0);j<=Math.min(rows-1,((y+r)/G)|0);j++) for(let i=Math.max(0,((x-r)/G)|0);i<=Math.min(cols-1,((x+r)/G)|0);i++){
      const k=j*cols+i; if(cov[k]===0&&((i*G+G/2-x)**2+(j*G+G/2-y)**2)<r*r){ cov[k]=1; done++; } }
  }
  // map & plan: a coarse grid of robot-sized cells, visit the nearest unvisited one with a breadth-first search
  const C=2*R-6; let planGrid=null, pc=0, pr=0;
  function buildPlan(){
    pc=Math.floor((W-40)/C); pr=Math.floor((H-130)/C); planGrid=[];
    for(let j=0;j<pr;j++) for(let i=0;i<pc;i++){ const x=20+i*C+C/2, y=70+j*C+C/2; planGrid.push({x,y,ok:!hits(x,y,R-4),seen:false}); }
  }
  function nearestPath(){
    const start=planGrid.reduce((b,c,k)=>c.ok&&(b<0||Math.hypot(c.x-bot.x,c.y-bot.y)<Math.hypot(planGrid[b].x-bot.x,planGrid[b].y-bot.y))?k:b,-1);
    if(start<0) return null;
    const prev=new Int32Array(planGrid.length).fill(-2); prev[start]=-1; const q=[start];
    // prefer moving up/down first so the result looks like neat lawnmower rows
    const dirs=[[0,-1],[0,1],[-1,0],[1,0]];
    while(q.length){ const k=q.shift(); const c=planGrid[k];
      if(!c.seen&&k!==start){ const p=[]; for(let t=k;t>=0;t=prev[t]) p.unshift(planGrid[t]); return p; }
      const i=k%pc, j=(k/pc)|0;
      for(const [di,dj] of dirs){ const ni=i+di, nj=j+dj; if(ni<0||nj<0||ni>=pc||nj>=pr) continue; const nk=nj*pc+ni; if(prev[nk]!==-2||!planGrid[nk].ok) continue; prev[nk]=k; q.push(nk); } }
    return null;
  }
  function stepBot(dt){
    const v=.11*dt;   // px per ms
    if(mode==="map"){
      if(!planGrid) buildPlan();
      planGrid.forEach(c=>{ if(Math.hypot(c.x-bot.x,c.y-bot.y)<C*.5) c.seen=true; });
      if(!bot.path.length){ const p=nearestPath(); if(!p) return; bot.path=p.slice(1); }
      const t=bot.path[0]; if(!t) return; const dx=t.x-bot.x, dy=t.y-bot.y, d=Math.hypot(dx,dy);
      bot.a=Math.atan2(dy,dx);
      if(d<=v){ bot.x=t.x; bot.y=t.y; t.seen=true; bot.path.shift(); } else { bot.x+=dx/d*v; bot.y+=dy/d*v; }
      return;
    }
    bot.t+=dt;
    if(bot.st==="spiral"){ bot.sp+=dt; bot.a+=dt*.0042/(1+bot.sp/900); if(bot.sp>9000) bot.st="go"; }
    const nx=bot.x+Math.cos(bot.a)*v, ny=bot.y+Math.sin(bot.a)*v;
    if(hits(nx,ny)){ bot.st="go"; bot.bump=1; let tries=0; do{ bot.a+=rnd(Math.PI*.55,Math.PI*1.45); tries++; } while(hits(bot.x+Math.cos(bot.a)*v*2,bot.y+Math.sin(bot.a)*v*2)&&tries<20); }
    else { bot.x=nx; bot.y=ny; if(bot.st==="go"&&Math.random()<dt/26000){ bot.st="spiral"; bot.sp=0; } }
  }
  function draw(){
    const x=ctxOf(cv), rm=room();
    x.fillStyle="#0d0d0f"; x.fillRect(0,0,W,H);
    x.fillStyle="#1a1916"; x.fillRect(rm.x,rm.y,rm.w,rm.h);
    for(let j=0;j<rows;j++) for(let i=0;i<cols;i++) if(cov[j*cols+i]===1){ x.fillStyle="rgba(255,194,14,.2)"; x.fillRect(i*G,j*G,G,G); }
    x.strokeStyle="#3a3a42"; x.lineWidth=2; x.strokeRect(rm.x,rm.y,rm.w,rm.h);
    for(const o of obs){ x.fillStyle=o.sock?"#c94f8a":"#2c2c33"; x.strokeStyle=o.sock?"#ff7ab8":"#45454f"; x.lineWidth=1.5;
      x.beginPath(); x.roundRect?x.roundRect(o.x,o.y,o.w,o.h,o.sock?6:8):x.rect(o.x,o.y,o.w,o.h); x.fill(); x.stroke();
      if(o.label){ x.fillStyle=MUTE; x.font=`15px ${MONO}`; x.textAlign="center"; x.textBaseline="middle"; x.fillText(o.label,o.x+o.w/2,o.y+o.h/2); } }
    if(mode==="map"&&planGrid){ for(const c of bot.path){ x.fillStyle="rgba(106,184,255,.5)"; x.beginPath(); x.arc(c.x,c.y,2.5,0,7); x.fill(); } }
    // robot
    x.save(); x.translate(bot.x,bot.y); x.rotate(bot.a);
    x.fillStyle="#bdbab3"; x.beginPath(); x.arc(0,0,R,0,7); x.fill();
    x.fillStyle="#3b3b40"; x.beginPath(); x.arc(0,0,R-5,0,7); x.fill();
    x.strokeStyle=bot.bump>0?RED:Y; x.lineWidth=4; x.beginPath(); x.arc(0,0,R-1,-1.1,1.1); x.stroke();
    x.fillStyle=mode==="map"?BLUE:GREEN; x.beginPath(); x.arc(5,0,3,0,7); x.fill();
    x.restore();
    if(bot.bump>0) bot.bump-=.06;
    const pct=free?done/free*100:0;
    cap.textContent=`cleaned ${pct.toFixed(0)}% · ${(bot.clock/1000|0)} s · click the floor to drop a sock`;
  }
  const setMode=m=>{ mode=m; $("rmBounce").classList.toggle("on",m==="bounce"); $("rmMap").classList.toggle("on",m==="map"); reset(); bot.clock=0; };
  $("rmBounce").onclick=()=>setMode("bounce");
  $("rmMap").onclick=()=>setMode("map");
  $("rmReset").onclick=()=>{ reset(); bot.clock=0; };
  $("rmFast").onclick=()=>{ speed=speed===1?4:speed===4?12:1; $("rmFast").textContent=`Speed ×${speed}`; };
  cv.addEventListener("pointerdown",e=>{ const p=ptr(e,cv); const rm=room();
    if(p.x<rm.x||p.y<rm.y||p.x>rm.x+rm.w||p.y>rm.y+rm.h) return;
    const s={x:p.x-14,y:p.y-9,w:28,h:18,sock:true}; if(Math.hypot(p.x-bot.x,p.y-bot.y)<R+20) return;
    obs.push(s);
    for(let j=0;j<rows;j++) for(let i=0;i<cols;i++){ const k=j*cols+i, cx=i*G+G/2, cy=j*G+G/2; if(cx>s.x&&cx<s.x+s.w&&cy>s.y&&cy<s.y+s.h){ if(cov[k]===1) done--; if(cov[k]!==2){ cov[k]=2; free--; } } }
    if(planGrid) planGrid.forEach(c=>{ if(c.ok&&hits(c.x,c.y,R-4)) c.ok=false; }); bot.path=[];
  });
  A.roomba={
    enter(){ reset(); bot.clock=0; document.querySelectorAll('[data-id="roomba"] video').forEach(v=>{ try{ v.play().catch(()=>{}); }catch(e){} }); },
    tick(dt){ if(!cov) return; const n=Math.ceil(speed*dt/8), h=speed*dt/n; for(let i=0;i<n;i++){ stepBot(h); paint(bot.x,bot.y); } bot.clock+=dt*speed; draw(); }
  };
})();

/* ---------- robots: clip viewer ---------- */
(() => {
  const CLIPS=[
    ["{{IMG:atlas-electric.mp4}}","Atlas (electric)","Boston Dynamics · humanoid"],
    ["{{IMG:atlas-boxes.mp4}}","Atlas does parkour","Boston Dynamics · balance and planning"],
    ["{{IMG:spot-door.mp4}}","Spot opens a door","Boston Dynamics · four-legged robot"],
    ["{{IMG:bd-dance.mp4}}","Robots dancing","Boston Dynamics · Atlas, Spot and Handle"],
    ["{{IMG:optimus-hands.mp4}}","Optimus Gen 2","Tesla · delicate hands"],
    ["{{IMG:optimus-gym.mp4}}","Optimus walking","Tesla · humanoid"],
  ];
  let i=0; const vid=$("rbVid"), dots=$("rbDots");
  dots.innerHTML=CLIPS.map((_,k)=>`<i data-k="${k}"></i>`).join("");
  function show(k){ i=(k+CLIPS.length)%CLIPS.length; const [src,nm,who]=CLIPS[i];
    vid.src=src; try{ vid.play().catch(()=>{}); }catch(e){}
    $("rbName").textContent=nm; $("rbWho").textContent=who;
    [...dots.children].forEach((d,j)=>d.classList.toggle("on",j===i)); }
  $("rbPrev").onclick=()=>show(i-1); $("rbNext").onclick=()=>show(i+1);
  dots.onclick=e=>{ const k=e.target.dataset.k; if(k!=null) show(+k); };
  A.robots={ enter(){ show(i); } };
})();

/* ---------- ai > ml > dl: where does what we know fit? ---------- */
(() => {
  const svg=$("nestSvg"), drop=$("nestDrop"), fb=$("nestFb");
  const RINGS={
    ai:{cx:380,cy:340,rx:360,ry:325,col:Y,label:"ARTIFICIAL INTELLIGENCE",ly:82},
    ml:{cx:430,cy:400,rx:255,ry:245,col:BLUE,label:"MACHINE LEARNING",ly:218},
    dl:{cx:475,cy:470,rx:140,ry:150,col:GREEN,label:"DEEP LEARNING",ly:384},
  };
  const KEYS=["ai","ml","dl"];
  // name, ring, x, y, why it belongs there
  const ITEMS=[
    ["ELIZA","ai",165,215,"ELIZA matched patterns with rules Weizenbaum wrote by hand. It never learned anything."],
    ["MYCIN","ai",128,330,"Expert systems like MYCIN and DENDRAL ran on IF-THEN rules typed in by human experts."],
    ["Deep Blue","ai",124,432,"Deep Blue searched millions of moves with a scoring function people tuned. Smart, but not learned from data."],
    ["Minimax","ai",152,530,"Minimax (like our tic-tac-toe player) just searches the game tree. No data, no learning."],
    ["Roomba (2002)","ai",290,165,"Roomba’s bump-and-turn behaviors were programmed by engineers."],
    ["Perceptron","ml",258,402,"The perceptron learns its weights from labeled examples: machine learning, but only one layer."],
    ["Decision tree","ai",626,184,"The decision tree we built earlier used rules we wrote ourselves, so it’s rule-based AI, like an expert system."],
    ["Linear regression","ml",322,286,"It learns the best straight line through example data, then uses that line to predict a number, like a house’s price from its size."],
    ["Learned decision trees","ml",560,300,"Algorithms like ID3 and CART build the tree automatically from example data. Same kind of tree, but learned: that’s machine learning."],
    ["?","dl",440,430,null],["?","dl",510,480,null],["?","dl",450,540,null],
  ];
  const MSG=["Where does everything we’ve seen so far fit? Click to fill each circle.",
    "<b>AI</b>: everything from the early days lives here. People wrote the rules or the search.",
    "<b>Machine learning</b>: the program learns from examples instead. Click any chip for details.",
    "<b>Deep learning</b> is empty so far. Filling it in is the rest of today’s story."];
  const els={};
  for(const k of KEYS){ const r=RINGS[k], g=svgEl("g",{},svg);
    els[k]={g, e:svgEl("ellipse",{cx:r.cx,cy:r.cy,rx:r.rx,ry:r.ry,fill:r.col,"fill-opacity":0,stroke:r.col,"stroke-width":2.5},g)};
    const t=svgEl("text",{x:r.cx,y:r.ly,"text-anchor":"middle",fill:r.col,"font-size":19,"font-weight":700,"letter-spacing":2.5},g); t.textContent=r.label; els[k].t=t;
    g.style.transition="opacity .5s"; els[k].e.style.transition="fill-opacity .5s"; }
  let k=0;
  function show(n){ k=n; drop.innerHTML="";
    KEYS.forEach((key,i)=>{ els[key].g.style.opacity=i<k?1:.25; els[key].e.setAttribute("fill-opacity",i<k?.07:0); });
    document.querySelectorAll('[data-id="nest"] .def').forEach(d=>d.classList.toggle("hi",KEYS.indexOf(d.dataset.k)<k));
    let n2=0;
    ITEMS.forEach(([nm,ring,x,y,why])=>{ if(KEYS.indexOf(ring)>=k) return;
      const el=document.createElement("div"); el.className="nestPlaced"+(why?"":" q"); el.textContent=nm;
      if(ring==="ml") el.style.background=BLUE; if(ring==="dl") el.style.background=GREEN;
      el.style.left=(x/760*100)+"%"; el.style.top=(y/680*100)+"%";
      if(KEYS.indexOf(ring)===k-1) el.style.animationDelay=(n2++*120)+"ms"; else el.style.animation="none";
      el.onclick=e=>{ e.stopPropagation(); drop.querySelectorAll(".sel").forEach(o=>o.classList.remove("sel")); el.classList.add("sel");
        fb.innerHTML=why?`<b>${nm}:</b> ${why}`:"Coming up today: networks with many layers that learn their own features."; };
      drop.appendChild(el); });
    fb.innerHTML=MSG[k]; }
  document.querySelector('[data-id="nest"]').addEventListener("click",e=>{ if(e.target.closest("button,a,.nestPlaced")) return; advance(); });
  A.nest={ enter(dir){ show(dir<0?3:0); }, step(){ if(k>=3) return false; show(k+1); return true; }, back(){ if(k<=0) return false; show(k-1); return true; } };
})();

/* ---------- three kinds of learning ---------- */
(() => {
  const cv=$("lnCv"), top=$("lnTop"), say=$("lnSay"), tabs=[...document.querySelectorAll("#lnTabs .lnTab")];
  let seed=7; const rand=()=>((seed=(seed*16807)%2147483647)/2147483647);
  const gauss=()=>{ let u=0; for(let i=0;i<6;i++) u+=rand(); return (u-3)*1.41; };
  // cats: small with pointy ears, dogs: bigger with floppier ears (x = size, y = ear pointiness)
  function makeData(){ seed=7; const d=[];
    for(let i=0;i<14;i++) d.push({x:clamp(.3+gauss()*.095,.05,.95),y:clamp(.7+gauss()*.09,.05,.95),l:1});
    for(let i=0;i<14;i++) d.push({x:clamp(.68+gauss()*.1,.05,.95),y:clamp(.32+gauss()*.1,.05,.95),l:0});
    return d; }
  let tab=0, data=makeData(), w=[0,0,0], addL=1, mystery=null, km=null, kmT=0, rl=null, rlT=0;
  const sig=v=>1/(1+Math.exp(-v)), prob=(x,y)=>sig(w[0]+w[1]*(x-.5)*6+w[2]*(y-.5)*6);
  function trainLR(n){ for(let it=0;it<n;it++){ const g=[0,0,0]; for(const p of data){ const e=prob(p.x,p.y)-p.l; g[0]+=e; g[1]+=e*(p.x-.5)*6; g[2]+=e*(p.y-.5)*6; }
    for(let i=0;i<3;i++) w[i]-=.15*(g[i]/data.length+.002*w[i]*(i>0)); } }
  let geo=null;
  function layout(){ const W=cv.offsetWidth, H=cv.offsetHeight, t=72, b=H-96, s=Math.min(W-100,b-t); geo={W,H,ox:(W-s)/2+16,oy:t,s}; }
  const P=p=>({x:geo.ox+p.x*geo.s,y:geo.oy+(1-p.y)*geo.s});
  const KCOL=[GREEN,"#b07cff",AMBER];
  function axes(x){ const {ox,oy,s}=geo; x.strokeStyle=LINE; x.lineWidth=1.5; x.strokeRect(ox,oy,s,s);
    x.fillStyle=MUTE; x.font=`14px ${MONO}`; x.textAlign="center"; x.fillText("size →",ox+s/2,oy+s+22);
    x.save(); x.translate(ox-14,oy+s/2); x.rotate(-Math.PI/2); x.fillText("ear pointiness →",0,0); x.restore(); x.textAlign="left"; }
  function dot(x,p,fill,label){ const q=P(p); x.fillStyle=fill; x.strokeStyle="#0d0d0f"; x.lineWidth=2; x.beginPath(); x.arc(q.x,q.y,9,0,7); x.fill(); x.stroke();
    if(label){ x.font=`15px ${SANS}`; x.textAlign="center"; x.textBaseline="middle"; x.fillText(label,q.x,q.y-20); x.textBaseline="alphabetic"; x.textAlign="left"; } }
  function setTab(t){ tab=t; tabs.forEach((b,i)=>b.classList.toggle("on",i===t)); mystery=null; km=null;
    if(t===0){ top.innerHTML=`<span class="stat">Click the chart to add a</span><button class="btn on" data-a="1">🐱 cat</button><button class="btn" data-a="0">🐶 dog</button><span class="sp"></span><button class="btn" data-a="m">New mystery animal ❓</button><button class="btn" data-a="r">Reset</button>`;
      say.innerHTML="Every dot comes with an answer: <b>cat</b> or <b>dog</b>. The model learns a line that splits them."; }
    else if(t===1){ top.innerHTML=`<button class="btn on" data-a="k2">Find 2 groups</button><button class="btn" data-a="k3">Find 3 groups</button><span class="sp"></span><span class="stat">same animals, no labels</span>`;
      say.innerHTML="Same animals, but <b>no labels</b>. Can the computer find groups on its own?"; }
    else { top.innerHTML=`<button class="btn on" data-a="rl">Start over</button><span class="sp"></span><span class="stat">a 1D maze: walk to the cheese</span>`;
      rl=newRL(); say.innerHTML="No labels and no examples. The mouse just tries moves: <b>+10</b> for cheese, <b>−10</b> for the trap."; } }
  top.onclick=e=>{ const b=e.target.closest("[data-a]"); if(!b) return; const a=b.dataset.a;
    if(a==="1"||a==="0"){ addL=+a; top.querySelectorAll('[data-a="1"],[data-a="0"]').forEach(o=>o.classList.toggle("on",o===b)); }
    else if(a==="r"){ data=makeData(); w=[0,0,0]; mystery=null; }
    else if(a==="m"){ mystery={x:rnd(.15,.85),y:rnd(.15,.85)}; }
    else if(a==="k2"||a==="k3"){ top.querySelectorAll('[data-a^="k"]').forEach(o=>o.classList.toggle("on",o===b)); startKM(a==="k2"?2:3); }
    else if(a==="rl") rl=newRL(); };
  tabs.forEach((b,i)=>b.onclick=()=>setTab(i));
  cv.addEventListener("pointerdown",e=>{ if(tab!==0||!geo) return; const q=ptr(e,cv), x=(q.x-geo.ox)/geo.s, y=1-(q.y-geo.oy)/geo.s;
    if(x<0||y<0||x>1||y>1) return; data.push({x,y,l:addL,fresh:performance.now()}); });
  // k-means, one visible step at a time
  function startKM(k){ const pts=[...data].sort(()=>Math.random()-.5); km={k,c:pts.slice(0,k).map(p=>({x:p.x,y:p.y})),a:data.map(()=>-1),it:0,done:false}; kmT=0;
    say.innerHTML="Step 1: drop "+k+" random centers. Then repeat: color each dot by its nearest center, move each center to the middle of its dots."; }
  function stepKM(){ let changed=false;
    data.forEach((p,i)=>{ let b=0,bd=1e9; km.c.forEach((c,j)=>{ const d=(p.x-c.x)**2+(p.y-c.y)**2; if(d<bd){ bd=d; b=j; } }); if(km.a[i]!==b){ km.a[i]=b; changed=true; } });
    km.c=km.c.map((c,j)=>{ const m=data.filter((_,i)=>km.a[i]===j); return m.length?{x:m.reduce((s,p)=>s+p.x,0)/m.length,y:m.reduce((s,p)=>s+p.y,0)/m.length}:c; });
    km.it++; if(!changed&&km.it>1){ km.done=true;
      say.innerHTML=`Found <b>${km.k} groups</b> in ${km.it} rounds. It doesn’t know what they are: it can’t say “cat” or “dog”. ${km.k===3?"With 3 groups it splits one kind in two: the computer just finds whatever groups the numbers suggest.":"A person still has to name them."}`; } }
  // reinforcement: a 1D corridor, trap on the left, cheese on the right
  const N=9;
  function newRL(){ return {Q:Array.from({length:N},()=>[0,0]),pos:4,ep:1,steps:0,last:null,flash:0,hist:[]}; }
  function stepRL(){ const r=rl, e=Math.max(.1,Math.pow(.8,r.ep-1)), q=r.Q[r.pos]; const a=Math.random()<e||q[0]===q[1]?(Math.random()<.5?0:1):(q[1]>q[0]?1:0);
    const np=r.pos+(a?1:-1); let rew=-.5, done=false; if(np===0){ rew=-10; done=true; } if(np===N-1){ rew=10; done=true; }
    const nxt=done?0:Math.max(...r.Q[np]); q[a]+=.5*(rew+.9*nxt-q[a]); r.pos=np; r.steps++;
    if(done){ r.last=rew>0?"win":"trap"; r.flash=1; r.hist.push(r.last); r.ep++; setTimeout(()=>{ if(rl===r){ r.pos=4; r.steps=0; } },350); r.pos=np; r.wait=true; setTimeout(()=>{ if(rl===r) r.wait=false; },350); }
    const wins=r.hist.slice(-5).filter(h=>h==="win").length;
    say.innerHTML=`Try <b>#${r.ep}</b> · last result: ${r.last==="win"?"🧀 +10":r.last==="trap"?"🪤 −10":"…"} · ${r.ep>6&&wins>=4?"It has learned: always go right!":"still exploring…"}`; }
  function draw(now){
    layout(); const x=ctxOf(cv), {W,H}=geo; x.fillStyle="#0d0d0f"; x.fillRect(0,0,W,H);
    if(tab===0){ trainLR(8); const {ox,oy,s}=geo, G=32;
      for(let j=0;j<G;j++) for(let i=0;i<G;i++){ const p=prob((i+.5)/G,1-(j+.5)/G); x.fillStyle=p>.5?`rgba(255,194,14,${(p-.5)*.36})`:`rgba(106,184,255,${(.5-p)*.36})`; x.fillRect(ox+i*s/G,oy+j*s/G,s/G+.5,s/G+.5); }
      // boundary: w0 + w1*(x-.5)*6 + w2*(y-.5)*6 = 0
      if(Math.abs(w[2])>1e-3){ x.strokeStyle=INK; x.lineWidth=3; x.setLineDash([10,7]); x.beginPath(); let first=true;
        for(let k=0;k<=40;k++){ const xx=k/40, yy=.5-(w[0]+w[1]*(xx-.5)*6)/(w[2]*6); if(yy<0||yy>1){ first=true; continue; } const q=P({x:xx,y:yy}); first?x.moveTo(q.x,q.y):x.lineTo(q.x,q.y); first=false; } x.stroke(); x.setLineDash([]); }
      axes(x); for(const p of data) dot(x,p,p.l?Y:BLUE,p.fresh&&now-p.fresh<1200?(p.l?"🐱":"🐶"):null);
      x.font=`15px ${SANS}`; x.fillStyle=Y; x.fillText("● cat",geo.ox+geo.s-110,oy+22); x.fillStyle=BLUE; x.fillText("● dog",geo.ox+geo.s-55,oy+22);
      if(mystery){ const pc=prob(mystery.x,mystery.y), q=P(mystery); x.fillStyle="#fff"; x.beginPath(); x.arc(q.x,q.y,13,0,7); x.fill(); x.fillStyle="#121214"; x.font=`700 16px ${SANS}`; x.textAlign="center"; x.textBaseline="middle"; x.fillText("?",q.x,q.y+1); x.textAlign="left"; x.textBaseline="alphabetic";
        say.innerHTML=`Mystery animal ❓: the model predicts <b>${pc>.5?"cat":"dog"}</b> (${Math.round(Math.max(pc,1-pc)*100)}% sure), because of which side of the line it’s on.`; } }
    else if(tab===1){ if(km&&!km.done){ kmT+=16; if(kmT>750){ kmT=0; stepKM(); } }
      axes(x); data.forEach((p,i)=>dot(x,p,km&&km.a[i]>=0?KCOL[km.a[i]]:"#8a8a94"));
      if(km) km.c.forEach((c,j)=>{ const q=P(c); x.strokeStyle=KCOL[j]; x.lineWidth=4; x.beginPath(); x.moveTo(q.x-12,q.y-12); x.lineTo(q.x+12,q.y+12); x.moveTo(q.x+12,q.y-12); x.lineTo(q.x-12,q.y+12); x.stroke();
        if(km.done){ const t=`group ${"ABC"[j]} = ?`; x.font=`700 18px ${SANS}`; const tw=x.measureText(t).width; x.fillStyle="rgba(13,13,15,.85)"; x.fillRect(q.x-tw/2-8,q.y-46,tw+16,28); x.fillStyle=KCOL[j]; x.textAlign="center"; x.fillText(t,q.x,q.y-26); x.textAlign="left"; } }); }
    else { const r=rl; if(!r.wait){ rlT+=16; if(rlT>(r.ep<4?260:140)){ rlT=0; stepRL(); } }
      const cw=Math.min(84,(W-80)/N), ox=(W-cw*N)/2, oy=H/2-60;
      for(let i=0;i<N;i++){ const px=ox+i*cw, q=r.Q[i], v=Math.max(...q);
        x.fillStyle=i===0?"#5a1f12":i===N-1?"#1f3a26":v>0?`rgba(95,214,138,${Math.min(.6,v/10)})`:v<0?`rgba(255,90,78,${Math.min(.5,-v/10)})`:"#1a1a1f"; x.fillRect(px+2,oy,cw-4,cw);
        x.textAlign="center"; x.textBaseline="middle"; x.font=`${cw*.5}px ${SANS}`;
        if(i===0) x.fillText("🪤",px+cw/2,oy+cw/2); else if(i===N-1) x.fillText("🧀",px+cw/2,oy+cw/2);
        else if(q[0]!==q[1]){ x.fillStyle="rgba(243,241,234,.8)"; x.font=`700 ${cw*.42}px ${SANS}`; x.fillText(q[1]>q[0]?"→":"←",px+cw/2,oy+cw+28); } }
      x.font=`${cw*.55}px ${SANS}`; x.fillText("🐭",ox+r.pos*cw+cw/2,oy+cw/2);
      x.fillStyle=MUTE; x.font=`14px ${MONO}`; x.fillText("arrows = what the mouse has learned is the best move from each square",W/2,oy+cw+70);
      x.fillText("you’ll train a smarter mouse after AlphaGo",W/2,oy-36); x.textAlign="left"; x.textBaseline="alphabetic"; }
  }
  A.learning={ enter(dir){ data=makeData(); w=[0,0,0]; setTab(dir<0?2:0); }, tick(dt,now){ draw(now); },
    step(){ if(tab>=2) return false; setTab(tab+1); return true; }, back(){ if(tab<=0) return false; setTab(tab-1); return true; } };
})();

/* ---------- imagenet: count up + labeling calculator ---------- */
(() => {
  const N=14197122, num=$("inNum"), rng=$("inRange"); let t0=0, on=false;
  function calc(){ const s=+rng.value; $("inSec").textContent=s; const days=N*s/86400;
    $("inOut").textContent = days<365 ? `${fmt(days)} days` : `${(days/365).toFixed(1)} years`; }
  rng.oninput=calc; calc();
  A.imagenet={ enter(){ t0=performance.now(); on=true; }, tick(dt,now){ if(!on) return; const p=ease((now-t0-500)/2200); num.textContent=fmt(N*p); if(p>=1) on=false; } };
})();

/* ---------- pipeline: how a network sees a cat ---------- */
(() => {
  const cv=$("plCv"), tabs=$("plTabs"), txt=$("plText"), cap=$("plCap");
  const STAGES=[
    ["Label","1","Every image in the dataset comes with a <b>label</b> that says what it is. The label is the answer the network is checked against."],
    ["Grayscale","2","A color pixel is 3 numbers (red, green, blue). A gray pixel is just <b>1</b>, so there’s a third as much data to process."],
    ["Less noise","3","Smooth out random specks so the network pays attention to real shapes, not camera grain."],
    ["Numbers","4","Shrink to <b>28 × 28 = 784 pixels</b>. Each pixel is a brightness from 0 (black) to 255 (white). Each number is one <b>input</b>."],
    ["Network","5","Each neuron multiplies its inputs by <b>weights</b>, adds a <b>bias</b> and applies an <b>activation</b>. The last layer gives the answer."],
  ];
  tabs.innerHTML=STAGES.map((s,i)=>`<button data-k="${i}">${s[0]}<span>step ${s[1]}</span></button>`).join("");
  const img=new Image(); let ready=false, S=280, color, gray, noisy, clean, small, vals;
  img.onload=()=>{
    const mk=()=>{ const c=document.createElement("canvas"); c.width=c.height=S; return c; };
    color=mk(); const cx=color.getContext("2d"); cx.drawImage(img,0,0,S,S);
    let d; try{ d=cx.getImageData(0,0,S,S); }catch(e){ return; }
    const g=new Float32Array(S*S); for(let i=0;i<S*S;i++) g[i]=.299*d.data[i*4]+.587*d.data[i*4+1]+.114*d.data[i*4+2];
    const toCanvas=arr=>{ const c=mk(), x=c.getContext("2d"), o=x.createImageData(S,S); for(let i=0;i<S*S;i++){ const v=clamp(arr[i],0,255); o.data[i*4]=o.data[i*4+1]=o.data[i*4+2]=v; o.data[i*4+3]=255; } x.putImageData(o,0,0); return c; };
    gray=toCanvas(g);
    const nz=g.map(v=>Math.random()<.08?(Math.random()<.5?0:255):v+rnd(-28,28)); noisy=toCanvas(nz);
    // a median-ish clean up: 3x3 box blur of the noisy image, then a light blend back to the original detail
    const bl=new Float32Array(S*S); for(let y=0;y<S;y++) for(let x=0;x<S;x++){ let s=0,n=0; for(let j=-2;j<=2;j++) for(let i=-2;i<=2;i++){ const xx=x+i, yy=y+j; if(xx>=0&&yy>=0&&xx<S&&yy<S){ s+=nz[yy*S+xx]; n++; } } bl[y*S+x]=s/n*.75+g[y*S+x]*.25; }
    clean=toCanvas(bl);
    vals=new Uint8Array(28*28); const cell=S/28;
    for(let j=0;j<28;j++) for(let i=0;i<28;i++){ let s=0,n=0; for(let y=Math.floor(j*cell);y<Math.floor((j+1)*cell);y++) for(let x=Math.floor(i*cell);x<Math.floor((i+1)*cell);x++){ s+=bl[y*S+x]; n++; } vals[j*28+i]=Math.round(s/n); }
    small=document.createElement("canvas"); small.width=small.height=28; const sx=small.getContext("2d"), so=sx.createImageData(28,28);
    for(let i=0;i<784;i++){ so.data[i*4]=so.data[i*4+1]=so.data[i*4+2]=vals[i]; so.data[i*4+3]=255; } sx.putImageData(so,0,0);
    ready=true;
  };
  img.src="{{IMG:cat.jpg}}";
  let st=0, t0=0, hover=null, dots=[];
  function setStage(k){ st=clamp(k,0,4); t0=performance.now(); dots=[];
    [...tabs.children].forEach((b,i)=>{ b.classList.toggle("on",i===st); b.classList.toggle("done",i<st); });
    txt.innerHTML=`<h3>${STAGES[st][1]} · ${STAGES[st][0]}</h3><p>${STAGES[st][2]}</p>`;
    cap.style.display="none"; $("plBack").disabled=st===0; $("plNext").textContent=st===4?"Again ↺":"Next step →"; }
  tabs.onclick=e=>{ const b=e.target.closest("button"); if(b) setStage(+b.dataset.k); };
  $("plNext").onclick=()=>setStage(st===4?0:st+1); $("plBack").onclick=()=>setStage(st-1);
  cv.addEventListener("pointermove",e=>{ hover=ptr(e,cv); }); cv.addEventListener("pointerleave",()=>hover=null);
  function draw(now){
    const W=cv.offsetWidth, H=cv.offsetHeight, x=ctxOf(cv), p=(now-t0)/900;
    x.fillStyle="#0d0d0f"; x.fillRect(0,0,W,H);
    if(!ready){ x.fillStyle=MUTE; x.font=`18px ${SANS}`; x.fillText("loading…",20,30); return; }
    const sz=460, ix=(W-sz)/2, iy=(H-sz)/2;
    x.imageSmoothingEnabled=true;
    if(st===0){ x.drawImage(color,ix,iy,sz,sz);
      const a=ease(p), lab='label: "cat"'; x.font=`700 22px ${MONO}`; const lw=x.measureText(lab).width+28;
      x.globalAlpha=a; x.fillStyle=Y; x.beginPath(); x.roundRect?x.roundRect(ix+16,iy+16,lw,46,10):x.rect(ix+16,iy+16,lw,46); x.fill();
      x.fillStyle="#121214"; x.textBaseline="middle"; x.fillText(lab,ix+30,iy+40); x.globalAlpha=1;
      x.fillStyle=MUTE; x.font=`15px ${MONO}`; x.textBaseline="alphabetic"; x.fillText("cat.bmp",ix,iy+sz+24); }
    else if(st===1||st===2){
      const from=st===1?color:noisy, to=st===1?gray:clean, w=sz*ease(p);
      x.drawImage(from,ix,iy,sz,sz);
      x.save(); x.beginPath(); x.rect(ix,iy,w,sz); x.clip(); x.drawImage(to,ix,iy,sz,sz); x.restore();
      if(p<1){ x.fillStyle=Y; x.fillRect(ix+w-2,iy,4,sz); }
      x.fillStyle=MUTE; x.font=`15px ${MONO}`; x.fillText(st===1?"3 numbers per pixel → 1":"noisy → smoothed",ix,iy+sz+24); }
    else if(st===3){
      const a=ease(p); x.drawImage(clean,ix,iy,sz,sz); x.globalAlpha=a; x.imageSmoothingEnabled=false; x.drawImage(small,ix,iy,sz,sz); x.imageSmoothingEnabled=true; x.globalAlpha=1;
      const c=sz/28; x.strokeStyle="rgba(0,0,0,.35)"; x.lineWidth=1; x.globalAlpha=a;
      for(let i=1;i<28;i++){ x.beginPath(); x.moveTo(ix+i*c,iy); x.lineTo(ix+i*c,iy+sz); x.moveTo(ix,iy+i*c); x.lineTo(ix+sz,iy+i*c); x.stroke(); } x.globalAlpha=1;
      let hi=null; if(hover){ const i=Math.floor((hover.x-ix)/c), j=Math.floor((hover.y-iy)/c); if(i>=0&&j>=0&&i<28&&j<28) hi=[i,j]; }
      if(!hi) hi=[13+Math.round(Math.sin(now/1400)*5),11+Math.round(Math.cos(now/1700)*4)];
      const [hx,hy]=hi; x.strokeStyle=Y; x.lineWidth=2; x.strokeRect(ix+(hx-2)*c,iy+(hy-2)*c,5*c,5*c);
      // magnifier: 5x5 numbers
      const mx=ix+sz+14, my=iy+90, mc=26; x.font=`600 11px ${MONO}`; x.textAlign="center"; x.textBaseline="middle";
      for(let j=-2;j<=2;j++) for(let i=-2;i<=2;i++){ const xi=clamp(hx+i,0,27), yj=clamp(hy+j,0,27), v=vals[yj*28+xi];
        x.fillStyle=`rgb(${v},${v},${v})`; x.fillRect(mx+(i+2)*mc,my+(j+2)*mc,mc-1,mc-1); x.fillStyle=v>120?"#111":"#eee"; x.fillText(v,mx+(i+2)*mc+mc/2,my+(j+2)*mc+mc/2); }
      x.strokeStyle=Y; x.strokeRect(mx-1,my-1,5*mc+1,5*mc+1); x.textAlign="left"; x.textBaseline="alphabetic";
      x.fillStyle=MUTE; x.font=`15px ${MONO}`; x.fillText("zoomed",mx,my-10);
      x.fillText(`pixel (${hx}, ${hy}) = ${vals[hy*28+hx]}`,ix,iy+sz+24);
      cap.textContent="hover the pixels to read their values"; }
    else {
      // image on the left, a network on the right; numbers fly in as dots
      const s2=220, gx=40, gy=(H-s2)/2; x.imageSmoothingEnabled=false; x.drawImage(small,gx,gy,s2,s2); x.imageSmoothingEnabled=true;
      x.fillStyle=MUTE; x.font=`15px ${MONO}`; x.fillText("784 inputs",gx,gy+s2+24);
      const L=[[320,12],[450,8],[570,8],[W-150,3]], ys=(n,i)=>H/2+(i-(n-1)/2)*(Math.min(42,(H-140)/n));
      for(let l=0;l<L.length-1;l++) for(let i=0;i<L[l][1];i++) for(let j=0;j<L[l+1][1];j++){ x.strokeStyle="rgba(255,255,255,.07)"; x.beginPath(); x.moveTo(L[l][0],ys(L[l][1],i)); x.lineTo(L[l+1][0],ys(L[l+1][1],j)); x.stroke(); }
      if(Math.random()<.5&&now-t0<4500){ const i=(Math.random()*784)|0; dots.push({x:gx+(i%28+.5)*s2/28,y:gy+((i/28|0)+.5)*s2/28,l:0,j:(Math.random()*12)|0,t:0,v:vals[i]}); }
      dots=dots.filter(d=>{ d.t+=1/22; const [tx,n]=L[d.l], ty=ys(n,d.j); const sx=d.sx??d.x, sy=d.sy??d.y; if(d.sx==null){ d.sx=d.x; d.sy=d.y; }
        const px=sx+(tx-sx)*d.t, py=sy+(ty-sy)*d.t; x.fillStyle=`rgba(255,194,14,${.4+d.v/400})`; x.beginPath(); x.arc(px,py,3,0,7); x.fill();
        if(d.t>=1){ if(d.l>=L.length-1) return false; d.sx=tx; d.sy=ty; d.l++; d.j=(Math.random()*L[d.l][1])|0; d.t=0; } return true; });
      for(const [lx,n] of L) for(let i=0;i<n;i++){ x.fillStyle="#24242a"; x.strokeStyle=lx===L[3][0]?Y:"#6a6a74"; x.lineWidth=2; x.beginPath(); x.arc(lx,ys(n,i),9,0,7); x.fill(); x.stroke(); }
      const out=[["cat",.94],["dog",.04],["toaster",.02]], k=ease((now-t0-1600)/1500);
      x.font=`600 18px ${SANS}`; x.textBaseline="middle";
      out.forEach(([nm,v],i)=>{ const yy=ys(3,i); x.fillStyle=i===0?Y:MUTE; x.fillText(`${nm} ${Math.round(v*k*100)}%`,L[3][0]+18,yy);
        x.fillStyle=i===0?"rgba(255,194,14,.8)":"rgba(155,152,143,.5)"; x.fillRect(L[3][0]+18,yy+12,70*v*k,4); });
      x.textBaseline="alphabetic"; x.fillStyle=MUTE; x.font=`15px ${MONO}`;
      ["input","hidden","hidden","output"].forEach((t,i)=>{ x.textAlign="center"; x.fillText(t,L[i][0],H-40); }); x.textAlign="left"; }
  }
  A.pipeline={ enter(dir){ setStage(dir<0?4:0); }, tick(dt,now){ draw(now); },
    step(){ if(st>=4) return false; setStage(st+1); return true; }, back(){ if(st<=0) return false; setStage(st-1); return true; } };
})();

/* ---------- fully connected: count the weights ---------- */
(() => {
  const svg=$("fcSvg"), lyr=$("fcLyr"); let L=[3,5,5,2], nodes=[], edges=[], pulses=[], hov=null;
  const NAMES=["INPUT","HIDDEN","HIDDEN","OUTPUT"], COLS=[BLUE,Y,Y,"#b07cff"], XS=[110,320,540,750], MAXN=10;
  function render(){
    svg.innerHTML=""; nodes=[]; edges=[];
    const gE=svgEl("g",{},svg), gP=svgEl("g",{id:"fcP"},svg), gN=svgEl("g",{},svg);
    const shown=L.map(n=>n>MAXN?MAXN:n);
    const pos=L.map((n,l)=>{ const m=shown[l], gap=Math.min(56,460/m); return Array.from({length:m},(_,i)=>({x:XS[l],y:280+(i-(m-1)/2)*gap,l,i,more:n>MAXN&&i===m-2})); });
    for(let l=0;l<3;l++) for(const a of pos[l]) for(const b of pos[l+1]){ if(a.more||b.more) continue; const e=svgEl("line",{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:"#fff","stroke-opacity":.22,"stroke-width":1.2},gE); edges.push({a,b,e}); }
    pos.forEach((col,l)=>col.forEach(p=>{
      if(p.more){ const t=svgEl("text",{x:p.x,y:p.y+8,"text-anchor":"middle",fill:MUTE,"font-size":26,"font-family":MONO},gN); t.textContent="⋮"; return; }
      const c=svgEl("circle",{cx:p.x,cy:p.y,r:15,fill:"#1c1c20",stroke:COLS[l],"stroke-width":3,class:"nd"},gN); p.c=c; nodes.push(p);
      c.addEventListener("mouseenter",()=>{ hov=p; paint(); }); c.addEventListener("mouseleave",()=>{ hov=null; paint(); });
    }));
    L.forEach((n,l)=>{ const t=svgEl("text",{x:XS[l],y:540,"text-anchor":"middle",fill:MUTE,"font-size":15,"font-family":MONO,"letter-spacing":1.5},svg); t.textContent=n>MAXN?`${NAMES[l]} · ${fmt(n)}`:NAMES[l]; });
    const w=L[0]*L[1]+L[1]*L[2]+L[2]*L[3], b=L[1]+L[2]+L[3];
    $("fcCount").textContent=fmt(w+b); $("fcSub").textContent=`${fmt(w)} weights + ${fmt(b)} biases to learn`;
    lyr.innerHTML=L.map((n,l)=>`<div class="card"><div class="nm">${NAMES[l]}</div><div class="row"><button data-l="${l}" data-d="-1">−</button><span class="v">${fmt(n)}</span><button data-l="${l}" data-d="1">+</button></div></div>`).join("");
    document.querySelectorAll('[data-id="fcn"] [data-fc]').forEach(b=>b.classList.toggle("on",b.dataset.fc===L.join(",")));
    paint();
  }
  function paint(){
    for(const {a,b,e} of edges){ const on=hov&&(a===hov||b===hov); e.setAttribute("stroke",on?Y:"#fff"); e.setAttribute("stroke-opacity",hov?(on?.9:.05):.22); e.setAttribute("stroke-width",on?2.2:1.2); }
    for(const n of nodes) n.c.setAttribute("fill",n===hov?COLS[n.l]:"#1c1c20");
  }
  lyr.onclick=e=>{ const b=e.target.closest("button"); if(!b) return; const l=+b.dataset.l, d=+b.dataset.d, n=L[l];
    const step=n>=100?Math.max(1,Math.round(n*.25)):n>=12?4:1; L[l]=clamp(n+d*step,1,4096); render(); };
  document.querySelectorAll('[data-id="fcn"] [data-fc]').forEach(b=>b.onclick=()=>{ L=b.dataset.fc.split(",").map(Number); render(); });
  render();
  A.fcn={ enter(){ pulses=[]; },
    tick(dt){ const g=$("fcP"); if(!g) return;
      if(Math.random()<dt/120&&edges.length){ const first=edges.filter(e=>e.a.l===0); const e=pick(first); if(e) pulses.push({e,t:0}); }
      g.innerHTML=""; pulses=pulses.filter(p=>{ p.t+=dt/650; if(p.t>=1){ const nx=edges.filter(e=>e.a===p.e.b); if(nx.length){ p.e=pick(nx); p.t=0; } else return false; }
        const {a,b}=p.e; svgEl("circle",{cx:a.x+(b.x-a.x)*p.t,cy:a.y+(b.y-a.y)*p.t,r:4,fill:Y},g); return true; }); } };
})();

/* ---------- a single neuron: inputs, weights, bias, activation ---------- */
(() => {
  const svg=$("nrSvg"), ctl=$("nrCtl"), math=$("nrMath");
  const SUB="₁₂₃";
  let x=[1,0.5,0], w=[1.2,-0.6,0.8], b=-0.5, act="step";
  const F={ step:z=>z>=0?1:0, sig:z=>1/(1+Math.exp(-z)), relu:z=>Math.max(0,z) };
  const NAME={step:"step",sig:"sigmoid",relu:"ReLU"};
  ctl.innerHTML=[0,1,2].map(i=>`<div class="nrGrp"><div class="nrRow"><span class="nrL">input x${SUB[i]}</span><input type="range" min="0" max="1" step="0.1" data-k="x${i}"><span class="nrV" id="nrVx${i}"></span></div>
    <div class="nrRow"><span class="nrL">weight w${SUB[i]}</span><input class="w" type="range" min="-2" max="2" step="0.1" data-k="w${i}"><span class="nrV" id="nrVw${i}"></span></div></div>`).join("")+
    `<div class="nrGrp"><div class="nrRow"><span class="nrL">bias b</span><input class="b" type="range" min="-3" max="3" step="0.1" data-k="b"><span class="nrV" id="nrVb"></span></div></div>`;
  ctl.addEventListener("input",e=>{ const k=e.target.dataset.k; if(!k) return; const v=+e.target.value;
    if(k==="b") b=v; else if(k[0]==="x") x[+k[1]]=v; else w[+k[1]]=v; update(); });
  ctl.addEventListener("keydown",e=>e.stopPropagation());
  document.querySelectorAll("#nrAct [data-f]").forEach(btn=>btn.onclick=()=>{ act=btn.dataset.f; document.querySelectorAll("#nrAct [data-f]").forEach(o=>o.classList.toggle("on",o===btn)); update(); });
  // static drawing
  const IN=[[90,130],[90,280],[90,430]], NX=430, NY=280, AX=560, AW=170, OX=800;
  const gE=svgEl("g",{},svg), gD=svgEl("g",{},svg), gN=svgEl("g",{},svg);
  const edges=IN.map(([ix,iy])=>svgEl("line",{x1:ix+34,y1:iy,x2:NX-70,y2:NY,"stroke-linecap":"round"},gE));
  const wl=IN.map(([ix,iy])=>{ const g=svgEl("g",{},gN), mx=(ix+NX)/2-10, my=(iy+NY)/2; svgEl("rect",{x:mx-46,y:my-17,width:92,height:32,rx:8,fill:"#121214",stroke:LINE},g); const t=svgEl("text",{x:mx,y:my+6,"text-anchor":"middle","font-size":17,"font-family":MONO,"font-weight":600},g); return t; });
  const ins=IN.map(([ix,iy],i)=>{ const c=svgEl("circle",{cx:ix,cy:iy,r:34,fill:"#1c1c20",stroke:BLUE,"stroke-width":3},gN); const t=svgEl("text",{x:ix,y:iy+7,"text-anchor":"middle",fill:INK,"font-size":20,"font-family":MONO,"font-weight":600},gN);
    const l=svgEl("text",{x:ix,y:iy-44,"text-anchor":"middle",fill:MUTE,"font-size":15,"font-family":MONO},gN); l.textContent="x"+SUB[i]; return {c,t}; });
  svgEl("line",{x1:NX,y1:118,x2:NX,y2:NY-70,stroke:"#b07cff","stroke-width":3},gE);
  svgEl("circle",{cx:NX,cy:92,r:26,fill:"#1c1c20",stroke:"#b07cff","stroke-width":3},gN);
  const bt=svgEl("text",{x:NX,y:99,"text-anchor":"middle",fill:INK,"font-size":17,"font-family":MONO,"font-weight":600},gN);
  const bl=svgEl("text",{x:NX+38,y:98,fill:"#b07cff","font-size":15,"font-family":MONO},gN); bl.textContent="bias";
  const neu=svgEl("circle",{cx:NX,cy:NY,r:70,fill:"#1c1c20",stroke:Y,"stroke-width":3.5},gN);
  const sg=svgEl("text",{x:NX,y:NY-10,"text-anchor":"middle",fill:Y,"font-size":40,"font-family":SANS,"font-weight":700},gN); sg.textContent="Σ";
  const zt=svgEl("text",{x:NX,y:NY+30,"text-anchor":"middle",fill:INK,"font-size":18,"font-family":MONO},gN);
  svgEl("line",{x1:NX+70,y1:NY,x2:AX,y2:NY,stroke:MUTE,"stroke-width":2.5},gE);
  svgEl("rect",{x:AX,y:NY-85,width:AW,height:170,rx:14,fill:"#16161a",stroke:LINE,"stroke-width":2},gN);
  const at=svgEl("text",{x:AX+AW/2,y:NY-100,"text-anchor":"middle",fill:MUTE,"font-size":15,"font-family":MONO},gN);
  svgEl("line",{x1:AX+12,y1:NY+60,x2:AX+AW-12,y2:NY+60,stroke:LINE},gN); svgEl("line",{x1:AX+AW/2,y1:NY-75,x2:AX+AW/2,y2:NY+70,stroke:LINE},gN);
  const curve=svgEl("path",{fill:"none",stroke:Y,"stroke-width":3},gN), mk=svgEl("circle",{r:7,fill:"#fff",stroke:Y,"stroke-width":2},gN);
  svgEl("line",{x1:AX+AW,y1:NY,x2:OX-38,y2:NY,stroke:MUTE,"stroke-width":2.5},gE);
  const out=svgEl("circle",{cx:OX,cy:NY,r:38,fill:"#1c1c20",stroke:Y,"stroke-width":3},gN);
  const ot=svgEl("text",{x:OX,y:NY+7,"text-anchor":"middle",fill:INK,"font-size":19,"font-family":MONO,"font-weight":700},gN);
  const ol=svgEl("text",{x:OX,y:NY+66,"text-anchor":"middle","font-size":17,"font-family":SANS,"font-weight":700},gN);
  const ol0=svgEl("text",{x:OX,y:NY-50,"text-anchor":"middle",fill:MUTE,"font-size":15,"font-family":MONO},gN); ol0.textContent="output";
  const zOf=(xx)=>xx[0]*w[0]+xx[1]*w[1]+xx[2]*w[2]+b, f2=v=>(v<0?"−":"")+Math.abs(v).toFixed(1), f2p=v=>v<0?`(−${Math.abs(v).toFixed(1)})`:v.toFixed(1);
  function update(){
    ctl.querySelectorAll("input").forEach(inp=>{ const k=inp.dataset.k; inp.value=k==="b"?b:k[0]==="x"?x[+k[1]]:w[+k[1]]; });
    [0,1,2].forEach(i=>{ $("nrVx"+i).textContent=x[i].toFixed(1); $("nrVw"+i).textContent=f2(w[i]); }); $("nrVb").textContent=f2(b);
    const z=zOf(x), o=F[act](z), fire=o>.5;
    edges.forEach((e,i)=>{ e.setAttribute("stroke",w[i]>=0?Y:BLUE); e.setAttribute("stroke-width",1.5+Math.abs(w[i])*4); e.setAttribute("stroke-opacity",.25+.75*Math.min(1,x[i])); });
    wl.forEach((t,i)=>{ t.textContent="w"+SUB[i]+"="+f2(w[i]); t.setAttribute("fill",w[i]>=0?Y:BLUE); });
    ins.forEach((n,i)=>{ n.t.textContent=x[i].toFixed(1); n.c.setAttribute("fill",`rgba(106,184,255,${x[i]*.35})`); });
    bt.textContent=f2(b); zt.textContent="z = "+f2(z);
    at.textContent=NAME[act];
    const ymax=act==="relu"?4:1, px=v=>AX+AW/2+v/4*(AW/2-12), py=v=>NY+60-Math.min(v,ymax)/ymax*130;
    let d=""; for(let k=0;k<=80;k++){ const v=-4+k/10; d+=(k?"L":"M")+px(v).toFixed(1)+" "+py(F[act](v)).toFixed(1); } curve.setAttribute("d",d);
    mk.setAttribute("cx",px(clamp(z,-4,4))); mk.setAttribute("cy",py(F[act](clamp(z,-4,4))));
    ot.textContent=o.toFixed(2); out.setAttribute("fill",`rgba(255,194,14,${Math.min(1,o)*.85})`); ot.setAttribute("fill",o>.55?"#121214":INK);
    out.style.filter=fire?"drop-shadow(0 0 14px rgba(255,194,14,.9))":"none"; neu.style.filter=fire?"drop-shadow(0 0 10px rgba(255,194,14,.6))":"none";
    ol.textContent=fire?"FIRES!":"stays quiet"; ol.setAttribute("fill",fire?Y:MUTE);
    math.innerHTML=`z = ${[0,1,2].map(i=>`${x[i].toFixed(1)}×${f2p(w[i])}`).join(" + ")} + ${f2p(b)} = <b>${f2(z)}</b><br>${NAME[act]}(${f2(z)}) = <b>${o.toFixed(2)}</b> → ${fire?"<b>fires</b>":"quiet"} (fires when output &gt; 0.5)`;
  }
  update();
  A.neuron={ enter(){ update(); } };
})();

/* ---------- alexnet: error by year ---------- */
(() => {
  const svg=$("axSvg"), note=$("axNote");
  const D=[[2010,28.2,"NEC"],[2011,25.8,"XRCE"],[2012,15.3,"AlexNet"],[2013,11.7,"Clarifai"],[2014,6.7,"GoogLeNet"],[2015,3.6,"ResNet"],[2016,3.0,"Trimps-Soushen"],[2017,2.3,"SENet"]];
  const NOTES=["","",
    "<b>2010–2011:</b> hand-crafted features. About 1 in 4 photos labeled wrong.",
    "<b>2012:</b> AlexNet, 8 layers, trained on GPUs: <b class='y'>15.3%</b>. The next best entry was stuck at 26.2%.",
    "<b>2013:</b> almost every top team switches to deep learning.",
    "<b>2014:</b> networks get deeper. GoogLeNet has 22 layers.",
    "<b>2015:</b> ResNet, <b>152 layers</b>: 3.6%. Better than one human expert who tried the test (about 5%).",
    "<b>2016:</b> 3.0%.",
    "<b>2017:</b> 2.3%. The challenge ends: the problem is basically solved."];
  const X0=90, X1=870, Y0=70, Y1=560, ymax=30, yv=v=>Y1-(v/ymax)*(Y1-Y0), bw=60, bx=i=>X0+30+i*((X1-X0-60)/8);
  let k=2, bars=[];
  // axes and grid
  for(let v=0;v<=30;v+=10){ svgEl("line",{x1:X0,x2:X1,y1:yv(v),y2:yv(v),stroke:LINE},svg); const t=svgEl("text",{x:X0-12,y:yv(v)+5,"text-anchor":"end",fill:MUTE,"font-size":15,"font-family":MONO},svg); t.textContent=v+"%"; }
  const yl=svgEl("text",{x:X0,y:40,fill:MUTE,"font-size":15,"font-family":MONO},svg); yl.textContent="top-5 error (lower is better)";
  const hum=svgEl("g",{},svg);
  svgEl("line",{x1:X0,x2:X1,y1:yv(5.1),y2:yv(5.1),stroke:INK,"stroke-dasharray":"8 6","stroke-width":2,"stroke-opacity":.6},hum);
  const ht=svgEl("text",{x:X1,y:yv(5.1)-10,"text-anchor":"end",fill:INK,"font-size":15,"font-family":MONO,"fill-opacity":.75},hum); ht.textContent="human (one expert) ≈ 5%";
  const ghost=svgEl("g",{},svg);
  svgEl("rect",{x:bx(2)+bw/2+6,y:yv(26.2),width:26,height:Y1-yv(26.2),fill:"none",stroke:MUTE,"stroke-dasharray":"4 4"},ghost);
  const gt=svgEl("text",{x:bx(2)+bw/2+19,y:yv(26.2)-8,"text-anchor":"middle",fill:MUTE,"font-size":13,"font-family":MONO},ghost); gt.textContent="2nd";
  D.forEach(([yr,v,who],i)=>{ const g=svgEl("g",{},svg);
    const col=i<2?"#8f87b8":Y;
    const r=svgEl("rect",{x:bx(i)-bw/2,y:Y1,width:bw,height:0,rx:6,fill:col},g);
    const t=svgEl("text",{x:bx(i),y:Y1-8,"text-anchor":"middle",fill:INK,"font-size":18,"font-weight":700,"font-family":SANS},g); t.textContent=v+"%";
    const w=svgEl("text",{x:bx(i),y:Y1-30,"text-anchor":"middle",fill:MUTE,"font-size":13,"font-family":MONO},g); w.textContent=who;
    const y=svgEl("text",{x:bx(i),y:Y1+26,"text-anchor":"middle",fill:MUTE,"font-size":16,"font-family":MONO},g); y.textContent=yr;
    bars.push({g,r,t,w,v}); });
  const leg=svgEl("g",{},svg);
  [["#8f87b8","traditional computer vision"],[Y,"deep learning"]].forEach(([c,l],i)=>{ svgEl("rect",{x:520,y:96+i*28,width:18,height:18,rx:4,fill:c},leg); const t=svgEl("text",{x:546,y:110+i*28,fill:INK,"font-size":16,"font-family":SANS},leg); t.textContent=l; });
  function show(n,anim){ k=n;
    bars.forEach((b,i)=>{ const on=i<k, h=on?Y1-yv(b.v):0;
      b.r.style.transition=anim?"y .8s cubic-bezier(.2,.7,.2,1),height .8s cubic-bezier(.2,.7,.2,1)":"none";
      b.r.setAttribute("y",Y1-h); b.r.setAttribute("height",h);
      [b.t,b.w].forEach(t=>{ t.style.transition=anim?"opacity .5s .4s":"none"; t.style.opacity=on?1:0; });
      b.t.setAttribute("y",Y1-h-8); b.w.setAttribute("y",Y1-h-30);
      b.g.style.opacity=on?(i===k-1?1:.75):.15; });
    ghost.style.opacity=k===3?1:k>3?.4:0; ghost.style.transition="opacity .5s";
    hum.style.opacity=k>=6?1:.25; hum.style.transition="opacity .6s";
    note.innerHTML=NOTES[k]+(k<8?" <span class='muted'>Click for the next year.</span>":"");
  }
  document.querySelector('[data-id="alexnet"]').addEventListener("click",e=>{ if(e.target.closest("button,a")) return; advance(); });
  A.alexnet={ enter(dir){ show(dir<0?8:2,false); }, step(){ if(k>=8) return false; show(k+1,true); return true; }, back(){ if(k<=2) return false; show(k-1,true); return true; } };
})();

/* ---------- doodle: a tiny $1-style shape recognizer ---------- */
(() => {
  const cv=$("ddCv"), say=$("ddSay"), gEl=$("ddGuess");
  const NP=64, SZ=250;
  const path=(pts,n=NP)=>{ // resample a polyline to n evenly spaced points
    const P=pts.map(p=>({x:p.x,y:p.y})); let len=0; for(let i=1;i<P.length;i++) len+=Math.hypot(P[i].x-P[i-1].x,P[i].y-P[i-1].y);
    const I=len/(n-1); let D=0; const out=[P[0]];
    for(let i=1;i<P.length;i++){ const d=Math.hypot(P[i].x-P[i-1].x,P[i].y-P[i-1].y);
      if(D+d>=I&&d>0){ const q={x:P[i-1].x+((I-D)/d)*(P[i].x-P[i-1].x),y:P[i-1].y+((I-D)/d)*(P[i].y-P[i-1].y)}; out.push(q); P.splice(i,0,q); D=0; } else D+=d; }
    while(out.length<n) out.push(P[P.length-1]); return out.slice(0,n); };
  const cen=P=>({x:P.reduce((s,p)=>s+p.x,0)/P.length,y:P.reduce((s,p)=>s+p.y,0)/P.length});
  const rot=(P,a)=>{ const c=cen(P), co=Math.cos(a), si=Math.sin(a); return P.map(p=>({x:(p.x-c.x)*co-(p.y-c.y)*si+c.x,y:(p.x-c.x)*si+(p.y-c.y)*co+c.y})); };
  function norm(pts){ let P=path(pts); const c=cen(P); P=rot(P,-Math.atan2(P[0].y-c.y,P[0].x-c.x));
    let mnx=1e9,mny=1e9,mxx=-1e9,mxy=-1e9; for(const p of P){ mnx=Math.min(mnx,p.x); mny=Math.min(mny,p.y); mxx=Math.max(mxx,p.x); mxy=Math.max(mxy,p.y); }
    const w=Math.max(mxx-mnx,1e-3), h=Math.max(mxy-mny,1e-3); P=P.map(p=>({x:p.x*SZ/w,y:p.y*SZ/h})); const c2=cen(P); return P.map(p=>({x:p.x-c2.x,y:p.y-c2.y})); }
  const pd=(A,B)=>A.reduce((s,p,i)=>s+Math.hypot(p.x-B[i].x,p.y-B[i].y),0)/A.length;
  function dist(P,T){ let a=-Math.PI/4,b=Math.PI/4; const phi=.5*(Math.sqrt(5)-1);
    let x1=phi*a+(1-phi)*b, f1=pd(rot(P,x1),T), x2=(1-phi)*a+phi*b, f2=pd(rot(P,x2),T);
    while(Math.abs(b-a)>.035){ if(f1<f2){ b=x2; x2=x1; f2=f1; x1=phi*a+(1-phi)*b; f1=pd(rot(P,x1),T); } else { a=x1; x1=x2; f1=f2; x2=(1-phi)*a+phi*b; f2=pd(rot(P,x2),T); } }
    return Math.min(f1,f2); }
  // templates: closed shapes get every start point in both directions
  const T=[]; const add=(name,pts,closed)=>{ const n=closed?pts.length:1;
    for(let s=0;s<n;s++) for(const rev of [false,true]){ let q=closed?[...pts.slice(s),...pts.slice(0,s),pts[s]]:[...pts]; if(rev) q.reverse(); T.push({name,P:norm(q)}); } };
  const ring=(n,f)=>Array.from({length:n},(_,i)=>f(i/n*Math.PI*2));
  for(let s=0;s<4;s++) for(const d of [1,-1]) T.push({name:"circle",P:norm(Array.from({length:33},(_,j)=>({x:Math.cos(s*Math.PI/2+d*j/32*Math.PI*2),y:Math.sin(s*Math.PI/2+d*j/32*Math.PI*2)})))});
  add("square",[{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}],true);
  add("triangle",[{x:.5,y:0},{x:1,y:.87},{x:0,y:.87}],true);
  add("star",[0,2,4,1,3].map(i=>({x:Math.cos(-Math.PI/2+i*Math.PI*2/5),y:Math.sin(-Math.PI/2+i*Math.PI*2/5)})),true);
  const heart=ring(48,t=>({x:16*Math.sin(t)**3,y:-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))}));
  for(let s=0;s<48;s+=12) for(const rev of [false,true]){ let q=[...heart.slice(s),...heart.slice(0,s),heart[s]]; if(rev) q.reverse(); T.push({name:"heart",P:norm(q)}); }
  const zz=[{x:0,y:0},{x:1,y:1},{x:2,y:0},{x:3,y:1},{x:4,y:0}]; add("zigzag",zz,false); add("zigzag",zz.map(p=>({x:p.x,y:1-p.y})),false);
  const NAMES=["circle","square","triangle","star","heart","zigzag"];
  let strokes=[], drawing=null, target="circle", timer=0, won=false;
  function newTarget(){ const o=NAMES.filter(n=>n!==target); target=pick(o); $("ddWord").textContent=(target==="zigzag"?"a ":"a ")+target; clear(); say.textContent=""; }
  function clear(){ strokes=[]; won=false; showGuess(null); redraw(); }
  function redraw(){ const x=ctxOf(cv), W=cv.offsetWidth, H=cv.offsetHeight; x.fillStyle="#f6f3ea"; x.fillRect(0,0,W,H);
    x.strokeStyle="#18181b"; x.lineWidth=7; x.lineCap="round"; x.lineJoin="round";
    for(const s of [...strokes,drawing].filter(Boolean)){ x.beginPath(); s.forEach((p,i)=>i?x.lineTo(p.x,p.y):x.moveTo(p.x,p.y)); x.stroke(); } }
  function showGuess(list){
    gEl.innerHTML=(list||NAMES.map(n=>[n,0])).slice(0,4).map(([n,p])=>`<div class="gRow"><span>${n}</span><span class="bar"><i style="width:${(p*100).toFixed(0)}%"></i></span><span class="pc">${(p*100).toFixed(0)}%</span></div>`).join(""); }
  function recognize(){
    const pts=strokes.flat(); if(pts.length<8) return;
    const P=norm(pts), best={}; for(const t of T){ const d=dist(P,t.P); if(best[t.name]==null||d<best[t.name]) best[t.name]=d; }
    const e=NAMES.map(n=>[n,Math.exp(-best[n]/9)]), s=e.reduce((a,b)=>a+b[1],0); const list=e.map(([n,v])=>[n,v/s]).sort((a,b)=>b[1]-a[1]);
    showGuess(list); const [top,p]=list[0];
    if(top===target&&p>.4){ won=true; say.textContent=`Oh, I know! It’s ${top==="zigzag"?"a":"a"} ${top}!`; setTimeout(()=>{ if(won&&cur>=0&&slides[cur].dataset.id==="doodle") newTarget(); },1700); }
    else say.textContent=p>.5?`I see… a ${top}?`:`Hmm… ${list[0][0]}? ${list[1][0]}?`;
  }
  cv.addEventListener("pointerdown",e=>{ if(won) return; cv.setPointerCapture(e.pointerId); drawing=[ptr(e,cv)]; clearTimeout(timer); });
  cv.addEventListener("pointermove",e=>{ if(!drawing) return; drawing.push(ptr(e,cv)); redraw(); });
  const up=()=>{ if(!drawing) return; if(drawing.length>2) strokes.push(drawing); drawing=null; redraw(); clearTimeout(timer); timer=setTimeout(recognize,350); };
  cv.addEventListener("pointerup",up); cv.addEventListener("pointercancel",up);
  $("ddClear").onclick=()=>{ clear(); say.textContent=""; }; $("ddSkip").onclick=newTarget;
  A.doodle={ enter(){ fitCanvas(cv); newTarget(); } };
})();

/* ---------- backprop: train a tiny network on a diagonal pattern ---------- */
(() => {
  const cv=$("bpCv"), cap=$("bpCap"), lis=[...$("bpSteps").children];
  const H=6, lr=.5; let w1, b1, w2, b2, data=[], losses=[], epoch=0, running=false, anim=null, map=null;
  function init(){ w1=Array.from({length:H},()=>[rnd(-1,1),rnd(-1,1)]); b1=Array.from({length:H},()=>rnd(-.5,.5)); w2=Array.from({length:H},()=>rnd(-1,1)); b2=0;
    data=[]; for(const [cx,cy,l] of [[-.55,-.55,0],[.55,.55,0],[-.55,.55,1],[.55,-.55,1]]) for(let i=0;i<10;i++) data.push({x:cx+rnd(-.25,.25),y:cy+rnd(-.25,.25),l});
    losses=[loss()]; epoch=0; map=null; }
  const sig=v=>1/(1+Math.exp(-v));
  function fwd(x,y){ const h=w1.map((w,i)=>Math.tanh(w[0]*x+w[1]*y+b1[i])); const o=sig(h.reduce((s,v,i)=>s+v*w2[i],b2)); return {h,o}; }
  function loss(){ let L=0; for(const d of data){ const o=clamp(fwd(d.x,d.y).o,1e-6,1-1e-6); L-=d.l?Math.log(o):Math.log(1-o); } return L/data.length; }
  function train(){ const gw1=w1.map(()=>[0,0]), gb1=b1.map(()=>0), gw2=w2.map(()=>0); let gb2=0;
    for(const d of data){ const {h,o}=fwd(d.x,d.y), e=o-d.l; gb2+=e;
      h.forEach((hv,i)=>{ gw2[i]+=e*hv; const dh=e*w2[i]*(1-hv*hv); gb1[i]+=dh; gw1[i][0]+=dh*d.x; gw1[i][1]+=dh*d.y; }); }
    const n=data.length; b2-=lr*gb2/n; for(let i=0;i<H;i++){ w2[i]-=lr*gw2[i]/n; b1[i]-=lr*gb1[i]/n; w1[i][0]-=lr*gw1[i][0]/n; w1[i][1]-=lr*gw1[i][1]/n; }
    epoch++; losses.push(loss()); if(losses.length>600) losses.splice(1,1); map=null; }
  const setRun=v=>{ running=v; $("bpRun").textContent=v?"Pause ❚❚":"Train ▶"; $("bpRun").classList.toggle("on",!v); };
  $("bpRun").onclick=()=>{ anim=null; setRun(!running); };
  $("bpStep").onclick=()=>{ setRun(false); anim={t:0}; };
  $("bpReset").onclick=()=>{ setRun(false); anim=null; init(); };
  function draw(now){
    const W=cv.offsetWidth, Ht=cv.offsetHeight, x=ctxOf(cv); x.fillStyle="#0d0d0f"; x.fillRect(0,0,W,Ht);
    // network diagram
    const IX=60, HX=210, OX=350, ys=(n,i)=>Ht/2-40+(i-(n-1)/2)*62, inY=[ys(2,0)-40,ys(2,1)+40];
    const ph=anim?(anim.t<1?0:anim.t<2?1:2):-1;
    const edge=(x1,y1,x2,y2,w)=>{ x.strokeStyle=w>0?`rgba(255,194,14,${.25+Math.min(.7,Math.abs(w)/3)})`:`rgba(106,184,255,${.25+Math.min(.7,Math.abs(w)/3)})`; x.lineWidth=.6+Math.min(6,Math.abs(w)*1.6); x.beginPath(); x.moveTo(x1,y1); x.lineTo(x2,y2); x.stroke(); };
    for(let i=0;i<H;i++){ edge(IX,inY[0],HX,ys(H,i),w1[i][0]); edge(IX,inY[1],HX,ys(H,i),w1[i][1]); edge(HX,ys(H,i),OX,Ht/2-40,w2[i]); }
    if(anim){ const t=anim.t%1, fwdP=anim.t<1, col=fwdP?Y:RED; x.fillStyle=col;
      for(let i=0;i<H;i++){ for(const yy of inY){ const [ax,ay,bx,by]=fwdP?[IX,yy,HX,ys(H,i)]:[HX,ys(H,i),IX,yy]; const tt=fwdP?clamp(t*2,0,1):clamp(t*2-1,0,1); x.beginPath(); x.arc(ax+(bx-ax)*tt,ay+(by-ay)*tt,4,0,7); x.fill(); }
        const [ax,ay,bx,by]=fwdP?[HX,ys(H,i),OX,Ht/2-40]:[OX,Ht/2-40,HX,ys(H,i)]; const tt=fwdP?clamp(t*2-1,0,1):clamp(t*2,0,1); x.beginPath(); x.arc(ax+(bx-ax)*tt,ay+(by-ay)*tt,4,0,7); x.fill(); } }
    const node=(nx,ny,c,l)=>{ x.fillStyle="#1c1c20"; x.strokeStyle=c; x.lineWidth=3; x.beginPath(); x.arc(nx,ny,15,0,7); x.fill(); x.stroke(); if(l){ x.fillStyle=MUTE; x.font=`14px ${MONO}`; x.textAlign="center"; x.fillText(l,nx,ny+36); } };
    node(IX,inY[0],BLUE,"x"); node(IX,inY[1],BLUE,"y"); for(let i=0;i<H;i++) node(HX,ys(H,i),"#8a8a94"); node(OX,Ht/2-40,ph===1||ph===2?RED:Y,"guess");
    x.textAlign="left"; x.fillStyle=MUTE; x.font=`14px ${MONO}`; x.fillText("yellow = positive weight · blue = negative",24,30);
    // decision map
    const M=360, mx=W-M-30, my=40, G=36;
    if(!map){ map=[]; for(let j=0;j<G;j++) for(let i=0;i<G;i++) map.push(fwd(-1+2*(i+.5)/G,1-2*(j+.5)/G).o); }
    for(let j=0;j<G;j++) for(let i=0;i<G;i++){ const o=map[j*G+i]; x.fillStyle=`rgba(${Math.round(106+(255-106)*o)},${Math.round(184+(194-184)*o)},${Math.round(255-(255-14)*o)},.33)`; x.fillRect(mx+i*M/G,my+j*M/G,M/G+.5,M/G+.5); }
    x.strokeStyle=LINE; x.lineWidth=1; x.strokeRect(mx,my,M,M);
    let right=0; for(const d of data){ const o=fwd(d.x,d.y).o, ok=(o>.5)===!!d.l; if(ok) right++;
      x.fillStyle=d.l?Y:BLUE; x.strokeStyle=ok?"#0d0d0f":RED; x.lineWidth=ok?2:3; x.beginPath(); x.arc(mx+(d.x+1)/2*M,my+(1-d.y)/2*M,7,0,7); x.fill(); x.stroke(); }
    // loss curve
    const ly=my+M+40, lh=Ht-ly-40, mxL=Math.max(...losses,.01);
    x.fillStyle=MUTE; x.font=`14px ${MONO}`; x.fillText(`loss ${losses[losses.length-1].toFixed(3)} · ${right}/${data.length} correct`,mx,ly-12);
    x.strokeStyle=LINE; x.strokeRect(mx,ly,M,lh); x.strokeStyle=RED; x.lineWidth=2; x.beginPath();
    losses.forEach((l,i)=>{ const px=mx+i/(Math.max(losses.length-1,1))*M, py=ly+lh-(l/mxL)*lh; i?x.lineTo(px,py):x.moveTo(px,py); }); x.stroke();
    cap.textContent=`epoch ${epoch}`;
    lis.forEach((li,i)=>li.classList.toggle("on",anim?(ph===0&&i===0)||(ph===1&&(i===1||i===2))||(ph===2&&i===3):running));
  }
  init();
  A.backprop={ enter(){ setRun(false); anim=null; },
    tick(dt,now){ if(running){ for(let i=0;i<4;i++) train(); if(losses[losses.length-1]<.02) setRun(false); }
      if(anim){ anim.t+=dt/900; if(anim.t>=2&&!anim.done){ anim.done=1; train(); } if(anim.t>=2.6) anim=null; }
      draw(now); } };
})();

/* ---------- recipe: data + algorithm + compute ---------- */
(() => {
  const ICONS={
    data:`<svg viewBox="0 0 96 80"><g fill="none" stroke="#ffc20e" stroke-width="3"><ellipse cx="48" cy="16" rx="30" ry="9"/><path d="M18 16v44c0 5 13 9 30 9s30-4 30-9V16"/><path d="M18 31c0 5 13 9 30 9s30-4 30-9M18 46c0 5 13 9 30 9s30-4 30-9"/></g></svg>`,
    algo:`<svg viewBox="0 0 96 80"><g stroke="#6ab8ff" stroke-width="2" opacity=".7"><path d="M14 20L48 12M14 20L48 40M14 20L48 68M14 60L48 12M14 60L48 40M14 60L48 68M48 12L82 40M48 40L82 40M48 68L82 40"/></g><g fill="#1c1c20" stroke="#6ab8ff" stroke-width="3"><circle cx="14" cy="20" r="7"/><circle cx="14" cy="60" r="7"/><circle cx="48" cy="12" r="7"/><circle cx="48" cy="40" r="7"/><circle cx="48" cy="68" r="7"/><circle cx="82" cy="40" r="7"/></g></svg>`,
    comp:`<svg viewBox="0 0 96 80"><g fill="none" stroke="#5fd68a" stroke-width="3"><rect x="8" y="18" width="80" height="40" rx="6"/><circle cx="34" cy="38" r="12"/><circle cx="64" cy="38" r="12"/><path d="M16 58v10M26 58v10M36 58v10M46 58v10M56 58v10M66 58v10M76 58v10"/></g></svg>`,
  };
  const ING=[
    ["data","Data","Examples to learn from",[[0,"a few hundred examples"],[30,"thousands of examples"],[55,"ImageNet: 14 million images"],[85,"a huge slice of the internet"]]],
    ["algo","Algorithm","How the network learns",[[0,"a single perceptron"],[30,"backprop, small networks"],[55,"deep convolutional networks"],[85,"transformers"]]],
    ["comp","Compute","Hardware to train on",[[0,"a 1980s desktop"],[30,"a fast PC"],[55,"two gaming GPUs"],[85,"thousands of data-center GPUs"]]],
  ];
  const YEARS={ "1986":[8,40,5,"Backprop exists, but data is tiny and computers are slow."], "2012":[62,62,58,"ImageNet + gaming GPUs + deep CNNs = AlexNet."], "2022":[96,94,97,"Internet-scale text + GPU farms + transformers = ChatGPT."] };
  const box=$("ing"); let v={data:50,algo:50,comp:50}, yr=null;
  box.innerHTML=ING.map(([k,t,s])=>`<div class="card"><div>${ICONS[k]}</div><div class="t">${t}</div><div class="s" id="rcS_${k}">${s}</div><input type="range" min="0" max="100" value="50" id="rcR_${k}" aria-label="${t}"></div>`).join("");
  $("years").innerHTML=Object.keys(YEARS).map(y=>`<button class="btn" data-y="${y}">${y}</button>`).join("");
  const net=$("rcNet"); const NODES=[[30,40],[30,110],[110,25],[110,75],[110,125],[190,50],[190,100],[240,75]], EDG=[[0,2],[0,3],[0,4],[1,2],[1,3],[1,4],[2,5],[2,6],[3,5],[3,6],[4,5],[4,6],[5,7],[6,7]];
  const eEls=EDG.map(([a,b])=>svgEl("line",{x1:NODES[a][0],y1:NODES[a][1],x2:NODES[b][0],y2:NODES[b][1],stroke:Y,"stroke-width":2},net));
  const nEls=NODES.map(([x,y])=>svgEl("circle",{cx:x,cy:y,r:9,fill:"#1c1c20",stroke:Y,"stroke-width":3},net));
  function upd(){
    ING.forEach(([k,,,lv])=>{ $("rcR_"+k).value=v[k]; $("rcS_"+k).textContent=lv.filter(l=>v[k]>=l[0]).pop()[1]; });
    const q=Math.cbrt(Math.max(v.data,1)*Math.max(v.algo,1)*Math.max(v.comp,1))/100;
    $("rcG").style.width=(q*100)+"%"; $("rcG").style.backgroundSize=`${100/Math.max(q,.05)}% 100%`;
    const low=ING.map(i=>i[0]).sort((a,b)=>v[a]-v[b])[0], nm={data:"data",algo:"a better algorithm",comp:"compute"}[low];
    const msg=q<.2?"Barely learns anything. Random guesses.":q<.45?`Learns a little, but it’s weak. The bottleneck is ${nm}.`:q<.75?`A useful model! More ${nm} would help most.`:"State of the art. All three ingredients are strong.";
    $("rcV").innerHTML=(yr?`<b class="y">${yr}:</b> ${YEARS[yr][3]}<br>`:"")+msg;
    eEls.forEach(e=>e.setAttribute("stroke-opacity",.08+q*.8)); nEls.forEach(n=>n.setAttribute("fill",q>.75?Y:"#1c1c20"));
    nEls.forEach(n=>n.style.filter=q>.6?`drop-shadow(0 0 ${q*10}px rgba(255,194,14,.8))`:"none");
    document.querySelectorAll("#years .btn").forEach(b=>b.classList.toggle("on",b.dataset.y===yr));
  }
  ING.forEach(([k])=>$("rcR_"+k).oninput=e=>{ v[k]=+e.target.value; yr=null; upd(); });
  $("years").onclick=e=>{ const b=e.target.closest("[data-y]"); if(!b) return; yr=b.dataset.y; const [d,a,c]=YEARS[yr]; v={data:d,algo:a,comp:c}; upd(); };
  upd();
  A.recipe={ enter(){ yr="1986"; const [d,a,c]=YEARS[yr]; v={data:d,algo:a,comp:c}; upd(); } };
})();

/* ---------- gpu: cpu vs gpu race ---------- */
(() => {
  const C=[$("gpC0"),$("gpC1")], T=[$("gpT0"),$("gpT1")], GW=48, GH=36, N=GW*GH;
  const LANES=[{cores:8,ms:14},{cores:512,ms:180}];
  let st=null;
  const col=(i,j)=>{ const v=Math.sin(i*.25)+Math.sin(j*.3)+Math.sin((i+j)*.18)+Math.sin(Math.hypot(i-GW/2,j-GH/2)*.35); const h=(v+4)/8; return `hsl(${(h*300+20)|0},80%,${45+h*15}%)`; };
  function go(){ st={t:0,done:[0,0]}; $("gpGo").textContent="Race again ▶"; }
  $("gpGo").onclick=go;
  function draw(){
    C.forEach((cv,l)=>{ const x=ctxOf(cv), W=cv.offsetWidth, H=cv.offsetHeight, cw=W/GW, ch=H/GH; x.fillStyle="#0d0d0f"; x.fillRect(0,0,W,H);
      if(!st) { x.fillStyle=MUTE; x.font=`16px ${MONO}`; x.textAlign="center"; x.fillText(`${N.toLocaleString()} pixels to shade`,W/2,H/2); x.textAlign="left"; return; }
      const {cores,ms}=LANES[l], waves=Math.floor(st.t/ms), done=Math.min(N,waves*cores), busy=done<N?Math.min(cores,N-done):0;
      for(let k=0;k<done;k++){ const i=k%GW, j=(k/GW)|0; x.fillStyle=col(i,j); x.fillRect(i*cw,j*ch,cw+.5,ch+.5); }
      x.fillStyle="#fff"; for(let k=done;k<done+busy;k++){ const i=k%GW, j=(k/GW)|0; x.fillRect(i*cw,j*ch,cw+.5,ch+.5); }
      if(done>=N&&!st.done[l]) st.done[l]=Math.ceil(N/cores)*ms;
      T[l].textContent=((st.done[l]||st.t)/1000).toFixed(1)+" s"; });
  }
  A.gpu={ enter(){ st=null; T.forEach(t=>t.textContent="0.0 s"); $("gpGo").textContent="Race ▶"; }, tick(dt){ if(st&&!(st.done[0]&&st.done[1])) st.t+=dt; draw(); } };
})();

/* ---------- alphago: a go board + why search fails ---------- */
(() => {
  const cv=$("agBoard"), N=19; let stones=[], grid=null, last=0, fade=1;
  function reset(){ stones=[]; grid=new Int8Array(N*N); fade=1; }
  function place(){
    const color=stones.length%2?2:1; let x,y;
    if(!stones.length){ x=3; y=15; }
    else { for(let t=0;t<40;t++){ const s=pick(stones.slice(-12)); x=s.x+Math.round(rnd(-2.4,2.4)); y=s.y+Math.round(rnd(-2.4,2.4)); if(x>=0&&y>=0&&x<N&&y<N&&!grid[y*N+x]) break; x=null; }
      if(x==null){ do{ x=(Math.random()*N)|0; y=(Math.random()*N)|0; } while(grid[y*N+x]); } }
    grid[y*N+x]=color; stones.push({x,y,c:color,t:performance.now()});
  }
  function draw(now){
    const x=ctxOf(cv), W=cv.offsetWidth, H=cv.offsetHeight; x.clearRect(0,0,W,H);
    const S=Math.min(W,H)-44, g=S/(N-1), ox=(W-S)/2, oy=(H-S)/2;
    x.strokeStyle="rgba(40,26,8,.75)"; x.lineWidth=1.2;
    for(let i=0;i<N;i++){ x.beginPath(); x.moveTo(ox,oy+i*g); x.lineTo(ox+S,oy+i*g); x.moveTo(ox+i*g,oy); x.lineTo(ox+i*g,oy+S); x.stroke(); }
    x.fillStyle="rgba(40,26,8,.85)"; for(const a of [3,9,15]) for(const b of [3,9,15]){ x.beginPath(); x.arc(ox+a*g,oy+b*g,3.5,0,7); x.fill(); }
    x.globalAlpha=fade;
    stones.forEach((s,i)=>{ const k=ease((now-s.t)/250), r=g*.47*(.6+.4*k), cx=ox+s.x*g, cy=oy+s.y*g;
      const gr=x.createRadialGradient(cx-r*.35,cy-r*.35,r*.1,cx,cy,r);
      if(s.c===1){ gr.addColorStop(0,"#555"); gr.addColorStop(1,"#0b0b0b"); } else { gr.addColorStop(0,"#fff"); gr.addColorStop(1,"#c9c6bd"); }
      x.fillStyle=gr; x.beginPath(); x.arc(cx,cy,r,0,7); x.fill();
      if(i===stones.length-1){ x.strokeStyle=s.c===1?"#fff":"#000"; x.lineWidth=2; x.beginPath(); x.arc(cx,cy,r*.45,0,7); x.stroke(); } });
    x.globalAlpha=1;
  }
  const sup=n=>String(n).split("").map(c=>"⁰¹²³⁴⁵⁶⁷⁸⁹"[c]).join("");
  const big=e=>e<6?fmt(Math.pow(10,e)):`${Math.pow(10,e%1).toFixed(1)} × 10${sup(Math.floor(e))}`;
  function dur(l){ // l = log10 of seconds
    if(l<0) return "less than a second"; const s=Math.pow(10,l);
    if(s<60) return `${s.toFixed(0)} seconds`; if(s<3600) return `${(s/60).toFixed(0)} minutes`; if(s<86400) return `${(s/3600).toFixed(0)} hours`;
    if(s<3.156e7) return `${(s/86400).toFixed(0)} days`; const y=l-Math.log10(3.156e7);
    return y<6?`${fmt(Math.pow(10,y))} years`:`about 10${sup(Math.floor(y))} years`; }
  function calc(){ const n=+$("agR").value; $("agN").textContent=n;
    const ec=n*Math.log10(35), eg=n*Math.log10(250); $("agC").textContent=big(ec); $("agG").textContent=big(eg);
    const ly=eg-Math.log10(2e8)-Math.log10(3.156e7);
    $("agT").innerHTML=`Deep Blue checked about 200 million positions a second. At that speed, every Go line ${n} move${n>1?"s":""} deep would take <b>${dur(eg-Math.log10(2e8))}</b>.`+(ly>10.14?" That’s far longer than the universe has existed.":"")+(eg>80?" There are more lines to check than atoms in the universe!":""); }
  $("agR").oninput=calc; calc();
  A.alphago={ enter(){ reset(); for(let i=0;i<14;i++) place(); stones.forEach(s=>s.t=0); last=performance.now(); },
    tick(dt,now){ if(now-last>480){ last=now; if(stones.length>150){ fade-=.05; if(fade<=0) reset(); } else place(); } draw(now); } };
})();

/* ---------- play go: two players, one board ---------- */
(() => {
  const cv=$("goCv"), N=9, KOMI=6.5, STAR=[[2,2],[6,2],[4,4],[2,6],[6,6]];
  let bd, turn, caps, seen, stack, passes, last, over, hover=null, msg="";
  const nb=i=>{ const x=i%N, y=(i/N)|0, o=[]; if(x>0) o.push(i-1); if(x<N-1) o.push(i+1); if(y>0) o.push(i-N); if(y<N-1) o.push(i+N); return o; };
  function group(b,i){ const c=b[i], g=new Set([i]), libs=new Set(), q=[i];
    while(q.length){ const k=q.pop(); for(const n of nb(k)){ if(b[n]===0) libs.add(n); else if(b[n]===c&&!g.has(n)){ g.add(n); q.push(n); } } }
    return {g,libs}; }
  function reset(){ bd=new Int8Array(N*N); turn=1; caps=[0,0,0]; seen=new Set([bd.join("")]); stack=[]; passes=0; last=-1; over=null; msg="Black to play. Click an intersection."; status(); }
  const name=c=>c===1?"Black":"White";
  function play(i){
    if(over) return; if(bd[i]){ msg="That point is taken."; status(); return; }
    const b=bd.slice(), opp=3-turn; b[i]=turn; let got=0;
    for(const n of nb(i)) if(b[n]===opp){ const {g,libs}=group(b,n); if(!libs.size){ for(const k of g){ b[k]=0; got++; } } }
    if(!group(b,i).libs.size){ msg="Not allowed: your stone would have no liberties."; status(); return; }
    const key=b.join(""); if(seen.has(key)){ msg="Not allowed: ko. That repeats an earlier board. Play somewhere else first."; status(); return; }
    stack.push({bd:bd.slice(),turn,caps:caps.slice(),passes,last,key:null}); stack[stack.length-1].added=key;
    bd=b; seen.add(key); caps[turn]+=got; passes=0; last=i; turn=opp;
    msg=got?`${name(3-turn)} captured ${got} stone${got>1?"s":""}!`:`${name(turn)} to play.`; status(); }
  function pass(){ if(over) return; stack.push({bd:bd.slice(),turn,caps:caps.slice(),passes,last,added:null}); passes++; last=-1; turn=3-turn;
    if(passes>=2){ over=score(); msg=`Game over. Black ${over.b} · White ${over.w} (incl. ${KOMI} komi). <b>${over.b>over.w?"Black":"White"} wins!</b>`; }
    else msg=`${name(3-turn)} passed. ${name(turn)} to play (pass too to end the game).`; status(); }
  function undo(){ const s=stack.pop(); if(!s) return; if(s.added) seen.delete(s.added); bd=s.bd; turn=s.turn; caps=s.caps; passes=s.passes; last=s.last; over=null; msg=`${name(turn)} to play.`; status(); }
  function score(){ const own=new Int8Array(N*N), visited=new Uint8Array(N*N); let b=0,w=0;
    for(let i=0;i<N*N;i++){ if(bd[i]===1) b++; else if(bd[i]===2) w++; else if(!visited[i]){ const reg=[i], q=[i]; const border=new Set(); visited[i]=1;
      while(q.length){ const k=q.pop(); for(const n of nb(k)){ if(bd[n]===0&&!visited[n]){ visited[n]=1; reg.push(n); q.push(n); } else if(bd[n]) border.add(bd[n]); } }
      if(border.size===1){ const c=[...border][0]; for(const k of reg) own[k]=c; if(c===1) b+=reg.length; else w+=reg.length; } } }
    return {b,w:w+KOMI,own}; }
  function status(){ $("goTurn").innerHTML=over?"Final score":`<i style="background:${turn===1?"#111":"#f2f0ea"}"></i>${name(turn)} to play`;
    $("goMsg").innerHTML=`${msg}<br><span class="mono" style="font-size:15px">captured · Black ${caps[1]} · White ${caps[2]}</span>`; }
  let geo=null;
  function cell(e){ const p=ptr(e,cv), i=Math.round((p.x-geo.ox)/geo.g), j=Math.round((p.y-geo.oy)/geo.g); return i>=0&&j>=0&&i<N&&j<N?j*N+i:null; }
  cv.addEventListener("pointermove",e=>{ if(geo) hover=cell(e); }); cv.addEventListener("pointerleave",()=>hover=null);
  cv.addEventListener("pointerdown",e=>{ if(!geo) return; const c=cell(e); if(c!=null) play(c); });
  $("goPass").onclick=pass; $("goUndo").onclick=undo; $("goNew").onclick=reset;
  function stone(x,cx,cy,r,c,alpha=1){ x.globalAlpha=alpha; const gr=x.createRadialGradient(cx-r*.35,cy-r*.35,r*.1,cx,cy,r);
    if(c===1){ gr.addColorStop(0,"#555"); gr.addColorStop(1,"#0b0b0b"); } else { gr.addColorStop(0,"#fff"); gr.addColorStop(1,"#c9c6bd"); }
    x.fillStyle=gr; x.beginPath(); x.arc(cx,cy,r,0,7); x.fill(); x.globalAlpha=1; }
  function draw(){
    const x=ctxOf(cv), W=cv.offsetWidth, H=cv.offsetHeight, S=Math.min(W,H)-90, g=S/(N-1), ox=(W-S)/2, oy=(H-S)/2; geo={g,ox,oy}; x.clearRect(0,0,W,H);
    x.strokeStyle="rgba(40,26,8,.85)"; x.lineWidth=1.5;
    for(let i=0;i<N;i++){ x.beginPath(); x.moveTo(ox,oy+i*g); x.lineTo(ox+S,oy+i*g); x.moveTo(ox+i*g,oy); x.lineTo(ox+i*g,oy+S); x.stroke(); }
    x.fillStyle="rgba(40,26,8,.9)"; for(const [a,b] of STAR){ x.beginPath(); x.arc(ox+a*g,oy+b*g,5,0,7); x.fill(); }
    const r=g*.47;
    // liberties of the hovered group
    let libs=null; if(hover!=null&&bd[hover]&&!over) libs=group(bd,hover);
    for(let i=0;i<N*N;i++){ const cx=ox+(i%N)*g, cy=oy+((i/N)|0)*g;
      if(bd[i]){ stone(x,cx,cy,r,bd[i]); if(libs&&libs.g.has(i)){ x.strokeStyle="#ffc20e"; x.lineWidth=3; x.beginPath(); x.arc(cx,cy,r-1,0,7); x.stroke(); } }
      if(i===last&&bd[i]){ x.strokeStyle=bd[i]===1?"#fff":"#000"; x.lineWidth=2.5; x.beginPath(); x.arc(cx,cy,r*.42,0,7); x.stroke(); }
      if(over&&!bd[i]&&over.own[i]){ x.fillStyle=over.own[i]===1?"#111":"#f2f0ea"; x.fillRect(cx-g*.15,cy-g*.15,g*.3,g*.3); } }
    if(libs){ for(const k of libs.libs){ const cx=ox+(k%N)*g, cy=oy+((k/N)|0)*g; x.fillStyle="rgba(46,160,90,.9)"; x.beginPath(); x.arc(cx,cy,9,0,7); x.fill(); }
      x.fillStyle="rgba(20,14,4,.85)"; x.font=`700 18px ${SANS}`; x.textAlign="center"; x.fillText(`${libs.libs.size} ${libs.libs.size===1?"liberty (in danger!)":"liberties"}`,W/2,oy-24); x.textAlign="left"; }
    else if(hover!=null&&!bd[hover]&&!over){ stone(x,ox+(hover%N)*g,oy+((hover/N)|0)*g,r,turn,.45); }
  }
  reset();
  A.gogame={ enter(){}, tick(){ draw(); } };
})();

/* ---------- reinforcement learning: q-learning in a grid world ---------- */
(() => {
  const cv=$("rlCv"), cap=$("rlCap"), C=8, R=6, START=[0,5], GOAL=[7,0];
  const D=[[0,-1],[1,0],[0,1],[-1,0]];  // up, right, down, left
  const DEF={"2,1":"wall","2,2":"wall","5,2":"wall","5,3":"wall","3,4":"lava","4,4":"lava","6,1":"lava"};
  let map={...DEF}, Q=new Float32Array(C*R*4), ep=0, hist=[], run=false, speed=1, tool="wall", agent=null, epR=0, watch=null, trail=[];
  const id=(x,y)=>y*C+x, eps=()=>Math.max(.05,Math.pow(.96,ep));
  const isGoal=(x,y)=>x===GOAL[0]&&y===GOAL[1];
  function newEp(){ agent={x:START[0],y:START[1],n:0}; epR=0; trail=[[agent.x,agent.y]]; }
  function best(x,y){ let b=0; for(let a=1;a<4;a++) if(Q[id(x,y)*4+a]>Q[id(x,y)*4+b]) b=a; return b; }
  function move(s,a){ const nx=s.x+D[a][0], ny=s.y+D[a][1];
    if(nx<0||ny<0||nx>=C||ny>=R||map[nx+","+ny]==="wall") return {x:s.x,y:s.y,r:-.5,done:false};
    if(map[nx+","+ny]==="lava") return {x:nx,y:ny,r:-10,done:true,lava:true};
    if(isGoal(nx,ny)) return {x:nx,y:ny,r:10,done:true,win:true};
    return {x:nx,y:ny,r:-.1,done:false}; }
  function learnStep(){
    const s=agent, a=Math.random()<eps()?(Math.random()*4)|0:best(s.x,s.y), o=move(s,a), k=id(s.x,s.y)*4+a;
    const target=o.r+(o.done?0:.95*Math.max(...Q.slice(id(o.x,o.y)*4,id(o.x,o.y)*4+4)));
    Q[k]+=.5*(target-Q[k]); epR+=o.r; agent={x:o.x,y:o.y,n:s.n+1}; trail.push([o.x,o.y]); if(trail.length>40) trail.shift();
    if(o.done||agent.n>=80){ ep++; hist.push(epR); if(hist.length>200) hist.shift(); agent.flash=o.win?"win":o.lava?"lava":null; newEp(); }
  }
  const setRun=v=>{ run=v; $("rlRun").textContent=v?"Pause ❚❚":"Train ▶"; $("rlRun").classList.toggle("on",!v); };
  $("rlRun").onclick=()=>{ watch=null; setRun(!run); };
  $("rlFast").onclick=()=>{ speed=speed===1?8:speed===8?200:1; $("rlFast").textContent=`Speed ×${speed}`; };
  $("rlTool").onclick=()=>{ tool=tool==="wall"?"lava":"wall"; $("rlTool").textContent=tool==="wall"?"Placing: 🧱 wall":"Placing: 🔥 lava"; };
  $("rlReset").onclick=()=>{ Q=new Float32Array(C*R*4); ep=0; hist=[]; watch=null; setRun(false); newEp(); };
  $("rlWatch").onclick=()=>{ setRun(false); watch={x:START[0],y:START[1],n:0,t:0,path:[[START[0],START[1]]],end:null}; };
  let geo=null;
  function layout(){ const W=cv.offsetWidth, H=cv.offsetHeight, top=70, gh=H-top-200, cs=Math.min((W-40)/C,gh/R); geo={W,H,cs,ox:(W-cs*C)/2,oy:top,cy:top+cs*R+30}; }
  cv.addEventListener("pointerdown",e=>{ if(!geo) return; const p=ptr(e,cv), x=Math.floor((p.x-geo.ox)/geo.cs), y=Math.floor((p.y-geo.oy)/geo.cs);
    if(x<0||y<0||x>=C||y>=R||(x===START[0]&&y===START[1])||isGoal(x,y)) return; const k=x+","+y; if(map[k]===tool) delete map[k]; else map[k]=tool; });
  function draw(now){
    layout(); const {W,H,cs,ox,oy,cy}=geo, x=ctxOf(cv); x.fillStyle="#0d0d0f"; x.fillRect(0,0,W,H);
    x.textAlign="center"; x.textBaseline="middle";
    for(let j=0;j<R;j++) for(let i=0;i<C;i++){ const k=i+","+j, px=ox+i*cs, py=oy+j*cs;
      if(map[k]==="wall"){ x.fillStyle="#3a3a42"; x.fillRect(px+1,py+1,cs-2,cs-2); x.font=`${cs*.45}px ${SANS}`; x.fillText("🧱",px+cs/2,py+cs/2); continue; }
      if(map[k]==="lava"){ x.fillStyle="#5a1f12"; x.fillRect(px+1,py+1,cs-2,cs-2); x.font=`${cs*.45}px ${SANS}`; x.fillText("🔥",px+cs/2,py+cs/2); continue; }
      const q=Q.slice(id(i,j)*4,id(i,j)*4+4), v=Math.max(...q), any=q.some(t=>t!==0);
      x.fillStyle=!any||isGoal(i,j)?"#1a1a1f":v>=0?`rgba(95,214,138,${Math.min(.75,v/10)})`:`rgba(255,90,78,${Math.min(.6,-v/8)})`; x.fillRect(px+1,py+1,cs-2,cs-2);
      if(any&&!isGoal(i,j)){ const b=best(i,j), [dx,dy]=D[b], cx=px+cs/2, cyy=py+cs/2, L=cs*.28;
        x.strokeStyle="rgba(243,241,234,.75)"; x.fillStyle="rgba(243,241,234,.75)"; x.lineWidth=3; x.beginPath(); x.moveTo(cx-dx*L,cyy-dy*L); x.lineTo(cx+dx*L,cyy+dy*L); x.stroke();
        x.beginPath(); x.moveTo(cx+dx*(L+6),cyy+dy*(L+6)); x.lineTo(cx+dx*L-dy*7,cyy+dy*L+dx*7); x.lineTo(cx+dx*L+dy*7,cyy+dy*L-dx*7); x.fill(); } }
    x.strokeStyle=LINE; x.lineWidth=1; for(let i=0;i<=C;i++){ x.beginPath(); x.moveTo(ox+i*cs,oy); x.lineTo(ox+i*cs,oy+R*cs); x.stroke(); } for(let j=0;j<=R;j++){ x.beginPath(); x.moveTo(ox,oy+j*cs); x.lineTo(ox+C*cs,oy+j*cs); x.stroke(); }
    x.font=`${cs*.55}px ${SANS}`; x.fillText("🧀",ox+GOAL[0]*cs+cs/2,oy+GOAL[1]*cs+cs/2);
    x.font=`600 13px ${MONO}`; x.fillStyle=MUTE; x.fillText("start",ox+START[0]*cs+cs/2,oy+START[1]*cs+cs-12);
    const tr=watch?watch.path:trail; x.strokeStyle=watch?"rgba(255,194,14,.85)":"rgba(255,194,14,.3)"; x.lineWidth=watch?5:3; x.beginPath();
    tr.forEach(([i,j],n)=>{ const px=ox+i*cs+cs/2, py=oy+j*cs+cs/2; n?x.lineTo(px,py):x.moveTo(px,py); }); x.stroke();
    const ag=watch||agent; if(ag){ x.font=`${cs*.55}px ${SANS}`; x.fillText("🐭",ox+ag.x*cs+cs/2,oy+ag.y*cs+cs/2); }
    // reward chart
    const ch=H-cy-30, cw=W-80; x.textAlign="left"; x.textBaseline="alphabetic"; x.fillStyle=MUTE; x.font=`14px ${MONO}`; x.fillText("reward per try (higher is better)",40,cy-6);
    x.strokeStyle=LINE; x.strokeRect(40,cy,cw,ch); const yv=v=>cy+ch-(clamp(v,-20,10)+20)/30*ch;
    x.setLineDash([4,4]); x.beginPath(); x.moveTo(40,yv(0)); x.lineTo(40+cw,yv(0)); x.stroke(); x.setLineDash([]);
    if(hist.length>1){ x.strokeStyle=Y; x.lineWidth=2; x.beginPath(); let m=hist[0];
      hist.forEach((v,i)=>{ m=m*.85+v*.15; const px=40+i/(hist.length-1)*cw; i?x.lineTo(px,yv(m)):x.moveTo(px,yv(m)); }); x.stroke(); }
    if(watch&&watch.end){ x.textAlign="center"; x.font=`700 30px ${SANS}`; x.fillStyle="rgba(13,13,15,.85)"; x.fillRect(ox,oy+R*cs/2-34,C*cs,68); x.fillStyle=watch.end==="win"?GREEN:RED; x.fillText(watch.end==="win"?`Found the cheese in ${watch.n} steps!`:watch.end==="lava"?"Ouch, lava! It needs more training.":"Got lost. It needs more training.",W/2,oy+R*cs/2); }
    cap.textContent=`tries: ${ep} · exploring randomly ${Math.round(eps()*100)}% of the time`;
  }
  function stepWatch(){ const a=best(watch.x,watch.y), o=move(watch,a); watch.x=o.x; watch.y=o.y; watch.n++; watch.path.push([o.x,o.y]);
    if(o.win) watch.end="win"; else if(o.lava) watch.end="lava"; else if(watch.n>=30) watch.end="lost"; }
  // the agent/environment loop diagram
  const loop=$("rlLoop"); let dot=null, pth=null;
  (()=>{ const box=(x,lab,col)=>{ svgEl("rect",{x,y:45,width:170,height:80,rx:14,fill:"#1c1c20",stroke:col,"stroke-width":2.5},loop); const t=svgEl("text",{x:x+85,y:92,"text-anchor":"middle",fill:INK,"font-size":22,"font-weight":700,"font-family":SANS},loop); t.textContent=lab; };
    box(10,"Agent 🐭",Y); box(380,"Environment",BLUE);
    pth=svgEl("path",{d:"M180 70 C 260 10, 300 10, 380 70 M380 100 C 300 160, 260 160, 180 100",fill:"none",stroke:MUTE,"stroke-width":2,"stroke-dasharray":"6 6"},loop);
    const l1=svgEl("text",{x:280,y:24,"text-anchor":"middle",fill:Y,"font-size":17,"font-family":MONO},loop); l1.textContent="action";
    const l2=svgEl("text",{x:280,y:162,"text-anchor":"middle",fill:BLUE,"font-size":17,"font-family":MONO},loop); l2.textContent="reward + new state";
    dot=svgEl("circle",{r:7,fill:Y},loop); })();
  let wt=0;
  newEp();
  A.rl={ enter(){ setRun(false); watch=null; },
    tick(dt,now){ if(run){ const n=speed===1?1:speed===8?8:200; for(let i=0;i<n;i++) learnStep(); }
      if(watch&&!watch.end){ wt+=dt; if(wt>170){ wt=0; stepWatch(); } }
      const L=pth.getTotalLength(), p=(now/2600)%1, pt=pth.getPointAtLength(p*L); dot.setAttribute("cx",pt.x); dot.setAttribute("cy",pt.y); dot.setAttribute("fill",p<.5?Y:BLUE);
      draw(now); } };
})();

/* ---------- tokens ---------- */
function tokenize(text){
  const out=[]; const re=/\s*[A-Za-z']+|\s*\d+|\s*[^\sA-Za-z\d]|\s+$/g; let m;
  const SUF=["tion","able","ness","ment","ing","est","ed","ly","er"];
  while((m=re.exec(text))){ let w=m[0]; if(!w) break;
    const lead=w.match(/^\s*/)[0], core0=w.slice(lead.length); let core=core0, tail=[];
    while(core.length>7){ const s=SUF.find(s=>core.endsWith(s)&&core.length-s.length>=3); if(s){ tail.unshift(s); core=core.slice(0,-s.length); } else { tail.unshift(core.slice(5)); core=core.slice(0,5); } }
    out.push(lead+core, ...tail); }
  return out.filter(t=>t.length);
}
const tokId=t=>{ let h=2166136261; for(const c of t) h=Math.imul(h^c.charCodeAt(0),16777619); return (h>>>0)%50000+200; };
(() => {
  const inp=$("tokIn"), box=$("toks"), ids=$("tokIds");
  const COLS=["#ffd65c","#9fd0ff","#94e8b2","#ffb0a8","#d4b8ff"];
  function run(){ const t=tokenize(inp.value);
    box.innerHTML=t.map((w,i)=>`<span class="tok" style="background:${COLS[i%5]};color:#121214;animation-delay:${Math.min(i*35,900)}ms"><span class="w">${w.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/^ /,"␣")}</span><span class="id">${tokId(w)}</span></span>`).join("");
    $("tokN").textContent=`${t.length} tokens · ${inp.value.length} characters`;
    ids.textContent="["+t.map(tokId).join(", ")+"]"; }
  inp.addEventListener("input",run); inp.addEventListener("keydown",e=>e.stopPropagation()); run();
  A.nlp={ enter(){ run(); } };
})();

/* ---------- embeddings: a 2D meaning map ---------- */
(() => {
  const cv=$("emCv"), say=$("emSay");
  const W0={ man:[.12,.32],woman:[.12,.52],king:[.29,.22],queen:[.29,.42],boy:[.05,.14],girl:[.05,.34],prince:[.2,.06],princess:[.2,.26],
    dog:[.70,.24],cat:[.82,.32],puppy:[.64,.10],kitten:[.76,.18],horse:[.92,.14],cow:[.94,.26],mouse:[.88,.42],bird:[.70,.40],
    pizza:[.10,.74],cheese:[.20,.82],bread:[.06,.88],apple:[.26,.68],banana:[.32,.78],"ice cream":[.20,.95],
    car:[.52,.74],truck:[.60,.82],bus:[.48,.86],bike:[.44,.68],train:[.60,.94],
    happy:[.82,.66],joyful:[.90,.60],glad:[.88,.72],sad:[.78,.88],angry:[.92,.86],calm:[.72,.76],
    school:[.48,.40],home:[.52,.28],house:[.58,.34],office:[.44,.50] };
  const words=Object.keys(W0); let W=0,H=0, sel=null, an=null, t0=0;
  const P=w=>({x:40+W0[w][0]*(W-80), y:80+W0[w][1]*(H-190)});
  function near(w,n=4){ return words.filter(o=>o!==w).map(o=>[o,Math.hypot(W0[o][0]-W0[w][0],W0[o][1]-W0[w][1])]).sort((a,b)=>a[1]-b[1]).slice(0,n); }
  function draw(now){
    W=cv.offsetWidth; H=cv.offsetHeight; const x=ctxOf(cv); x.fillStyle="#0d0d0f"; x.fillRect(0,0,W,H);
    const p=an?ease((now-t0)/1400):1, p2=an?ease((now-t0-1400)/1200):0;
    if(sel&&!an){ for(const [o] of near(sel)){ const a=P(sel), b=P(o); x.strokeStyle="rgba(255,194,14,.6)"; x.lineWidth=2; x.setLineDash([6,5]); x.beginPath(); x.moveTo(a.x,a.y); x.lineTo(b.x,b.y); x.stroke(); x.setLineDash([]); } }
    const nb=sel&&!an?near(sel).map(n=>n[0]):[], act=an?[an.a,an.b,an.c,an.res]:[];
    for(const w of words){ const q=P(w), on=w===sel||nb.includes(w)||act.includes(w), dim=(sel||an)&&!on;
      x.fillStyle=on?Y:dim?"rgba(243,241,234,.25)":"rgba(243,241,234,.8)"; x.beginPath(); x.arc(q.x,q.y,on?6:4,0,7); x.fill();
      x.font=`${on?700:500} ${on?20:17}px ${SANS}`; x.fillStyle=on?INK:dim?"rgba(243,241,234,.3)":"#cfccc4"; x.fillText(w,q.x+9,q.y+6); }
    if(an){ const a=P(an.a), b=P(an.b), c=P(an.c), d={x:c.x+(a.x-b.x),y:c.y+(a.y-b.y)};
      const arrow=(f,t,k,col)=>{ if(k<=0) return; const ex=f.x+(t.x-f.x)*k, ey=f.y+(t.y-f.y)*k; x.strokeStyle=col; x.lineWidth=3.5; x.beginPath(); x.moveTo(f.x,f.y); x.lineTo(ex,ey); x.stroke();
        const ang=Math.atan2(t.y-f.y,t.x-f.x); x.fillStyle=col; x.beginPath(); x.moveTo(ex,ey); x.lineTo(ex-14*Math.cos(ang-.4),ey-14*Math.sin(ang-.4)); x.lineTo(ex-14*Math.cos(ang+.4),ey-14*Math.sin(ang+.4)); x.fill(); };
      arrow(b,a,p,BLUE); arrow(c,d,p2,Y);
      if(p2>=1){ x.strokeStyle=Y; x.lineWidth=3; x.beginPath(); x.arc(d.x,d.y,16+Math.sin(now/200)*3,0,7); x.stroke(); } }
  }
  cv.addEventListener("pointerdown",e=>{ const q=ptr(e,cv); let best=null,bd=40; for(const w of words){ const p=P(w), d=Math.hypot(p.x+20-q.x,p.y-q.y); if(d<bd){ bd=d; best=w; } }
    an=null; sel=best; if(!best){ say.innerHTML="Click a word to see its nearest neighbors."; return; }
    say.innerHTML=`Closest to <b>${best}</b>: ${near(best).map(n=>n[0]).join(", ")}`; });
  document.querySelectorAll('[data-id="embed"] [data-an]').forEach(b=>b.onclick=()=>{
    const [a,bb,c]=b.dataset.an.split(","); const tx=W0[c][0]+W0[a][0]-W0[bb][0], ty=W0[c][1]+W0[a][1]-W0[bb][1];
    const res=words.filter(w=>![a,bb,c].includes(w)).sort((m,n)=>Math.hypot(W0[m][0]-tx,W0[m][1]-ty)-Math.hypot(W0[n][0]-tx,W0[n][1]-ty))[0];
    an={a,b:bb,c,res}; sel=null; t0=performance.now();
    say.innerHTML=`Blue: the step from <b>${bb}</b> to <b>${a}</b>. Take the same step from <b>${c}</b>…`;
    setTimeout(()=>{ if(an&&an.res===res) say.innerHTML=`<b>${a}</b> − <b>${bb}</b> + <b>${c}</b> ≈ <b>${res}</b>`; },2600); });
  A.embed={ enter(){ sel=null; an=null; say.innerHTML="Click a word to see its nearest neighbors."; }, tick(dt,now){ draw(now); } };
})();

/* ---------- gpt: three letters ---------- */
(() => {
  const rows=[...document.querySelectorAll("#gptRows .gptRow")], cv=$("gptCv"); let k=0, t0=0, books=[];
  const TXT="Once upon a time, a robot vacuum dreamed of exploring the whole house…";
  const WORDS=["The","cat","that","was","chasing","the","mouse","ran"];
  function set(n){ k=n; t0=performance.now(); books=[]; rows.forEach((r,i)=>r.classList.toggle("on",i<k)); }
  document.querySelector('[data-id="gpt"]').addEventListener("click",e=>{ if(e.target.closest("button,a")) return; advance(); });
  function draw(now){
    const x=ctxOf(cv), W=cv.offsetWidth, H=cv.offsetHeight, t=now-t0; x.fillStyle="#0d0d0f"; x.fillRect(0,0,W,H);
    x.textAlign="center"; x.textBaseline="middle";
    if(k===0){ x.fillStyle=MUTE; x.font=`20px ${SANS}`; x.fillText("Click to reveal each letter",W/2,H/2); }
    else if(k===1){ // generative: text appears word by word
      const n=Math.floor((t%9000)/260), shown=TXT.split(" ").slice(0,n).join(" ");
      x.textAlign="left"; x.font=`28px ${SANS}`; x.fillStyle=INK; const lines=[]; let line="";
      for(const w of shown.split(" ")){ const tl=line?line+" "+w:w; if(x.measureText(tl).width>W-80){ lines.push(line); line=w; } else line=tl; } lines.push(line);
      lines.forEach((l,i)=>x.fillText(l,40,H/2-40+i*44));
      const last=lines[lines.length-1]; if(Math.floor(now/450)%2){ x.fillStyle=Y; x.fillRect(44+x.measureText(last).width,H/2-40+(lines.length-1)*44-16,3,32); } }
    else if(k===2){ // pre-trained: books fly into the network
      if(Math.random()<.25) books.push({x:rnd(20,W-60),y:-30,v:rnd(2,4),c:pick(["#c94f4f","#4f7ac9","#c9a24f","#5fa86e","#8f6ac9"]),r:rnd(-.4,.4)});
      const cx=W/2, cy=H-110;
      books=books.filter(b=>{ b.x+=(cx-b.x)*.03; b.y+=b.v; b.v+=.08; x.save(); x.translate(b.x,b.y); x.rotate(b.r); x.fillStyle=b.c; x.fillRect(-14,-20,28,40); x.fillStyle="rgba(255,255,255,.5)"; x.fillRect(-10,-14,20,3); x.restore(); return b.y<cy-30; });
      for(let i=0;i<5;i++) for(let j=0;j<5;j++){ x.strokeStyle="rgba(255,194,14,.25)"; x.beginPath(); x.moveTo(cx-90,cy-60+i*30); x.lineTo(cx+90,cy-60+j*30); x.stroke(); }
      for(let i=0;i<5;i++) for(const sx of [-90,90]){ x.fillStyle="#1c1c20"; x.strokeStyle=Y; x.lineWidth=2.5; x.beginPath(); x.arc(cx+sx,cy-60+i*30,8,0,7); x.fill(); x.stroke(); }
      x.fillStyle=MUTE; x.font=`16px ${MONO}`; x.fillText(`pages read: ${fmt(t*4100)}`,W/2,30); }
    else { // transformer: every word attends to every word
      const n=WORDS.length, xs=i=>50+i*(W-100)/(n-1), y0=H/2+60;
      for(let i=0;i<n;i++) for(let j=i+1;j<n;j++){ const ph=(Math.sin(now/600+i*1.3+j*.7)+1)/2, a=xs(i), b=xs(j), h=(b-a)*.45;
        x.strokeStyle=`rgba(255,194,14,${.08+ph*.5})`; x.lineWidth=1+ph*3; x.beginPath(); x.moveTo(a,y0-22); x.quadraticCurveTo((a+b)/2,y0-22-h,b,y0-22); x.stroke(); }
      x.font=`600 20px ${SANS}`; WORDS.forEach((w,i)=>{ x.fillStyle="#24242a"; const wd=x.measureText(w).width+18; x.fillRect(xs(i)-wd/2,y0-16,wd,32); x.fillStyle=INK; x.fillText(w,xs(i),y0); }); }
    x.textAlign="left"; x.textBaseline="alphabetic";
  }
  A.gpt={ enter(dir){ set(dir<0?3:0); }, step(){ if(k>=3) return false; set(k+1); return true; }, back(){ if(k<=0) return false; set(k-1); return true; }, tick(dt,now){ draw(now); } };
})();

/* ---------- attention: click a word ---------- */
(() => {
  const WORDS=["The","cat","that","was","chasing","the","mouse","ran","into","the","house","."];
  const HAND={7:{1:.42,7:.12,6:.1,10:.1,4:.08,8:.08,0:.03,2:.02,3:.02,5:.01,9:.01,11:.01},1:{7:.3,1:.25,0:.15,4:.15,2:.1,6:.05},2:{1:.6,2:.15,3:.1,4:.1,0:.05},
    4:{1:.35,6:.3,4:.15,3:.1,5:.05,2:.05},6:{4:.4,6:.2,5:.15,1:.15,7:.1},10:{7:.3,8:.25,9:.2,10:.2,1:.05},8:{7:.45,10:.35,8:.2},3:{1:.4,4:.35,3:.25}};
  const box=$("atWords"), svg=$("atSvg"), sayEl=$("atSay"); let sel=7, near=false;
  box.innerHTML=WORDS.map((w,i)=>`<span class="atW" data-i="${i}">${w}</span>`).join("");
  function weights(i){ let w={};
    if(near){ for(let j=i-2;j<=i+2;j++) if(j>=0&&j<WORDS.length) w[j]=j===i?.3:Math.abs(j-i)===1?.25:.1; }
    else if(HAND[i]) w={...HAND[i]};
    else { WORDS.forEach((_,j)=>w[j]=j===i?.35:Math.abs(j-i)===1?.2:.03); }
    const s=Object.values(w).reduce((a,b)=>a+b,0); for(const k in w) w[k]/=s; return w; }
  function render(){
    [...box.children].forEach((c,i)=>c.classList.toggle("sel",i===sel));
    svg.innerHTML=""; const w=weights(sel), el=box.children, base=box.offsetTop;
    const cx=i=>el[i].offsetLeft+el[i].offsetWidth/2;
    Object.entries(w).sort((a,b)=>a[1]-b[1]).forEach(([j,v])=>{ j=+j; if(j===sel) return; const a=cx(sel), b=cx(j), h=Math.min(300,40+Math.abs(b-a)*.4), top=base-6;
      const pth=svgEl("path",{d:`M${a} ${top} Q${(a+b)/2} ${top-h*1.6} ${b} ${top}`,fill:"none",stroke:Y,"stroke-opacity":.25+v*1.6,"stroke-width":1.5+v*26,"stroke-linecap":"round"},svg);
      const len=pth.getTotalLength(); pth.style.strokeDasharray=len; pth.style.strokeDashoffset=len; pth.style.transition="stroke-dashoffset .7s ease"; requestAnimationFrame(()=>requestAnimationFrame(()=>pth.style.strokeDashoffset=0));
      if(v>=.07){ const t=svgEl("text",{x:(a+b)/2,y:top-h*.8-10,"text-anchor":"middle",fill:INK,"font-size":17,"font-family":MONO,"font-weight":600},svg); t.textContent=Math.round(v*100)+"%"; } });
    const top=+Object.entries(w).filter(([j])=>+j!==sel).sort((a,b)=>b[1]-a[1])[0][0], wd=WORDS[sel];
    sayEl.className="fb";
    if(sel===7&&near){ sayEl.className="fb bad"; sayEl.innerHTML="Only looking nearby, “ran” sees “the mouse ran into”… so it would think <b>the mouse</b> ran. Wrong!"; }
    else if(sel===7){ sayEl.className="fb good"; sayEl.innerHTML="“ran” pays the most attention to <b>“cat”</b>, six words away. The cat is the one that ran."; }
    else sayEl.innerHTML=`“${wd}” pays the most attention to “${WORDS[top]}”. Try clicking <b>ran</b>.`;
  }
  box.onclick=e=>{ const c=e.target.closest(".atW"); if(c){ sel=+c.dataset.i; render(); } };
  $("atAll").onclick=()=>{ near=false; $("atAll").classList.add("on"); $("atNear").classList.remove("on"); render(); };
  $("atNear").onclick=()=>{ near=true; $("atNear").classList.add("on"); $("atAll").classList.remove("on"); render(); };
  A.attention={ enter(){ sel=7; near=false; $("atAll").classList.add("on"); $("atNear").classList.remove("on"); setTimeout(render,60); } };
})();

/* ---------- next word: the cow jumped over the moon ---------- */
(() => {
  const P1={ the:{cow:.45,moon:.2,barn:.15,fence:.1,dog:.1}, cow:{jumped:.5,mooed:.2,ran:.12,slept:.08,".":.1}, dog:{ran:.4,jumped:.3,slept:.15,".":.1,mooed:.05},
    jumped:{over:.8,happily:.08,".":.07,and:.05}, over:{the:.88,".":.12}, moon:{".":.7,and:.2,happily:.1}, barn:{".":.6,and:.4}, fence:{".":.5,and:.3,happily:.2},
    mooed:{happily:.4,".":.4,and:.2}, ran:{over:.4,".":.25,happily:.2,and:.15}, slept:{".":.6,happily:.2,and:.2}, happily:{".":.7,and:.3}, and:{the:.4,jumped:.2,ran:.2,mooed:.1,slept:.1} };
  const P2={ "over the":{moon:.62,fence:.18,barn:.12,dog:.05,cow:.03}, "the moon":{".":.8,and:.12,happily:.08} };
  let sent=["The"], fresh=0;
  const dist=()=>{ const n=sent.length, k2=(sent[n-2]||"").toLowerCase()+" "+sent[n-1].toLowerCase(); return P2[k2]||P1[sent[n-1].toLowerCase()]||{".":1}; };
  const done=()=>sent[sent.length-1]===".";
  function render(){
    $("nwSent").innerHTML=sent.map((w,i)=>(w==="."?"":" ")+`<span class="${i===sent.length-1&&fresh?"new":""}">${w}</span>`).join("").trim()+(done()?"":`<span class="cur"></span>`);
    const d=Object.entries(dist()).sort((a,b)=>b[1]-a[1]);
    $("nwHead").textContent=done()?"Sentence finished: “.” ends it":`Next word after “${sent.slice(-2).join(" ")}”`;
    $("nwProbs").innerHTML=done()?`<div class="hint">Press <b>Start over</b>, or try rolling the dice for a different sentence.</div>`:
      d.map(([w,p],i)=>`<div class="nwRow ${i===0?"top":""}" data-w="${w}"><span>${w==="."?". (end)":w}</span><span class="bar"><i style="width:${p*100}%"></i></span><span class="pc">${Math.round(p*100)}%</span></div>`).join("");
    ["nwTop","nwRoll"].forEach(id=>$(id).disabled=done());
  }
  function add(w){ if(done()) return; const row=[...$("nwProbs").children].find(r=>r.dataset.w===w); if(row) row.classList.add("pk");
    setTimeout(()=>{ sent.push(w); fresh=1; if(sent.length>13&&!done()) sent.push("."); render(); },180); }
  const greedy=()=>Object.entries(dist()).sort((a,b)=>b[1]-a[1])[0][0];
  const sample=()=>{ let r=Math.random(); for(const [w,p] of Object.entries(dist())){ r-=p; if(r<=0) return w; } return "."; };
  $("nwTop").onclick=()=>add(greedy()); $("nwRoll").onclick=()=>add(sample());
  $("nwReset").onclick=()=>{ sent=["The"]; fresh=0; render(); };
  $("nwProbs").onclick=e=>{ const r=e.target.closest(".nwRow"); if(r) add(r.dataset.w); };
  A.nextword={ enter(){ sent=["The"]; fresh=0; render(); } };
})();

/* ---------- be the model: word banks ---------- */
(() => {
  const BANKS=[
    {name:"Animals",words:["a","cat","dog","bird","jumps","flies","runs","quietly","quickly","and","STOP"],
     P:{"^":{a:1},a:{cat:4,dog:4,bird:3},cat:{jumps:4,runs:3,and:1,STOP:1},dog:{runs:5,jumps:3,and:1},bird:{flies:7,jumps:1,and:1},
        jumps:{quickly:3,quietly:2,and:2,STOP:3},flies:{quickly:3,quietly:3,and:2,STOP:3},runs:{quickly:5,quietly:1,and:2,STOP:2},
        quietly:{and:3,STOP:6},quickly:{and:3,STOP:6},and:{a:4,runs:2,jumps:2,flies:1}}},
    {name:"Morning",words:["I","up","early","late","wake","go","to","and","school","work","home","sleep","again","STOP"],
     P:{"^":{I:1},I:{wake:6,go:4,sleep:2},wake:{up:9,early:1},up:{early:5,late:3,and:3},early:{and:5,STOP:3},late:{and:5,STOP:3,again:2},
        and:{go:5,I:3},go:{to:8,home:3},to:{school:5,work:4,sleep:3},school:{late:2,STOP:4,and:3},work:{late:2,STOP:4,and:3,early:1,again:1},
        home:{and:3,early:2,late:2,STOP:4,again:1},sleep:{late:2,early:2,again:2,STOP:3,and:1},again:{STOP:7,and:2}}},
    {name:"Food",words:["I","like","love","hate","pizza","apples","ice cream","spicy","sweet","and","STOP"],
     P:{"^":{I:1},I:{like:5,love:4,hate:2},like:{pizza:4,apples:3,"ice cream":4,spicy:2,sweet:2},love:{pizza:5,"ice cream":5,apples:2,spicy:1,sweet:2},
        hate:{apples:3,spicy:3,pizza:1,sweet:2,"ice cream":1},spicy:{pizza:6,apples:1,"ice cream":1},sweet:{apples:4,"ice cream":4,pizza:1},
        pizza:{and:4,STOP:6},apples:{and:4,STOP:6},"ice cream":{and:4,STOP:6},and:{I:4,apples:2,"ice cream":2,pizza:2,spicy:1,sweet:1}}},
  ];
  let b=0, sent=[], busy=false;
  const last=()=>sent.length?sent[sent.length-1].w:"^", over=()=>last()==="STOP";
  function dist(){ const d=BANKS[b].P[last()]||{}, s=Object.values(d).reduce((a,c)=>a+c,0)||1; const o={}; for(const w of BANKS[b].words) o[w]=(d[w]||0)/s; return o; }
  function render(){
    $("btTabs").innerHTML=BANKS.map((k,i)=>`<button class="btn ${i===b?"on":""}" data-b="${i}">${k.name}</button>`).join("");
    const d=dist();
    $("btBank").innerHTML=BANKS[b].words.map(w=>`<button class="wb ${w==="STOP"?"stop":""}" data-w="${w}">${w}<span class="p" style="width:${over()?0:d[w]*100}%"></span>${!over()&&d[w]>0?`<span class="n">${Math.round(d[w]*100)}%</span>`:""}</button>`).join("");
    $("btSent").innerHTML=sent.length?sent.filter(s=>s.w!=="STOP").map(s=>`<span class="${s.m?"m":"u"}">${s.w}</span>`).join(" ")+(over()?".":""):`<span class="muted" style="font-weight:500;font-size:24px">Click words below to build a sentence…</span>`;
    $("btHint").textContent=over()?"Finished! Clear it, or let the model write another.":sent.length?"The bars show what the model expects next.":"";
  }
  $("btTabs").onclick=e=>{ const t=e.target.closest("[data-b]"); if(!t||busy) return; b=+t.dataset.b; sent=[]; render(); };
  $("btBank").onclick=e=>{ const t=e.target.closest(".wb"); if(!t||busy) return; if(over()) sent=[]; sent.push({w:t.dataset.w,m:false}); render(); };
  $("btClear").onclick=()=>{ if(busy) return; sent=[]; render(); };
  $("btModel").onclick=()=>{ if(busy) return; sent=[]; render(); busy=true;
    const stepM=()=>{ if(cur<0||slides[cur].dataset.id!=="bethe"){ busy=false; return; }
      const d=dist(); let r=Math.random(), w="STOP"; for(const [k,p] of Object.entries(d)){ r-=p; if(p>0&&r<=0){ w=k; break; } }
      if(sent.length>=12) w="STOP";
      const el=[...$("btBank").children].find(c=>c.dataset.w===w); if(el) el.classList.add("flash");
      setTimeout(()=>{ sent.push({w,m:true}); render(); if(w==="STOP"){ busy=false; return; } setTimeout(stepM,550); },450); };
    setTimeout(stepM,300); };
  A.bethe={ enter(){ busy=false; sent=[]; render(); } };
})();

/* ---------- training data: towers of books ---------- */
(() => {
  const cv=$("dtCv"); let k=1, unit="books", t0=0, born=[];
  const M=[ // name, year, books, label per unit
    ["You","70 years",3640,{books:"~3,640 books",pages:"~1.8 million pages",gb:"~3.6 GB"}],
    ["GPT-2","2019",40000,{books:"~40,000 books",pages:"~20 million pages",gb:"40 GB"}],
    ["GPT-3","2020",570000,{books:"~570,000 books",pages:"~285 million pages",gb:"570 GB"}],
    ["GPT-4","2023",2000000,{books:"~2 million books",pages:"~1 billion pages",gb:"~2 TB (assumed)"}],
  ];
  const PER=10000, ROW=10, SPINES=["#b4534b","#4b6fb4","#c49a3c","#4f9a62","#8a62b8","#c96f3c","#3c9aa8"];
  document.querySelectorAll("#dtUnits [data-u]").forEach(btn=>btn.onclick=e=>{ e.stopPropagation(); unit=btn.dataset.u; document.querySelectorAll("#dtUnits [data-u]").forEach(o=>o.classList.toggle("on",o===btn)); });
  document.querySelector('[data-id="data"]').addEventListener("click",e=>{ if(e.target.closest("button,a")) return; advance(); });
  function set(n,anim){ k=n; t0=anim?performance.now():-1e9; }
  function draw(now){
    const x=ctxOf(cv), W=cv.offsetWidth, H=cv.offsetHeight; x.fillStyle="#0d0d0f"; x.fillRect(0,0,W,H);
    const base=H-110, bw=Math.min(18,(W-120)/4/ROW-1), bh=Math.min(24,(base-60)/20), colW=(W-60)/4;
    x.strokeStyle=LINE; x.lineWidth=2; x.beginPath(); x.moveTo(20,base+1); x.lineTo(W-20,base+1); x.stroke();
    M.forEach(([nm,yr,books,lab],i)=>{ const cx=30+colW*i+colW/2, vis=i<=k, n=books/PER, full=Math.floor(n), frac=n-full;
      x.textAlign="center"; x.fillStyle=vis?(i?INK:BLUE):"rgba(243,241,234,.15)"; x.font=`700 22px ${SANS}`; x.fillText(nm,cx,base+34);
      x.font=`14px ${MONO}`; x.fillStyle=vis?MUTE:"rgba(155,152,143,.2)"; x.fillText(yr,cx,base+54);
      if(!vis) return;
      x.fillStyle=i?Y:BLUE; x.font=`600 15px ${MONO}`; x.fillText(lab[unit],cx,base+78);
      const delay=i===k?t0:-1e9;
      for(let b=0;b<Math.ceil(n);b++){ const r=(b/ROW)|0, c=b%ROW, wFrac=b===full?frac:1, tb=(now-delay-b*18)/450; if(tb<0) continue;
        const yy=base-(r+1)*bh - (1-ease(tb))*220, xx=cx-ROW*bw/2+c*bw;
        x.globalAlpha=Math.min(1,tb*2); x.fillStyle=i?SPINES[(b*5+((b/ROW)|0)*3+i)%SPINES.length]:BLUE; x.fillRect(xx+1,yy+1,(bw-2)*wFrac,bh-2); x.globalAlpha=1;
        if(wFrac===1){ x.fillStyle="rgba(255,255,255,.35)"; x.fillRect(xx+3,yy+5,bw-6,2); } }
      if(i===0){ x.fillStyle=BLUE; x.font=`13px ${MONO}`; x.fillText("(a tiny sliver)",cx,base-bh-10); } });
    x.textAlign="left"; x.fillStyle=MUTE; x.font=`15px ${MONO}`; x.fillText("1 block = 10,000 books",24,32);
  }
  A.data={ enter(dir){ set(dir<0?3:1,dir>=0); }, step(){ if(k>=3) return false; set(k+1,true); return true; }, back(){ if(k<=1) return false; set(k-1,false); return true; }, tick(dt,now){ draw(now); } };
})();

/* ---------- chatgpt: token-by-token streaming ---------- */
(() => {
  const PR=[
    ["Explain AI to a 10-year-old","AI is when a computer learns patterns from lots of examples, so it can do things like recognize pictures or answer questions. It doesn’t think like you do. It just makes really good guesses!"],
    ["Name my robot vacuum","How about Sir Sweeps-a-Lot? Other ideas: Crumb Hunter, Dusty, or The Floor Whisperer."],
    ["A two-line poem about GPUs","Ten thousand tiny cores all in a row,\nthey paint your games and help the AIs grow."],
  ];
  const ALT=[" the"," a"," it"," to"," and"," games"," learn"," so"," very"," AI"," you","!",","," data"," fast"," big"];
  const msgs=$("cgMsgs"), nx=$("cgNext"); let run=0;
  $("cgPrompts").innerHTML=PR.map((p,i)=>`<button class="btn" data-p="${i}">${p[0]}</button>`).join("");
  function ask(i){ const id=++run; msgs.innerHTML="";
    const u=document.createElement("div"); u.className="bub u"; u.textContent=PR[i][0]; msgs.appendChild(u);
    const a=document.createElement("div"); a.className="bub a"; msgs.appendChild(a);
    const toks=tokenize(PR[i][1].replace(/\n/g," ↵ ")); let j=0;
    const tick=()=>{ if(id!==run) return; if(j>=toks.length){ nx.innerHTML=`<span>done · ${toks.length} tokens</span>`; return; }
      const t=toks[j++], p=rnd(.42,.93), alts=ALT.filter(w=>w!==t).sort(()=>Math.random()-.5).slice(0,2), q=rnd(.3,.7)*(1-p);
      nx.innerHTML=`<span>next token:</span><span class="c w">${t.replace(/^ /,"␣")} ${Math.round(p*100)}%</span>`+alts.map((w,k)=>`<span class="c">${w.replace(/^ /,"␣")} ${Math.max(1,Math.round((k?1-p-q:q)*100))}%</span>`).join("");
      const s=document.createElement("span"); s.className="t"; if(t.trim()==="↵"){ a.appendChild(document.createElement("br")); } else { s.textContent=t; a.appendChild(s); }
      setTimeout(tick,t.length>4?150:110); };
    setTimeout(tick,500); }
  $("cgPrompts").onclick=e=>{ const b=e.target.closest("[data-p]"); if(b) ask(+b.dataset.p); };
  A.chatgpt={ enter(){ run++; msgs.innerHTML=""; nx.innerHTML="<span>Pick a prompt above.</span>"; } };
})();

}

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
let sx=null; stage.addEventListener("touchstart",e=>{ if(e.target.closest("input,button,svg,canvas,.chip,.wb,.atW,.nwRow,.cell,.switch,.fact")) return; sx=e.touches[0].clientX; },{passive:true});
stage.addEventListener("touchend",e=>{ if(sx===null) return; const dx=e.changedTouches[0].clientX-sx; if(Math.abs(dx)>60) (dx<0?advance:retreat)(); sx=null; });
addEventListener("resize",fitStage);
fitStage(); fromHash(); claudeAdapter();
let last=performance.now();
function loop(now){ const dt=Math.min(100,now-last); last=now; const s=slides[cur], a=s&&A[s.dataset.id]; if(a&&a.tick){ try{ a.tick(dt,now); }catch(err){ console.error(err); } } requestAnimationFrame(loop); }
requestAnimationFrame(loop);
})();


