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
(() => {
  const cv=$("bgData"); let P=[], t0=0;
  A.title={
    enter(){ const r=srand(3); t0=performance.now();
      P=Array.from({length:150},(_,i)=>{ const tx=180+i/149*1240; return {x:rnd(0,1600),y:rnd(0,900),vx:rnd(-.3,.3),vy:rnd(-.3,.3),tx,ty:720-(tx-180)*.42+gauss(r)*46}; }); },
    tick(dt,now){
      const x=ctxOf(cv), f=dt/16.7; x.fillStyle="#121214"; x.fillRect(0,0,1600,900);
      const ph=((now-t0)/1000)%12, k=ease(ph<3?0:ph<4.6?(ph-3)/1.6:ph<8.5?1:ph<10?1-(ph-8.5)/1.5:0);
      for(const p of P){ p.x+=p.vx*f; p.y+=p.vy*f; if(p.x<0||p.x>1600) p.vx*=-1; if(p.y<0||p.y>900) p.vy*=-1; }
      if(k>.02){ x.strokeStyle=`rgba(255,194,14,${k*.55})`; x.lineWidth=3; x.beginPath(); x.moveTo(140,737); x.lineTo(1460,183); x.stroke(); }
      for(const p of P){ const px=lerp(p.x,p.tx,k), py=lerp(p.y,p.ty,k);
        x.fillStyle=k>.5?`rgba(255,194,14,${.35+k*.5})`:"rgba(243,241,234,.35)"; x.beginPath(); x.arc(px,py,3+k*1.5,0,7); x.fill(); }
    }
  };
})();

/* ---------- falling numbers (oil + recap backgrounds) ---------- */
function rain(id){
  const cv=$(id); let C=[];
  return {
    enter(){ C=Array.from({length:46},(_,i)=>({x:i*35+10,y:rnd(-900,0),v:rnd(.4,1.4),s:Array.from({length:22},()=>pick(["0","1","0","1","3.14","42","NaN","7","0.5","1"]))})); },
    tick(dt){ const x=ctxOf(cv), f=dt/16.7; x.fillStyle="#121214"; x.fillRect(0,0,1600,900); x.font='16px "JetBrains Mono",monospace';
      for(const c of C){ c.y+=c.v*f; if(c.y>900) c.y=rnd(-600,-200);
        c.s.forEach((t,j)=>{ const py=c.y-j*26; if(py<-20||py>920) return; x.fillStyle=j===0?"rgba(255,194,14,.55)":`rgba(255,194,14,${Math.max(0,.18-j*.008)})`; x.fillText(t,c.x,py); }); }
    }
  };
}
A.oil=rain("bgOil"); A.recap=rain("bgRecap");
$("rcChips").innerHTML=["structured","unstructured","dataset","feature","label","data type","supervised","regression","classification","unsupervised","annotation","EDA","mean · median · mode","data cleaning","imputation","encoding","feature engineering","train / test split","bias","visualization"]
  .map(t=>`<span class="tag t-y" style="font-size:20px;padding:8px 16px">${t}</span>`).join("");

/* ---------- dataset term: a faint csv behind the word ---------- */
$("tbg1").textContent=["id,sq_ft,beds,pool,price","1,1500,3,1,267","2,1600,3,0,234","3,1720,4,1,300","4,1800,4,1,312","5,1450,2,0,221","6,2010,4,1,355","7,1380,2,0,205","8,1920,3,1,331","9,1660,3,0,262","10,1750,4,0,288","11,2200,5,1,402","12,1590,3,1,270","13,1310,2,0,199","14,1880,4,1,322","15,1700,3,0,279"].join("\n").repeat(2);

/* ---------- ingredients: data + algorithm flow into compute, power drives the training ---------- */
(() => {
  const cv=$("ingCv"), VW=1380, VH=600;
  const CAP=["Press → to build it, one ingredient at a time.",
    "<b>Data</b>: examples to learn from. Numbers, text, images, audio.",
    "<b>Algorithm</b>: the recipe for how the model adjusts itself to fit the data.",
    "<b>Compute</b>: GPUs run billions of small math operations in parallel, so <b>model training</b> can begin.",
    "<b>Power</b>: all that compute runs on electricity. More compute, faster training."];
  // where things sit (design units: 1380 × 600)
  const DATA={x:190,y:300}, ALG={x:1190,y:250}, RACK={x:600,y:300,w:180,h:224}, NET={x:520,y:20,w:340,h:240}, PWR={x:1150,y:500};
  const RC={x:RACK.x+RACK.w/2,y:RACK.y+RACK.h/2};
  const LAYERS=[4,6,6,3];
  const nodes=LAYERS.map((n,li)=>Array.from({length:n},(_,i)=>({x:NET.x+50+li*(NET.w-100)/(LAYERS.length-1),y:NET.y+70+(i+.5)*(NET.h-90)/n,g:0})));
  const edges=[]; for(let l=0;l<LAYERS.length-1;l++) for(const a of nodes[l]) for(const b of nodes[l+1]) edges.push([a,b]);
  let step=0, vis=[0,0,0,0,0], P=[], pulses=[], up=[], bolts=[], acc=.1, epoch=0, ep=0, spin=0, typing=0, spD=0, spA=0, spP=0, spU=0, spN=0;
  const bez=(p0,c,p1,t)=>({x:(1-t)*(1-t)*p0.x+2*(1-t)*t*c.x+t*t*p1.x, y:(1-t)*(1-t)*p0.y+2*(1-t)*t*c.y+t*t*p1.y});
  const DPATH=[{x:DATA.x+95,y:DATA.y-10},{x:400,y:220},{x:RACK.x-6,y:RACK.y+70}];
  const APATH=[{x:ALG.x-120,y:ALG.y+10},{x:960,y:200},{x:RACK.x+RACK.w+6,y:RACK.y+70}];
  const PPATH=[{x:PWR.x-90,y:PWR.y+10},{x:930,y:560},{x:RACK.x+RACK.w+6,y:RACK.y+RACK.h-40}];
  function rr(x,X,Y,w,h,r){ x.beginPath(); x.moveTo(X+r,Y); x.arcTo(X+w,Y,X+w,Y+h,r); x.arcTo(X+w,Y+h,X,Y+h,r); x.arcTo(X,Y+h,X,Y,r); x.arcTo(X,Y,X+w,Y,r); x.closePath(); }
  function title(x,t,sub,cx,cy,col){ x.textAlign="center"; x.fillStyle=col; x.font='700 26px "Space Grotesk",sans-serif'; x.fillText(t,cx,cy); if(sub){ x.fillStyle=MUTE; x.font='15px "JetBrains Mono",monospace'; x.fillText(sub,cx,cy+24); } x.textAlign="left"; }
  function path(x,p,col,a){ x.save(); x.globalAlpha*=a; x.strokeStyle=col; x.lineWidth=2; x.setLineDash([5,7]); x.lineDashOffset=-performance.now()/40; x.beginPath(); x.moveTo(p[0].x,p[0].y); x.quadraticCurveTo(p[1].x,p[1].y,p[2].x,p[2].y); x.stroke(); x.restore(); }
  const rate=()=>vis[1]>.5&&vis[2]>.5&&vis[3]>.5?(vis[4]>.5?1:.35):0;
  const setCap=()=>{ $("ingCap").innerHTML=CAP[step]; };
  function show(n){ step=clamp(n,0,4); setCap(); }
  A.ingredients={
    enter(d){ P=[]; pulses=[]; up=[]; bolts=[]; acc=.1; epoch=0; ep=0; const n=d<0?4:0; vis=[0,0,0,0,0].map((_,i)=>i<=n&&i>0?1:0); show(n); },
    step(){ if(step>=4) return false; show(step+1); return true; },
    back(){ if(step<=0) return false; show(step-1); if(step<3){ acc=.1; epoch=0; } return true; },
    tick(dt,now){
      const W=cv.offsetWidth, H=cv.offsetHeight, x=ctxOf(cv), k=Math.min(W/VW,H/VH);
      x.clearRect(0,0,W,H); x.save(); x.translate((W-VW*k)/2,(H-VH*k)/2); x.scale(k,k);
      for(let i=1;i<=4;i++) vis[i]=lerp(vis[i],i<=step?1:0,Math.min(1,dt/180));
      const R=rate(), f=dt/16.7;
      // flows
      if(vis[1]>.05) path(x,DPATH,Y,vis[1]*.6);
      if(vis[2]>.05) path(x,APATH,PURPLE,vis[2]*.6);
      if(vis[4]>.05) path(x,PPATH,AMBER,vis[4]*.6);
      spD+=dt; if(step>=1) while(spD>140){ spD-=140; P.push({p:DPATH,t:0,txt:pick(["0","1","1","0","42","3.1","A","{ }","▦","♪"]),c:Y,s:rnd(.0045,.0065)}); } else spD=0;
      spA+=dt; if(step>=2) while(spA>420){ spA-=420; P.push({p:APATH,t:0,txt:pick(["f(x)","if","w+=","Σ","∂","for"]),c:PURPLE,s:rnd(.004,.0055)}); } else spA=0;
      spP+=dt; if(step>=4) while(spP>260){ spP-=260; bolts.push({t:0,s:rnd(.008,.011)}); } else spP=0;
      x.font='600 17px "JetBrains Mono",monospace'; x.textAlign="center";
      P=P.filter(q=>{ q.t+=q.s*f; if(q.t>=1) return false; const o=bez(q.p[0],q.p[1],q.p[2],q.t), a=Math.min(1,q.t*6)*(vis[3]>.5?1:Math.max(0,1-(q.t-.6)*2.5));
        x.globalAlpha=a; x.fillStyle=q.c; x.fillText(q.txt,o.x,o.y+6); x.globalAlpha=1; return true; });
      bolts=bolts.filter(b=>{ b.t+=b.s*f; if(b.t>=1) return false; const o=bez(PPATH[0],PPATH[1],PPATH[2],b.t);
        x.save(); x.translate(o.x,o.y); x.fillStyle=Y; x.shadowColor=Y; x.shadowBlur=14; x.beginPath(); x.moveTo(-4,-14); x.lineTo(6,-14); x.lineTo(1,-2); x.lineTo(8,-2); x.lineTo(-6,16); x.lineTo(-1,3); x.lineTo(-8,3); x.closePath(); x.fill(); x.restore(); return true; });
      x.textAlign="left";

      // DATA: stacked database cylinders
      if(vis[1]>.01){ x.save(); x.globalAlpha=vis[1]; const cx=DATA.x, top=DATA.y-90;
        for(let i=2;i>=0;i--){ const y=top+i*58; x.fillStyle="#1c1c20"; x.strokeStyle=Y; x.lineWidth=3;
          x.beginPath(); x.moveTo(cx-80,y); x.lineTo(cx-80,y+50); x.ellipse(cx,y+50,80,20,0,Math.PI,0,true); x.lineTo(cx+80,y); x.closePath(); x.fill(); x.stroke();
          x.beginPath(); x.ellipse(cx,y,80,20,0,0,7); x.fillStyle="#24242a"; x.fill(); x.stroke();
          for(let j=0;j<4;j++){ const on=Math.sin(now/220+i*2+j*1.7)>.2; x.fillStyle=on?Y:"#3a3a42"; x.fillRect(cx-50+j*26,y+28,16,5); } }
        title(x,"DATA",null,cx,DATA.y+150,Y); x.restore(); }

      // ALGORITHM: a monitor typing code
      if(vis[2]>.01){ x.save(); x.globalAlpha=vis[2]; const mx=ALG.x-110, my=ALG.y-110;
        rr(x,mx,my,220,150,14); x.fillStyle="#1c1c20"; x.fill(); x.strokeStyle=PURPLE; x.lineWidth=3; x.stroke();
        rr(x,mx+12,my+12,196,112,8); x.fillStyle="#120f1d"; x.fill();
        typing+=dt/900; const lines=[[0,.5],[1,.75],[1,.6],[0,.4],[2,.7],[1,.55],[0,.3]], shown=typing%(lines.length+2);
        lines.forEach(([ind,w],i)=>{ const frac=clamp(shown-i,0,1); if(frac<=0) return; x.fillStyle=i%3===1?GREEN:"#7fd8ff"; x.fillRect(mx+24+ind*16,my+24+i*14,(150-ind*16)*w*frac,6); });
        x.fillStyle=PURPLE; x.fillRect(ALG.x-14,my+150,28,26); rr(x,ALG.x-60,my+174,120,12,6); x.fill();
        title(x,"ALGORITHM",null,ALG.x,ALG.y+120,PURPLE); x.restore(); }

      // POWER: a substation and transmission tower
      if(vis[4]>.01){ x.save(); x.globalAlpha=vis[4]; const px=PWR.x, py=PWR.y;
        x.strokeStyle="#8a877f"; x.lineWidth=2;
        for(let b=0;b<3;b++){ rr(x,px-80+b*34,py-26-b*6,28,46+b*6,4); x.fillStyle="#2a2a30"; x.fill(); x.stroke(); x.fillStyle=Math.sin(now/300+b)>0?AMBER:"#55534d"; x.fillRect(px-72+b*34,py-14-b*6,12,4); }
        const tx=px+70, ty=py+24; x.beginPath(); x.moveTo(tx-22,ty); x.lineTo(tx,ty-90); x.lineTo(tx+22,ty); x.moveTo(tx-16,ty-26); x.lineTo(tx+16,ty-26); x.moveTo(tx-10,ty-52); x.lineTo(tx+10,ty-52);
        x.moveTo(tx-30,ty-70); x.lineTo(tx+30,ty-70); x.moveTo(tx-16,ty-26); x.lineTo(tx+10,ty-52); x.moveTo(tx+16,ty-26); x.lineTo(tx-10,ty-52); x.stroke();
        title(x,"POWER",null,px,py+62,AMBER); x.restore(); }

      // COMPUTE: server rack with a GPU
      if(vis[3]>.01){ x.save(); x.globalAlpha=vis[3]; const {x:rx,y:ry,w:rw,h:rh}=RACK;
        rr(x,rx,ry,rw,rh,14); x.fillStyle="#1c1c20"; x.fill(); x.strokeStyle=R>.5?Y:"#55534d"; x.lineWidth=3; x.stroke();
        for(let u=0;u<4;u++){ const uy=ry+12+u*52; rr(x,rx+12,uy,rw-24,44,6); x.fillStyle="#24242a"; x.fill();
          if(u===2){ spin+=dt*(.002+R*.03); const gx=rx+30, gy=uy+5; rr(x,gx,gy,rw-60,34,4); x.fillStyle="#121214"; x.fill(); x.strokeStyle=GREEN; x.lineWidth=2; x.stroke();
            for(const fx of [gx+22,gx+rw-82]){ x.save(); x.translate(fx,gy+17); x.rotate(spin); x.strokeStyle=GREEN; for(let b=0;b<4;b++){ x.rotate(Math.PI/2); x.beginPath(); x.moveTo(0,0); x.lineTo(12,4); x.stroke(); } x.restore(); }
            x.fillStyle=GREEN; x.font='600 13px "JetBrains Mono",monospace'; x.textAlign="center"; x.fillText("GPU",gx+(rw-60)/2,gy+22); x.textAlign="left"; }
          else for(let l=0;l<6;l++){ const on=R>0?Math.random()<.25+R*.5:Math.sin(now/500+l+u)>.6; x.fillStyle=on?(l%2?GREEN:Y):"#3a3a42"; x.beginPath(); x.arc(rx+30+l*12,uy+22,3.5,0,7); x.fill(); }
          if(u!==2){ x.fillStyle="#3a3a42"; x.fillRect(rx+rw-70,uy+18,46,8); } }
        title(x,"COMPUTE",`GPU load ${Math.round(R*100)}%`,RC.x,ry+rh+36,GREEN); x.restore(); }

      // MODEL TRAINING: a network that lights up as compute pushes data through it
      if(vis[3]>.01){ x.save(); x.globalAlpha=vis[3];
        rr(x,NET.x,NET.y,NET.w,NET.h,16); x.fillStyle="rgba(255,194,14,.05)"; x.fill(); x.strokeStyle=R>.5?Y:"rgba(255,194,14,.4)"; x.lineWidth=2; x.stroke();
        x.fillStyle=Y; x.font='700 20px "Space Grotesk",sans-serif'; x.fillText("MODEL TRAINING",NET.x+18,NET.y+32);
        x.font='14px "JetBrains Mono",monospace'; x.fillStyle=MUTE; x.textAlign="right"; x.fillText(`epoch ${epoch}`,NET.x+NET.w-18,NET.y+30); x.textAlign="left";
        x.lineWidth=1; x.strokeStyle="rgba(243,241,234,.08)"; x.beginPath(); for(const [a,b] of edges){ x.moveTo(a.x,a.y); x.lineTo(b.x,b.y); } x.stroke();
        spN+=dt*R; while(spN>40){ spN-=40; const e=pick(edges.slice(0,LAYERS[0]*LAYERS[1])); pulses.push({e,t:0,l:0}); }
        pulses=pulses.filter(p=>{ p.t+=dt*(.0015+R*.004); if(p.t>=1){ p.e[1].g=1; const l=nodes.findIndex(L=>L.includes(p.e[1])); if(l<LAYERS.length-1&&Math.random()<.7){ const nx=edges.filter(([a])=>a===p.e[1]); p.e=pick(nx); p.t=0; return true; } return false; }
          const px=lerp(p.e[0].x,p.e[1].x,p.t), py=lerp(p.e[0].y,p.e[1].y,p.t); x.strokeStyle="rgba(255,194,14,.55)"; x.lineWidth=2; x.beginPath(); x.moveTo(p.e[0].x,p.e[0].y); x.lineTo(px,py); x.stroke(); dot(x,px,py,3,Y); return true; });
        for(const L of nodes) for(const n of L){ n.g*=.93; dot(x,n.x,n.y,9,n.g>.05?`rgba(255,194,14,${.3+n.g*.7})`:"#2a2a30",n.g>.05?Y:"#55534d"); }
        // accuracy bar
        if(R>0){ acc+=(.97-acc)*R*dt*.0002; ep+=dt*R; if(ep>900){ ep=0; epoch++; } }
        const bx=NET.x+18, by=NET.y+NET.h-24, bw=NET.w-130; x.fillStyle="#2a2a30"; rr(x,bx,by,bw,10,5); x.fill(); x.fillStyle=Y; rr(x,bx,by,Math.max(10,bw*acc),10,5); x.fill();
        x.fillStyle=INK; x.font='600 14px "JetBrains Mono",monospace'; x.fillText(`accuracy ${Math.round(acc*100)}%`,bx+bw+12,by+10);
        // compute → model: energy rising from the rack
        spU+=dt*R; while(spU>120){ spU-=120; up.push({x:RC.x+rnd(-40,40),t:0}); }
        up=up.filter(u=>{ u.t+=dt*.0016; if(u.t>=1) return false; const y=lerp(RACK.y-4,NET.y+NET.h+4,u.t); x.fillStyle=`rgba(95,214,138,${1-u.t})`; x.fillRect(u.x-2,y-8,4,12); return true; });
        x.restore(); }
      x.restore();
    }
  };
})();

