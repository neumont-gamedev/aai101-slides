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

