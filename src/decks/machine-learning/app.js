(() => {
"use strict";
const Y="#ffc20e", BLUE="#6ab8ff", GREEN="#5fd68a", RED="#ff5a4e", AMBER="#ff8a1f", PURPLE="#b18cff", INK="#f3f1ea", MUTE="#9b988f", LINE="#2e2e35";
const stage=document.getElementById("stage");
const slides=[...document.querySelectorAll(".slide")];
const $=id=>document.getElementById(id);
const NS="http://www.w3.org/2000/svg";
const svgEl=(tag,attrs={},parent)=>{ const e=document.createElementNS(NS,tag); for(const k in attrs) e.setAttribute(k,attrs[k]); if(parent) parent.appendChild(e); return e; };
const rnd=(a,b)=>a+Math.random()*(b-a), pick=a=>a[(Math.random()*a.length)|0];
const ease=t=>1-Math.pow(1-Math.min(1,Math.max(0,t)),3);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
// seeded random, so demos look the same every class
function srand(seed){ let a=seed>>>0; return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const gauss=r=>{ let u=0,v=0; while(!u) u=r(); while(!v) v=r(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); };
const fmt=(v,d=2)=>{ const s=(+v).toFixed(d); return s.replace(/\.?0+$/,"")||"0"; };
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
// pointer position in an element's own (unscaled) pixels
function localXY(e,el){ const r=el.getBoundingClientRect(), k=r.width/el.offsetWidth; return [(e.clientX-r.left)/k,(e.clientY-r.top)/k]; }
function svgXY(e,svg){ const p=svg.createSVGPoint(); p.x=e.clientX; p.y=e.clientY; const q=p.matrixTransform(svg.getScreenCTM().inverse()); return [q.x,q.y]; }
function tabs(el,cb){ el.querySelectorAll("button").forEach(b=>b.onclick=()=>{ set(b.dataset.k); cb(b.dataset.k); }); function set(k){ el.querySelectorAll("button").forEach(b=>b.classList.toggle("on",b.dataset.k===k)); } return set; }
const A={};

/* shared canvas helpers */
function axes(x,L,T,R,B){ x.strokeStyle=LINE; x.lineWidth=2; x.beginPath(); x.moveTo(L,T); x.lineTo(L,B); x.lineTo(R,B); x.stroke(); }
function label(x,t,px,py,col=MUTE,size=14,align="left",font="JetBrains Mono"){ x.fillStyle=col; x.font=`${size}px "${font}",monospace`; x.textAlign=align; x.fillText(t,px,py); x.textAlign="left"; }
function dot(x,px,py,r,fill,stroke){ x.beginPath(); x.arc(px,py,r,0,7); if(fill){ x.fillStyle=fill; x.fill(); } if(stroke){ x.strokeStyle=stroke; x.lineWidth=2; x.stroke(); } }

/* ---------- title: a cloud of points that keeps finding its trend line ---------- */

/* a plot area inside a canvas: maps data coords to pixels */
function plot(cv,xr,yr,pad=[70,30,30,60]){
  const W=cv.offsetWidth, H=cv.offsetHeight, [L,T,R,B]=[pad[0],pad[1],W-pad[2],H-pad[3]];
  const px=v=>L+(v-xr[0])/(xr[1]-xr[0])*(R-L), py=v=>B-(v-yr[0])/(yr[1]-yr[0])*(B-T);
  const ix=p=>xr[0]+(p-L)/(R-L)*(xr[1]-xr[0]), iy=p=>yr[0]+(B-p)/(B-T)*(yr[1]-yr[0]);
  return {W,H,L,T,R,B,px,py,ix,iy,xr,yr};
}
// grid, ticks and axis titles
function frame(x,P,xt,yt,xl,yl,xf=v=>v,yf=v=>v){
  x.lineWidth=1; x.strokeStyle="rgba(255,255,255,.05)";
  for(const v of xt){ x.beginPath(); x.moveTo(P.px(v),P.T); x.lineTo(P.px(v),P.B); x.stroke(); }
  for(const v of yt){ x.beginPath(); x.moveTo(P.L,P.py(v)); x.lineTo(P.R,P.py(v)); x.stroke(); }
  axes(x,P.L,P.T,P.R,P.B);
  for(const v of xt) label(x,xf(v),P.px(v),P.B+22,MUTE,14,"center");
  for(const v of yt) label(x,yf(v),P.L-10,P.py(v)+5,MUTE,14,"right");
  if(xl) label(x,xl,(P.L+P.R)/2,P.H-12,INK,16,"center");
  if(yl){ x.save(); x.translate(18,(P.T+P.B)/2); x.rotate(-Math.PI/2); label(x,yl,0,0,INK,16,"center"); x.restore(); }
}
function dashed(x,x1,y1,x2,y2,col,w=1.5,d=[5,5]){ x.save(); x.strokeStyle=col; x.lineWidth=w; x.setLineDash(d); x.beginPath(); x.moveTo(x1,y1); x.lineTo(x2,y2); x.stroke(); x.restore(); }
function cross(x,px,py,s,col,w=2.5){ x.strokeStyle=col; x.lineWidth=w; x.beginPath(); x.moveTo(px-s,py-s); x.lineTo(px+s,py+s); x.moveTo(px+s,py-s); x.lineTo(px-s,py+s); x.stroke(); }
function ols(P){ const n=P.length, mx=P.reduce((s,p)=>s+p[0],0)/n, my=P.reduce((s,p)=>s+p[1],0)/n;
  let sxy=0,sxx=0; for(const [a,b] of P){ sxy+=(a-mx)*(b-my); sxx+=(a-mx)*(a-mx); } const m=sxy/sxx; return [m,my-m*mx]; }
const sig=z=>1/(1+Math.exp(-z));
const CL=[BLUE,AMBER,GREEN,PURPLE,RED,Y];
function steps(el,i){ [...el.children].forEach((c,j)=>{ c.classList.toggle("on",j===i); c.classList.toggle("done",j<i); }); }

/* ---------- title + recap: points that sort themselves into clusters ---------- */
function clusterBg(id){
  const cv=$(id); let P=[], t0=0;
  const C=[[480,560,BLUE],[1000,330,Y],[1180,650,GREEN]];
  return {
    enter(){ const r=srand(11); t0=performance.now();
      P=Array.from({length:170},(_,i)=>{ const c=C[i%3]; return {x:r()*1600,y:r()*900,vx:(r()-.5)*.6,vy:(r()-.5)*.6,tx:c[0]+gauss(r)*95,ty:c[1]+gauss(r)*80,c:c[2]}; }); },
    tick(dt,now){
      const x=ctxOf(cv), f=dt/16.7; x.fillStyle="#121214"; x.fillRect(0,0,1600,900);
      const ph=((now-t0)/1000)%12, k=ease(ph<2.5?0:ph<4.5?(ph-2.5)/2:ph<8.5?1:ph<10?1-(ph-8.5)/1.5:0);
      for(const p of P){ p.x+=p.vx*f; p.y+=p.vy*f; if(p.x<0||p.x>1600) p.vx*=-1; if(p.y<0||p.y>900) p.vy*=-1; }
      if(k>.05) for(const c of C){ x.strokeStyle=c[2]; x.globalAlpha=k*.35; x.lineWidth=2; x.beginPath(); x.ellipse(c[0],c[1],230,190,0,0,7); x.stroke(); x.globalAlpha=1; }
      for(const p of P){ const px=lerp(p.x,p.tx,k), py=lerp(p.y,p.ty,k);
        x.globalAlpha=.35+k*.45; x.fillStyle=k>.5?p.c:"#f3f1ea"; x.beginPath(); x.arc(px,py,3+k*1.5,0,7); x.fill(); }
      x.globalAlpha=1;
    }
  };
}
A.title=clusterBg("bgML"); A.recap=clusterBg("bgRecap");
$("rcChips").innerHTML=["model","supervised","regression","linear regression","y = mx + b","multiple regression","classification","logistic regression","sigmoid","k-NN","decision tree","unsupervised","k-means","training","inference","train · validation · test","error","loss","MAE · MSE · RMSE","generalization","underfitting","overfitting","bias","variance"]
  .map(t=>`<span class="tag t-y" style="font-size:20px;padding:8px 16px">${t}</span>`).join("");

/* ---------- warm-up cannon: learn from each miss ---------- */
(() => {
  const cv=$("cnCv"), G=9.8, V=p=>10+p*.25, HIT=3, LIFT=16;
  let ang=45, pow=50, tx=78, hh=14, unlocked=false, shots=[], ball=null, boom=[], ai=false, hit=false, aiTimer=null;
  const geo=()=>{ const W=cv.offsetWidth, H=cv.offsetHeight, gy=H-60, x0=64, ppm=(W-x0-30)/125;
    return {W,H,gy,x0,ppm,X:m=>x0+m*ppm,Yp:m=>gy-LIFT-m*ppm,G:m=>gy-hill(m)*ppm}; };
  // the target sits on a flat-topped hill: TOP m of flat top either side of the flag, SL m of rounded slope
  const TOP=6, SL=12;
  function hill(m){ const d=Math.abs(m-tx); return d<=TOP?hh:d<TOP+SL?hh*(.5+.5*Math.cos(Math.PI*(d-TOP)/SL)):0; }
  function sync(){ $("cnA").value=ang; $("cnP").value=Math.round(pow); $("cnAv").textContent=ang+"°"; $("cnPv").textContent=Math.round(pow);
    $("cnFire").disabled=!!ball||ai; $("cnAI").disabled=!!ball||ai; $("cnAI").classList.toggle("on",ai); $("cnAI").classList.toggle("locked",!unlocked); }
  function msg(h){ $("cnMsg").innerHTML=h; }
  function fire(byAI){ if(ball) return; const v=V(pow), a=ang*Math.PI/180;
    ball={t:0,vx:v*Math.cos(a),vy:v*Math.sin(a),path:[],ai:byAI,a:ang,p:Math.round(pow)}; sync(); }
  function land(x){
    const b=ball, err=x-tx, h=Math.abs(err)<=HIT, n=shots.length+1;
    shots.push({x,err,ai:b.ai,path:b.path,hit:h}); ball=null;
    const who=b.ai?'<span style="color:var(--blue)">AI</span> shot':"Shot";
    if(h){ hit=true; ai=false;
      const r=geo(); boom=Array.from({length:40},()=>({x:r.X(x),y:r.G(x),vx:rnd(-4,4),vy:rnd(-7,-2),l:1}));
      const first=!b.ai&&!unlocked; if(!b.ai) unlocked=true;
      msg(`<b style="color:var(--green)">HIT!</b> ${who} ${n} landed ${Math.abs(err).toFixed(1)} m from the center. It took <b class="y">${n} ${n===1?"try":"tries"}</b>.`+
        (first?'<br><span style="font-size:18px;color:var(--blue)">Now press <b>New target</b> and <b>Let the AI learn</b> to watch a machine do the same thing.</span>':""));
      $("cnIdea").classList.add("on"); }
    else {
      msg(`${who} ${n} (angle ${b.a}°, power ${b.p}): <b style="color:${err<0?"var(--amber)":"var(--red)"}">${Math.abs(err).toFixed(1)} m ${err<0?"short":"long"}</b><br><span class="muted" style="font-size:18px">error = ${err>0?"+":"−"}${Math.abs(err).toFixed(1)} m → ${err<0?"more":"less"} power or a different angle?</span>`);
      if(ai){ const aiN=shots.filter(s=>s.ai).length;
        if(aiN>=15||(pow>=100&&err<0)){ ai=false; if(pow>=100&&err<0) msg($("cnMsg").innerHTML+'<br><span style="font-size:18px;color:var(--red)">Even full power can’t reach. Try a different angle.</span>'); }
        else { pow=clamp(pow-err*.45,0,100); aiTimer=setTimeout(()=>{ aiTimer=null; fire(true); },500); } } }
    sync(); }
  $("cnA").oninput=e=>{ ang=+e.target.value; sync(); };
  $("cnP").oninput=e=>{ pow=+e.target.value; sync(); };
  $("cnFire").onclick=()=>fire(false);
  $("cnAI").onclick=()=>{ if(ball) return; ai=true; hit=false; msg('<span style="color:var(--blue)">The AI keeps your angle and changes only the power, using each miss to decide how much.</span>'); sync(); fire(true); };
  function reset(dist,height){ clearTimeout(aiTimer); aiTimer=null; shots=[]; ball=null; boom=[]; ai=false; hit=false; tx=dist; hh=height;
    msg("No shots yet. Take your best guess."); $("cnIdea").classList.remove("on"); sync(); }
  $("cnNew").onclick=()=>reset(Math.round(rnd(45,108)),Math.round(rnd(8,20)));
  A.cannon={
    enter(){ ang=45; pow=50; unlocked=false; reset(78,14); },
    step(){ if($("cnIdea").classList.contains("on")) return false; $("cnIdea").classList.add("on"); return true; },
    back(){ if(!$("cnIdea").classList.contains("on")) return false; $("cnIdea").classList.remove("on"); return true; },
    tick(dt){
      const r=geo(), x=ctxOf(cv); x.clearRect(0,0,r.W,r.H);
      // flight (runs 2.2× real time)
      if(ball){ const b=ball, lo=-LIFT/r.ppm, P=t=>[b.vx*t,b.vy*t-G*t*t/2], under=t=>{ const [px,py]=P(t); return py<=lo+hill(px); };
        const t0=b.t, t1=b.t+dt/1000*2.2;
        if(under(t1)&&t1>.05){ let a=t0,c=t1; for(let i=0;i<30;i++){ const m=(a+c)/2; if(under(m)) c=m; else a=m; }
          const [px]=P(c); b.path.push([px,lo+hill(px)]); land(px); }
        else { b.t=t1; b.path.push(P(t1)); } }
      // ground + distance ticks
      x.fillStyle="#17171b"; x.fillRect(0,r.gy,r.W,r.H-r.gy);
      // hill under the target
      x.beginPath(); x.moveTo(r.X(tx-TOP-SL),r.gy); for(let m=tx-TOP-SL;m<=tx+TOP+SL;m+=.5) x.lineTo(r.X(m),r.G(m)); x.lineTo(r.X(tx+TOP+SL),r.gy); x.closePath();
      x.fillStyle="#1e1f24"; x.fill();
      x.strokeStyle="#55534d"; x.lineWidth=2; x.beginPath(); x.moveTo(0,r.gy); for(let m=-r.x0/r.ppm;m<=(r.W-r.x0)/r.ppm;m+=.5) x.lineTo(r.X(m),r.G(m)); x.stroke();
      label(x,`hill ${hh} m`,r.X(tx),r.G(tx)+Math.min(32,hh*r.ppm/2+6),"#6b6960",13,"center");
      for(let m=0;m<=120;m+=10){ x.strokeStyle="#55534d"; x.beginPath(); x.moveTo(r.X(m),r.gy); x.lineTo(r.X(m),r.gy+8); x.stroke(); label(x,m+" m",r.X(m),r.gy+28,MUTE,13,"center"); }
      // target pad + flag
      const tl=r.X(tx-HIT), tw=2*HIT*r.ppm;
      const ty=r.G(tx);
      for(let i=0;i<6;i++){ x.fillStyle=i%2?"#f3f1ea":RED; x.fillRect(tl+i*tw/6,ty-6,tw/6,6); }
      x.strokeStyle=INK; x.lineWidth=2.5; x.beginPath(); x.moveTo(r.X(tx),ty-6); x.lineTo(r.X(tx),ty-70); x.stroke();
      x.fillStyle=hit?GREEN:RED; x.beginPath(); x.moveTo(r.X(tx),ty-70); x.lineTo(r.X(tx)+30,ty-60); x.lineTo(r.X(tx),ty-50); x.closePath(); x.fill();
      // earlier shots: faint arcs, landing marks and error labels
      const path=(p,col,w,dash)=>{ x.save(); x.strokeStyle=col; x.lineWidth=w; x.setLineDash(dash||[]); x.beginPath(); p.forEach(([a,b],i)=>i?x.lineTo(r.X(a),r.Yp(b)):x.moveTo(r.X(a),r.Yp(b))); x.stroke(); x.restore(); };
      shots.forEach((s,i)=>{ const last=i===shots.length-1, col=s.hit?GREEN:s.ai?BLUE:Y;
        path(s.path,col,last?2.5:1.5,last?[]:[4,6]); x.globalAlpha=last?1:.35;
        dot(x,r.X(s.x),r.G(s.x)-4,5,col);
        if(last&&!s.hit){ const my=Math.min(r.G(s.x),ty)-14; dashed(x,r.X(s.x),my,r.X(tx),my,RED,2,[5,4]);
          label(x,`${Math.abs(s.err).toFixed(1)} m ${s.err<0?"short":"long"}`,(r.X(s.x)+r.X(tx))/2,my-10,RED,15,"center"); }
        x.globalAlpha=1; });
      // ball in flight
      if(ball){ path(ball.path,ball.ai?BLUE:Y,2.5); const p=ball.path[ball.path.length-1]; if(p) dot(x,r.X(p[0]),r.Yp(p[1]),8,INK); }
      // cannon
      x.save(); x.translate(r.x0,r.gy-LIFT); x.rotate(-ang*Math.PI/180); x.fillStyle="#4a4a52"; x.strokeStyle=INK; x.lineWidth=2;
      x.beginPath(); x.roundRect(-8,-10,58,20,6); x.fill(); x.stroke(); x.restore();
      dot(x,r.x0,r.gy-12,14,"#24242a",INK); dot(x,r.x0,r.gy-12,4,INK);
      // hit burst
      boom=boom.filter(p=>{ p.x+=p.vx*dt/16; p.y+=p.vy*dt/16; p.vy+=.25*dt/16; p.l-=dt/1200; if(p.l<=0) return false; x.globalAlpha=p.l; dot(x,p.x,p.y,4,pick([Y,GREEN,INK])); x.globalAlpha=1; return true; });
      if(hit) label(x,"HIT!",r.X(tx),ty-90,GREEN,30,"center","Space Grotesk");
      // miss distance per shot: the learning curve
      const bx=r.W-300, by=20, bw=280, bh=130; x.fillStyle="rgba(28,28,32,.92)"; x.strokeStyle=LINE; x.lineWidth=1; x.beginPath(); x.roundRect(bx,by,bw,bh,10); x.fill(); x.stroke();
      label(x,"miss distance per shot",bx+12,by+22,MUTE,13);
      if(!shots.length) label(x,"fire to start",bx+bw/2,by+80,"#55534d",14,"center");
      const S=shots.slice(-14), mx=Math.max(20,...S.map(s=>Math.abs(s.err))), sw=(bw-24)/14;
      S.forEach((s,i)=>{ const h=Math.max(3,Math.abs(s.err)/mx*(bh-46)); x.fillStyle=s.hit?GREEN:s.ai?BLUE:Y; x.fillRect(bx+12+i*sw+2,by+bh-12-h,sw-4,h); });
    }
  };
})();

/* ---------- ai > ml > dl ---------- */
(() => {
  const svg=$("nestSvg"), fb=$("nestFb");
  const RINGS={
    ai:{cx:380,cy:340,rx:360,ry:325,col:Y,label:"ARTIFICIAL INTELLIGENCE",ly:82},
    ml:{cx:430,cy:400,rx:255,ry:245,col:BLUE,label:"MACHINE LEARNING",ly:218},
    dl:{cx:475,cy:470,rx:140,ry:150,col:GREEN,label:"DEEP LEARNING",ly:384},
  };
  const KEYS=["ai","ml","dl"], els={};
  for(const k of KEYS){ const r=RINGS[k], g=svgEl("g",{},svg);
    els[k]={g, e:svgEl("ellipse",{cx:r.cx,cy:r.cy,rx:r.rx,ry:r.ry,fill:r.col,"fill-opacity":0,stroke:r.col,"stroke-width":2.5},g)};
    const t=svgEl("text",{x:r.cx,y:r.ly,"text-anchor":"middle",fill:r.col,"font-size":19,"font-weight":700,"letter-spacing":2.5},g); t.textContent=r.label;
    g.style.transition="opacity .5s"; els[k].e.style.transition="fill-opacity .5s"; }
  // today's algorithms, placed in the ML ring (outside DL)
  const today=svgEl("g",{},svg); today.style.transition="opacity .5s";
  [["linear regression",310,275],["logistic regression",555,288],["k-NN",240,372],["decision trees",255,445],["k-means",300,560]].forEach(([t,X,Y2])=>{
    const tx=svgEl("text",{x:X,y:Y2,"text-anchor":"middle",fill:INK,"font-size":18,"font-family":"Space Grotesk"},today); tx.textContent=t; });
  const MSG=["Today we live in the <b style=\"color:var(--blue)\">machine learning</b> circle. Press → or click to step in.",
    "<b>AI</b>: any machine doing a task that usually needs human intelligence, even with hand-written rules.",
    "<b style=\"color:var(--blue)\">Machine learning</b>: the program <b>learns from examples</b>. Everything in today’s deck lives here.",
    "<b style=\"color:var(--green)\">Deep learning</b> is one kind of ML, using many-layered neural networks. That’s the next deck."];
  let k=0;
  function show(n){ k=n;
    KEYS.forEach((key,i)=>{ els[key].g.style.opacity=i<k?1:.25; els[key].e.setAttribute("fill-opacity",i<k?(key==="ml"&&k===2?.13:.06):0); });
    today.style.opacity=k>=2?1:0;
    document.querySelectorAll('[data-id="nest"] .ndef').forEach(d=>d.classList.toggle("hi",KEYS.indexOf(d.dataset.k)===k-1));
    fb.innerHTML=MSG[k]; }
  document.querySelector('[data-id="nest"]').addEventListener("click",e=>{ if(e.target.closest("button,a")) return; advance(); });
  A.nest={ enter(dir){ show(dir<0?3:0); }, step(){ if(k>=3) return false; show(k+1); return true; }, back(){ if(k<=0) return false; show(k-1); return true; } };
})();

/* ---------- ml map: reveal each branch ---------- */
(() => {
  const B=["mapS","mapU","mapR"].map($); let n=0;
  const show=i=>{ n=i; B.forEach((b,j)=>b.classList.toggle("on",j<n)); $("mapHint").style.opacity=n>=3?0:1; };
  A.mlmap={ enter(d){ show(d<0?3:0); }, step(){ if(n>=3) return false; show(n+1); return true; }, back(){ if(n<=0) return false; show(n-1); return true; } };
})();

/* ---------- traditional ML vs deep learning: one row per click ---------- */
(() => {
  const rows=[...document.querySelectorAll("#trTbl tr.rv")]; let n=0;
  function show(i){ n=i; rows.forEach((r,j)=>r.classList.toggle("on",j<n)); }
  A.trad={ enter(d){ show(d<0?rows.length:0); },
    step(){ if(n>=rows.length) return false; show(n+1); return true; },
    back(){ if(n<=0) return false; show(n-1); return true; } };
})();

/* ---------- four tasks: tiny live demos ---------- */
(() => {
  const cards=[...document.querySelectorAll('[data-id="tasks"] .task')], cvs=[0,1,2,3].map(i=>$("tk"+i));
  const r=srand(5);
  const C0=Array.from({length:26},(_,i)=>{ const c=i%2; return [c?.68+gauss(r)*.11:.3+gauss(r)*.11, c?.36+gauss(r)*.12:.66+gauss(r)*.12, c]; });
  const R1=Array.from({length:14},(_,i)=>{ const t=.08+i/13*.84; return [t,.15+t*.7+gauss(r)*.06]; });
  const K2=[[.25,.3],[.72,.3],[.5,.75]], P2=Array.from({length:36},(_,i)=>{ const c=K2[i%3]; return [c[0]+gauss(r)*.07,c[1]+gauss(r)*.07,i%3]; });
  let n=0;
  function show(i){ n=i; cards.forEach((c,j)=>{ c.classList.toggle("on",j===n-1); c.classList.toggle("seen",j<n-1||n>=5); });
    $("tkIdea").classList.toggle("on",n>=5); $("tkHint").style.opacity=n>=5?0:1; }
  A.tasks={
    enter(d){ show(d<0?5:0); }, step(){ if(n>=5) return false; show(n+1); return true; }, back(){ if(n<=0) return false; show(n-1); return true; },
    tick(dt,now){
      const t=now/1000;
      cvs.forEach((cv,i)=>{ const x=ctxOf(cv), W=cv.offsetWidth, H=cv.offsetHeight, X=v=>14+v*(W-28), Yp=v=>H-12-v*(H-24);
        x.clearRect(0,0,W,H);
        if(i===0){ dashed(x,X(.15),Yp(.12),X(.85),Yp(.92),MUTE,2,[6,5]);
          for(const p of C0) dot(x,X(p[0]),Yp(p[1]),4.5,p[2]?AMBER:BLUE);
          const ph=(t%4)/4, q=[.5+.3*Math.cos(t*.8),.5+.3*Math.sin(t*1.1)], c=q[1]<.12+(q[0]-.15)*(.8/.7)?1:0;
          dot(x,X(q[0]),Yp(q[1]),8,null,ph<.5?INK:(c?AMBER:BLUE)); label(x,ph<.5?"?":(c?"spam":"ok"),X(q[0])+12,Yp(q[1])-8,ph<.5?INK:(c?AMBER:BLUE),13); }
        if(i===1){ const [m,b]=ols(R1); x.strokeStyle=Y; x.lineWidth=2.5; x.beginPath(); x.moveTo(X(0),Yp(b)); x.lineTo(X(1),Yp(m+b)); x.stroke();
          for(const p of R1) dot(x,X(p[0]),Yp(p[1]),4.5,BLUE);
          const qx=.5+.4*Math.sin(t*.9), qy=m*qx+b; dashed(x,X(qx),Yp(0),X(qx),Yp(qy),INK,1.5); dot(x,X(qx),Yp(qy),7,Y); label(x,"$"+Math.round(150+qy*400)+"k",X(qx)+10,Yp(qy)+18,Y,13); }
        if(i===2){ const k=ease(clamp(Math.sin(t*1.2)*1.5+.5,0,1));
          for(const p of P2){ x.globalAlpha=1; dot(x,X(p[0]),Yp(p[1]),4.5,k>.5?[GREEN,PURPLE,AMBER][p[2]]:"#77756e"); }
          if(k>.5){ x.globalAlpha=k; K2.forEach((c,j)=>{ x.strokeStyle=[GREEN,PURPLE,AMBER][j]; x.lineWidth=1.5; x.beginPath(); x.arc(X(c[0]),Yp(c[1]),(W-28)*.17,0,7); x.stroke(); }); x.globalAlpha=1; } }
        if(i===3){ const cols=5, rows=3, gw=(W-28)/cols, gh=(H-24)/rows, rec=Math.floor(t/2.2)%3, recI=[7,11,13][rec];
          for(let j=0;j<cols*rows;j++){ const cx=14+(j%cols)*gw, cy=12+Math.floor(j/cols)*gh, seen=[0,2,5,8].includes(j), isR=j===recI;
            x.fillStyle=seen?"rgba(177,140,255,.35)":isR?"rgba(255,194,14,.25)":"#1c1c20"; x.fillRect(cx+4,cy+4,gw-8,gh-8);
            x.strokeStyle=isR?Y:seen?PURPLE:LINE; x.lineWidth=isR?2.5:1; x.strokeRect(cx+4,cy+4,gw-8,gh-8);
            label(x,seen?"✓":isR?"★":"▶",cx+gw/2,cy+gh/2+6,seen?PURPLE:isR?Y:"#55534d",isR?18:15,"center"); } }
      });
    }
  };
})();

/* ---------- 10 popular models: cards with drawn icons ---------- */
(() => {
  const grid=$("mGrid");
  const M=[
    ["Linear Regression","Predicts a number with a straight-line equation.",["reg"],1,"lin"],
    ["Logistic Regression","Yes/no classification, like spam detection or fraud.",["cls"],1,"log"],
    ["Decision Tree","Splits data with if/else questions. Easy to read.",["cls","reg"],1,"tree"],
    ["Random Forest","Many trees vote. More accurate, less overfitting.",["cls","reg"],0,"forest"],
    ["Support Vector Machine","Finds the widest boundary between classes.",["cls"],0,"svm"],
    ["k-Nearest Neighbors","Classifies by the majority of the closest points.",["cls"],1,"knn"],
    ["Naïve Bayes","Uses probability (Bayes’ theorem) to pick a class.",["cls"],0,"bayes"],
    ["K-Means Clustering","Groups similar points with no labels.",["uns"],1,"km"],
    ["PCA","Squeezes many features into a few, keeping the pattern.",["uns"],0,"pca"],
    ["Neural Network","Layers of neurons for images, text and speech. Deep learning.",["cls","reg"],0,"nn"],
  ];
  const TAG={reg:["t-blue","regression"],cls:["t-y","classification"],uns:["t-green","unsupervised"]};
  const r=srand(9);
  function icon(svg,kind){
    const g=(t,a)=>svgEl(t,a,svg), c=(x,y,f,rr=4.5)=>g("circle",{cx:x,cy:y,r:rr,fill:f});
    const ln=(x1,y1,x2,y2,s,w=2.5,d)=>g("line",{x1,y1,x2,y2,stroke:s,"stroke-width":w,"stroke-dasharray":d||"none","stroke-linecap":"round"});
    if(kind==="lin"){ for(let i=0;i<11;i++){ const X=25+i*15; c(X,98-i*7+gauss(r)*8,BLUE,4); } ln(20,102,180,22,Y); }
    if(kind==="log"){ for(let i=0;i<7;i++){ c(22+i*10,100,RED,4); c(110+i*11,18,GREEN,4); }
      const pts=[]; for(let X=15;X<=185;X+=5) pts.push(`${X},${100-82*sig((X-100)/13)}`); g("polyline",{points:pts.join(" "),fill:"none",stroke:Y,"stroke-width":3}); }
    if(kind==="tree"||kind==="forest"){ const T=(ox,oy,s)=>{ const N=[[0,0],[-1,1],[1,1],[-1.5,2],[-.5,2],[.5,2],[1.5,2]];
        [[0,1],[0,2],[1,3],[1,4],[2,5],[2,6]].forEach(([a,b])=>ln(ox+N[a][0]*s*20,oy+N[a][1]*s*30,ox+N[b][0]*s*20,oy+N[b][1]*s*30,MUTE,1.5));
        N.forEach((p,i)=>c(ox+p[0]*s*20,oy+p[1]*s*30,i<3?INK:(i%2?GREEN:AMBER),i<3?5*s:4.5*s)); };
      if(kind==="tree") T(100,22,1.25); else { T(40,16,.75); T(100,16,.75); T(160,16,.75); g("rect",{x:80,y:88,width:40,height:20,rx:5,fill:Y}); [40,100,160].forEach(X=>ln(X,66,100,88,MUTE,1.2,"3 3")); } }
    if(kind==="svm"){ ln(40,110,160,8,Y,2.5); ln(20,96,140,-6,MUTE,1.5,"5 4"); ln(60,124,180,22,MUTE,1.5,"5 4");
      for(let i=0;i<8;i++){ g("rect",{x:20+r()*55,y:15+r()*45,width:8,height:8,fill:BLUE}); c(130+r()*55,60+r()*45,AMBER); } }
    if(kind==="knn"){ const pts=[]; for(let i=0;i<16;i++) pts.push([20+r()*160,12+r()*94,i%2]);
      g("circle",{cx:100,cy:59,r:34,fill:"none",stroke:Y,"stroke-width":2,"stroke-dasharray":"4 4"});
      [[85,45,0],[118,50,0],[95,82,1],[112,75,0]].forEach(p=>pts.push(p)); pts.forEach(p=>c(p[0],p[1],p[2]?AMBER:BLUE,4)); c(100,59,INK,6); }
    if(kind==="bayes"){ const bell=(mu,col)=>{ const pts=[]; for(let X=10;X<=190;X+=4) pts.push(`${X},${105-80*Math.exp(-((X-mu)**2)/(2*22*22))}`); g("polyline",{points:pts.join(" "),fill:"none",stroke:col,"stroke-width":3}); };
      bell(75,BLUE); bell(125,AMBER); ln(100,10,100,108,MUTE,1.5,"4 4"); ln(10,105,190,105,LINE,2); }
    if(kind==="km"){ [[50,40,BLUE],[145,35,GREEN],[100,88,AMBER]].forEach(([X,Yc,col])=>{ for(let i=0;i<8;i++) c(X+gauss(r)*12,Yc+gauss(r)*9,col,4);
      ln(X-6,Yc-6,X+6,Yc+6,INK,2.5); ln(X+6,Yc-6,X-6,Yc+6,INK,2.5); }); }
    if(kind==="pca"){ for(let i=0;i<34;i++){ const t=gauss(r)*30, s=gauss(r)*8; c(100+t*.9-s*.45,59-t*.45-s*.9,"rgba(106,184,255,.8)",3.5); }
      ln(30,94,172,22,Y,3); g("polygon",{points:"172,22 160,22 165,32",fill:Y}); }
    if(kind==="nn"){ const L=[[3,40],[4,100],[2,160]], N=L.map(([n,X])=>Array.from({length:n},(_,i)=>[X,59+(i-(n-1)/2)*26]));
      for(let l=0;l<2;l++) for(const a of N[l]) for(const b of N[l+1]) ln(a[0],a[1],b[0],b[1],"rgba(155,152,143,.45)",1.2);
      N.forEach((col,l)=>col.forEach(p=>c(p[0],p[1],[BLUE,Y,PURPLE][l],8))); }
  }
  M.forEach(([nm,d,tags,star,kind],i)=>{
    const el=document.createElement("div"); el.className="card mc";
    el.innerHTML=`<svg viewBox="0 0 200 118"></svg><h3><i>${i+1}</i>${nm}${star?' <span class="y">★</span>':""}</h3><p>${d}</p><div class="tags">${tags.map(t=>`<span class="tag ${TAG[t][0]}">${TAG[t][1]}</span>`).join("")}</div>`;
    icon(el.querySelector("svg"),kind); el.onclick=()=>el.classList.toggle("sel"); grid.appendChild(el); });
  A.models={ enter(){ grid.querySelectorAll(".sel").forEach(e=>e.classList.remove("sel")); } };
})();

/* ---------- supervised flow: click Train, then Predict (animated) ---------- */
(() => {
  const M=$("svM"), B=$("svB"), gear=$("svGear"), layer=$("svFly"), wrap=document.querySelector(".svWrap");
  const trRows=[...$("svA").querySelectorAll(".r")], pdRows=[...B.querySelectorAll(".r")], ANS=["apple","banana"];
  const TS=1100, TD=1200, TT=(trRows.length-1)*TS+TD+300;          // training flights (ms)
  const T_CARD=TT+400, T_DOWN=T_CARD+700, T2=T_DOWN+900;            // then: new-data card in, model down, Predict button
  const PS=2000, PT=pdRows.length*PS;                               // prediction flights (ms)
  const mk=h=>{ const d=document.createElement("div"); d.className="fly"; d.innerHTML=h; layer.appendChild(d); return d; };
  const emo=r=>r.querySelector(".e").textContent;
  const trFly=trRows.map(r=>mk(`<span>${emo(r)}</span><span class="lb">${r.querySelector(".lb").textContent}</span>`));
  const pdIn=pdRows.map(r=>mk(`<span>${emo(r)}</span>`)), pdOut=ANS.map(a=>mk(`<span class="lb">${a}</span>`));
  let n=1, t=0, ang=0, shown=[];
  const ease=u=>u<.5?2*u*u:1-(-2*u+2)**2/2, cl=u=>Math.max(0,Math.min(1,u));
  const K=()=>layer.getBoundingClientRect().width/1600||1;
  function ctr(el){ const L=layer.getBoundingClientRect(), r=el.getBoundingClientRect(), k=K();
    return [(r.left+r.width/2-L.left)/k,(r.top+r.height/2-L.top)/k]; }
  function box(el){ const L=wrap.getBoundingClientRect(), r=el.getBoundingClientRect(), k=K();
    return {l:(r.left-L.left)/k,t:(r.top-L.top)/k,r:(r.right-L.left)/k,b:(r.bottom-L.top)/k}; }
  function place(el,a,b,u,arc,s0,s1){ if(u<=0||u>=1){ el.style.opacity=0; return; }
    const e=ease(u), x=a[0]+(b[0]-a[0])*e, y=a[1]+(b[1]-a[1])*e-arc*Math.sin(Math.PI*e);
    el.style.opacity=u>.85?(1-u)/.15:Math.min(1,u/.1);
    el.style.transform=`translate(${x}px,${y}px) translate(-50%,-50%) scale(${s0+(s1-s0)*e})`; }
  function arrow(path,from,to,col,op){ const x0=from.r+10, y0=(from.t+from.b)/2, x1=to.l-8, y1=(to.t+to.b)/2, mx=(x0+x1)/2;
    path.setAttribute("d",`M${x0},${y0} C${mx},${y0} ${mx},${y1} ${x1},${y1}`); path.style.stroke=col; path.style.opacity=op; }
  function render(){
    const t2=n<2?0:n===2?Math.min(t,T2):T2, tr=Math.min(t2,TT), pd=n<3?0:n===3?Math.min(t,PT):PT, g=ctr(gear);
    const cardIn=t2>=T_CARD, down=t2>=T_DOWN;
    B.classList.toggle("on",cardIn); M.classList.toggle("down",down);
    $("svTrainW").classList.toggle("show",n===1); $("svPredW").classList.toggle("show",n===2&&t2>=T2);
    let k=0;
    trRows.forEach((r,i)=>{ const u=cl((tr-i*TS)/TD); if(u>=1) k++;
      r.classList.toggle("hot",u>0&&u<1); r.classList.toggle("sent",u>=1&&tr<TT);
      place(trFly[i],ctr(r.querySelector(".e")),g,u,90,1,.45); });
    let busy=n===2&&tr<TT;
    pdRows.forEach((r,j)=>{ const d=pd-j*PS, lb=r.querySelector(".lb");
      place(pdIn[j],ctr(r.querySelector(".e")),g,cl(d/700),60,1,.45);
      if(d>650&&d<1350) busy=true;
      place(pdOut[j],g,ctr(lb),cl((d-1300)/600),70,.6,1);
      const done=d>=1900; r.classList.toggle("hot",d>0&&d<1900);
      if(done!==!!shown[j]){ shown[j]=done; lb.textContent=done?ANS[j]:"?"; if(done) lb.classList.remove("pop"),void lb.offsetWidth,lb.classList.add("pop"); } });
    const trained=tr>=TT;
    $("svBarI").style.width=(trained?100:k/trRows.length*100)+"%"; $("svBarI").classList.toggle("full",trained);
    $("svMt").textContent=n<2?"untrained: no idea yet":!trained?`learning… ${k} / ${trRows.length} examples`:n===3&&pd<PT?"predicting…":"learned: color + shape → fruit";
    M.classList.toggle("busy",busy); M._busy=busy; M._trained=trained;
    const mb=box(M);
    arrow($("svArA"),box($("svA")),mb,down?"var(--mute)":"var(--y)",down?.35:1);
    arrow($("svArB"),box(B),mb,"var(--y)",cardIn?1:0);
    $("svS1").className="pill "+(trained?"done":"on");
    $("svS2").className="pill "+(n===3&&pd<PT?"on":n>=3?"done":"");
    $("svIdea").classList.toggle("on",n>=4); }
  const running=()=>(n===2&&t<T2)||(n===3&&t<PT);
  const go=()=>{ if(running()){ t=1e9; render(); return true; } if(n>=4) return false; n++; t=0; render(); return true; };
  $("svTrain").onclick=()=>{ if(n===1) go(); };
  $("svPred").onclick=()=>{ if(n===2&&!running()) go(); };
  A.supervised={
    enter(d){ n=d<0?4:1; t=d<0?1e9:0; shown=[]; render(); },
    step:go,
    back(){ if(n<=1) return false; n--; t=1e9; render(); return true; },
    tick(dt){ if(running()) t+=dt; ang+=(M._busy?.55:M._trained?.05:0)*dt; gear.style.transform=`rotate(${ang%360}deg)`; render(); } };
})();

/* ---------- linear regression: fit the line by hand ---------- */
(() => {
  const cv=$("lfCv"), r=srand(21);
  const D=Array.from({length:16},(_,i)=>{ const s=.9+i/15*2.2+(r()-.5)*.12; return [s,60+s*110+gauss(r)*28]; });
  const [M0,B0]=ols(D); let m=40,b=200, anim=null;
  const err=()=>D.reduce((s,[a,y])=>s+Math.abs(y-(m*a+b)),0)/D.length;
  function sync(){ $("lfM").value=m; $("lfB").value=b; $("lfMv").textContent=Math.round(m); $("lfBv").textContent=Math.round(b);
    const e=err(), best=D.reduce((s,[a,y])=>s+Math.abs(y-(M0*a+B0)),0)/D.length;
    $("lfErr").textContent="$"+e.toFixed(0)+"k"; $("lfBar").style.width=clamp(e/180*100,2,100)+"%"; $("lfBar").style.background=e<best*1.08?GREEN:e<best*2?Y:RED; }
  $("lfM").oninput=e=>{ anim=null; m=+e.target.value; sync(); }; $("lfB").oninput=e=>{ anim=null; b=+e.target.value; sync(); };
  $("lfFit").onclick=()=>{ anim={t:0,m0:m,b0:b}; }; $("lfReset").onclick=()=>{ anim=null; m=40; b=200; sync(); };
  A.linfit={
    enter(){ anim=null; m=40; b=200; sync(); },
    tick(dt){
      if(anim){ anim.t+=dt/1200; const k=ease(anim.t); m=lerp(anim.m0,M0,k); b=lerp(anim.b0,B0,k); sync(); if(anim.t>=1) anim=null; }
      const x=ctxOf(cv), P=plot(cv,[.5,3.5],[0,500],[80,30,30,64]); x.clearRect(0,0,P.W,P.H);
      frame(x,P,[1,1.5,2,2.5,3],[0,100,200,300,400,500],"house size (1000 sq ft)","price ($ thousands)",v=>v.toFixed(1),v=>"$"+v);
      x.save(); x.beginPath(); x.rect(P.L,P.T,P.R-P.L,P.B-P.T); x.clip();
      for(const [a,y] of D) dashed(x,P.px(a),P.py(y),P.px(a),P.py(m*a+b),"rgba(255,90,78,.75)",1.5);
      x.strokeStyle=Y; x.lineWidth=3.5; x.beginPath(); x.moveTo(P.px(.5),P.py(m*.5+b)); x.lineTo(P.px(3.5),P.py(m*3.5+b)); x.stroke(); x.restore();
      for(const [a,y] of D) dot(x,P.px(a),P.py(y),7,BLUE,"#0d0d0f");
    }
  };
})();

/* ---------- y = mx + b explorer ---------- */
(() => {
  const cv=$("lnCv"); let m=2,b=3;
  const sgn=v=>v<0?"− ":"+ ";
  function eqText(){ const mt=m===0?"":(m===1?"x":m===-1?"−x":(m<0?"−":"")+fmt(Math.abs(m))+"x"); const bt=b===0?"":(mt?" "+sgn(b)+Math.abs(b):(b<0?"−":"")+Math.abs(b));
    return `y = <span class="y">${mt||""}</span>${mt?"":""}<span style="color:var(--blue)">${bt||(mt?"":"0")}</span>`; }
  function sync(){ $("lnM").value=m; $("lnB").value=b; $("lnMv").textContent=fmt(m); $("lnBv").textContent=b; $("lnEq").innerHTML=eqText(); }
  $("lnM").oninput=e=>{ m=+e.target.value; sync(); }; $("lnB").oninput=e=>{ b=+e.target.value; sync(); };
  document.querySelectorAll('[data-id="ymxb"] [data-p]').forEach(bt=>bt.onclick=()=>{ [m,b]=bt.dataset.p.split(",").map(Number); sync(); });
  A.ymxb={
    enter(){ m=2; b=3; sync(); },
    tick(){
      const x=ctxOf(cv), W=cv.offsetWidth, H=cv.offsetHeight, S=26, cx=W/2, cy=H/2, X=v=>cx+v*S, Yp=v=>cy-v*S;
      x.clearRect(0,0,W,H); x.lineWidth=1;
      for(let v=-20;v<=20;v++){ x.strokeStyle=v%5?"rgba(255,255,255,.04)":"rgba(255,255,255,.09)"; x.beginPath(); x.moveTo(X(v),0); x.lineTo(X(v),H); x.stroke(); x.beginPath(); x.moveTo(0,Yp(v)); x.lineTo(W,Yp(v)); x.stroke(); }
      x.strokeStyle="#55534d"; x.lineWidth=2; x.beginPath(); x.moveTo(0,cy); x.lineTo(W,cy); x.moveTo(cx,0); x.lineTo(cx,H); x.stroke();
      for(const v of [-10,-5,5,10]){ label(x,v,X(v),cy+20,MUTE,13,"center"); label(x,v,cx-8,Yp(v)+5,MUTE,13,"right"); }
      
      x.strokeStyle=Y; x.lineWidth=4; x.beginPath(); x.moveTo(X(-20),Yp(m*-20+b)); x.lineTo(X(20),Yp(m*20+b)); x.stroke();
      // slope triangle: run 1 → rise m (drawn ×2 so it's visible)
      if(m!==0){ const x0=1, y0=m*x0+b; dashed(x,X(x0),Yp(y0),X(x0+2),Yp(y0),INK,2,[4,4]); dashed(x,X(x0+2),Yp(y0),X(x0+2),Yp(y0+2*m),INK,2,[4,4]);
        label(x,"run 2",X(x0+1),Yp(y0)+(m>0?20:-10),MUTE,14,"center"); label(x,"rise "+fmt(2*m),X(x0+2)+10,Yp(y0+m)+5,Y,15); }
      dot(x,X(0),Yp(b),8,BLUE,"#0d0d0f"); label(x,"b = "+b,X(0)-14,Yp(b)-12,BLUE,16,"right");
      const tag=(t,px,py,al)=>{ x.font='15px "JetBrains Mono",monospace'; const w=x.measureText(t).width+14, lx=al==="right"?px-w:px; x.fillStyle="rgba(13,13,15,.9)"; x.fillRect(lx,py-17,w,24); label(x,t,lx+7,py,INK,15); };
      tag("x (independent) →",W-12,cy-12,"right"); tag("↑ y (dependent)",cx+10,26);
    }
  };
})();

/* ---------- slope from two points ---------- */
(() => {
  const cv=$("slCv"), L=[0,1,2,3,4].map(i=>$("sl"+i)); let n=0;
  function show(i){ n=i; L.forEach((l,j)=>{ l.classList.toggle("on",j<n); l.classList.toggle("cur",j===n-1); }); $("slIdea").classList.toggle("on",n>=6); }
  A.slope={
    enter(d){ show(d<0?6:0); }, step(){ if(n>=6) return false; show(n+1); return true; }, back(){ if(n<=0) return false; show(n-1); return true; },
    tick(){
      const x=ctxOf(cv), P=plot(cv,[0,5],[0,120],[70,30,30,64]); x.clearRect(0,0,P.W,P.H);
      frame(x,P,[0,1,2,3,4,5],[0,20,40,60,80,100,120],"hours studied","exam score");
      if(n>=3){ x.strokeStyle=Y; x.lineWidth=3; x.globalAlpha=n>=5?1:.5; x.beginPath(); x.moveTo(P.px(n>=5?0:1),P.py(n>=5?35:50)); x.lineTo(P.px(n>=5?5:3),P.py(n>=5?110:80)); x.stroke(); x.globalAlpha=1; }
      if(n>=1){ dashed(x,P.px(3),P.py(50),P.px(3),P.py(80),Y,3,[6,4]); label(x,"rise 30",P.px(3)+12,P.py(65)+5,Y,17); }
      if(n>=2){ dashed(x,P.px(1),P.py(50),P.px(3),P.py(50),Y,3,[6,4]); label(x,"run 2",P.px(2),P.py(50)+24,Y,17,"center"); }
      if(n>=4){ dot(x,P.px(0),P.py(35),8,BLUE,"#0d0d0f"); label(x,"b = 35",P.px(0)+14,P.py(35)+22,BLUE,17); }
      if(n>=5){ dot(x,P.px(4),P.py(95),7,null,Y); label(x,"4 h → 95",P.px(4)+12,P.py(95)+22,Y,16); }
      for(const [a,s] of [[1,50],[3,80]]){ dot(x,P.px(a),P.py(s),9,BLUE,"#0d0d0f"); label(x,`(${a}, ${s})`,P.px(a)-12,P.py(s)-14,INK,17,"right"); }
    }
  };
})();

/* ---------- how linear regression works ---------- */
(() => {
  const cv=$("hlCv"), C=[0,1,2,3].map(i=>$("hc"+i)), r=srand(4);
  const D=Array.from({length:16},()=>{ const h=r()*8; return [h,50+5*h+gauss(r)*5]; }); let n=0;
  const show=i=>{ n=i; C.forEach((c,j)=>c.classList.toggle("on",j<n)); };
  A.howlr={
    enter(d){ show(d<0?4:0); }, step(){ if(n>=4) return false; show(n+1); return true; }, back(){ if(n<=0) return false; show(n-1); return true; },
    tick(){ const x=ctxOf(cv), P=plot(cv,[0,8],[35,105],[30,8,8,24]); x.clearRect(0,0,P.W,P.H); axes(x,P.L,P.T,P.R,P.B);
      label(x,"hours studied",P.R,P.H-4,MUTE,12,"right"); label(x,"score",P.L+6,P.T+12,MUTE,12);
      x.strokeStyle=Y; x.lineWidth=2.5; x.beginPath(); x.moveTo(P.px(0),P.py(50)); x.lineTo(P.px(8),P.py(90)); x.stroke();
      for(const [a,s] of D) dot(x,P.px(a),P.py(s),4.5,BLUE);
      if(n>=4){ dashed(x,P.px(4),P.B,P.px(4),P.py(70),INK,1.5); dot(x,P.px(4),P.py(70),7,Y); } }
  };
})();

/* ---------- multiple linear regression: a plane in 3D ---------- */
(() => {
  const cv=$("muCv"), r=srand(8); let yaw=-.6, pitch=.42, drag=null;
  // u = area (−1..1 ≙ 1000..3000 sq ft), v = bedrooms (−1..1 ≙ 1..5), w = price (scaled)
  const f=(u,v)=>.55*u+.3*v-.05;
  const D=Array.from({length:34},()=>{ const u=r()*2-1, v=Math.round((r()*2-1)*2)/2; return [u,v,f(u,v)+gauss(r)*.12]; });
  function proj(u,v,w,W,H){ const S=Math.min(W,H)*.24, x1=u*Math.cos(yaw)-v*Math.sin(yaw), d=u*Math.sin(yaw)+v*Math.cos(yaw);
    return [W/2+S*x1, H*.54-S*(w*Math.cos(pitch)+d*Math.sin(pitch)), d]; }
  cv.addEventListener("pointerdown",e=>{ drag=localXY(e,cv); cv.setPointerCapture(e.pointerId); cv.style.cursor="grabbing"; });
  cv.addEventListener("pointermove",e=>{ if(!drag) return; const p=localXY(e,cv); yaw+=(p[0]-drag[0])*.008; pitch=clamp(pitch+(p[1]-drag[1])*.006,.05,1.2); drag=p; });
  cv.addEventListener("pointerup",()=>{ drag=null; cv.style.cursor="grab"; });
  A.multi={
    enter(){ yaw=-.6; pitch=.42; },
    tick(dt){
      if(!drag) yaw+=dt*.00012;
      const x=ctxOf(cv), W=cv.offsetWidth, H=cv.offsetHeight, p=(u,v,w)=>proj(u,v,w,W,H); x.clearRect(0,0,W,H);
      // floor grid
      x.strokeStyle="rgba(255,255,255,.07)"; x.lineWidth=1;
      for(let t=-1;t<=1.001;t+=.5){ let a=p(t,-1,-1), b=p(t,1,-1); x.beginPath(); x.moveTo(a[0],a[1]); x.lineTo(b[0],b[1]); x.stroke(); a=p(-1,t,-1); b=p(1,t,-1); x.beginPath(); x.moveTo(a[0],a[1]); x.lineTo(b[0],b[1]); x.stroke(); }
      // axes
      const ax=(a,b,col,t)=>{ const A1=p(...a), B1=p(...b); x.strokeStyle=col; x.lineWidth=2; x.beginPath(); x.moveTo(A1[0],A1[1]); x.lineTo(B1[0],B1[1]); x.stroke(); x.font='16px "JetBrains Mono",monospace'; const tw=x.measureText(t).width+12; x.fillStyle="rgba(13,13,15,.85)"; x.fillRect(B1[0]-tw/2,B1[1]-28,tw,24); label(x,t,B1[0],B1[1]-10,col,16,"center"); };
      // plane
      x.fillStyle="rgba(255,194,14,.10)"; const c=[p(-1,-1,f(-1,-1)),p(1,-1,f(1,-1)),p(1,1,f(1,1)),p(-1,1,f(-1,1))];
      x.beginPath(); c.forEach((q,i)=>i?x.lineTo(q[0],q[1]):x.moveTo(q[0],q[1])); x.closePath(); x.fill();
      x.strokeStyle="rgba(255,194,14,.45)"; x.lineWidth=1.2;
      for(let t=-1;t<=1.001;t+=.25){ let a=p(t,-1,f(t,-1)), b=p(t,1,f(t,1)); x.beginPath(); x.moveTo(a[0],a[1]); x.lineTo(b[0],b[1]); x.stroke(); a=p(-1,t,f(-1,t)); b=p(1,t,f(1,t)); x.beginPath(); x.moveTo(a[0],a[1]); x.lineTo(b[0],b[1]); x.stroke(); }
      // points, far ones first, with error stems to the plane
      D.map(d=>({d,q:p(...d),s:p(d[0],d[1],f(d[0],d[1]))})).sort((a,b)=>b.q[2]-a.q[2]).forEach(({d,q,s})=>{
        dashed(x,q[0],q[1],s[0],s[1],"rgba(255,90,78,.7)",1.2,[3,3]); dot(x,q[0],q[1],6,d[2]>f(d[0],d[1])?BLUE:"#4a8fd0","#0d0d0f"); });
      ax([-1,-1,-1],[1.25,-1,-1],BLUE,"x₁ area"); ax([-1,-1,-1],[-1,1.25,-1],BLUE,"x₂ bedrooms"); ax([-1,-1,-1],[-1,-1,1.15],Y,"y price");
    }
  };
})();

/* ---------- logistic regression ---------- */
(() => {
  const cv=$("lgCv"), r=srand(31);
  const D=Array.from({length:26},(_,i)=>{ const h=.3+i/25*9.4+(r()-.5)*.3; return [h, r()<sig(1.6*(h-3.4))?1:0, (r()-.5)*.05]; });
  let X=4,w=2,b=-6,t=.5;
  function sync(){ const z=w*X+b, p=sig(z), pass=p>=t;
    $("lgXv").textContent=fmt(X); $("lgWv").textContent=fmt(w,1); $("lgBv").textContent=fmt(b,1); $("lgTv").textContent=fmt(t,2);
    $("lgZ").textContent=`${fmt(w,1)}(${fmt(X)}) ${b<0?"−":"+"} ${fmt(Math.abs(b),1)} = ${fmt(z,2)}`; $("lgP").textContent=p.toFixed(2);
    $("lgD").innerHTML=`p ${pass?"≥":"<"} ${fmt(t,2)} → predict <b style="color:${pass?GREEN:AMBER}">${pass?"Pass":"Fail"}</b>`;
    const acc=D.filter(([h,y])=>(sig(w*h+b)>=t?1:0)===y).length; $("lgCap").textContent=`correct on these ${D.length} past students: ${acc} / ${D.length}`; }
  [["lgX",v=>X=v],["lgW",v=>w=v],["lgB",v=>b=v],["lgT",v=>t=v]].forEach(([id,s])=>$(id).oninput=e=>{ s(+e.target.value); sync(); });
  A.logistic={
    enter(){ X=4; w=2; b=-6; t=.5; ["lgX","lgW","lgB","lgT"].forEach((id,i)=>$(id).value=[X,w,b,t][i]); sync(); },
    tick(){
      const x=ctxOf(cv), P=plot(cv,[0,10],[-.08,1.08],[80,30,30,64]); x.clearRect(0,0,P.W,P.H);
      const bx=(Math.log(t/(1-t))-b)/w;
      if(bx>0&&bx<10){ x.fillStyle="rgba(95,214,138,.06)"; x.fillRect(P.px(bx),P.T,P.R-P.px(bx),P.B-P.T); x.fillStyle="rgba(255,138,31,.06)"; x.fillRect(P.L,P.T,P.px(bx)-P.L,P.B-P.T); }
      frame(x,P,[0,2,4,6,8,10],[0,.25,.5,.75,1],"hours studied","probability of passing",v=>v,v=>v.toFixed(2));
      dashed(x,P.L,P.py(t),P.R,P.py(t),MUTE,1.5);
      label(x,"threshold "+fmt(t,2),P.R-6,P.py(t)-8,MUTE,14,"right");
      if(bx>0&&bx<10){ dashed(x,P.px(bx),P.T,P.px(bx),P.B,Y,2,[7,5]); label(x,"decision boundary",P.px(bx)+8,P.T+18,Y,14); }
      x.strokeStyle=Y; x.lineWidth=3.5; x.beginPath(); for(let h=0;h<=10.001;h+=.05){ const q=[P.px(h),P.py(sig(w*h+b))]; h?x.lineTo(...q):x.moveTo(...q); } x.stroke();
      for(const [h,y,j] of D) dot(x,P.px(h),P.py(y+j),7,y?GREEN:RED,"#0d0d0f");
      label(x,"● passed (1)",P.R-8,P.py(1)+30,GREEN,14,"right"); label(x,"● failed (0)",P.L+8,P.py(.13),RED,14);
      const p=sig(w*X+b); dashed(x,P.px(X),P.B,P.px(X),P.py(p),INK,1.5); dashed(x,P.L,P.py(p),P.px(X),P.py(p),INK,1.5);
      dot(x,P.px(X),P.py(p),10,p>=t?GREEN:AMBER,INK); label(x,"p = "+p.toFixed(2),P.px(X)+14,P.py(p)+(p>.8?24:-10),INK,16);
    }
  };
})();

/* ---------- k-NN ---------- */
function knnData(seed,n){ const r=srand(seed); return Array.from({length:n},(_,i)=>{ const c=i%2; return [clamp((c?.64:.36)+gauss(r)*.16,.04,.96),clamp((c?.42:.6)+gauss(r)*.16,.05,.95),c]; }); }
function knnDraw(x,cv,D,q,k,opts={}){
  const W=cv.offsetWidth, H=cv.offsetHeight, S=Math.min(W,H)-60, ox=(W-S)/2, oy=(H-S)/2, X=v=>ox+v*S, Yp=v=>oy+(1-v)*S;
  x.clearRect(0,0,W,H); x.strokeStyle="rgba(255,255,255,.05)"; x.lineWidth=1;
  for(let v=0;v<=1.001;v+=.1){ x.beginPath(); x.moveTo(X(v),Yp(0)); x.lineTo(X(v),Yp(1)); x.stroke(); x.beginPath(); x.moveTo(X(0),Yp(v)); x.lineTo(X(1),Yp(v)); x.stroke(); }
  const ds=D.map((p,i)=>({i,d:Math.hypot(p[0]-q[0],p[1]-q[1])})).sort((a,b)=>a.d-b.d), nn=ds.slice(0,k);
  const showAll=opts.all, showNN=opts.nn!==false, vote=opts.vote!==false;
  if(showAll) for(const p of D) dashed(x,X(q[0]),Yp(q[1]),X(p[0]),Yp(p[1]),"rgba(243,241,234,.18)",1,[3,4]);
  if(showNN){ const R=nn[nn.length-1].d*S; x.strokeStyle=Y; x.lineWidth=2; x.setLineDash([6,5]); x.beginPath(); x.arc(X(q[0]),Yp(q[1]),R+8,0,7); x.stroke(); x.setLineDash([]);
    for(const {i} of nn){ x.strokeStyle="rgba(255,194,14,.8)"; x.lineWidth=2; x.beginPath(); x.moveTo(X(q[0]),Yp(q[1])); x.lineTo(X(D[i][0]),Yp(D[i][1])); x.stroke(); } }
  D.forEach((p,i)=>{ const isN=showNN&&nn.some(o=>o.i===i); dot(x,X(p[0]),Yp(p[1]),isN?9:7,p[2]?AMBER:BLUE,isN?INK:"#0d0d0f"); });
  const vA=nn.filter(o=>D[o.i][2]===1).length, vB=k-vA, pred=vA>vB?1:0;
  dot(x,X(q[0]),Yp(q[1]),13,vote?(pred?AMBER:BLUE):"#0d0d0f",INK); if(!vote) label(x,"?",X(q[0]),Yp(q[1])+6,INK,17,"center");
  return {vA,vB,pred,X,Yp,S,ox,oy};
}
(() => {
  const cv=$("knCv"), D=knnData(13,44); let q=[.5,.52], k=5, last=null;
  $("knK").oninput=e=>{ k=+e.target.value; $("knKv").textContent=k; };
  cv.addEventListener("click",e=>{ if(!last) return; const [px,py]=localXY(e,cv); q=[clamp((px-last.ox)/last.S,0,1),clamp(1-(py-last.oy)/last.S,0,1)]; });
  A.knn={
    enter(){ q=[.5,.52]; k=5; $("knK").value=5; $("knKv").textContent=5; },
    tick(){ const x=ctxOf(cv); last=knnDraw(x,cv,D,q,k);
      $("knVB").textContent=last.vB; $("knVA").textContent=last.vA; $("knPred").innerHTML=last.pred?'<span style="color:var(--amber)">orange</span>':'<span style="color:var(--blue)">blue</span>'; }
  };
})();
(() => {
  const cv=$("ksCv"), D=knnData(17,30), q=[.53,.5]; let n=0;
  function show(i){ n=i; steps($("ksList"),n-1); }
  A.knnsteps={
    enter(d){ show(d<0?4:0); }, step(){ if(n>=4) return false; show(n+1); return true; }, back(){ if(n<=0) return false; show(n-1); return true; },
    tick(){ const x=ctxOf(cv), res=knnDraw(x,cv,D,q,5,{all:n===2,nn:n>=3,vote:n>=4});
      $("ksCap").innerHTML=n>=4?`5 neighbors: ${res.vB} blue, ${res.vA} orange → <b style="color:${res.pred?AMBER:BLUE}">${res.pred?"orange":"blue"}</b>`:n>=3?"the 5 nearest neighbors":n>=2?`distances to all ${D.length} points`:"new point: ?"; }
  };
})();

/* ---------- decision tree: tree on the left, boxes on the right ---------- */
(() => {
  const svg=$("trSvg"), cv=$("trCv"), r=srand(19);
  const rule=(h,a)=>h<3?(a>=90?1:0):(a>=60?1:0);
  const D=Array.from({length:34},()=>{ const h=r()*8, a=20+r()*80; return [h,a,rule(h,a)]; });
  D.push([1.2,94,1],[2.1,97,1],[.8,92,1]);
  const S=[["Ana",2,95],["Ben",6,40],["Cy",5,85]];
  let n=0, sel=-1;
  const cnt=f=>{ const s=D.filter(f); return [s.filter(d=>d[2]).length,s.filter(d=>!d[2]).length]; };
  function node(x,y,txt,sub,kind,hi){ const w=kind==="q"?250:150, h=kind==="q"?56:62;
    const col=kind==="q"?INK:kind==="p"?GREEN:RED;
    svgEl("rect",{x:x-w/2,y:y-h/2,width:w,height:h,rx:12,fill:kind==="q"?"#1c1c20":kind==="p"?"rgba(95,214,138,.14)":"rgba(255,90,78,.14)",stroke:hi?Y:kind==="q"?"#4a4a52":col,"stroke-width":hi?3.5:2},svg);
    const t=svgEl("text",{x,y:y+(sub?-3:7),"text-anchor":"middle",fill:col,"font-size":kind==="q"?20:22,"font-weight":700,"font-family":"Space Grotesk"},svg); t.textContent=txt;
    if(sub){ const s=svgEl("text",{x,y:y+19,"text-anchor":"middle",fill:MUTE,"font-size":13,"font-family":"JetBrains Mono"},svg); s.textContent=sub; } }
  function edge(x1,y1,x2,y2,t,hi){ svgEl("line",{x1,y1,x2,y2,stroke:hi?Y:"#55534d","stroke-width":hi?4:2},svg);
    const e=svgEl("text",{x:(x1+x2)/2+(x2<x1?-14:14),y:(y1+y2)/2,"text-anchor":x2<x1?"end":"start",fill:hi?Y:MUTE,"font-size":16,"font-family":"JetBrains Mono"},svg); e.textContent=t; }
  function leaf(x,y,f,hi){ const [p,q]=cnt(f); node(x,y,p>=q?"PASS":"FAIL",`${p} pass · ${q} fail`,p>=q?"p":"f",hi); }
  function draw(){
    svg.innerHTML=""; const s=sel>=0?S[sel]:null, goR=s&&s[1]>=3;
    if(n===0){ const [p,q]=cnt(()=>1); node(325,70,"All students",`${p} pass · ${q} fail`,"q",false);
      const t=svgEl("text",{x:325,y:180,"text-anchor":"middle",fill:MUTE,"font-size":17,"font-family":"Space Grotesk"},svg); t.textContent="No questions yet: which split separates pass from fail best?"; return; }
    edge(325,98,165,192,"no",s&&!goR); edge(325,98,485,192,"yes",s&&goR);
    node(325,70,"hours ≥ 3 ?",null,"q",!!s);
    if(n>=2){ edge(165,220,85,342,"no",s&&!goR&&s[2]<90); edge(165,220,245,342,"yes",s&&!goR&&s[2]>=90);
      node(165,192,"attendance ≥ 90% ?",null,"q",s&&!goR); leaf(85,372,d=>d[0]<3&&d[1]<90,s&&!goR&&s[2]<90); leaf(245,372,d=>d[0]<3&&d[1]>=90,s&&!goR&&s[2]>=90); }
    else leaf(165,192,d=>d[0]<3,s&&!goR);
    if(n>=3){ edge(485,220,405,342,"no",s&&goR&&s[2]<60); edge(485,220,565,342,"yes",s&&goR&&s[2]>=60);
      node(485,192,"attendance ≥ 60% ?",null,"q",s&&goR); leaf(405,372,d=>d[0]>=3&&d[1]<60,s&&goR&&s[2]<60); leaf(565,372,d=>d[0]>=3&&d[1]>=60,s&&goR&&s[2]>=60); }
    else leaf(485,192,d=>d[0]>=3,s&&goR);
    if(s){ const p=rule(s[1],s[2]); const t=svgEl("text",{x:325,y:470,"text-anchor":"middle",fill:p?GREEN:RED,"font-size":22,"font-weight":700,"font-family":"Space Grotesk"},svg);
      t.textContent=`${s[0]}: ${s[1]} h, ${s[2]}% attendance → ${p?"PASS":"FAIL"}`; }
  }
  function show(i){ n=i; if(n<3) sel=-1; document.querySelectorAll('[data-id="tree"] [data-s]').forEach(b=>b.classList.toggle("on",+b.dataset.s===sel)); draw();
    $("trHint").textContent=n<3?"press → to grow the tree one split at a time":"the tree is done: route a student through it";
    $("trCap").textContent=["each split cuts the data into boxes","split 1: hours ≥ 3","split 2: attendance ≥ 90% (low hours)","split 3: attendance ≥ 60% (high hours)"][n]; }
  document.querySelectorAll('[data-id="tree"] [data-s]').forEach(b=>b.onclick=()=>{ sel=+b.dataset.s; show(3); });
  A.tree={
    enter(d){ sel=-1; show(d<0?3:0); }, step(){ if(n>=3) return false; show(n+1); return true; }, back(){ if(n<=0) return false; sel=-1; show(n-1); return true; },
    tick(){ const x=ctxOf(cv), P=plot(cv,[0,8],[20,100],[70,50,24,60]); x.clearRect(0,0,P.W,P.H);
      const box=(x0,x1,y0,y1,f)=>{ const [p,q]=cnt(d=>d[0]>=x0&&d[0]<x1&&d[1]>=y0&&d[1]<y1&&f(d)); x.fillStyle=p>=q?"rgba(95,214,138,.09)":"rgba(255,90,78,.09)"; x.fillRect(P.px(x0),P.py(y1),P.px(x1)-P.px(x0),P.py(y0)-P.py(y1)); };
      const all=()=>1;
      if(n>=1){ if(n>=2){ box(0,3,20,90,all); box(0,3,90,101,all); } else box(0,3,20,101,all); if(n>=3){ box(3,8.01,20,60,all); box(3,8.01,60,101,all); } else box(3,8.01,20,101,all); }
      frame(x,P,[0,2,4,6,8],[20,40,60,80,100],"hours studied","attendance (%)",v=>v,v=>v+"%");
      if(n>=1){ x.strokeStyle=Y; x.lineWidth=3; x.beginPath(); x.moveTo(P.px(3),P.T); x.lineTo(P.px(3),P.B); x.stroke(); label(x,"1",P.px(3)+8,P.T+18,Y,16); }
      if(n>=2){ x.strokeStyle=Y; x.beginPath(); x.moveTo(P.L,P.py(90)); x.lineTo(P.px(3),P.py(90)); x.stroke(); label(x,"2",P.L+8,P.py(90)-8,Y,16); }
      if(n>=3){ x.strokeStyle=Y; x.beginPath(); x.moveTo(P.px(3),P.py(60)); x.lineTo(P.R,P.py(60)); x.stroke(); label(x,"3",P.R-18,P.py(60)-8,Y,16); }
      for(const [h,a,p] of D) dot(x,P.px(h),P.py(a),6,p?GREEN:RED,"#0d0d0f");
      if(sel>=0){ const s=S[sel]; dot(x,P.px(s[1]),P.py(s[2]),11,null,Y); dot(x,P.px(s[1]),P.py(s[2]),4,Y); label(x,s[0],P.px(s[1])+14,P.py(s[2])+5,Y,17); } }
  };
})();

/* ---------- labeled vs unlabeled ---------- */
(() => {
  const L=$("unL"), U=$("unU"), r=srand(23), C=[[.28,.68],[.72,.7],[.5,.28]], NM=["cat","dog","bird"];
  const D=Array.from({length:48},(_,i)=>{ const c=C[i%3]; return [c[0]+gauss(r)*.08,c[1]+gauss(r)*.08,i%3]; });
  let n=0, k=0;
  const show=i=>{ n=i; $("unIdea").classList.toggle("on",n>=1); $("unHint").style.opacity=n>=1?0:1; };
  function draw(cv,mode,kk){ const x=ctxOf(cv), W=cv.offsetWidth, H=cv.offsetHeight, X=v=>30+v*(W-60), Yp=v=>H-30-v*(H-60); x.clearRect(0,0,W,H);
    if(mode==="u"&&kk>.02){ x.globalAlpha=kk; C.forEach((c,j)=>{ x.strokeStyle=[GREEN,PURPLE,AMBER][j]; x.lineWidth=2; x.setLineDash([6,5]); x.beginPath(); x.ellipse(X(c[0]),Yp(c[1]),(W-60)*.17,(H-60)*.18,0,0,7); x.stroke(); x.setLineDash([]);
      label(x,"group "+(j+1),X(c[0]),Yp(c[1])-(H-60)*.18-10,[GREEN,PURPLE,AMBER][j],15,"center"); }); x.globalAlpha=1; }
    for(const [a,b,c] of D){ if(mode==="l"){ dot(x,X(a),Yp(b),6,[BLUE,Y,RED][c],"#0d0d0f"); }
      else { const col=kk>.5?[GREEN,PURPLE,AMBER][c]:"#8a877f"; dot(x,X(a),Yp(b),6,col,"#0d0d0f"); } }
    if(mode==="l") C.forEach((c,j)=>label(x,NM[j],X(c[0]),Yp(c[1])-(H-60)*.2,[BLUE,Y,RED][j],16,"center")); }
  A.unsupervised={ enter(d){ show(d<0?1:0); k=n; }, step(){ if(n>=1) return false; show(1); return true; }, back(){ if(n<=0) return false; show(0); return true; },
    tick(dt){ k=lerp(k,n,Math.min(1,dt/400)); draw(L,"l",0); draw(U,"u",k); } };
})();

/* ---------- k-means ---------- */
(() => {
  const cv=$("kmCv"), r=srand(29), G=[[.25,.7],[.72,.75],[.3,.25],[.75,.3]];
  const D=Array.from({length:120},(_,i)=>{ const g=G[i%4]; return [clamp(g[0]+gauss(r)*.09,.02,.98),clamp(g[1]+gauss(r)*.09,.02,.98)]; });
  let K=4, cen=[], shown=[], as=[], phase="assign", round=0, done=false, timer=0, running=false, seedR=srand(3);
  function init(rand){ cen=Array.from({length:K},()=>{ const p=D[Math.floor(rand()*D.length)]; return [p[0],p[1]]; }); shown=cen.map(c=>c.slice()); as=D.map(()=>-1); phase="assign"; round=0; done=false; running=false; msg(); steps($("kmList"),-1); }
  function msg(){ $("kmMsg").innerHTML=done?`<span style="color:var(--green)">converged after ${round} rounds ✓</span>`:`round ${round} · next: <b class="y">${phase}</b>`; $("kmRun").textContent=running?"Pause":"Run"; }
  function one(){ if(done) return false;
    if(phase==="assign"){ let ch=0; D.forEach((p,i)=>{ let b=0,bd=9; cen.forEach((c,j)=>{ const d=Math.hypot(p[0]-c[0],p[1]-c[1]); if(d<bd){ bd=d; b=j; } }); if(as[i]!==b){ as[i]=b; ch++; } });
      round++; phase="update"; steps($("kmList"),0); if(!ch&&round>1){ done=true; running=false; } }
    else { cen=cen.map((c,j)=>{ const m=D.filter((_,i)=>as[i]===j); return m.length?[m.reduce((s,p)=>s+p[0],0)/m.length,m.reduce((s,p)=>s+p[1],0)/m.length]:c; }); phase="assign"; steps($("kmList"),1); }
    msg(); return true; }
  $("kmK").oninput=e=>{ K=+e.target.value; $("kmKv").textContent=K; seedR=srand(3+K); init(seedR); };
  $("kmStep").onclick=()=>{ running=false; one(); msg(); }; $("kmRun").onclick=()=>{ if(done) return; running=!running; timer=0; msg(); };
  $("kmNew").onclick=()=>init(Math.random);
  A.kmeans={
    enter(){ K=4; $("kmK").value=4; $("kmKv").textContent=4; seedR=srand(7); init(seedR); },
    step(){ running=false; return one(); },
    tick(dt){
      if(running){ timer+=dt; if(timer>650){ timer=0; one(); } }
      shown=shown.map((s,j)=>[lerp(s[0],cen[j][0],Math.min(1,dt/160)),lerp(s[1],cen[j][1],Math.min(1,dt/160))]);
      const x=ctxOf(cv), W=cv.offsetWidth, H=cv.offsetHeight, S=Math.min(W,H)-60, ox=(W-S)/2, oy=(H-S)/2, X=v=>ox+v*S, Yp=v=>oy+(1-v)*S; x.clearRect(0,0,W,H);
      if(phase==="update"&&!done) D.forEach((p,i)=>{ const c=shown[as[i]]; if(!c) return; x.strokeStyle=CL[as[i]]; x.globalAlpha=.18; x.lineWidth=1; x.beginPath(); x.moveTo(X(p[0]),Yp(p[1])); x.lineTo(X(c[0]),Yp(c[1])); x.stroke(); x.globalAlpha=1; });
      D.forEach((p,i)=>dot(x,X(p[0]),Yp(p[1]),6,as[i]<0?"#8a877f":CL[as[i]],"#0d0d0f"));
      shown.forEach((c,j)=>{ cross(x,X(c[0]),Yp(c[1]),13,"#0d0d0f",8); cross(x,X(c[0]),Yp(c[1]),12,CL[j],4.5); });
    }
  };
})();

/* ---------- which task: click to reveal ---------- */
(() => {
  const Q=[...document.querySelectorAll('[data-id="whichtask"] .qz')];
  Q.forEach(q=>q.onclick=()=>q.classList.toggle("open"));
  A.whichtask={ enter(){ Q.forEach(q=>q.classList.remove("open")); } };
})();

/* ---------- pipeline: data → training → model → inference ---------- */
(() => {
  const S=[0,1,2,3].map(i=>$("pp"+i)); let n=0, tr=0;
  function show(i){ n=i; S.forEach((s,j)=>{ s.classList.toggle("on",j<n); s.classList.toggle("cur",j===n-1); });
    $("ppL1").classList.toggle("on",n===2); $("ppL2").classList.toggle("on",n>=4);
    $("ppOut").textContent=n>=4?"2,100 sq ft → $312k":" "; if(n<2) tr=0; if(n>2) tr=1; }
  A.pipeline={ enter(d){ show(d<0?4:1); }, step(){ if(n>=4) return false; show(n+1); return true; }, back(){ if(n<=1) return false; show(n-1); return true; },
    tick(dt){ if(n===2) tr=Math.min(1,tr+dt/2200); $("ppBar").style.width=(tr*100)+"%";
      $("ppEp").textContent=tr<.02?"error: high":tr<1?`epoch ${Math.round(tr*50)} · error ${(1-ease(tr)*.92).toFixed(2)}`:"done · error 0.08"; } };
})();

/* ---------- 80 / 10 / 10 split ---------- */
(() => {
  const cv=$("spCv"); let dots=[], split=false, t=0;
  function make(shuffle){ const r=srand(42); const idx=[...Array(100).keys()];
    if(shuffle) for(let i=99;i>0;i--){ const j=Math.floor(r()*(i+1)); [idx[i],idx[j]]=[idx[j],idx[i]]; }
    dots=[...Array(100).keys()].map(i=>({c:i<60?0:1,home:i,dest:idx.indexOf(i),delay:0}));
    dots.forEach(d=>d.delay=d.dest*12); }
  function layout(W,H){
    const top={x:W/2-10*22+11,y:70}, home=i=>[top.x+(i%20)*22,top.y+Math.floor(i/20)*22];
    const bw=(W-80)/3, bh=H-350, by=290, boxes=[[30,GREEN,"TRAINING",80],[30+bw+10,Y,"VALIDATION",10],[30+2*(bw+10),BLUE,"TESTING",10]];
    const dest=j=>{ const b=j<80?0:j<90?1:2, k=j<80?j:j<90?j-80:j-90, cols=b?3:8, gap=b?28:26, bx=boxes[b][0]+bw/2-(cols-1)*gap/2, rows=Math.ceil((b?10:80)/cols);
      return [bx+(k%cols)*gap, by+bh/2-(rows-1)*gap/2+Math.floor(k/cols)*gap]; };
    return {home,dest,boxes,bw,bh,by}; }
  function doSplit(){ make(true); split=true; t=0; }
  $("spGo").onclick=()=>{ if(split){ split=false; t=0; setTimeout(doSplit,350); } else doSplit(); };
  A.split={
    enter(d){ make(false); split=d<0; if(split){ make(true); } t=split?99999:0; },
    step(){ if(split) return false; doSplit(); return true; },
    back(){ if(!split) return false; make(false); split=false; return true; },
    tick(dt){ t+=dt; const x=ctxOf(cv), W=cv.offsetWidth, H=cv.offsetHeight, Lo=layout(W,H); x.clearRect(0,0,W,H);
      label(x,split?"shuffled, then dealt out":"the full dataset: 100 rows, sorted by class",W/2,40,MUTE,16,"center");
      Lo.boxes.forEach(([bx,col,nm,c])=>{ x.strokeStyle=col; x.lineWidth=2; x.beginPath(); x.roundRect(bx,Lo.by,Lo.bw,Lo.bh,14); x.stroke();
        label(x,`${nm} · ${c}%`,bx+Lo.bw/2,Lo.by+Lo.bh+28,col,17,"center"); });
      for(const d of dots){ const a=Lo.home(d.home), b=Lo.dest(d.dest), k=split?ease((t-d.delay)/700):0; dot(x,lerp(a[0],b[0],k),lerp(a[1],b[1],k),8,d.c?AMBER:BLUE,"#0d0d0f"); }
      if(split&&t>2000) label(x,"each pile gets a mix of both classes",W/2,Lo.by-18,Y,16,"center");
    }
  };
})();

/* ---------- error plot: hover a point ---------- */
(() => {
  const cv=$("epCv"), r=srand(37), D=Array.from({length:30},(_,i)=>{ const a=i/29*100+(r()-.5)*2; return [a,32+.82*a+gauss(r)*16]; });
  const [m,b]=ols(D); let hov=-1, P=null;
  const info=()=>{ if(hov<0){ $("epInfo").innerHTML=`line: ŷ = ${m.toFixed(2)}x + ${b.toFixed(1)}<br><span class="muted">hover a point to see its error</span>`; return; }
    const [a,y]=D[hov], yh=m*a+b; $("epInfo").innerHTML=`x = ${a.toFixed(0)}<br><span style="color:var(--blue)">y = ${y.toFixed(1)}</span> · <span style="color:var(--red)">ŷ = ${yh.toFixed(1)}</span><br>e = ${y.toFixed(1)} − ${yh.toFixed(1)} = <b class="y">${(y-yh).toFixed(1)}</b>`; };
  cv.addEventListener("pointermove",e=>{ if(!P) return; const [px,py]=localXY(e,cv); let best=-1,bd=24; D.forEach(([a,y],i)=>{ const d=Math.hypot(P.px(a)-px,P.py(y)-py); if(d<bd){ bd=d; best=i; } }); if(best!==hov){ hov=best; info(); } });
  cv.addEventListener("pointerleave",()=>{ hov=-1; info(); });
  A.errplot={ enter(){ hov=-1; info(); },
    tick(){ const x=ctxOf(cv); P=plot(cv,[-4,104],[0,150],[70,30,30,64]); x.clearRect(0,0,P.W,P.H);
      frame(x,P,[0,20,40,60,80,100],[0,30,60,90,120,150],"input feature (x)","output value (y)");
      x.strokeStyle=RED; x.lineWidth=2.5; x.beginPath(); x.moveTo(P.px(-4),P.py(m*-4+b)); x.lineTo(P.px(104),P.py(m*104+b)); x.stroke();
      D.forEach(([a,y],i)=>{ dashed(x,P.px(a),P.py(y),P.px(a),P.py(m*a+b),i===hov?Y:"rgba(243,241,234,.35)",i===hov?3:1.2); });
      D.forEach(([a,y],i)=>{ cross(x,P.px(a),P.py(m*a+b),5,RED,2); dot(x,P.px(a),P.py(y),i===hov?10:7,BLUE,i===hov?Y:"#0d0d0f"); });
      if(hov>=0){ const [a,y]=D[hov]; label(x,"e = "+(y-(m*a+b)).toFixed(1),P.px(a)+14,(P.py(y)+P.py(m*a+b))/2+5,Y,17); } }
  };
})();

/* ---------- MAE / MSE / RMSE with draggable errors ---------- */
(() => {
  const cv=$("mtCv"), E0=[-1.2,.8,-.5,1.1,.4,-.9,.7,12.5,-15,1.3]; let E=E0.slice(), drag=-1, G=null;
  function stats(){ const n=E.length, mae=E.reduce((s,e)=>s+Math.abs(e),0)/n, mse=E.reduce((s,e)=>s+e*e,0)/n;
    $("mtMAE").textContent=fmt(mae,3); $("mtMSE").textContent=fmt(mse,3); $("mtRMSE").textContent=fmt(Math.sqrt(mse),3); }
  function geo(){ const W=cv.offsetWidth, H=cv.offsetHeight, L=70, R=W*.6, T=34, B=H-46, n=E.length, bw=(R-L)/n;
    return {W,H,L,R,T,B,bw,n,py:v=>(T+B)/2-v/16*((B-T)/2),iy:p=>((T+B)/2-p)/((B-T)/2)*16}; }
  cv.addEventListener("pointerdown",e=>{ if(!G) return; const [px]=localXY(e,cv), i=Math.floor((px-G.L)/G.bw); if(i>=0&&i<E.length){ drag=i; cv.setPointerCapture(e.pointerId); move(e); } });
  const move=e=>{ if(drag<0) return; const [,py]=localXY(e,cv); E[drag]=Math.round(clamp(G.iy(py),-16,16)*10)/10; stats(); };
  cv.addEventListener("pointermove",move); cv.addEventListener("pointerup",()=>drag=-1);
  $("mtNo").onclick=()=>{ E=E.filter(e=>Math.abs(e)<=5); stats(); }; $("mtReset").onclick=()=>{ E=E0.slice(); stats(); };
  A.metrics={ enter(){ E=E0.slice(); stats(); },
    tick(){ const x=ctxOf(cv); G=geo(); const g=G; x.clearRect(0,0,g.W,g.H);
      label(x,"each prediction’s error e = y − ŷ",g.L,20,MUTE,14);
      for(const v of [-15,-10,-5,0,5,10,15]){ x.strokeStyle=v?"rgba(255,255,255,.05)":"#55534d"; x.lineWidth=v?1:2; x.beginPath(); x.moveTo(g.L,g.py(v)); x.lineTo(g.R,g.py(v)); x.stroke(); label(x,v,g.L-10,g.py(v)+5,MUTE,13,"right"); }
      E.forEach((e,i)=>{ const cx=g.L+i*g.bw+g.bw/2, out=Math.abs(e)>5, col=out?RED:Y;
        x.fillStyle=col; x.globalAlpha=drag===i?1:.85; x.fillRect(cx-g.bw*.3,Math.min(g.py(0),g.py(e)),g.bw*.6,Math.max(2,Math.abs(g.py(e)-g.py(0)))); x.globalAlpha=1;
        label(x,fmt(e,1),cx,e>=0?g.py(e)-8:g.py(e)+20,col,14,"center"); label(x,"#"+(i+1),cx,g.H-16,MUTE,13,"center"); });
      // right: where the total comes from
      const X0=g.R+70, X1=g.W-30, absT=E.reduce((s,e)=>s+Math.abs(e),0)||1, sqT=E.reduce((s,e)=>s+e*e,0)||1;
      const bar=(y,lab,vals,tot,col)=>{ label(x,lab,X0,y-12,col,15); let cx=X0; vals.forEach(v=>{ const w=(X1-X0)*v.v/tot; x.fillStyle=v.out?RED:col; x.fillRect(cx,y,Math.max(0,w-1.5),34); cx+=w; });
        const o=vals.filter(v=>v.out).reduce((s,v)=>s+v.v,0); label(x,`outliers = ${Math.round(o/tot*100)}% of the total`,X0,y+58,o?RED:MUTE,14); };
      label(x,"where does the total error come from?",X0,40,INK,16);
      bar(110,"MAE adds up |e|",E.map(e=>({v:Math.abs(e),out:Math.abs(e)>5})),absT,AMBER);
      bar(250,"MSE adds up e²",E.map(e=>({v:e*e,out:Math.abs(e)>5})),sqT,BLUE);
      label(x,"squaring makes big misses count much more",X0,g.H-16,MUTE,14);
    } };
})();

/* ---------- underfit / overfit: polynomial degree ---------- */
(() => {
  const cv=$("ftCv"), r=srand(15), f=v=>1.1*v*v-.35*v-.25;
  const TR=Array.from({length:12},(_,i)=>{ const v=-1+i/11*2+(r()-.5)*.08; return [v,f(v)+gauss(r)*.14]; });
  const TE=Array.from({length:12},(_,i)=>{ const v=-.96+i/11*1.92+(r()-.5)*.06; return [v,f(v)+gauss(r)*.14]; });
  let d=1, coef=[];
  function fit(deg){ const n=deg+1, A2=Array.from({length:n},()=>Array(n+1).fill(0));
    for(const [v,y] of TR){ const p=Array.from({length:n},(_,i)=>v**i); for(let i=0;i<n;i++){ for(let j=0;j<n;j++) A2[i][j]+=p[i]*p[j]; A2[i][n]+=p[i]*y; } }
    for(let i=0;i<n;i++) A2[i][i]+=1e-9;
    for(let c=0;c<n;c++){ let pv=c; for(let i=c+1;i<n;i++) if(Math.abs(A2[i][c])>Math.abs(A2[pv][c])) pv=i; [A2[c],A2[pv]]=[A2[pv],A2[c]];
      for(let i=0;i<n;i++){ if(i===c) continue; const k=A2[i][c]/A2[c][c]; for(let j=c;j<=n;j++) A2[i][j]-=k*A2[c][j]; } }
    return A2.map((row,i)=>row[n]/row[i]); }
  const pred=v=>coef.reduce((s,c,i)=>s+c*v**i,0);
  const rmse=S=>Math.sqrt(S.reduce((s,[v,y])=>s+(y-pred(v))**2,0)/S.length);
  function set(n){ d=n; coef=fit(d); $("ftD").value=d; $("ftDv").textContent=d; const tr=rmse(TR), te=rmse(TE);
    $("ftTr").textContent=tr.toFixed(3); $("ftTe").textContent=te.toFixed(3);
    const v=d===1?["Underfit: too simple",AMBER]:d<=4?["Balanced: generalizes",GREEN]:d<=8?["Starting to overfit",Y]:["Overfit: memorized the noise",RED];
    $("ftVerdict").textContent=v[0]; $("ftVerdict").style.color=v[1];
    document.querySelectorAll('[data-id="fit"] [data-d]').forEach(b=>b.classList.toggle("on",+b.dataset.d===d)); }
  $("ftD").oninput=e=>set(+e.target.value);
  document.querySelectorAll('[data-id="fit"] [data-d]').forEach(b=>b.onclick=()=>set(+b.dataset.d));
  A.fit={ enter(){ set(1); },
    tick(){ const x=ctxOf(cv), P=plot(cv,[-1.08,1.08],[-.8,1.6],[60,30,30,60]); x.clearRect(0,0,P.W,P.H);
      frame(x,P,[-1,-.5,0,.5,1],[-.5,0,.5,1,1.5],"x (input)","y (output)",v=>v,v=>v);
      x.save(); x.beginPath(); x.rect(P.L,P.T,P.R-P.L,P.B-P.T); x.clip();
      for(const [v,y] of TE) dashed(x,P.px(v),P.py(y),P.px(v),P.py(pred(v)),"rgba(255,138,31,.6)",1.5,[4,4]);
      x.strokeStyle=Y; x.lineWidth=3.5; x.beginPath(); for(let v=-1.08;v<=1.081;v+=.005){ const q=[P.px(v),P.py(pred(v))]; v===-1.08?x.moveTo(...q):x.lineTo(...q); } x.stroke(); x.restore();
      for(const [v,y] of TR) dot(x,P.px(v),P.py(y),7,BLUE,"#0d0d0f");
      for(const [v,y] of TE) dot(x,P.px(v),P.py(y),7,AMBER,"#0d0d0f"); }
  };
})();

/* ---------- model A vs B ---------- */
(() => {
  const C=[...document.querySelectorAll('[data-id="modelab"] .abc')];
  C.forEach(c=>c.onclick=()=>{ C.forEach(o=>o.classList.remove("pick","right","wrong")); c.classList.add(c.dataset.m==="b"?"right":"wrong"); if(c.dataset.m==="a") C[1].classList.add("right"); $("abIdea").classList.add("on"); });
  A.modelab={ enter(){ C.forEach(o=>o.classList.remove("pick","right","wrong")); $("abIdea").classList.remove("on"); } };
})();

/* ---------- height → shoe size ---------- */
(() => {
  const cv=$("shCv");
  const TR=[[59,5.5],[60,5],[62,6],[62.5,5],[63,8.2],[66,10.5],[67,11],[68,9],[69,9],[69,10],[69,11],[71,13],[71,9.5],[72,10.5],[72,11],[73,9.5]];
  const TE=[[66,9.5],[67,9.5],[67.5,7.5],[70,12],[74,13]];
  const [m,b]=ols(TR), mae=S=>S.reduce((s,[h,y])=>s+Math.abs(y-(m*h+b)),0)/S.length; let showT=false;
  $("shInfo").innerHTML=`shoe = ${m.toFixed(2)} × height ${b<0?"−":"+"} ${Math.abs(b).toFixed(1)}<br><span style="color:var(--blue)">training MAE: ${mae(TR).toFixed(2)} sizes</span><br><span style="color:var(--amber)">test MAE: ${mae(TE).toFixed(2)} sizes</span>`;
  $("shTest").onclick=()=>{ showT=!showT; $("shTest").classList.toggle("on",showT); };
  A.shoes={ enter(){ showT=false; $("shTest").classList.remove("on"); },
    tick(){ const x=ctxOf(cv), P=plot(cv,[58,75],[4,14],[70,30,30,64]); x.clearRect(0,0,P.W,P.H);
      frame(x,P,[58,60,62,64,66,68,70,72,74],[4,6,8,10,12,14],"height (inches)","shoe size (U.S. men’s)");
      x.strokeStyle=RED; x.lineWidth=3; x.beginPath(); x.moveTo(P.px(59),P.py(m*59+b)); x.lineTo(P.px(74),P.py(m*74+b)); x.stroke();
      if(showT) for(const [h,y] of TE){ dashed(x,P.px(h),P.py(y),P.px(h),P.py(m*h+b),AMBER,2,[5,4]); label(x,(y-(m*h+b)>0?"+":"")+(y-(m*h+b)).toFixed(1),P.px(h)+10,(P.py(y)+P.py(m*h+b))/2+5,AMBER,14); }
      for(const [h,y] of TR) dot(x,P.px(h),P.py(y),7,BLUE,"#0d0d0f");
      for(const [h,y] of TE) dot(x,P.px(h),P.py(y),8,AMBER,"#0d0d0f");
      label(x,"● training data",P.L+16,P.T+18,BLUE,15); label(x,"● test data",P.L+16,P.T+40,AMBER,15); label(x,"— regression line",P.L+16,P.T+62,RED,15); }
  };
})();

/* ---------- bias / variance dartboards ---------- */
(() => {
  const C=[0,1,2,3].map(i=>$("bv"+i)), CFG=[[0,0,.07],[0,0,.24],[.12,-.5,.07],[-.2,-.48,.24]];
  let T=[[],[],[],[]], t0=[0,0,0,0];
  function throwAt(i,rand){ const [bx,by,s]=CFG[i]; T[i]=Array.from({length:16},()=>[bx+gauss(rand)*s,by+gauss(rand)*s]); t0[i]=performance.now(); }
  C.forEach((c,i)=>c.onclick=()=>throwAt(i,Math.random));
  A.biasvar={ enter(){ C.forEach((_,i)=>throwAt(i,srand(60+i))); },
    tick(dt,now){ C.forEach((cv,i)=>{ const x=ctxOf(cv), W=cv.offsetWidth, H=cv.offsetHeight, R=Math.min(W,H)*.43, cx=W/2, cy=H/2; x.clearRect(0,0,W,H);
      [[1,"#1c1c20"],[.78,"rgba(106,184,255,.28)"],[.5,"#1c1c20"],[.2,"rgba(255,90,78,.8)"]].forEach(([k,f])=>{ x.beginPath(); x.arc(cx,cy,R*k,0,7); x.fillStyle=f; x.fill(); x.strokeStyle="#55534d"; x.lineWidth=1.5; x.stroke(); });
      const shown=Math.floor((now-t0[i])/70);
      T[i].slice(0,shown).forEach(([a,b])=>dot(x,cx+a*R,cy-b*R,5.5,Y,"#0d0d0f")); }); } };
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
let sx=null; stage.addEventListener("touchstart",e=>{ if(e.target.closest("input,button,.switch,.chipx,.bin,.tchip,.swRow,svg,canvas,table,.qz,.abc,.mc")) return; sx=e.touches[0].clientX; },{passive:true});
stage.addEventListener("touchend",e=>{ if(sx===null) return; const dx=e.changedTouches[0].clientX-sx; if(Math.abs(dx)>60) (dx<0?advance:retreat)(); sx=null; });
addEventListener("resize",fitStage);
fitStage(); fromHash(); claudeAdapter();
let last=performance.now();
function loop(now){ const dt=Math.min(100,now-last); last=now; const s=slides[cur], a=s&&A[s.dataset.id]; if(a&&a.tick){ try{ a.tick(dt,now); }catch(err){ console.error(err); } } requestAnimationFrame(loop); }
requestAnimationFrame(loop);
})();