/* ---------- rules vs machine learning ---------- */
(() => {
  const cv=$("rmCv"); const r=srand(11); let mode="rules";
  const D=[]; for(let i=0;i<26;i++){ D.push({t:clamp(99.4+gauss(r)*.65,97.8,103.8),a:clamp(2.8+gauss(r)*1.6,.3,9.5),c:-1}); D.push({t:clamp(101.3+gauss(r)*.75,97.8,103.8),a:clamp(6.8+gauss(r)*1.6,.3,9.5),c:1}); }
  const nx=p=>[(p.t-98)/6,p.a/10];
  let w, best, bestErr, epoch, timer=0, running=false;
  const errs=W=>D.filter(p=>{ const [u,v]=nx(p); return Math.sign(W[0]*u+W[1]*v+W[2]||-1)!==p.c; }).length;
  function reset(){ w=[.2,-1,.35]; best=w.slice(); bestErr=errs(w); epoch=0; running=false; $("rmEpoch").textContent="epoch 0"; $("rmTrain").textContent="Train ▶"; }
  function trainEpoch(){ for(const p of D){ const [u,v]=nx(p); const y=Math.sign(w[0]*u+w[1]*v+w[2]||-1); if(y!==p.c){ w[0]+=.08*p.c*u; w[1]+=.08*p.c*v; w[2]+=.08*p.c; } }
    const e=errs(w); if(e<bestErr){ bestErr=e; best=w.slice(); } epoch++; $("rmEpoch").textContent=`epoch ${epoch} · ${bestErr} mistake${bestErr===1?"":"s"}`; if(epoch>=40){ running=false; $("rmTrain").textContent="Train ▶"; } }
  const set=tabs($("rmTabs"),k=>{ mode=k; $("rmRules").style.display=k==="rules"?"":"none"; $("rmML").style.display=k==="ml"?"":"none"; });
  $("rmTrain").onclick=()=>{ if(epoch>=40) reset(); running=!running; $("rmTrain").textContent=running?"Pause ❚❚":"Train ▶"; };
  $("rmReset").onclick=reset;
  reset();
  A.rulesml={
    enter(){ mode="rules"; set("rules"); $("rmRules").style.display=""; $("rmML").style.display="none"; reset(); },
    step(){ if(mode==="rules"){ mode="ml"; set("ml"); $("rmRules").style.display="none"; $("rmML").style.display=""; return true; } if(epoch===0&&!running){ running=true; $("rmTrain").textContent="Pause ❚❚"; return true; } return false; },
    tick(dt){
      if(running){ timer+=dt; if(timer>130){ timer=0; trainEpoch(); } }
      const W=cv.offsetWidth, H=cv.offsetHeight, x=ctxOf(cv), L=80, T=40, R=W-30, B=H-70;
      x.clearRect(0,0,W,H); axes(x,L,T,R,B);
      const px=t=>L+(t-98)/6*(R-L), py=a=>B-a/10*(B-T);
      label(x,"temperature (°F) →",R,B+44,MUTE,15,"right"); x.save(); x.translate(30,T+10); x.rotate(-Math.PI/2); label(x,"muscle aches (0–10) →",-(B-T)+10,0,MUTE,15); x.restore();
      for(const t of [98,100,102,104]) label(x,t,px(t),B+22,MUTE,13,"center");
      for(let a=0;a<=10;a+=2) label(x,a,L-12,py(a)+5,MUTE,13,"right");
      for(const p of D) dot(x,px(p.t),py(p.a),7,p.c>0?Y:BLUE);
      x.lineWidth=4; x.setLineDash([]);
      if(mode==="rules"){ x.strokeStyle=RED; x.setLineDash([10,8]); x.beginPath(); x.moveTo(px(100.5),T); x.lineTo(px(100.5),B); x.stroke(); x.setLineDash([]);
        const miss=D.filter(p=>(p.t>100.5?1:-1)!==p.c).length;
        label(x,"temperature > 100.5 → flu",px(100.5)+10,T+20,RED,15);
        $("rmCap").textContent=`a person wrote this rule · it gets ${miss} of ${D.length} wrong`;
      } else {
        const drawLine=(W2,col,a)=>{ x.strokeStyle=col; x.globalAlpha=a; x.beginPath(); for(let i=0;i<=1;i++){ const u=i; const v=Math.abs(W2[1])<1e-6?0:-(W2[0]*u+W2[2])/W2[1]; i?x.lineTo(L+u*(R-L),B-v*(B-T)):x.moveTo(L+u*(R-L),B-v*(B-T)); } x.stroke(); x.globalAlpha=1; };
        x.save(); x.beginPath(); x.rect(L,T,R-L,B-T); x.clip(); if(running) drawLine(w,INK,.25); drawLine(best,GREEN,1); x.restore();
        $("rmCap").textContent=epoch?`the model learned this line from ${D.length} examples · ${bestErr} wrong`:"press Train: the model starts with a random guess";
      }
      label(x,"● cold",R-150,T-14,BLUE,16); label(x,"● flu",R-70,T-14,Y,16);
    }
  };
})();

/* ---------- kinds of datasets: what we see vs. the numbers the computer sees ---------- */
(() => {
  const C={t:$("dkTable"),x:$("dkText"),i:$("dkImage"),a:$("dkAudio")};
  let mode=0, m=0;
  const ROWS=[[1500,3,"Yes",267],[1600,3,"No",234],[1720,4,"Yes",300],[1800,4,"Yes",312],[1450,2,"No",221],[2010,4,"Yes",355],[1380,2,"No",205]];
  const REVIEWS=["This game is amazing!","The controls are terrible.","Best game all year!","It crashes every time.","Love the soundtrack."];
  const tok=w=>{ let h=7; for(const c of w.toLowerCase()) h=(h*31+c.charCodeAt(0))%4999; return h+1; };
  const DIG=["..........","...####...","..#....#..",".......#..",".....##...",".......#..","........#.","..#.....#.","...#####..",".........."];
  const PIX=DIG.map((r,y)=>[...r].map((c,x)=>{ if(c==="#") return 235; let n=0; for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const q=DIG[y+dy]; if(q&&q[x+dx]==="#") n++; } return n*45; }));
  const set=tabs($("dkTabs"),k=>{ mode=k==="num"?1:0; $("dkIdea").classList.toggle("on",mode===1); });
  const prep=c=>{ const W=c.offsetWidth, H=c.offsetHeight, x=ctxOf(c); x.clearRect(0,0,W,H); return [x,W,H]; };
  const mono=(x,s,w="400")=>x.font=`${w} ${s}px "JetBrains Mono",monospace`;
  A.dskinds={
    enter(d){ mode=d<0?1:0; m=mode; set(mode?"num":"raw"); $("dkIdea").classList.toggle("on",mode===1); },
    step(){ if(mode) return false; mode=1; set("num"); $("dkIdea").classList.add("on"); return true; },
    back(){ if(!mode) return false; mode=0; set("raw"); $("dkIdea").classList.remove("on"); return true; },
    tick(dt,now){
      m=lerp(m,mode,Math.min(1,dt/250));
      // table
      { const [x,W]=prep(C.t), cw=(W-20)/4, rh=34, scan=Math.floor(now/700)%ROWS.length;
        mono(x,13,"600"); x.textAlign="center"; ["sq_ft","beds","pool","price"].forEach((h,i)=>{ x.fillStyle=MUTE; x.fillText(h,10+cw*i+cw/2,30); });
        x.strokeStyle=LINE; x.beginPath(); x.moveTo(10,42); x.lineTo(W-10,42); x.stroke();
        ROWS.forEach((r,ri)=>{ const y=50+ri*rh; if(ri===scan){ x.fillStyle="rgba(255,194,14,.12)"; x.fillRect(10,y,W-20,rh-4); }
          r.forEach((v,ci)=>{ mono(x,16,ri===scan?"600":"400"); let t=v;
            if(ci===2){ x.globalAlpha=1-m; x.fillStyle=ri===scan?Y:INK; x.fillText(v,10+cw*ci+cw/2,y+22); x.globalAlpha=m; x.fillStyle=Y; x.fillText(v==="Yes"?1:0,10+cw*ci+cw/2,y+22); x.globalAlpha=1; return; }
            x.fillStyle=ri===scan?Y:INK; x.fillText(t,10+cw*ci+cw/2,y+22); }); });
        x.textAlign="left"; }
      // text
      { const [x,W]=prep(C.x); const chars=(now/45)%260; let n=0, y=34;
        REVIEWS.forEach(rv=>{ let px=14; const words=rv.split(" ");
          for(const w of words){ const raw=w+" ", num=tok(w.replace(/[^a-z]/gi,""))+" ";
            x.font='17px "Space Grotesk",sans-serif'; const rw=x.measureText(raw).width; mono(x,15,"600"); const ww=lerp(rw,x.measureText(num).width,m);
            if(px+ww>W-10){ px=14; y+=24; }
            const vis=n<chars; n+=raw.length;
            if(vis){ x.globalAlpha=1-m; x.fillStyle=INK; x.font='17px "Space Grotesk",sans-serif'; x.fillText(raw,px,y); x.globalAlpha=m; mono(x,15,"600"); x.fillStyle=Y; x.fillText(num,px,y); x.globalAlpha=1; }
            px+=ww+2; }
          y+=36; }); }
      // image: a handwritten 3, then its pixel values
      { const [x,W,H]=prep(C.i); const s=Math.min(W,H)-30, cs=s/10, ox=(W-s)/2, oy=(H-s)/2;
        PIX.forEach((row,yy)=>row.forEach((v,xx)=>{ const g=Math.round(v*(1-m*.75)); x.fillStyle=`rgb(${g},${g},${g})`; x.fillRect(ox+xx*cs,oy+yy*cs,cs-1,cs-1);
          if(m>.02){ x.globalAlpha=m; mono(x,Math.max(8,cs*.36),"600"); x.textAlign="center"; x.fillStyle=v>100?Y:"#77746d"; x.fillText(v,ox+xx*cs+cs/2,oy+yy*cs+cs*.62); x.textAlign="left"; x.globalAlpha=1; } })); }
      // audio: a waveform, then its samples
      { const [x,W,H]=prep(C.a); const mid=H/2, t=now/1000;
        const wave=px=>{ const u=px/W*6+t*2; const env=.55+.45*Math.sin(px/W*Math.PI*2+t*.7); return (Math.sin(u*3.1)*.6+Math.sin(u*7.3)*.3+Math.sin(u*1.3)*.25)*env; };
        x.strokeStyle=LINE; x.beginPath(); x.moveTo(0,mid); x.lineTo(W,mid); x.stroke();
        x.globalAlpha=1-m*.75; x.strokeStyle=BLUE; x.lineWidth=3; x.beginPath(); for(let px=0;px<=W;px+=2){ const yv=mid-wave(px)*(H*.36); px?x.lineTo(px,yv):x.moveTo(px,yv); } x.stroke(); x.globalAlpha=1; x.lineWidth=1;
        if(m>.02){ x.globalAlpha=m; let k=0; for(let px=12;px<W;px+=20,k++){ const v=wave(px), yv=mid-v*(H*.36); x.strokeStyle=Y; x.lineWidth=2; x.beginPath(); x.moveTo(px,mid); x.lineTo(px,yv); x.stroke(); dot(x,px,yv,4,Y);
            if(k%3===0){ mono(x,11,"600"); x.fillStyle=INK; x.textAlign="center"; x.fillText(v.toFixed(2),px,v>0?mid+18:mid-10); x.textAlign="left"; } } x.globalAlpha=1; x.lineWidth=1; } }
    }
  };
})();

