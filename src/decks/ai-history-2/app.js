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

/* ---------- title: drifting network ---------- */
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

/* ---------- timeline ---------- */
const EVENTS=[
  ["1986","Rumelhart, Hinton & Williams publish backpropagation, a breakthrough for training neural networks."],
  ["1997","IBM’s Deep Blue defeats world chess champion Garry Kasparov."],
  ["2002","iRobot introduces Roomba, the first mass-produced home robot vacuum that navigates on its own."],
  ["2012","AlexNet (Krizhevsky, Sutskever & Hinton) wins the ImageNet challenge by a huge margin. Deep learning takes off."],
  ["2017","Google researchers publish “Attention Is All You Need”, introducing the Transformer."],
  ["2022","OpenAI releases ChatGPT (GPT-3.5) to the public on November 30."],
];
document.querySelectorAll(".slide.tl").forEach(sl=>{
  const k=+sl.dataset.upto, n=EVENTS.length, xp=i=>(i+.5)/n*100;
  const hd=document.createElement("div");
  hd.innerHTML=`<h2 class="rise" style="--i:0"><span class="n">TIMELINE</span>${k<=2?"Where we left off":"The road to AI"}</h2>`;
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

/* ---------- ai > ml > dl: sort the examples ---------- */
(() => {
  const svg=$("nestSvg"), drop=$("nestDrop"), fb=$("nestFb"), chipsEl=$("nestChips");
  const RINGS={
    ai:{cx:380,cy:340,rx:360,ry:325,col:Y,label:"ARTIFICIAL INTELLIGENCE",ly:52},
    ml:{cx:430,cy:400,rx:255,ry:245,col:BLUE,label:"MACHINE LEARNING",ly:190},
    dl:{cx:475,cy:470,rx:140,ry:150,col:GREEN,label:"DEEP LEARNING",ly:355},
  };
  // where placed chips sit inside each ring (only in the part not covered by the inner ring)
  const SLOTS={ai:[[150,230],[110,360],[170,480],[230,590],[250,140]],ml:[[310,300],[300,420],[560,250],[410,250],[300,540]],dl:[[475,410],[475,460],[475,510],[475,560]]};
  const ITEMS=[ // chip text, ring, short name once placed, explanation
    ["Deep Blue (1997)","ai","Deep Blue","Deep Blue used hand-written rules and search. Smart, but it didn’t learn from data."],
    ["MYCIN expert system","ai","MYCIN","MYCIN’s knowledge was typed in by experts as IF-THEN rules. AI, but not machine learning."],
    ["Pac-Man ghosts","ai","Pac-Man ghosts","Classic game AI is hand-coded rules. No learning from data."],
    ["Spam filter that learns from what you mark","ml","Spam filter","It learns patterns from examples, so it’s machine learning, but it doesn’t need a deep network."],
    ["Decision tree learned from data","ml","Learned decision tree","A learned decision tree is classic machine learning, with no neural network."],
    ["Netflix recommendations","ml","Netflix picks","Recommendations learn from viewing data: machine learning."],
    ["AlexNet","dl","AlexNet","AlexNet is a neural network with 8 learned layers: deep learning."],
    ["ChatGPT","dl","ChatGPT","ChatGPT is a huge transformer neural network: deep learning."],
    ["Face unlock on your phone","dl","Face unlock","Face recognition uses deep convolutional networks: deep learning."],
  ];
  const NAMES={ai:"AI (but not machine learning)",ml:"machine learning (but not deep learning)",dl:"deep learning"};
  let sel=null, used={ai:0,ml:0,dl:0};
  for(const k of ["ai","ml","dl"]){ const r=RINGS[k];
    const g=svgEl("g",{class:"ring","data-k":k},svg);
    svgEl("ellipse",{cx:r.cx,cy:r.cy,rx:r.rx,ry:r.ry,fill:r.col,"fill-opacity":.06,stroke:r.col,"stroke-width":2.5},g);
    const t=svgEl("text",{x:r.cx,y:r.ly,"text-anchor":"middle",fill:r.col,"font-size":19,"font-weight":700,"letter-spacing":2.5},g); t.textContent=r.label;
    g.addEventListener("mouseenter",()=>hi(k)); g.addEventListener("mouseleave",()=>hi(null));
    g.addEventListener("click",e=>{ e.stopPropagation(); place(k); });
  }
  function hi(k){ document.querySelectorAll('[data-id="nest"] .def').forEach(d=>d.classList.toggle("hi",d.dataset.k===k)); }
  // clicks on the inner ring bubble to the outer ones; stopPropagation above handles the innermost first
  function place(k){
    if(!sel){ fb.className="fb"; fb.textContent="Pick a chip first, then click a circle."; return; }
    const it=ITEMS[+sel.dataset.i];
    if(it[1]!==k){ fb.className="fb bad"; fb.textContent=`Not quite: “${it[0]}” isn’t ${NAMES[k]}. Try again.`; sel.classList.remove("shake"); void sel.offsetWidth; sel.classList.add("shake"); return; }
    const [sx,sy]=SLOTS[k][used[k]++%SLOTS[k].length];
    const el=document.createElement("div"); el.className="nestPlaced"; el.textContent=it[2];
    if(k==="ml") el.style.background=BLUE; if(k==="dl") el.style.background=GREEN;
    el.style.left=(sx/760*100)+"%"; el.style.top=(sy/680*100)+"%"; drop.appendChild(el);
    sel.classList.add("used"); sel.classList.remove("sel"); sel=null;
    fb.className="fb good"; fb.textContent="✓ "+it[3];
    if(!chipsEl.querySelector(".chip:not(.used)")) fb.textContent+=" All sorted!";
  }
  function build(){
    drop.innerHTML=""; used={ai:0,ml:0,dl:0}; sel=null; fb.className="fb"; fb.textContent="";
    const order=ITEMS.map((_,i)=>i).sort(()=>Math.random()-.5);
    chipsEl.innerHTML=order.map(i=>`<span class="chip" data-i="${i}">${ITEMS[i][0]}</span>`).join("");
  }
  chipsEl.onclick=e=>{ const c=e.target.closest(".chip"); if(!c||c.classList.contains("used")) return;
    if(sel) sel.classList.remove("sel"); sel=c===sel?null:c; if(sel) sel.classList.add("sel"); fb.className="fb"; fb.textContent=sel?"Now click the circle where it belongs.":""; };
  build();
  A.nest={ enter(){ if(!chipsEl.querySelector(".chip.used")) build(); } };
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
      const a=ease(p); x.globalAlpha=a; x.fillStyle=Y; x.beginPath(); x.roundRect?x.roundRect(ix+16,iy+16,150,46,10):x.rect(ix+16,iy+16,150,46); x.fill();
      x.fillStyle="#121214"; x.font=`700 22px ${MONO}`; x.textBaseline="middle"; x.fillText('label: "cat"',ix+28,iy+39); x.globalAlpha=1;
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
      d.map(([w,p],i)=>`<div class="prow ${i===0?"top":""}" data-w="${w}"><span>${w==="."?". (end)":w}</span><span class="bar"><i style="width:${p*100}%"></i></span><span class="pc">${Math.round(p*100)}%</span></div>`).join("");
    ["nwTop","nwRoll"].forEach(id=>$(id).disabled=done());
  }
  function add(w){ if(done()) return; const row=[...$("nwProbs").children].find(r=>r.dataset.w===w); if(row) row.classList.add("pk");
    setTimeout(()=>{ sent.push(w); fresh=1; if(sent.length>13&&!done()) sent.push("."); render(); },180); }
  const greedy=()=>Object.entries(dist()).sort((a,b)=>b[1]-a[1])[0][0];
  const sample=()=>{ let r=Math.random(); for(const [w,p] of Object.entries(dist())){ r-=p; if(r<=0) return w; } return "."; };
  $("nwTop").onclick=()=>add(greedy()); $("nwRoll").onclick=()=>add(sample());
  $("nwReset").onclick=()=>{ sent=["The"]; fresh=0; render(); };
  $("nwProbs").onclick=e=>{ const r=e.target.closest(".prow"); if(r) add(r.dataset.w); };
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
let sx=null; stage.addEventListener("touchstart",e=>{ if(e.target.closest("input,button,svg,canvas,.chip,.wb,.atW,.prow")) return; sx=e.touches[0].clientX; },{passive:true});
stage.addEventListener("touchend",e=>{ if(sx===null) return; const dx=e.changedTouches[0].clientX-sx; if(Math.abs(dx)>60) (dx<0?advance:retreat)(); sx=null; });
addEventListener("resize",fitStage);
fitStage(); fromHash(); claudeAdapter();
let last=performance.now();
function loop(now){ const dt=Math.min(100,now-last); last=now; const s=slides[cur], a=s&&A[s.dataset.id]; if(a&&a.tick){ try{ a.tick(dt,now); }catch(err){ console.error(err); } } requestAnimationFrame(loop); }
requestAnimationFrame(loop);
})();


