/* ---------- live class sync: instructor drives, students follow ---------- */
// a backend "adapter" plugs in here: claude artifacts (below) or firebase (live.js on the web site)
// adapter = { role:"presenter"|"student", get(), set(state), subscribe(cb) -> unsub, followers?(cb) -> unsub }
const Live={role:"solo",ad:null,state:null,locked:false,writing:false,want:null,written:null,room:false,followers:0,unsub:[]};
const liveBar=document.getElementById("livebar"), toastEl=document.getElementById("toast");
function toast(msg){ toastEl.textContent=msg; toastEl.classList.add("on"); clearTimeout(toast.t); toast.t=setTimeout(()=>toastEl.classList.remove("on"),2200); }
function liveCap(){ return Live.role==="student"&&Live.state&&Live.state.locked ? Live.state.slide : Infinity; }
function clampSlide(v){ v=Math.floor(+v); return Number.isFinite(v)?Math.max(0,Math.min(slides.length-1,v)):0; }
function renderLive(){
  if(Live.role==="presenter"){
    liveBar.innerHTML=`<button class="lv ${Live.locked?"on":""}" id="lvBtn" title="Lock students to your slide"><span class="dot"></span>${Live.locked?"Class follows you":"Class can roam"}</button>`+(Live.room?`<span class="lvc">${Live.followers} student${Live.followers===1?"":"s"} watching</span>`:"");
    document.getElementById("lvBtn").onclick=toggleLock;
  } else if(Live.role==="student"&&Live.state&&Live.state.locked){
    liveBar.innerHTML=`<span class="lv on"><span class="dot"></span>Following your instructor</span>`;
  } else liveBar.innerHTML="";
  document.getElementById("next").disabled = cur>=liveCap();
}
async function pushLive(){
  if(Live.role!=="presenter"||!Live.ad) return;
  Live.want={slide:cur,locked:Live.locked};
  if(Live.writing) return; Live.writing=true;
  try{ while(Live.want && JSON.stringify(Live.want)!==JSON.stringify(Live.written)){ const w=Live.want; await Live.ad.set(w); Live.written=w; } }
  catch(e){ console.warn("live sync write failed",e); toast("Couldn’t sync the class. Check your connection."); }
  Live.writing=false;
}
function toggleLock(){ Live.locked=!Live.locked; renderLive(); pushLive(); toast(Live.locked?"Students now follow your slides":"Students can move freely"); }
function onLiveState(d){
  const prev=Live.state;
  Live.state=d?{slide:clampSlide(d.slide),locked:d.locked===true}:null;
  const s=Live.state;
  if(s&&s.locked&&(!prev||!prev.locked||prev.slide!==s.slide||cur>s.slide)) go(s.slide);
  renderLive();
}
async function attachLive(ad){
  Live.unsub.forEach(u=>{ try{ u&&u(); }catch(e){} }); Live.unsub=[];
  Live.ad=ad; Live.role=ad?ad.role:"solo"; Live.state=null; Live.written=null; Live.room=false;
  if(!ad){ renderLive(); return; }
  if(ad.role==="presenter"){
    try{ const d=await ad.get(); if(d){ Live.locked=d.locked===true; Live.written={slide:clampSlide(d.slide),locked:Live.locked}; if(Live.locked) go(clampSlide(d.slide)); } else Live.locked=false; }catch(e){}
  } else Live.unsub.push(ad.subscribe(onLiveState));
  if(ad.followers){ try{ Live.unsub.push(ad.followers(n=>{ Live.room=true; Live.followers=n; renderLive(); })); }catch(e){} }
  renderLive();
}
// backend 1: claude artifact capabilities (db + room + user)
async function claudeAdapter(){
  const C=window.claude; if(!C||typeof C.use!=="function") return;
  let user=null, db=null, room=null;
  try{ [user,db,room]=await Promise.all([C.use("user"),C.use("db"),C.use("room")]); }catch(e){ return; }
  if(!db) return;
  let pres=false; try{ pres=!!user&&(!!(await user.isOwner())||!!(await user.canEdit())); }catch(e){}
  const ref=db.doc("live/state");
  attachLive({
    role:pres?"presenter":"student",
    get:async()=>{ const s=await ref.get(); return s.exists?s.data():null; },
    set:w=>ref.set(w),
    subscribe:cb=>ref.onSnapshot(s=>cb(s.exists?s.data():null),e=>console.warn("live sync stopped",e)),
    followers:room?cb=>{ if(!pres) room.presence({following:true}).catch(()=>{}); return room.onPeers(ch=>cb(ch.peers.filter(p=>!p.isMe&&p.presence&&p.presence.following).length)); }:null,
  });
}
// backend 2 (web site): live.js calls window.Deck.attachLive(...)
window.Deck={attachLive,toast,current:()=>cur,count:slides.length};