/* ---------- structured vs. unstructured side by side ---------- */
(() => {
  const cS=$("svuS"), cU=$("svuU");
  const HEAD=["id","age","city","plan","spent"], CITY=["Austin","Miami","Seattle","Denver","Boise","Provo"], PLAN=["basic","pro","free"];
  const r=srand(4); const ROWS=Array.from({length:7},(_,i)=>[100+i*7,20+Math.floor(r()*40),CITY[Math.floor(r()*6)],PLAN[Math.floor(r()*3)],"$"+(10+Math.floor(r()*190))]);
  const ITEMS=["🤳","🎙️","✉️","📹","🩻","🎵","💬","📷","“lol same 😂”","“meeting moved to 3?”","“great hotel, dirty pool”","#throwback","“call me back”","wave","photo","wave"];
  let F=[], t0=0, show=false;
  function reset(){ t0=performance.now(); const q=srand(9); F=ITEMS.map(k=>({k,x:30+q()*560,y:30+q()*230,vx:(q()-.5)*.7,vy:(q()-.5)*.7,r:(q()-.5)*.6,vr:(q()-.5)*.004})); }
  A.svu={
    enter(d){ reset(); show=d<0; $("svuT").classList.toggle("on",show); },
    step(){ if(show) return false; show=true; $("svuT").classList.add("on"); return true; },
    back(){ if(!show) return false; show=false; $("svuT").classList.remove("on"); return true; },
    tick(dt,now){
      // structured: the table fills in cell by cell, then holds, then starts over
      { const W=cS.offsetWidth, H=cS.offsetHeight, x=ctxOf(cS); x.clearRect(0,0,W,H);
        const cols=HEAD.length, cw=(W-30)/cols, rh=(H-50)/ROWS.length, total=cols*ROWS.length, el=((now-t0)/90)%(total+40), n=Math.min(total,el);
        x.textAlign="center";
        HEAD.forEach((h,i)=>{ x.fillStyle="rgba(106,184,255,.14)"; x.fillRect(15+i*cw+2,8,cw-4,30); x.fillStyle=BLUE; x.font='600 15px "JetBrains Mono",monospace'; x.fillText(h,15+i*cw+cw/2,28); });
        for(let k=0;k<total;k++){ const ri=Math.floor(k/cols), ci=k%cols, cx=15+ci*cw, cy=44+ri*rh;
          x.strokeStyle=LINE; x.strokeRect(cx+2,cy,cw-4,rh-4);
          if(k<n){ const fresh=n-k<3; x.fillStyle=fresh?Y:INK; x.font=`${fresh?600:400} 15px "JetBrains Mono",monospace`; x.fillText(ROWS[ri][ci],cx+cw/2,cy+rh/2+2); } }
        x.textAlign="left"; }
      // unstructured: a jumble that drifts and bumps around
      { const W=cU.offsetWidth, H=cU.offsetHeight, x=ctxOf(cU), f=dt/16.7; x.clearRect(0,0,W,H);
        for(const p of F){ p.x+=p.vx*f; p.y+=p.vy*f; p.r+=p.vr*f; if(p.x<30||p.x>W-30) p.vx*=-1; if(p.y<24||p.y>H-24) p.vy*=-1; p.x=clamp(p.x,30,W-30); p.y=clamp(p.y,24,H-24);
          x.save(); x.translate(p.x,p.y); x.rotate(p.r);
          if(p.k==="wave"){ x.strokeStyle=AMBER; x.lineWidth=2.5; x.beginPath(); for(let i=-40;i<=40;i+=2){ const yv=Math.sin(i/4+now/200)*10*Math.cos(i/26); i===-40?x.moveTo(i,yv):x.lineTo(i,yv); } x.stroke(); }
          else if(p.k==="photo"){ x.fillStyle="#24242a"; x.fillRect(-30,-22,60,44); x.strokeStyle=INK; x.lineWidth=2; x.strokeRect(-30,-22,60,44); x.fillStyle=AMBER; x.beginPath(); x.moveTo(-26,18); x.lineTo(-8,-4); x.lineTo(6,10); x.lineTo(14,2); x.lineTo(26,18); x.fill(); dot(x,14,-10,5,Y); }
          else if(p.k.length<=3){ x.font='34px "Segoe UI Emoji","Apple Color Emoji",sans-serif'; x.textAlign="center"; x.fillText(p.k,0,12); }
          else { x.font='italic 16px "Space Grotesk",sans-serif'; x.textAlign="center"; x.fillStyle="#d6d3cb"; x.fillText(p.k,0,6); }
          x.restore(); } }
    }
  };
})();

/* ---------- everything has features: hover the parts of a car, a house, an animal ---------- */
(() => {
  const OBJ=[
    { name:"car", label:["Price","$18,500"],
      art:`<rect x="0" y="372" width="700" height="4" fill="#2e2e35"/>
        <path d="M90 300 Q90 236 150 232 L232 228 L284 160 L452 160 L522 228 L590 238 Q614 244 614 278 L614 300 Q614 322 592 322 L108 322 Q90 322 90 300Z" fill="#ff5a4e"/>
        <path d="M298 172 L370 172 L370 226 L254 226Z M384 172 L446 172 L500 226 L384 226Z" fill="#6ab8ff" opacity=".35"/>
        <path d="M300 230 L300 314 M420 230 L420 314" stroke="#121214" stroke-width="3"/><rect x="392" y="246" width="20" height="5" rx="2" fill="#121214"/>
        <ellipse cx="604" cy="258" rx="10" ry="8" fill="#ffc20e"/><circle cx="148" cy="252" r="9" fill="#121214" stroke="#9b988f" stroke-width="2"/>
        <circle cx="194" cy="322" r="44" fill="#121214"/><circle cx="194" cy="322" r="20" fill="#77746d"/><circle cx="510" cy="322" r="44" fill="#121214"/><circle cx="510" cy="322" r="20" fill="#77746d"/>`,
      feats:[
        {n:"Color",v:"Red",t:"Text",hl:`<path class="hl" d="M90 300 Q90 236 150 232 L232 228 L284 160 L452 160 L522 228 L590 238 Q614 244 614 278 L614 300 Q614 322 592 322 L108 322 Q90 322 90 300Z"/>`},
        {n:"Horsepower",v:"180",t:"Number",hl:`<path class="hl" d="M522 228 L590 238 Q614 244 614 278 L614 296 L522 296Z"/>`},
        {n:"Doors",v:"4",t:"Number",hl:`<rect class="hl" x="300" y="230" width="120" height="84" rx="4"/>`},
        {n:"Seats",v:"5",t:"Number",hl:`<path class="hl" d="M298 172 L446 172 L500 226 L254 226Z"/>`},
        {n:"Wheels",v:"4",t:"Number",hl:`<circle class="hl" cx="194" cy="322" r="46"/><circle class="hl" cx="510" cy="322" r="46"/>`},
        {n:"Electric",v:"No",t:"Boolean",hl:`<circle class="hl" cx="148" cy="252" r="16"/>`}]},
    { name:"house", label:["Price","$300k"],
      art:`<rect x="0" y="380" width="700" height="4" fill="#2e2e35"/>
        <rect x="402" y="112" width="32" height="70" fill="#55534d"/>
        <rect x="170" y="212" width="300" height="168" fill="#3b3b44"/><path d="M146 218 L320 98 L494 218Z" fill="#b5562a"/>
        <rect x="470" y="262" width="140" height="118" fill="#34343c"/><path d="M462 266 L540 222 L618 266Z" fill="#9a4a24"/>
        <path d="M486 290 H594 M486 312 H594 M486 334 H594 M486 356 H594" stroke="#55534d" stroke-width="3"/>
        <rect x="296" y="300" width="50" height="80" rx="3" fill="#6b3f22"/><circle cx="336" cy="342" r="4" fill="#ffc20e"/>
        <rect x="200" y="250" width="62" height="52" fill="#6ab8ff" opacity=".45"/><rect x="380" y="250" width="62" height="52" fill="#6ab8ff" opacity=".45"/>
        <ellipse cx="96" cy="414" rx="70" ry="18" fill="#6ab8ff" opacity=".7"/>
        <circle cx="650" cy="300" r="34" fill="#5fd68a" opacity=".6"/><rect x="646" y="330" width="8" height="50" fill="#6b3f22"/>`,
      feats:[
        {n:"Sq feet",v:"1,720",t:"Number",hl:`<rect class="hl" x="170" y="212" width="300" height="168"/>`},
        {n:"Roof",v:"Shingle",t:"Text",hl:`<path class="hl" d="M146 218 L320 98 L494 218Z"/>`},
        {n:"Fireplace",v:"Yes",t:"Boolean",hl:`<rect class="hl" x="402" y="112" width="32" height="70"/>`},
        {n:"Garage spaces",v:"2",t:"Number",hl:`<path class="hl" d="M462 266 L540 222 L618 266 L610 266 L610 380 L470 380 L470 266Z"/>`},
        {n:"Year built",v:"1998",t:"Date / Time",hl:`<rect class="hl" x="296" y="300" width="50" height="80" rx="3"/>`},
        {n:"Has pool",v:"Yes",t:"Boolean",hl:`<ellipse class="hl" cx="96" cy="414" rx="72" ry="20"/>`}]},
    { name:"animal", label:["Class","Mammal"],
      art:`<rect x="0" y="384" width="700" height="4" fill="#2e2e35"/>
        <path d="M200 240 Q150 220 140 160" stroke="#9c6a3e" stroke-width="16" fill="none" stroke-linecap="round"/>
        <rect x="226" y="290" width="28" height="94" rx="12" fill="#9c6a3e"/><rect x="270" y="290" width="28" height="94" rx="12" fill="#8a5c34"/>
        <rect x="380" y="290" width="28" height="94" rx="12" fill="#9c6a3e"/><rect x="424" y="290" width="28" height="94" rx="12" fill="#8a5c34"/>
        <ellipse cx="330" cy="262" rx="146" ry="68" fill="#b07a4a"/><path d="M220 214 Q330 176 440 214 Q330 232 220 214Z" fill="#8a5c34"/>
        <circle cx="500" cy="186" r="56" fill="#b07a4a"/><ellipse cx="552" cy="204" rx="34" ry="22" fill="#c99a6a"/><circle cx="582" cy="198" r="8" fill="#121214"/>
        <path d="M466 150 Q446 170 452 232 Q476 222 480 160Z" fill="#6b3f22"/><circle cx="512" cy="176" r="6" fill="#121214"/>
        <path d="M548 222 Q560 230 574 222" stroke="#121214" stroke-width="3" fill="none"/>`,
      feats:[
        {n:"Legs",v:"4",t:"Number",hl:`<rect class="hl" x="224" y="300" width="76" height="86" rx="10"/><rect class="hl" x="378" y="300" width="76" height="86" rx="10"/>`},
        {n:"Weight",v:"30 kg",t:"Number",hl:`<ellipse class="hl" cx="330" cy="268" rx="146" ry="56"/>`},
        {n:"Fur",v:"Yes",t:"Boolean",hl:`<path class="hl" d="M220 214 Q330 176 440 214 Q330 232 220 214Z"/>`},
        {n:"Has tail",v:"Yes",t:"Boolean",hl:`<path class="hl" d="M206 250 Q140 230 128 156 L152 150 Q164 210 214 228Z"/>`},
        {n:"Ears",v:"Floppy",t:"Text",hl:`<path class="hl" d="M466 150 Q446 170 452 232 Q476 222 480 160Z"/>`},
        {n:"Sound",v:"Bark",t:"Text",hl:`<ellipse class="hl" cx="556" cy="206" rx="38" ry="26"/>`}]}
  ];
  const TCLS={"Text":"t-blue","Number":"t-y","Boolean":"t-green","Date / Time":"t-red"};
  const s=$("foSvg"); let o=0, seen=new Set(), cur=-1;
  function info(){
    const O=OBJ[o];
    if(cur<0) $("foInfo").innerHTML=`<span class="k">The ${O.name}</span><div class="fn" style="color:var(--mute)">Hover a part</div><p class="muted">Each part you can measure or describe is a <b class="y">feature</b>.</p>`;
    else { const f=O.feats[cur]; $("foInfo").innerHTML=`<span class="k">Feature</span><div class="fn">${f.n}</div><div style="display:flex;gap:14px;align-items:center"><span class="fv">${f.v}</span><span class="tag ${TCLS[f.t]}">${f.t}</span></div>`; }
    const all=seen.size===O.feats.length;
    $("foTbl").innerHTML=`<tr><th class="l">Feature</th><th class="l">Value</th></tr>`+O.feats.map((f,i)=>`<tr class="${i===cur?"found":""}"><td class="l ${seen.has(i)?"hF":""}">${seen.has(i)?f.n:"?"}</td><td class="l ${seen.has(i)?"":"q"}">${seen.has(i)?f.v:"?"}</td></tr>`).join("")+
      `<tr><td class="l hL">${O.label[0]} (label)</td><td class="l hL">${all?O.label[1]:"?"}</td></tr>`;
    $("foCap").textContent=all?`all ${O.feats.length} features found · this ${O.name} is now one row of data`:`${seen.size} of ${O.feats.length} features found`;
    s.querySelectorAll(".hs").forEach(g=>{ const i=+g.dataset.i; g.classList.toggle("on",i===cur); g.classList.toggle("seen",seen.has(i)&&i!==cur); });
  }
  function pickF(i){ cur=i; if(i>=0) seen.add(i); info(); }
  function load(i){ o=i; seen=new Set(); cur=-1; const O=OBJ[o];
    s.innerHTML=O.art+O.feats.map((f,i)=>`<g class="hs" data-i="${i}">${f.hl}</g>`).join(""); info(); }
  s.addEventListener("mouseover",e=>{ const g=e.target.closest(".hs"); if(g) pickF(+g.dataset.i); });
  s.addEventListener("click",e=>{ const g=e.target.closest(".hs"); if(g) pickF(+g.dataset.i); });
  const set=tabs($("foTabs"),k=>load(+k));
  A.fobj={ enter(d){ const i=d<0?OBJ.length-1:0; set(String(i)); load(i); },
    step(){ const O=OBJ[o]; const nx=O.feats.findIndex((_,i)=>!seen.has(i)); if(nx>=0){ pickF(nx); return true; } if(o<OBJ.length-1){ set(String(o+1)); load(o+1); return true; } return false; },
    back(){ if(o>0){ set(String(o-1)); load(o-1); return true; } return false; } };
})();

/* ---------- structured data table ---------- */
(() => {
  const cols=["ID","Name","Job title","Dept","Age","Hire date","Salary","City"];
  const rows=[["E021","Maya Patel","Analyst","Finance",29,"6/13/2018","$77,203","Chicago"],["E104","Leo Brooks","Engineer","IT",41,"3/2/2014","$118,940","Seattle"],["E257","Ana Ruiz","Manager","Sales",36,"1/25/2019","$113,527","Austin"],["E283","Sam Okafor","Director","IT",55,"4/8/2006","$163,099","Phoenix"],["E316","Kim Tran","Analyst","Accounting",25,"5/16/2020","$51,336","Miami"],["E390","Noah Berg","Sr. Manager","Marketing",48,"2/11/2009","$141,604","Columbus"]];
  const t=$("stTbl"); t.innerHTML=`<tr>${cols.map((c,i)=>`<th data-c="${i}" class="${i<2?"l":""}">${c}</th>`).join("")}</tr>`+rows.map((r,ri)=>`<tr data-r="${ri}">${r.map((v,i)=>`<td data-c="${i}" class="${i<2?"l":""}">${v}</td>`).join("")}</tr>`).join("");
  const clear=()=>t.querySelectorAll(".hF,.hL").forEach(e=>e.classList.remove("hF","hL"));
  t.addEventListener("mouseover",e=>{ const c=e.target.closest("td,th"); if(!c) return; clear();
    if(c.tagName==="TH"){ const i=c.dataset.c; t.querySelectorAll(`[data-c="${i}"]`).forEach(x=>x.classList.add("hF")); $("stHint").innerHTML=`column <b style="color:var(--blue)">${cols[i]}</b> = one <b style="color:var(--blue)">feature</b>, measured for every employee`; }
    else { const tr=c.parentElement; tr.querySelectorAll("td").forEach(x=>x.classList.add("hL")); $("stHint").innerHTML=`row ${+tr.dataset.r+1} = one <b class="y">instance</b>: everything we know about ${rows[tr.dataset.r][1]}`; } });
  t.addEventListener("mouseleave",()=>{ clear(); $("stHint").textContent="hover a column or a row"; });
  let s=0;
  A.structured={ enter(){ s=0; clear(); $("stHint").textContent="hover a column or a row"; },
    step(){ if(s>=2) return false; s++; clear(); if(s===1){ t.querySelectorAll('[data-c="4"]').forEach(x=>x.classList.add("hF")); $("stHint").innerHTML=`column <b style="color:var(--blue)">Age</b> = one <b style="color:var(--blue)">feature</b>`; } else { t.querySelectorAll('tr[data-r="2"] td').forEach(x=>x.classList.add("hL")); $("stHint").innerHTML=`row 3 = one <b class="y">instance</b>: one employee`; } return true; } };
})();

/* ---------- structured or unstructured? sorter ---------- */
(() => {
  const ITEMS=[["📊","Spreadsheet of sales","S"],["🤳","A selfie","U"],["🎙️","Voice memo","U"],["🗃️","Customer database table","S"],["💬","A social media post","U"],["📹","Security camera video","U"],["🌡️","CSV of daily temperatures","S"],["✉️","An email","U"],["🏦","Bank transaction records","S"],["🩻","An X-ray image","U"]];
  let sel=null, placed={};
  function render(){
    $("srtItems").innerHTML=ITEMS.map((it,i)=>placed[i]?"":`<span class="chipx ${sel===i?"sel":""}" data-i="${i}"><span class="e">${it[0]}</span>${it[1]}</span>`).join("")||`<span class="hint">all sorted</span>`;
    document.querySelectorAll('[data-id="unstructured"] .bin').forEach(b=>{ const k=b.dataset.b; const ids=Object.keys(placed).filter(i=>placed[i]===k);
      b.querySelector(".in").innerHTML=ids.map(i=>`<span class="chipx ${ITEMS[i][2]===k?"right":"wrong"}"><span class="e">${ITEMS[i][0]}</span>${ITEMS[i][1]}</span>`).join(""); $("srt"+k).textContent=ids.length; });
    const n=Object.keys(placed).length, ok=Object.keys(placed).filter(i=>ITEMS[i][2]===placed[i]).length;
    $("srtMsg").innerHTML=n===ITEMS.length?`<span class="${ok===n?"y":""}">${ok} / ${n} correct${ok===n?" ✓":""}</span>`:n?`<span class="muted">${ok} / ${n} correct so far</span>`:"";
  }
  $("srtItems").onclick=e=>{ const c=e.target.closest(".chipx"); if(!c) return; sel=+c.dataset.i; render(); };
  document.querySelectorAll('[data-id="unstructured"] .bin').forEach(b=>b.onclick=()=>{ if(sel===null) return; placed[sel]=b.dataset.b; sel=null; render(); });
  $("srtReset").onclick=()=>{ placed={}; sel=null; render(); };
  render();
  A.unstructured={ enter(){} };
})();

/* ---------- features & labels ---------- */
(() => {
  const F=["Legs","Weight (kg)","Can fly","Fur","Lays eggs","Lives on land"];
  const R=[["Lion",4,190,"No","Yes","No","Yes","Mammal"],["Chicken",2,2.5,"No","No","Yes","Yes","Bird"],["Monkey",2,9,"No","Yes","No","Yes","Mammal"],["Snake",0,5,"No","No","Yes","Yes","Reptile"],["Frog",4,.1,"No","No","Yes","Yes","Amphibian"],["Llama",4,150,"No","Yes","No","Yes","Mammal"]];
  const NEW=["Penguin",2,23,"No","No","Yes","Yes","Bird"];
  const t=$("flTbl"); let mode="", tmr=0;
  const NOTES={"":"Every row is one animal. Press → to highlight the parts.",
    f:`<b style="color:var(--blue)">Features</b> are the inputs: measurable facts about each animal.`,
    l:`The <b class="y">label</b> is the answer we want the model to learn to predict.`,
    q:`A new animal arrives <b>without</b> a label. From its features alone, a trained model predicts one…`};
  function render(){
    const rows=mode==="q"?[...R,NEW]:R;
    t.innerHTML=`<tr><th class="l">Animal</th>${F.map(f=>`<th class="${mode==="f"||mode==="q"?"hF":""}">${f}</th>`).join("")}<th class="${mode==="l"||mode==="q"?"hL":""}">Class (label)</th></tr>`+
      rows.map((r,ri)=>`<tr>${r.map((v,i)=>{ const isF=i>=1&&i<=6, isL=i===7, isNew=ri===R.length;
        const cls=(i===0?"l ":"")+((mode==="f"||mode==="q")&&isF?"hF":"")+((mode==="l"||(mode==="q"&&!isNew))&&isL?"hL":"");
        return `<td class="${cls}" ${isNew&&isL?'id="flNew"':""}>${isNew&&isL?"?":v}</td>`; }).join("")}</tr>`).join("");
    $("flNote").innerHTML=NOTES[mode];
    clearTimeout(tmr); if(mode==="q") tmr=setTimeout(()=>{ const c=$("flNew"); if(c){ c.textContent="Bird"; c.className="hL pop"; $("flNote").innerHTML=NOTES.q+` <b class="y">Bird</b>. That’s supervised learning.`; } },1400);
  }
  const ORDER=["","f","l","q"];
  const set=tabs($("flTabs"),k=>{ mode=k; render(); });
  A.featlab={ enter(){ mode=""; set(""); render(); },
    step(){ const i=ORDER.indexOf(mode); if(i>=ORDER.length-1) return false; mode=ORDER[i+1]; set(mode); render(); return true; },
    back(){ const i=ORDER.indexOf(mode); if(i<=0) return false; mode=ORDER[i-1]; set(mode); render(); return true; } };
})();

/* ---------- data types quiz ---------- */
(() => {
  const TYPES=["Text","Number","Boolean","Date / Time","Category"];
  const ROWS=[["Name",'"Ember"',0],["Element",'"Fire"',4],["Level","12",1],["HP","48.5",1],["Shiny","Yes",2],["Can evolve","No",2],["Caught on","2026-10-15",3]];
  let ans=[];
  const s=$("critSvg");
  s.innerHTML=`<path d="M128 120c30-6 40-40 22-62 4 20-8 30-16 26 8-18-4-34-14-40 2 16-8 22-14 18" fill="#ff8a1f" stroke="#ffc20e" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="82" cy="118" rx="46" ry="40" fill="#ff8a1f"/><ellipse cx="82" cy="128" rx="26" ry="22" fill="#ffd9a8"/>
    <path d="M44 70l8-40 26 30zM120 70l-8-40-26 30z" fill="#ff8a1f"/><path d="M52 62l4-20 12 14zM112 62l-4-20-12 14z" fill="#ffd9a8"/>
    <ellipse cx="82" cy="84" rx="44" ry="36" fill="#ff8a1f"/><ellipse cx="66" cy="82" rx="7" ry="9" fill="#121214"/><ellipse cx="98" cy="82" rx="7" ry="9" fill="#121214"/>
    <circle cx="68" cy="79" r="2.5" fill="#fff"/><circle cx="100" cy="79" r="2.5" fill="#fff"/><path d="M76 98q6 6 12 0" stroke="#121214" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="54" cy="96" r="6" fill="#ff5a4e" opacity=".5"/><circle cx="110" cy="96" r="6" fill="#ff5a4e" opacity=".5"/>`;
  function render(check){
    $("tqTbl").innerHTML=`<tr><th class="l">Column</th><th class="l">Value</th><th>Data type</th></tr>`+ROWS.map((r,i)=>{
      const a=ans[i], st=a===undefined?"":(check?(a===r[2]?"right":"wrong"):"set");
      return `<tr><td class="l">${r[0]}</td><td class="l" style="color:var(--y)">${r[1]}</td><td><span class="tchip ${st}" data-i="${i}">${a===undefined?"?":TYPES[a]}</span></td></tr>`; }).join("");
  }
  $("tqTbl").onclick=e=>{ const c=e.target.closest(".tchip"); if(!c) return; const i=+c.dataset.i; ans[i]=ans[i]===undefined?0:(ans[i]+1)%TYPES.length; $("tqMsg").textContent=""; render(false); };
  $("tqCheck").onclick=()=>{ render(true); const n=ROWS.filter((r,i)=>ans[i]===r[2]).length; $("tqMsg").innerHTML=n===ROWS.length?`<span class="y">all ${n} correct ✓</span>`:`<span class="muted">${n} / ${ROWS.length} correct</span>`; };
  $("tqShow").onclick=()=>{ ans=ROWS.map(r=>r[2]); render(true); $("tqMsg").innerHTML=`<span class="muted">"Fire" comes from a fixed set: a category</span>`; };
  A.dtypes={ enter(){ ans=[]; render(false); $("tqMsg").textContent=""; } };
})();

/* ---------- house data (supervised, cleaning) ---------- */
const HOUSES=[[1500,3,1,267],[1600,3,0,234],[1720,4,1,300],[1800,4,1,312]];
function fitLine(P){ const n=P.length; if(n<2) return null; const mx=P.reduce((s,p)=>s+p[0],0)/n, my=P.reduce((s,p)=>s+p[1],0)/n; let sxy=0,sxx=0; for(const [a,b] of P){ sxy+=(a-mx)*(b-my); sxx+=(a-mx)**2; } if(!sxx) return null; const m=sxy/sxx; return {m,b:my-m*mx}; }

/* ---------- supervised in action ---------- */
(() => {
  const cv=$("svCv");
  $("svTbl").innerHTML=`<tr><th class="hF">Sq Feet</th><th class="hF">Bedrooms</th><th class="hF">Has Pool</th><th class="hL">Price (1k)</th></tr>`+HOUSES.map(r=>`<tr>${r.map((v,i)=>`<td class="${i<3?"hF":"hL"}">${v}</td>`).join("")}</tr>`).join("");
  const fit=fitLine(HOUSES.map(h=>[h[0],h[3]]));
  const pred=s=>fit.m*s+fit.b;
  const upd=()=>{ const v=+$("svX").value; $("svXv").textContent=v; $("svY").textContent=`$${Math.round(pred(v))}k`; };
  $("svX").oninput=upd; upd();
  $("svCap").textContent=`learned: price ≈ ${fmt(fit.m,3)} × sq ft ${fit.b<0?"−":"+"} ${fmt(Math.abs(fit.b),1)}`;
  A.supervised={ enter(){ upd(); }, tick(){
    const W=cv.offsetWidth, H=cv.offsetHeight, x=ctxOf(cv), L=80, T=40, R=W-36, B=H-70;
    x.clearRect(0,0,W,H); axes(x,L,T,R,B);
    const px=s=>L+(s-1300)/800*(R-L), py=p=>B-(p-150)/250*(B-T);
    for(let s=1300;s<=2100;s+=200) label(x,s,px(s),B+24,MUTE,13,"center");
    for(let p=150;p<=400;p+=50) label(x,p,L-12,py(p)+5,MUTE,13,"right");
    label(x,"sq feet →",R,B+50,MUTE,15,"right"); label(x,"price (1k)",L,T-14,MUTE,15);
    x.strokeStyle=Y; x.lineWidth=3; x.globalAlpha=.7; x.beginPath(); x.moveTo(px(1300),py(pred(1300))); x.lineTo(px(2100),py(pred(2100))); x.stroke(); x.globalAlpha=1;
    for(const h of HOUSES) dot(x,px(h[0]),py(h[3]),9,BLUE);
    const v=+$("svX").value, q=pred(v);
    x.setLineDash([6,6]); x.strokeStyle="rgba(255,194,14,.6)"; x.lineWidth=2; x.beginPath(); x.moveTo(px(v),B); x.lineTo(px(v),py(q)); x.lineTo(L,py(q)); x.stroke(); x.setLineDash([]);
    dot(x,px(v),py(q),12,null,Y); dot(x,px(v),py(q),5,Y);
    label(x,"● training examples",R-210,T+6,BLUE,15); label(x,"◎ prediction",R-210,T+30,Y,15);
  } };
})();

/* ---------- cleaning problems overview ---------- */
$("probGrid").innerHTML=[
  ["∅","Missing data","NA, null, NaN. From entry errors or incomplete collection.","impute (mean / median / mode) or drop"],
  ["⧉","Duplicate data","Repeated rows, often from merging datasets.","find with duplicated(), then remove"],
  ["Aa","Inconsistent formatting","Mixed date formats, “Davis” vs “davis”.","standardize, e.g. pd.to_datetime()"],
  ["\"1\"","Incorrect data types","Text where numbers belong, int vs. float.","convert with astype()"],
  ["⇡","Outliers","Extreme values: typos or real anomalies.","visualize (box plot), then remove or adjust"],
  ["✕","Invalid data","Negative ages, impossible dates.","logical checks and filters"],
  ["−","Irrelevant features","Columns that don’t help the prediction.","feature selection: drop them"],
  ["↺","Garbage in, garbage out","A model can only be as good as the data it learns from.","clean before you train"]
].map((p,i)=>`<div class="card prob rise" style="--i:${i+1}"><span class="ic">${p[0]}</span><h3>${p[1]}</h3><div class="ex">${p[2]}</div><div class="fix">${p[3]}</div></div>`).join("");

/* ---------- cleaning lab ---------- */
(() => {
  const H=["Sq Feet","Bedrooms","Has Pool","Price (1k)"];
  const base=()=>HOUSES.map(r=>r.slice());
  const P=[
    {name:"Missing data", cols:H, rows:(()=>{ const r=base(); r[2][0]="NaN"; return r; })(), bad:[[2,0]],
      note:`Row 3 has no square footage. Most models <b>crash or skip</b> on missing values. Pick a fix:`,
      fixes:[
        {label:"Fill with mean", set:[[2,0,1633]], note:`<b>Mean</b>: (1500 + 1600 + 1800) / 3 = 4900 / 3 ≈ <b>1633</b>. This is <b>imputation</b>.`},
        {label:"Fill with median", set:[[2,0,1600]], note:`<b>Median</b>: sort 1500, 1600, 1800 and take the middle → <b>1600</b>. Safer if there are outliers.`},
        {label:"Drop the row", drop:[2], note:`Dropping is simple, but we <b>lose</b> that house’s other data. Fine when only a few rows are missing.`}]},
    {name:"Duplicates", cols:H, rows:[...base(),[1800,4,1,312]], badRow:[4],
      note:`The last row is an exact copy of row 4, maybe from merging two files. It would count that house <b>twice</b>.`,
      fixes:[{label:"Remove duplicates", drop:[4], note:`<code>df.duplicated()</code> finds them, <code>df.drop_duplicates()</code> removes them.`}]},
    {name:"Formatting", cols:["Sq Feet","County","Built","Price (1k)"], rows:[[1500,'"Davis"',"10/6/2003",267],[1600,'"Davis"',"3/8/2004",234],[1720,'"Salt Lake"',"15/11/2005",300],[1800,'"davis"',"9-21-2006",312]], bad:[[2,2],[3,1],[3,2]],
      note:`To a computer, <b>"davis"</b> and <b>"Davis"</b> are different counties, and dates come in three different formats.`,
      fixes:[{label:"Standardize", set:[[2,2,"11/15/2005"],[3,1,'"Davis"'],[3,2,"9/21/2006"]], note:`One format for everything. In pandas, <code>pd.to_datetime()</code> fixes dates; <code>.str.title()</code> fixes capitals.`}]},
    {name:"Data types", cols:H, rows:(()=>{ const r=base(); r[1][2]='"0"'; r[2][1]=4.2; return r; })(), bad:[[1,2],[2,1]],
      note:`<b>"0"</b> is text, not a number, and you can’t have <b>4.2</b> bedrooms: it should be a whole number (int, not float).`,
      fixes:[{label:"Convert types", set:[[1,2,0],[2,1,4]], note:`Convert with <code>astype()</code>: <code>df["Has Pool"].astype(int)</code>.`}]},
    {name:"Outliers", cols:H, rows:(()=>{ const r=base(); r[0][3]=47; r[2][3]=850; return r; })(), bad:[[0,3],[2,3]],
      note:`A $47k house and an $850k house next to $234k–$312k ones? Probably typos. A <b>box plot</b> makes them easy to spot.`,
      fixes:[{label:"Replace with median", set:[[0,3,273],[2,3,273]], note:`Median of the trustworthy prices: (234 + 312) / 2 = <b>273</b>. The median isn’t dragged around by outliers.`},
             {label:"Remove rows", drop:[0,2], note:`Removing works too, but with only 4 houses we’d lose half the data.`}]},
    {name:"Invalid data", cols:H, rows:(()=>{ const r=base(); r[1][1]=-3; return r; })(), bad:[[1,1]],
      note:`<b>−3 bedrooms</b> is impossible. Write logical checks: bedrooms ≥ 0, age ≥ 0, no dates in the future.`,
      fixes:[{label:"Fix the sign", set:[[1,1,3]], note:`A filter like <code>df[df.Bedrooms &gt;= 0]</code> catches it. Here it looks like a typo, so we fix it to <b>3</b>.`},
             {label:"Drop the row", drop:[1], note:`If we can’t tell what it should be, drop the row.`}]},
    {name:"Irrelevant features", cols:["Sq Feet","Bedrooms","Near Park","Price (1k)"], rows:[[1500,3,1,267],[1600,3,1,234],[1720,4,0,300],[1800,4,0,312]], badCol:[2],
      note:`Say we found <b>Near Park</b> doesn’t affect price in this market. Extra columns add noise and slow training.`,
      fixes:[{label:"Drop the column", dropCol:[2], note:`<b>Feature selection</b>: keep only the columns that help predict the label.`}]},
  ];
  let idx=0, fixed=[];
  function render(){
    const p=P[idx], f=fixed[idx]!=null?p.fixes[fixed[idx]]:null;
    $("labTitle").textContent=p.name;
    $("labTabs").innerHTML=P.map((q,i)=>`<button class="${i===idx?"on":""} ${fixed[i]!=null?"done":""}" data-i="${i}">${i+1}. ${q.name}</button>`).join("");
    const val={}; if(f&&f.set) f.set.forEach(([r,c,v])=>val[r+","+c]=v);
    const dr=new Set(f&&f.drop||[]), dc=new Set(f&&f.dropCol||[]);
    const badCells=new Set((p.bad||[]).map(a=>a.join(","))), badRows=new Set(p.badRow||[]), badCols=new Set(p.badCol||[]);
    $("labTbl").innerHTML=`<tr>${p.cols.map((c,i)=>`<th class="${dc.has(i)?"gone":badCols.has(i)&&!f?"bad":""}">${c}</th>`).join("")}</tr>`+p.rows.map((r,ri)=>`<tr class="${dr.has(ri)?"gone":""}">${r.map((v,ci)=>{
      const k=ri+","+ci; let cls="";
      if(k in val) cls="ok pop"; else if(!f&&(badCells.has(k)||badRows.has(ri)||badCols.has(ci))) cls="bad";
      if(dc.has(ci)) cls="gone";
      return `<td class="${cls}">${k in val?val[k]:v}</td>`; }).join("")}</tr>`).join("");
    $("labNote").innerHTML=f?f.note:p.note;
    $("labActs").innerHTML=p.fixes.map((x,i)=>`<button class="btn ${fixed[idx]===i?"on":""}" data-f="${i}">${x.label}</button>`).join("")+(f?`<button class="btn" data-f="-1">Undo</button>`:"");
  }
  $("labTabs").onclick=e=>{ const b=e.target.closest("button"); if(!b) return; idx=+b.dataset.i; render(); };
  $("labActs").onclick=e=>{ const b=e.target.closest("button"); if(!b) return; const f=+b.dataset.f; fixed[idx]=f<0?null:f; render(); };
  A.cleanlab={ enter(d){ fixed=[]; idx=d<0?P.length-1:0; render(); },
    step(){ if(fixed[idx]==null){ fixed[idx]=0; render(); return true; } if(idx<P.length-1){ idx++; render(); return true; } return false; },
    back(){ if(idx>0){ idx--; render(); return true; } return false; } };
})();

/* ---------- mean, median, mode on a number line ---------- */
(() => {
  const s=$("ctSvg"), X0=70, X1=1310, LY=200, MAX=20, px=v=>X0+v/MAX*(X1-X0);
  const PRE=[["[2, 4, 6, 8]",[2,4,6,8]],["[2, 3, 3, 4, 5]",[2,3,3,4,5]],["[1, 2, 3, 3, 4, 4]",[1,2,3,3,4,4]],["[1, 3, 5, 7]",[1,3,5,7]],["prices + outlier",[3,4,4,5,6,19]]];
  let V=[];
  $("ctPre").innerHTML=PRE.map((p,i)=>`<button class="btn" data-i="${i}">${p[0]}</button>`).join("");
  $("ctPre").onclick=e=>{ const b=e.target.closest("button"); if(!b) return; V=PRE[+b.dataset.i][1].slice(); render(); };
  const stats=()=>{ if(!V.length) return null; const so=V.slice().sort((a,b)=>a-b), n=so.length, mean=so.reduce((a,b)=>a+b,0)/n;
    const med=n%2?so[(n-1)/2]:(so[n/2-1]+so[n/2])/2; const f={}; so.forEach(v=>f[v]=(f[v]||0)+1); const mx=Math.max(...Object.values(f));
    const mode=mx>1?Object.keys(f).filter(k=>f[k]===mx).map(Number):[]; return {mean,med,mode,n}; };
  function render(){
    s.innerHTML=""; svgEl("line",{x1:X0-20,y1:LY,x2:X1+20,y2:LY,stroke:LINE,"stroke-width":3},s);
    for(let v=0;v<=MAX;v++){ svgEl("line",{x1:px(v),y1:LY-6,x2:px(v),y2:LY+6,stroke:"#55534d","stroke-width":2},s); const t=svgEl("text",{x:px(v),y:LY+34,"text-anchor":"middle",fill:MUTE,"font-size":17,"font-family":"JetBrains Mono"},s); t.textContent=v; }
    const st=stats(), cnt={};
    V.forEach((v,i)=>{ const k=cnt[v]=(cnt[v]||0)+1; const c=svgEl("circle",{cx:px(v),cy:LY-14-(k-1)*30,r:13,fill:INK,stroke:"#121214","stroke-width":3,"data-i":i,style:"cursor:pointer"},s); });
    if(st){
      // one row per marker (mean on top, median below) so their labels never overlap
      const mk=(v,col,txt,row)=>{ const g=svgEl("g",{},s), y0=LY+46+row*46, w=txt.length*10+16;
        if(row) svgEl("line",{x1:px(v),y1:LY+42,x2:px(v),y2:y0,stroke:col,"stroke-width":2,"stroke-dasharray":"4 4"},g);
        svgEl("path",{d:`M${px(v)-9} ${y0+12}l9 -12l9 12z`,fill:col},g);
        svgEl("rect",{x:px(v)-w/2,y:y0+15,width:w,height:24,rx:6,fill:"#1c1c20"},g);
        const t=svgEl("text",{x:px(v),y:y0+32,"text-anchor":"middle",fill:col,"font-size":16,"font-family":"JetBrains Mono","font-weight":600},g); t.textContent=txt; };
      mk(st.med,BLUE,"median "+fmt(st.med),1); mk(st.mean,Y,"mean "+fmt(st.mean),0);
      st.mode.forEach(m=>{ const t=svgEl("text",{x:px(m),y:LY-14-cnt[m]*30-4,"text-anchor":"middle",fill:GREEN,"font-size":16,"font-family":"JetBrains Mono","font-weight":600},s); t.textContent="mode"; });
      $("ctMean").textContent=fmt(st.mean); $("ctMed").textContent=fmt(st.med); $("ctMode").textContent=st.mode.length?st.mode.join(" & "):"none";
    } else { $("ctMean").textContent=$("ctMed").textContent=$("ctMode").textContent="–"; }
    const hit=svgEl("rect",{x:X0-30,y:0,width:X1-X0+60,height:340,fill:"transparent",style:"cursor:copy"}); s.insertBefore(hit,s.firstChild);
  }
  s.addEventListener("click",e=>{ const d=e.target.closest("circle"); if(d){ V.splice(+d.dataset.i,1); render(); return; } const [x]=svgXY(e,s); const v=Math.round((x-X0)/(X1-X0)*MAX); if(v<0||v>MAX) return; if(V.filter(a=>a===v).length>=5) return; V.push(v); render(); });
  let pi=0;
  A.center={ enter(){ pi=0; V=PRE[0][1].slice(); render(); },
    step(){ if(pi>=PRE.length-1) return false; pi++; V=PRE[pi][1].slice(); render(); return true; },
    back(){ if(pi<=0) return false; pi--; V=PRE[pi][1].slice(); render(); return true; } };
})();

/* ---------- transforming values: scaling + encoding ---------- */
(() => {
  const upd=()=>{ const h=+$("scH").value, r=(h-150)/40; $("scHv").textContent=h+" cm"; $("scA").textContent=h; $("scR").textContent=r.toFixed(2);
    $("scT1").querySelector("i").style.left=(r*100)+"%"; $("scT2").querySelector("i").style.left=(r*100)+"%"; };
  $("scH").oninput=upd; upd();
  const C=["RED","BLUE","GREEN","BLUE","RED"], HEX={RED:RED,BLUE:BLUE,GREEN:GREEN}, NUM={RED:0,BLUE:1,GREEN:2};
  let mode="label";
  function render(){
    const sw=c=>`<span class="sw8" style="background:${HEX[c]}"></span>${c}`;
    if(mode==="label"){ $("encTbl").innerHTML=`<tr><th class="l">Color</th><th>→</th><th>#</th></tr>`+C.map(c=>`<tr><td class="l">${sw(c)}</td><td class="muted">→</td><td class="hL">${NUM[c]}</td></tr>`).join("");
      $("encP").innerHTML=`<b>Label encoding</b>: give each category a number. Simple, but it hints that GREEN (2) is “bigger” than RED (0).`; }
    else { $("encTbl").innerHTML=`<tr><th class="l">Color</th><th>is_red</th><th>is_blue</th><th>is_green</th></tr>`+C.map(c=>`<tr><td class="l">${sw(c)}</td>${["RED","BLUE","GREEN"].map(k=>`<td class="${k===c?"hL":"muted"}">${k===c?1:0}</td>`).join("")}</tr>`).join("");
      $("encP").innerHTML=`<b>One-hot encoding</b>: one yes/no column per category. No fake ordering.`; }
  }
  const set=tabs($("encTabs"),k=>{ mode=k; render(); }); render();
  A.transform={ enter(){ mode="label"; set("label"); render(); $("scH").value=172; upd(); },
    step(){ if(mode==="label"){ mode="onehot"; set(mode); render(); return true; } return false; } };
})();

/* ---------- feature engineering pipeline ---------- */
(() => {
  const RAW=[["J. Smith",1998,1720,"Yes",300],["A. Lopez",2010,1500,"No",null],["K. Chen",1985,1800,"Yes",312]];
  const MSG=["raw data, straight from the listing site","cleaned: missing price filled with the median of 300 and 312 → 306","created: Age = 2026 − Built","selected: the owner’s name and Built (now Age) won’t help predict price","transformed: Yes/No → 1/0, sq ft scaled to 0–1. Ready for a model!"];
  let s=0;
  function render(){
    document.querySelectorAll("#feSteps .fes").forEach((e,i)=>{ e.classList.toggle("on",i===s-1); e.classList.toggle("done",i<s-1); });
    const cols=["Owner","Built","Sq Ft","Pool"].concat(s>=2?["Age"]:[]).concat(["Price (label)"]);
    const gone=c=>s>=3&&(c==="Owner"||c==="Built");
    $("feTbl").innerHTML=`<tr>${cols.map(c=>`<th class="${gone(c)?"gone":c==="Price (label)"?"hL":""}">${c}</th>`).join("")}</tr>`+RAW.map(r=>{
      const v={Owner:r[0],Built:r[1],"Sq Ft":r[2],Pool:r[3],Age:2026-r[1],"Price (label)":r[4]};
      return `<tr>${cols.map(c=>{ let x=v[c], cls="";
        if(c==="Price (label)"){ if(x==null){ if(s>=1){ x=306; cls=s===1?"ok pop":""; } else { x="NaN"; cls="bad"; } } }
        if(c==="Age"&&s===2) cls="ok pop";
        if(s>=4&&c==="Pool"){ x=x==="Yes"?1:0; cls=s===4?"ok pop":""; }
        if(s>=4&&c==="Sq Ft"){ x=((x-1500)/300).toFixed(2); cls=s===4?"ok pop":""; }
        if(gone(c)) cls="gone";
        return `<td class="${cls}">${x}</td>`; }).join("")}</tr>`; }).join("");
    $("feMsg").textContent=MSG[s]; $("feNext").textContent=s<4?`Apply step ${s+1} ▶`:"Done ✓"; $("feNext").disabled=s>=4;
  }
  document.querySelectorAll("#feSteps .fes").forEach(e=>e.onclick=()=>{ s=+e.dataset.s+1; render(); });
  $("feNext").onclick=()=>{ if(s<4){ s++; render(); } }; $("feReset").onclick=()=>{ s=0; render(); };
  A.feateng={ enter(){ s=0; render(); }, step(){ if(s<4){ s++; render(); return true; } return false; }, back(){ if(s>0){ s--; render(); return true; } return false; } };
})();

/* ---------- why charts ---------- */
(() => {
  const M=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"], V=[42.1,45.3,47.8,51.2,49.6,53.4,38.7,55.1,58.3,60.2,57.9,64.5];
  $("vzTbl").innerHTML=`<tr><th>Month</th><th>Sales ($k)</th><th style="width:60px"></th><th>Month</th><th>Sales ($k)</th></tr>`+[0,1,2,3,4,5].map(i=>`<tr><td>${M[i]}</td><td>${V[i]}</td><td></td><td>${M[i+6]}</td><td>${V[i+6]}</td></tr>`).join("");
  const s=$("vzChart"), L=70, R=830, T=30, B=350, px=i=>L+i/11*(R-L), py=v=>B-(v-30)/40*(B-T);
  function draw(){ s.innerHTML="";
    for(let v=30;v<=70;v+=10){ svgEl("line",{x1:L,y1:py(v),x2:R,y2:py(v),stroke:LINE},s); const t=svgEl("text",{x:L-12,y:py(v)+5,"text-anchor":"end",fill:MUTE,"font-size":15,"font-family":"JetBrains Mono"},s); t.textContent=v; }
    M.forEach((m,i)=>{ const t=svgEl("text",{x:px(i),y:B+30,"text-anchor":"middle",fill:MUTE,"font-size":15,"font-family":"JetBrains Mono"},s); t.textContent=m; });
    const d=V.map((v,i)=>`${i?"L":"M"}${px(i)} ${py(v)}`).join(" ");
    svgEl("path",{d:d+` L${R} ${B} L${L} ${B}Z`,fill:"rgba(255,194,14,.08)"},s);
    const p=svgEl("path",{d,fill:"none",stroke:Y,"stroke-width":4,"stroke-linejoin":"round"},s); const len=p.getTotalLength(); p.style.strokeDasharray=len; p.style.strokeDashoffset=len; p.style.transition="stroke-dashoffset 1.4s ease"; requestAnimationFrame(()=>requestAnimationFrame(()=>p.style.strokeDashoffset=0));
    V.forEach((v,i)=>svgEl("circle",{cx:px(i),cy:py(v),r:i===6?9:5,fill:i===6?RED:Y},s));
    const t=svgEl("text",{x:px(6),y:py(V[6])+40,"text-anchor":"middle",fill:RED,"font-size":18,"font-family":"JetBrains Mono","font-weight":600},s); t.textContent="July dip";
  }
  let mode="t";
  const show=k=>{ mode=k; $("vzTable").classList.toggle("off",k!=="t"); s.classList.toggle("off",k!=="c"); if(k==="c") draw(); };
  const set=tabs($("vzTabs"),show);
  A.vizwhy={ enter(){ set("t"); show("t"); }, step(){ if(mode==="t"){ set("c"); show("c"); return true; } return false; } };
})();

/* ---------- chart types ---------- */
(() => {
  const C=[Y,BLUE,GREEN,RED,AMBER,PURPLE];
  const R=(x,y,w,h,f)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${f}"/>`;
  const AX=`<path d="M12 8V100H190" stroke="#55534d" stroke-width="2" fill="none"/>`;
  const T=[
    ["Bar chart","Compares values across categories (horizontal bars).","Comparing amounts, ranking, long category names.",AX+[70,40,60,25].map((w,i)=>R(14,14+i*22,w*2,14,C[i])).join("")],
    ["Column chart","Compares values across categories (vertical bars).","Comparing amounts, ranking categories.",AX+[40,62,80,52].map((h,i)=>R(30+i*40,100-h,26,h,C[i])).join("")],
    ["Line chart","How values change over time.","Trends, changes over time, continuous data.",AX+`<polyline points="20,82 55,70 90,74 125,48 160,40 185,22" fill="none" stroke="${BLUE}" stroke-width="4"/><polyline points="20,92 55,88 90,80 125,74 160,64 185,58" fill="none" stroke="${AMBER}" stroke-width="4"/>`],
    ["Pie chart","Parts of a whole.","Percentages of a total, with only a few categories.",`<circle cx="100" cy="55" r="44" fill="${BLUE}"/><path d="M100 55V11A44 44 0 0 1 141 70Z" fill="${RED}"/><path d="M100 55L141 70A44 44 0 0 1 90 98Z" fill="${Y}"/><path d="M100 55L90 98A44 44 0 0 1 58 70Z" fill="${GREEN}"/>`],
    ["Scatter plot","The relationship between two numeric variables.","Finding patterns, correlation, relationships.",AX+[[24,88],[40,80],[52,84],[66,70],[80,72],[94,60],[106,64],[120,50],[134,52],[148,40],[160,36],[176,26],[186,30]].map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="${BLUE}"/>`).join("")],
    ["Histogram","The distribution of one numeric variable.","Seeing spread, range and frequency.",AX+[14,30,52,74,60,36,18].map((h,i)=>R(18+i*24,100-h,23,h,BLUE)).join("")],
    ["Box plot","Median, spread and outliers at a glance.","Comparing distributions across groups.",`<path d="M30 56H66M134 56H170M30 40V72M170 40V72" stroke="${INK}" stroke-width="3"/><rect x="66" y="36" width="68" height="40" fill="rgba(106,184,255,.25)" stroke="${BLUE}" stroke-width="3"/><path d="M96 36V76" stroke="${Y}" stroke-width="4"/><circle cx="188" cy="56" r="4" fill="${RED}"/><circle cx="14" cy="56" r="4" fill="${RED}"/>`],
    ["Area chart","Change over time, area filled below.","Trends and cumulative totals.",AX+`<path d="M14 100L14 80 60 70 100 72 140 50 188 34 188 100Z" fill="${BLUE}" opacity=".9"/><path d="M14 100L14 92 60 86 100 88 140 74 188 62 188 100Z" fill="${AMBER}"/>`],
    ["Stacked bar","Parts of a whole, across several categories.","Comparing multiple series within each category.",[0,1,2].map(i=>R(14,18+i*28,50-i*6,18,BLUE)+R(64-i*6,18+i*28,40+i*8,18,AMBER)+R(104+i*2,18+i*28,44,18,GREEN)+R(148+i*2,18+i*28,30,18,RED)).join("")],
    ["Heatmap","Values as colors in a grid.","Spotting high/low values and patterns in big tables.",Array.from({length:30},(_,i)=>{ const r=i/6|0, c=i%6, v=(Math.sin(r*1.3+c*.9)+1)/2; return R(14+c*30,6+r*20,27,17,`rgba(255,${Math.round(90+v*104)},${Math.round(14+(1-v)*60)},${.25+v*.75})`); }).join("")],
    ["Treemap","Hierarchy as nested rectangles.","Part-to-whole with many categories.",R(10,8,92,96,BLUE)+R(106,8,84,50,AMBER)+R(106,62,40,42,GREEN)+R(150,62,40,20,PURPLE)+R(150,86,40,18,RED)],
    ["Radar chart","Several variables for one item, around a circle.","Comparing profiles: stats of players, products.",`<polygon points="100,10 146,40 140,92 60,92 54,40" fill="none" stroke="#55534d" stroke-width="2"/><polygon points="100,30 128,46 124,80 76,84 70,44" fill="none" stroke="#3a3a42" stroke-width="2"/><polygon points="100,16 136,44 116,84 70,88 66,46" fill="rgba(95,214,138,.25)" stroke="${GREEN}" stroke-width="3"/>`]
  ];
  let on=0;
  $("cgGrid").innerHTML=T.map((t,i)=>`<div class="card cg" data-i="${i}"><svg viewBox="0 0 200 110">${t[3]}</svg><span>${t[0]}</span></div>`).join("");
  const sel=i=>{ on=i; document.querySelectorAll("#cgGrid .cg").forEach((e,j)=>e.classList.toggle("on",j===i)); const t=T[i];
    $("cgInfo").innerHTML=`<h3>${t[0]}</h3><div><div class="k">Shows</div><p>${t[1]}</p></div><div><div class="k">Use for</div><p>${t[2]}</p></div>`; };
  $("cgGrid").onclick=e=>{ const c=e.target.closest(".cg"); if(c) sel(+c.dataset.i); };
  A.charts={ enter(){ sel(0); } };
})();

/* ---------- label an image: draw bounding boxes, then compare with an expert key ---------- */
(() => {
  const s=$("ilSvg");
  const L=[["car","Car",BLUE],["person","Person",Y],["dog","Dog",AMBER],["tree","Tree",GREEN],["bike","Bicycle",PURPLE],["light","Traffic light",RED]];
  const COL=Object.fromEntries(L.map(l=>[l[0],l[2]])), NAME=Object.fromEntries(L.map(l=>[l[0],l[1]]));
  // the expert's answer key: label, x, y, w, h in the 900 x 560 picture
  const KEY=[["tree",35,90,180,280],["light",798,115,44,330],["car",300,362,260,106],["bike",83,468,164,84],["person",605,327,60,215],["dog",688,474,103,68]];
  const WIN=[[250,190],[290,190],[250,240],[290,240],[250,290],[290,290],[365,140],[405,140],[365,190],[405,190],[365,240],[405,240],[365,290],[405,290],[470,220],[520,220],[470,270],[520,270],[620,170],[660,170],[620,220],[660,220],[620,270],[660,270]];
  // the picture, drawn so the key matches it exactly
  s.innerHTML=`<defs><linearGradient id="ilSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b4f7a"/><stop offset="1" stop-color="#8fb7d9"/></linearGradient></defs>
  <rect width="900" height="560" fill="url(#ilSky)"/><circle cx="700" cy="70" r="34" fill="#ffe08a"/>
  <g fill="#566173"><rect x="230" y="170" width="110" height="190"/><rect x="350" y="120" width="90" height="240"/><rect x="450" y="200" width="130" height="160"/><rect x="600" y="150" width="100" height="210"/><rect x="860" y="190" width="40" height="170"/></g>
  <g fill="#9fb0c6" opacity=".55">${WIN.map(([x,y])=>`<rect x="${x}" y="${y}" width="22" height="30"/>`).join("")}</g>
  <rect y="340" width="900" height="22" fill="#4f7a43"/><rect y="355" width="900" height="115" fill="#3a3a40"/>
  <g fill="#e8e3d0">${[20,140,260,380,500,620,740,860].map(x=>`<rect x="${x}" y="409" width="60" height="6"/>`).join("")}</g>
  <rect y="468" width="900" height="92" fill="#8d8a84"/><rect y="468" width="900" height="6" fill="#a9a59d"/>
  <rect x="110" y="250" width="30" height="120" fill="#6b4a2f"/><circle cx="125" cy="170" r="80" fill="#3f8a3a"/><circle cx="85" cy="200" r="50" fill="#4a9a44"/><circle cx="165" cy="200" r="50" fill="#357a31"/>
  <rect x="815" y="220" width="10" height="225" fill="#2a2a2e"/><rect x="798" y="115" width="44" height="110" rx="8" fill="#1d1d21"/><circle cx="820" cy="140" r="11" fill="#ff5a4e"/><circle cx="820" cy="170" r="11" fill="#5a4a1e"/><circle cx="820" cy="200" r="11" fill="#1e4a2a"/>
  <path d="M350 395 L382 362 L490 362 L525 395 Z" fill="#2f6fb3"/><path d="M362 393 L388 368 L432 368 L432 393 Z M440 368 L486 368 L512 393 L440 393 Z" fill="#a9d4f5"/><rect x="300" y="393" width="260" height="55" rx="14" fill="#3d86d1"/><rect x="545" y="405" width="12" height="10" rx="3" fill="#ffe08a"/><circle cx="360" cy="450" r="18" fill="#111"/><circle cx="500" cy="450" r="18" fill="#111"/><circle cx="360" cy="450" r="7" fill="#888"/><circle cx="500" cy="450" r="7" fill="#888"/>
  <g fill="none" stroke="#b18cff" stroke-width="5" stroke-linecap="round"><circle cx="115" cy="520" r="30"/><circle cx="215" cy="520" r="30"/><path d="M115 520 L150 485 L200 485 L215 520 M150 485 L170 520 L115 520 M170 520 L200 485 M200 485 L196 472 L212 470 M150 485 L145 474"/></g><rect x="134" y="469" width="24" height="7" rx="3" fill="#2a2a2e"/>
  <circle cx="635" cy="345" r="18" fill="#c68b5e"/><path d="M617 340 Q635 318 653 340 Z" fill="#2a2016"/><rect x="615" y="365" width="40" height="90" rx="10" fill="#e0b022"/><rect x="605" y="370" width="11" height="70" rx="5" fill="#c68b5e"/><rect x="654" y="370" width="11" height="70" rx="5" fill="#c68b5e"/><rect x="618" y="452" width="15" height="88" fill="#26324a"/><rect x="637" y="452" width="15" height="88" fill="#26324a"/><rect x="614" y="534" width="21" height="8" rx="3" fill="#111"/><rect x="635" y="534" width="21" height="8" rx="3" fill="#111"/>
  <ellipse cx="730" cy="505" rx="40" ry="18" fill="#a8672e"/><circle cx="775" cy="490" r="14" fill="#a8672e"/><path d="M766 480 L760 498 L772 492 Z" fill="#6e4219"/><circle cx="780" cy="487" r="2.5" fill="#111"/><circle cx="789" cy="493" r="3" fill="#111"/><g stroke="#a8672e" stroke-width="7" stroke-linecap="round"><path d="M705 515 L703 538 M720 518 L720 538 M745 518 L745 538 M758 515 L760 538"/><path d="M692 500 L688 478" stroke-width="5"/></g>
  <g id="ilKey"></g><g id="ilUser"></g><rect id="ilDraft" fill="none" stroke-width="3" stroke-dasharray="6 4" visibility="hidden"/>`;
  const gU=$("ilUser"), gK=$("ilKey"), draft=$("ilDraft"), note0=$("ilNote").innerHTML;
  let B=[], lab="car", t0=0, tLast=0, checked=false, drag=null;
  const rect=(g,b,col,dash,text)=>{ const [,x,y,w,h]=b;
    svgEl("rect",{x,y,width:w,height:h,fill:col,"fill-opacity":dash?0:.12,stroke:col,"stroke-width":3,"stroke-dasharray":dash||"none"},g);
    const tw=text.length*8.6+14, ty=y>26?y-24:y+h; const tx=Math.min(x,900-tw); svgEl("rect",{x:tx,y:ty,width:tw,height:22,rx:4,fill:col},g);
    const t=svgEl("text",{x:tx+7,y:ty+16,fill:"#121214","font-size":14,"font-weight":600,"font-family":"JetBrains Mono"},g); t.textContent=text; };
  const iou=(a,b)=>{ const ix=Math.max(0,Math.min(a[1]+a[3],b[1]+b[3])-Math.max(a[1],b[1])), iy=Math.max(0,Math.min(a[2]+a[4],b[2]+b[4])-Math.max(a[2],b[2])), I=ix*iy; return I/(a[3]*a[4]+b[3]*b[4]-I); };
  function stat(){ const n=B.length; let t=`${n} box${n===1?"":"es"} drawn`;
    if(n>=3){ const per=(tLast-t0)/1000/(n-1); if(per>0){ const days=1.5e6*per/86400; t+=` · about ${fmt(per,1)} s per box. COCO, a popular image dataset, has about 1.5 million labeled objects: ${Math.round(days).toLocaleString()} days of nonstop labeling at your pace.`; } }
    $("ilStat").textContent=t; }
  function draw(){ gU.innerHTML=""; gK.innerHTML="";
    if(checked){ const used=new Set(); let hit=0; const miss=[];
      KEY.forEach(k=>{ let best=-1, bi=-1; B.forEach((b,i)=>{ if(b[0]!==k[0]||used.has(i)) return; const v=iou(b,k); if(v>best){ best=v; bi=i; } });
        const ok=best>=.5; if(ok){ used.add(bi); hit++; } else miss.push(NAME[k[0]]);
        rect(gK,k,ok?GREEN:RED,"8 6",(ok?"✓ ":"✗ ")+NAME[k[0]]); });
      B.forEach((b,i)=>{ if(!used.has(i)) rect(gU,b,MUTE,"",NAME[b[0]]+" ?"); });
      $("ilNote").innerHTML=`You matched <b class="y">${hit} of ${KEY.length}</b> objects.`+(miss.length?` Missed or off: ${miss.join(", ")}.`:"")+` A box counts when it has the right label and overlaps the expert’s box by at least half. Real projects check annotators’ work the same way.`;
    } else B.forEach(b=>rect(gU,b,COL[b[0]],"",NAME[b[0]]));
    stat(); }
  function labels(){ $("ilLabels").innerHTML=L.map(([k,n,c])=>`<button data-k="${k}" class="${k===lab?"on":""}"><i style="background:${c}"></i>${n}</button>`).join(""); }
  $("ilLabels").onclick=e=>{ const b=e.target.closest("button"); if(!b) return; lab=b.dataset.k; labels(); };
  const pt=e=>{ const [x,y]=svgXY(e,s); return [clamp(x,0,900),clamp(y,0,560)]; };
  const move=e=>{ if(!drag) return; const [x,y]=pt(e);
    draft.setAttribute("x",Math.min(drag[0],x)); draft.setAttribute("y",Math.min(drag[1],y)); draft.setAttribute("width",Math.abs(x-drag[0])); draft.setAttribute("height",Math.abs(y-drag[1])); };
  s.addEventListener("pointerdown",e=>{ if(checked) return; drag=pt(e); try{ s.setPointerCapture(e.pointerId); }catch(err){}
    draft.setAttribute("stroke",COL[lab]); draft.setAttribute("visibility","visible"); move(e); });
  s.addEventListener("pointermove",move);
  s.addEventListener("pointerup",e=>{ if(!drag) return; const [x,y]=pt(e);
    const b=[lab,Math.min(drag[0],x),Math.min(drag[1],y),Math.abs(x-drag[0]),Math.abs(y-drag[1])]; drag=null; draft.setAttribute("visibility","hidden");
    if(b[3]<10||b[4]<10) return; const now=performance.now(); if(!B.length) t0=now; tLast=now; B.push(b); draw(); });
  const reset=()=>{ B=[]; checked=false; $("ilCheck").textContent="Compare with expert"; $("ilNote").innerHTML=note0; draw(); };
  $("ilCheck").onclick=()=>{ checked=!checked; $("ilCheck").textContent=checked?"Keep labeling":"Compare with expert"; if(!checked) $("ilNote").innerHTML=note0; draw(); };
  $("ilUndo").onclick=()=>{ if(checked) return; B.pop(); draw(); };
  $("ilClear").onclick=reset;
  labels(); draw();
  A.imglab={ enter(){ lab="car"; labels(); reset(); } };
})();

/* ---------- data shapes the mind: emojis flow into a brain, which becomes a model ---------- */
(() => {
  const cv=$("mdCv");
  const EM=[["🐶","dog"],["🐱","cat"],["🍎","apple"],["🚗","car"],["🌳","tree"],["🎵","music"],["⚽","ball"],["🍕","pizza"],["🏠","house"],["✈️","plane"],["🐦","bird"],["🌧️","rain"],["📚","books"],["😀","happy"]];
  const EF=s=>`${s}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`;
  const LAYERS=[4,6,6,3];
  let P=[], OUT=[], FL=[], spawn=0, seen=0, m=0, target=0, NODES=[], DOTS=[], geo=null;
  function layout(W,H){ const cx=W*.5, cy=H*.5, R=Math.min(W,H)*.25;
    if(geo&&geo.W===W&&geo.H===H) return geo;
    const r=srand(11); DOTS=Array.from({length:46},()=>{ const a=r()*Math.PI*2, d=Math.sqrt(r()); return [cx+Math.cos(a)*d*R*.78, cy-R*.08+Math.sin(a)*d*R*.55]; });
    NODES=LAYERS.map((n,li)=>Array.from({length:n},(_,i)=>[cx-R*.95+li*(R*1.9/(LAYERS.length-1)), cy+(i-(n-1)/2)*(R*.36)]));
    return geo={W,H,cx,cy,R}; }
  function caption(){ $("mdCap").textContent=target?"A model: every example nudges its weights.":"Your brain: every experience nudges its connections."; }
  function set(t){ target=t; $("mdHuman").classList.toggle("on",!t); $("mdML").classList.toggle("on",!!t); $("mdIdea").classList.toggle("on",!!t); $("mdHint").style.visibility=t?"hidden":""; caption(); }
  function flash(){ if(m<.5){ const a=(Math.random()*DOTS.length)|0; const near=DOTS.map((d,i)=>[Math.hypot(d[0]-DOTS[a][0],d[1]-DOTS[a][1]),i]).sort((p,q)=>p[0]-q[0]).slice(1,4).map(p=>p[1]); FL.push({k:"b",a,near,t:0}); }
    else FL.push({k:"m",path:LAYERS.map(n=>(Math.random()*n)|0),t:0}); }
  A.mind={
    enter(){ P=[]; OUT=[]; FL=[]; seen=0; spawn=0; m=0; set(0); },
    step(){ if(!target){ set(1); return true; } return false; },
    back(){ if(target){ set(0); return true; } return false; },
    tick(dt){ const W=cv.offsetWidth, H=cv.offsetHeight, x=ctxOf(cv), g=layout(W,H), {cx,cy,R}=g;
      m+=(target-m)*Math.min(1,dt/350);
      x.clearRect(0,0,W,H);
      label(x,"DATA IN",24,36,MUTE,15);
      label(x,m<.5?"BRAIN":"MODEL",cx,36,Y,15,"center");
      label(x,m<.5?"WHAT IT KNOWS":"PREDICTIONS",W-24,36,MUTE,15,"right");
      // incoming emojis
      spawn+=dt; while(spawn>120){ spawn-=120; const e=pick(EM), y0=rnd(H*.14,H*.86); P.push({e,y0,k:0,sp:rnd(.00034,.00048),cy:rnd(-H*.12,H*.12)}); }
      P=P.filter(p=>{ p.k+=p.sp*dt; if(p.k>=1){ seen++; flash(); const free=[0,1,2,3,4].filter(i=>!OUT.some(o=>o.slot===i)); if(free.length&&Math.random()<.5){ const sl=pick(free); OUT.push({w:p.e[1],slot:sl,y:cy+(sl-2)*R*.3,t:0,conf:Math.round(rnd(84,99))}); } return false; }
        const t=ease(p.k), sx=-30, ex=lerp(cx-R*.15,cx-R*1.05,m), c1x=W*.22;
        const px=(1-t)*(1-t)*sx+2*(1-t)*t*c1x+t*t*ex, py=(1-t)*(1-t)*p.y0+2*(1-t)*t*(p.y0+p.cy)+t*t*cy;
        const sz=48*(1-Math.max(0,t-.6)*1.6); x.globalAlpha=Math.min(1,p.k*6)*(t>.82?(1-t)/.18:1);
        x.font=EF(Math.max(8,sz)); x.textAlign="center"; x.textBaseline="middle"; x.fillText(p.e[0],px,py); x.globalAlpha=1; return true; });
      x.textBaseline="alphabetic"; x.textAlign="left";
      // the brain (fades out) and the network (fades in)
      if(m<.99){ x.globalAlpha=1-m; x.font=EF(R*2); x.textAlign="center"; x.textBaseline="middle"; x.fillText("🧠",cx,cy); x.textBaseline="alphabetic"; x.textAlign="left";
        x.fillStyle="rgba(255,194,14,.5)"; DOTS.forEach(d=>{ x.beginPath(); x.arc(d[0],d[1],2.2,0,7); x.fill(); }); x.globalAlpha=1; }
      if(m>.01){ x.globalAlpha=m; x.strokeStyle="rgba(155,152,143,.22)"; x.lineWidth=1;
        for(let l=0;l<NODES.length-1;l++) for(const a of NODES[l]) for(const b of NODES[l+1]){ x.beginPath(); x.moveTo(a[0],a[1]); x.lineTo(b[0],b[1]); x.stroke(); }
        NODES.forEach((L,li)=>L.forEach(n=>dot(x,n[0],n[1],11,"#1c1c20",li===0?BLUE:li===NODES.length-1?PURPLE:Y))); x.globalAlpha=1; }
      // flashes: new connections lighting up
      FL=FL.filter(f=>{ f.t+=dt; const a=1-f.t/700; if(a<=0) return false;
        x.strokeStyle=`rgba(255,194,14,${a})`; x.lineWidth=3; x.shadowColor=Y; x.shadowBlur=12*a;
        if(f.k==="b"){ if(m<.5){ const A0=DOTS[f.a]; f.near.forEach(i=>{ x.beginPath(); x.moveTo(A0[0],A0[1]); x.lineTo(DOTS[i][0],DOTS[i][1]); x.stroke(); }); dot(x,A0[0],A0[1],5,`rgba(255,194,14,${a})`); } }
        else if(m>.5){ for(let l=0;l<NODES.length-1;l++){ const p=NODES[l][f.path[l]], q=NODES[l+1][f.path[l+1]]; x.beginPath(); x.moveTo(p[0],p[1]); x.lineTo(q[0],q[1]); x.stroke(); } f.path.forEach((ni,l)=>dot(x,NODES[l][ni][0],NODES[l][ni][1],6,`rgba(255,194,14,${a})`)); }
        x.shadowBlur=0; return true; });
      // what comes out
      OUT=OUT.filter(o=>{ o.t+=dt; const k=o.t/1800; if(k>=1) return false; const ox=cx+R*1.02+k*70, al=k<.15?k/.15:k>.7?(1-k)/.3:1;
        x.globalAlpha=al; label(x,m<.5?`“${o.w}!”`:`${o.w} · ${o.conf}%`,ox,o.y,m<.5?INK:Y,18); x.globalAlpha=1; return true; });
      label(x,`examples seen: ${seen.toLocaleString()}`,24,H-22,MUTE,15);
    }
  };
})();

/* ---------- be the annotator ---------- */
(() => {
  const RV=[["This game is absolutely amazing!","p"],["The controls are terrible and frustrating.","n"],["The game was released yesterday.","u"],["I love the graphics and soundtrack!","p"],["The game crashes every time I start it.","n"],["The game supports four players.","u"],["Best game I've played all year!","p"],["The loading times are way too long.","n"],["The game is available on PC and Xbox.","u"],["The story was boring and disappointing.","n"]];
  let L=[], checked=false;
  function render(){
    $("anList").innerHTML=RV.map((r,i)=>`<div class="rv ${checked&&L[i]?(L[i]===r[1]?"hit":"miss"):""}"><span class="id">${i+1}</span><span class="tx">${r[0]}</span><span class="lb">${[["p","POSITIVE"],["u","NEUTRAL"],["n","NEGATIVE"]].map(([k,t])=>`<button class="${k} ${L[i]===k?"on":""}" data-i="${i}" data-k="${k}">${t}</button>`).join("")}</span></div>`).join("");
    const n=L.filter(Boolean).length; $("anCount").textContent=`${n} / 10 labeled`;
  }
  $("anList").onclick=e=>{ const b=e.target.closest("button"); if(!b) return; L[+b.dataset.i]=b.dataset.k; checked=false; render(); };
  $("anCheck").onclick=()=>{ checked=true; render(); const hit=RV.filter((r,i)=>L[i]===r[1]).length;
    $("anNote").innerHTML=`<b>${hit} / 10</b> match the key. Disagreements usually happen on the borderline ones. Real projects have several people label each item and keep the majority vote.`; };
  $("anReset").onclick=()=>{ L=[]; checked=false; render(); $("anNote").innerHTML="Label every review. Do your answers match your neighbor’s? Annotators disagree, and that disagreement ends up in the data."; };
  render();
  A.annotate={ enter(){} };
})();

/* ---------- llm: text pouring into a model ---------- */
(() => {
  const cv=$("llmCv"); const SRC=[["web page",BLUE],["book",Y],["forum",GREEN],["news",AMBER],["wiki",PURPLE],["code",RED]];
  const WORDS="the of and to in is was for on that with as it by at from his an were are which this be or has had not first one their its new after but who they have her she two been other when there all during into school time may years more most only over city some world would where later up such used many can state about national out known university united then made".split(" ");
  let P=[], tokens=0, spawn=0;
  A.llm={ enter(){ P=[]; tokens=0; },
    tick(dt){ const W=cv.offsetWidth, H=cv.offsetHeight, x=ctxOf(cv), mx=W-140, my=H/2;
      spawn+=dt; while(spawn>90){ spawn-=90; const s=pick(SRC); P.push({x:110,y:rnd(40,H-60),w:pick(WORDS),c:s[1],sp:rnd(2.2,3.6),t:0}); }
      x.clearRect(0,0,W,H);
      SRC.forEach((s,i)=>label(x,s[0],18,42+i*((H-80)/5),s[1],15));
      const f=dt/16.7;
      P=P.filter(p=>{ p.t+=dt/1000; const dx=mx-p.x, dy=my-p.y, d=Math.hypot(dx,dy); const v=p.sp*f*(1+p.t*.5); p.x+=dx/Math.max(d,1)*v; p.y+=dy/Math.max(d,1)*v*Math.min(1,p.t*1.5); if(d<60||p.x>W){ tokens+=1; return false; }
        x.globalAlpha=clamp(d/300,.2,1); label(x,p.w,p.x,p.y,p.c,16); x.globalAlpha=1; return true; });
      const pulse=1+Math.sin(performance.now()/300)*.04;
      const g=x.createRadialGradient(mx,my,10,mx,my,110*pulse); g.addColorStop(0,"rgba(255,194,14,.35)"); g.addColorStop(1,"rgba(255,194,14,0)"); x.fillStyle=g; x.beginPath(); x.arc(mx,my,110*pulse,0,7); x.fill();
      dot(x,mx,my,64,"#1c1c20",Y); label(x,"LLM",mx,my+8,Y,24,"center");
      $("llmCap").textContent=`words read: ${tokens.toLocaleString()} · real models read trillions`;
    } };
})();

/* ---------- bias: ask for a picture ---------- */
(() => {
  let rev=false;
  const figs=()=>document.querySelectorAll("#mkGrid figure");
  // photos A and B are real; box C stays black until a student clicks it to reveal the AI's image
  const show=()=>{ rev=true; figs().forEach((f,i)=>{ f.classList.add("rev"); f.querySelector("figcaption").textContent=f.dataset.ai==="1"?"C · AI-generated":"ABC"[i]+" · real photo"; if(f.dataset.ai==="1") f.classList.add("ai"); }); $("mkIdea").classList.add("on"); $("mkHint").style.visibility="hidden"; };
  figs().forEach(f=>{ if(f.dataset.ai==="1") f.onclick=()=>{ if(!rev) show(); }; });
  A.market={ enter(){ rev=false; $("mkIdea").classList.remove("on"); $("mkHint").style.visibility=""; figs().forEach((f,i)=>{ f.classList.remove("rev","ai"); f.querySelector("figcaption").textContent="ABC"[i]; }); } };
})();

/* ---------- bias in, bias out ---------- */
(() => {
  const cv=$("bsCv"); let gen=[], shown=0, acc=0;
  const sharpen=p=>{ const a=p**3, b=(1-p)**3; return a/(a+b); };
  const run=()=>{ const p=+$("bsMix").value/100, q=sharpen(p); gen=Array.from({length:40},()=>Math.random()<q?1:0); shown=0; acc=0; $("bsGen").textContent=$("bsGenB").textContent="…"; };
  const setTrain=()=>{ const v=+$("bsMix").value; $("bsTrain").textContent=v+"%"; $("bsTrainB").textContent=(100-v)+"%"; };
  $("bsMix").oninput=()=>{ setTrain(); gen=[]; $("bsGen").textContent=$("bsGenB").textContent="–"; };
  $("bsGo").onclick=run;
  function person(x,px,py,col,a=1){ x.globalAlpha=a; x.fillStyle=col; x.beginPath(); x.arc(px,py-12,9,0,7); x.fill(); x.beginPath(); x.moveTo(px-14,py+16); x.quadraticCurveTo(px-14,py,px,py); x.quadraticCurveTo(px+14,py,px+14,py+16); x.closePath(); x.fill(); x.globalAlpha=1; }
  A.biassim={ enter(){ $("bsMix").value=70; setTrain(); run(); },
    tick(dt){ const W=cv.offsetWidth, H=cv.offsetHeight, x=ctxOf(cv); x.clearRect(0,0,W,H);
      const p=+$("bsMix").value/100, nA=Math.round(p*40), cols=10, gx=(W-80)/cols;
      label(x,`TRAINING DATA · ${nA} A · ${40-nA} B`,40,44,MUTE,15);
      for(let i=0;i<40;i++){ const c=i%cols, r=i/cols|0; person(x,40+gx*c+gx/2,80+r*56,i<nA?Y:BLUE); }
      acc+=dt; while(acc>45&&shown<gen.length){ acc-=45; shown++; }
      const sorted=gen.slice(0,shown);
      for(let i=0;i<shown;i++){ const c=i%cols, r=i/cols|0; person(x,40+gx*c+gx/2,H/2+66+r*56,sorted[i]?Y:BLUE,Math.min(1,(shown-i)/3)); }
      const gA=sorted.filter(Boolean).length; label(x,shown?`GENERATED · ${gA} A · ${shown-gA} B`:"GENERATED",40,H/2+30,MUTE,15);
      if(shown===gen.length&&gen.length){ const pa=Math.round(gA/gen.length*100); $("bsGen").textContent=pa+"%"; $("bsGenB").textContent=(100-pa)+"%"; }
      x.strokeStyle=LINE; x.beginPath(); x.moveTo(30,H/2+4); x.lineTo(W-30,H/2+4); x.stroke();
      label(x,"● group A",W-210,44,Y,15); label(x,"● group B",W-110,44,BLUE,15);
    } };
})();

/* ---------- regression: click to add houses ---------- */
(() => {
  const cv=$("rgCv"); let P=[];
  const INIT=[[1300,205],[1450,221],[1500,267],[1600,234],[1660,262],[1720,300],[1800,312],[1880,322],[2010,355],[2200,402]];
  const geo=()=>{ const W=cv.offsetWidth, H=cv.offsetHeight; return {W,H,L:80,T:40,R:W-30,B:H-70}; };
  const toPx=(g,s,p)=>[g.L+(s-1200)/1200*(g.R-g.L), g.B-(p-150)/300*(g.B-g.T)];
  cv.addEventListener("click",e=>{ const g=geo(), [mx,my]=localXY(e,cv);
    const hit=P.findIndex(p=>{ const [a,b]=toPx(g,p[0],p[1]); return Math.hypot(a-mx,b-my)<14; });
    if(hit>=0){ P.splice(hit,1); return; }
    if(mx<g.L||mx>g.R||my<g.T||my>g.B) return;
    P.push([1200+(mx-g.L)/(g.R-g.L)*1200, 150+(g.B-my)/(g.B-g.T)*300]); });
  A.regression={ enter(){ P=INIT.map(p=>p.slice()); },
    tick(){ const g=geo(), x=ctxOf(cv); x.clearRect(0,0,g.W,g.H); axes(x,g.L,g.T,g.R,g.B);
      for(let s=1200;s<=2400;s+=200){ const [a]=toPx(g,s,0); label(x,s,a,g.B+24,MUTE,13,"center"); }
      for(let p=150;p<=450;p+=50){ const [,b]=toPx(g,0,p); label(x,p,g.L-12,b+5,MUTE,13,"right"); }
      label(x,"sq feet (feature) →",g.R,g.B+50,MUTE,15,"right"); label(x,"price, 1k (label)",g.L,g.T-14,MUTE,15);
      const f=fitLine(P);
      if(f){ x.setLineDash([4,5]); x.strokeStyle="rgba(255,90,78,.6)"; x.lineWidth=2;
        for(const p of P){ const [a,b]=toPx(g,p[0],p[1]), [,c]=toPx(g,p[0],f.m*p[0]+f.b); x.beginPath(); x.moveTo(a,b); x.lineTo(a,c); x.stroke(); }
        x.setLineDash([]); x.save(); x.beginPath(); x.rect(g.L,g.T,g.R-g.L,g.B-g.T); x.clip();
        const [a1,b1]=toPx(g,1200,f.m*1200+f.b), [a2,b2]=toPx(g,2400,f.m*2400+f.b); x.strokeStyle=Y; x.lineWidth=4; x.beginPath(); x.moveTo(a1,b1); x.lineTo(a2,b2); x.stroke(); x.restore();
        $("rgCap").textContent=`${P.length} houses · price ≈ ${fmt(f.m,3)} × sq ft ${f.b<0?"−":"+"} ${fmt(Math.abs(f.b),0)} · red = error`;
      } else $("rgCap").textContent="add at least 2 houses";
      for(const p of P){ const [a,b]=toPx(g,p[0],p[1]); dot(x,a,b,8,BLUE); }
    } };
})();

/* ---------- classification ---------- */
(() => {
  const F=[["fins","Has fins"],["feathers","Has feathers"],["fur","Has fur"],["eggs","Lays eggs"]];
  let S={};
  $("clTog").innerHTML=F.map(([k,t])=>`<div class="switch card" data-k="${k}"><span class="lbl">${t}</span><div class="tog"></div></div>`).join("");
  function predict(){
    const sc=[ (S.fins?3:0)+(S.eggs?1:0)-(S.fur?3:0)-(S.feathers?3:0), (S.feathers?4:0)+(S.eggs?1:0)-(S.fur?2:0), (S.fur?4:0)+(S.eggs?0:1)-(S.feathers?3:0)-(S.fins?1:0) ];
    const any=Object.values(S).some(Boolean); const c=any?sc.indexOf(Math.max(...sc)):-1;
    document.querySelectorAll("#clTog .switch").forEach(e=>e.classList.toggle("on",!!S[e.dataset.k]));
    document.querySelectorAll("#clOut .cls").forEach(e=>e.classList.toggle("on",+e.dataset.c===c));
    const nm=["fish","bird","mammal"][c];
    $("clWhy").innerHTML=!any?"Switch on some features.":S.fur&&S.eggs?`Fur <b>and</b> eggs? That’s a platypus: a mammal that lays eggs. Real data has odd cases the model may get wrong.`:S.fins&&S.fur?`Fins and fur… a seal? Edge cases like these are why we need lots of varied training data.`:`Model output: <b class="y">${c}</b> → ${nm}. The number is the encoded label.`;
  }
  $("clTog").onclick=e=>{ const s=e.target.closest(".switch"); if(!s) return; S[s.dataset.k]=!S[s.dataset.k]; predict(); };
  A.classification={ enter(){ S={fins:true,eggs:true}; predict(); } };
})();

/* ---------- unsupervised: k-means ---------- */
(() => {
  const cv=$("usCv"); let P=[], Cn=[], iter=0, running=false, acc=0, done=false, seed=5;
  const COL=[Y,BLUE,GREEN];
  function data(){ const r=srand(seed++); const ctr=[[.25,.3],[.72,.28],[.5,.75]].map(c=>[c[0]+(r()-.5)*.12,c[1]+(r()-.5)*.12]); P=[];
    ctr.forEach(c=>{ for(let i=0;i<34;i++) P.push({x:clamp(c[0]+gauss(r)*.08,.03,.97),y:clamp(c[1]+gauss(r)*.08,.03,.97),k:-1}); }); Cn=[]; iter=0; running=false; done=false; $("usCap").textContent="k-means: unlabeled points"; $("usRun").textContent="Find 3 clusters ▶"; }
  function stepK(){
    if(!Cn.length){ Cn=[0,1,2].map(()=>{ const p=pick(P); return {x:p.x,y:p.y,tx:p.x,ty:p.y}; }); iter=0; $("usCap").textContent="step 0: drop 3 random centers"; return; }
    let moved=false;
    P.forEach(p=>{ let b=0,bd=1e9; Cn.forEach((c,i)=>{ const d=(p.x-c.tx)**2+(p.y-c.ty)**2; if(d<bd){ bd=d; b=i; } }); if(p.k!==b){ p.k=b; moved=true; } });
    Cn.forEach((c,i)=>{ const m=P.filter(p=>p.k===i); if(m.length){ c.tx=m.reduce((s,p)=>s+p.x,0)/m.length; c.ty=m.reduce((s,p)=>s+p.y,0)/m.length; } });
    iter++; $("usCap").textContent=`step ${iter}: color each point by nearest center, move centers to the middle`;
    if(!moved&&iter>1){ done=true; running=false; $("usCap").textContent=`converged after ${iter} steps: 3 groups found with no labels`; $("usRun").textContent="Run again ▶"; }
  }
  $("usRun").onclick=()=>{ if(done){ Cn=[]; P.forEach(p=>p.k=-1); done=false; } running=true; acc=600; };
  $("usNew").onclick=data;
  data();
  A.unsupervised={ enter(){ seed=5; data(); }, step(){ if(!running&&!done){ running=true; acc=600; return true; } return false; },
    tick(dt){ if(running){ acc+=dt; if(acc>700){ acc=0; stepK(); } }
      const W=cv.offsetWidth, H=cv.offsetHeight, x=ctxOf(cv), m=40; x.clearRect(0,0,W,H);
      for(const p of P) dot(x,m+p.x*(W-2*m),m+p.y*(H-2*m),7,p.k<0?"#77746d":COL[p.k]);
      Cn.forEach((c,i)=>{ c.x=lerp(c.x,c.tx,.15); c.y=lerp(c.y,c.ty,.15); const px=m+c.x*(W-2*m), py=m+c.y*(H-2*m);
        x.strokeStyle=COL[i]; x.lineWidth=4; x.beginPath(); x.moveTo(px-12,py-12); x.lineTo(px+12,py+12); x.moveTo(px+12,py-12); x.lineTo(px-12,py+12); x.stroke(); dot(x,px,py,18,null,COL[i]); });
    } };
})();

/* ---------- train / test split ---------- */
(() => {
  const cv=$("spCv"); let D=[];
  const r=srand(8); const ORDER=Array.from({length:100},(_,i)=>i).sort(()=>r()-.5);
  const upd=()=>{ const t=+$("spT").value; $("spTr").textContent=100-t; $("spTe").textContent=t; };
  $("spT").oninput=upd;
  A.split={ enter(){ D=Array.from({length:100},(_,i)=>({x:0,y:0,init:true})); upd(); },
    tick(){ const W=cv.offsetWidth, H=cv.offsetHeight, x=ctxOf(cv); x.clearRect(0,0,W,H);
      const t=+$("spT").value, test=new Set(ORDER.slice(0,t));
      const bw=(W-90)/2, bx=[[30,70,bw,H-110],[60+bw,70,bw,H-110]];
      [["TRAINING",GREEN],["TESTING",BLUE]].forEach(([n,c],i)=>{ const [a,b,w,h]=bx[i]; x.strokeStyle=c; x.globalAlpha=.5; x.lineWidth=2; x.setLineDash([8,6]); x.strokeRect(a,b,w,h); x.setLineDash([]); x.globalAlpha=1; label(x,n,a,b-16,c,16); });
      label(x,`${100-t} rows → the model learns from these`,30,H-16,GREEN,15); label(x,`${t} rows, hidden until the end`,bx[1][0],H-16,BLUE,15);
      let ti=0, ri=0;
      D.forEach((d,i)=>{ const isT=test.has(i); let tx,ty;
        if(isT){ const cols=Math.max(1,Math.floor((bx[1][2]-20)/30)); tx=bx[1][0]+24+(ti%cols)*30; ty=bx[1][1]+26+(ti/cols|0)*30; ti++; }
        else { const cols=Math.floor((bx[0][2]-20)/30); tx=bx[0][0]+24+(ri%cols)*30; ty=bx[0][1]+26+(ri/cols|0)*30; ri++; }
        if(d.init){ d.x=tx; d.y=ty; d.init=false; } d.x=lerp(d.x,tx,.12); d.y=lerp(d.y,ty,.12); dot(x,d.x,d.y,10,isT?BLUE:GREEN); });
    } };
})();

/* ---------- random_state ---------- */
(() => {
  let seed="42", runs=[];
  function split(){ const r=seed==="none"?Math.random:srand(+seed*2654435761); const idx=Array.from({length:10},(_,i)=>i+1);
    for(let i=idx.length-1;i>0;i--){ const j=Math.floor(r()*(i+1)); [idx[i],idx[j]]=[idx[j],idx[i]]; } return idx.slice(0,3).sort((a,b)=>a-b); }
  function run(){ const t=split(); const prev=runs[0]; const same=prev&&prev.seed===seed&&prev.t.join()===t.join(); runs.unshift({seed,t,same}); runs=runs.slice(0,4);
    $("sdRow").innerHTML=Array.from({length:10},(_,i)=>`<div class="${t.includes(i+1)?"te":"tr"}">${i+1}</div>`).join("");
    $("sdLog").innerHTML=runs.map((r,i)=>`<div>${i===0?"<b>":""}random_state=${r.seed==="none"?"None":r.seed} → test rows [${r.t.join(", ")}]${i===0?"</b>":""} ${r.same?'<span style="color:var(--green)">same as last run ✓</span>':""}</div>`).join(""); }
  tabs($("sdTabs"),k=>{ seed=k; $("sdCode").textContent=k==="none"?"None":k; run(); });
  $("sdRun").onclick=run;
  A.seed={ enter(){ runs=[]; run(); } };
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
let sx=null; stage.addEventListener("touchstart",e=>{ if(e.target.closest("input,button,.switch,.chipx,.bin,.tchip,svg,canvas,table")) return; sx=e.touches[0].clientX; },{passive:true});
stage.addEventListener("touchend",e=>{ if(sx===null) return; const dx=e.changedTouches[0].clientX-sx; if(Math.abs(dx)>60) (dx<0?advance:retreat)(); sx=null; });
addEventListener("resize",fitStage);
fitStage(); fromHash(); claudeAdapter();
let last=performance.now();
function loop(now){ const dt=Math.min(100,now-last); last=now; const s=slides[cur], a=s&&A[s.dataset.id]; if(a&&a.tick){ try{ a.tick(dt,now); }catch(err){ console.error(err); } } requestAnimationFrame(loop); }
requestAnimationFrame(loop);
})();
