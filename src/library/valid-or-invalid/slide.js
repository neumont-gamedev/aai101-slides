/* ---------- 4 valid or invalid? ---------- */
(() => {
  // [a]=yellow term, [b]=blue, [c]=green, so students can see each argument's shape
  const Q=[
    {p:["All [a:humans] are [b:mortal].","[c:Socrates] is [a:a human]."], c:"[c:Socrates] is [b:mortal].", valid:true,
     form:"All A are B · C is A · ∴ C is B", why:"The classic. If every human is mortal and Socrates is human, there’s no way out."},
    {p:["All [a:cats] are [b:mammals].","[c:Rex] is [b:a mammal]."], c:"[c:Rex] is [a:a cat].", valid:false, trap:true,
     form:"All A are B · C is B · ∴ C is A", why:"Rex could be a dog. Lots of things are mammals without being cats."},
    {p:["All [a:cats] are [b:robots].","[c:Tom] is [a:a cat]."], c:"[c:Tom] is [b:a robot].", valid:true, falsePremise:true,
     form:"All A are B · C is A · ∴ C is B", why:"Silly, but valid! The form is perfect. The first premise is just false, so the conclusion isn’t guaranteed to be true."},
    {p:["All [a:squares] are [b:rectangles].","[c:This tile] is [b:a rectangle]."], c:"[c:This tile] is [a:a square].", valid:false, trap:true,
     form:"All A are B · C is B · ∴ C is A", why:"Same trap. The tile could be a long, skinny rectangle."},
    {p:["No [a:fish] can [b:fly].","[c:A salmon] is [a:a fish]."], c:"[c:A salmon] can’t [b:fly].", valid:true,
     form:"No A are B · C is A · ∴ C is not B", why:"A different valid pattern. If no fish fly, then no particular fish flies."},
    {p:["Some [a:students] are [b:athletes].","Some [b:athletes] are [c:tall]."], c:"Some [a:students] are [c:tall].", valid:false,
     form:"Some A are B · Some B are C · ∴ Some A are C", why:"Tricky! The athletes who are students might not be the tall ones. “Some” doesn’t link the groups."},
  ];
  const fmt=t=>t.replace(/\[(a|b|c):([^\]]+)\]/g,(_,k,w)=>`<span class="term t${k.toUpperCase()} flip">${w}</span>`);
  let i=0, picks=[], trapSeen=false;
  const act=$("vqAct"), trap=$("vqTrap");
  function header(){
    $("vqNum").textContent=`Argument ${Math.min(i+1,Q.length)} of ${Q.length}`;
    $("vqDots").innerHTML=Q.map((_,k)=>`<i class="${k<picks.length?(picks[k]?"ok":"no"):k===i?"on":""}"></i>`).join("");
    $("vqScore").textContent=`score ${picks.filter(Boolean).length} / ${picks.length}`;
    trap.classList.toggle("locked",!trapSeen);
  }
  function ask(){
    const q=Q[i];
    $("vq1").innerHTML=fmt(q.p[0]); $("vq2").innerHTML=fmt(q.p[1]); $("vq3").innerHTML=fmt(q.c);
    act.innerHTML=`<div class="vqBtns"><button class="btn b-yes" data-v="1">✓ Valid</button><button class="btn b-no" data-v="0">✗ Invalid</button></div><div class="muted" style="font-size:18px">Does the conclusion <i>have</i> to be true if both premises are true?</div>`;
    act.querySelectorAll("[data-v]").forEach(b=>b.onclick=()=>answer(b.dataset.v==="1"));
    header();
  }
  function answer(v){
    const q=Q[i], right=v===q.valid; picks.push(right);
    const fresh=q.trap&&!trapSeen; if(q.trap) trapSeen=true;
    trap.classList.remove("fresh"); if(fresh){ void trap.offsetWidth; trap.classList.add("fresh"); }
    const verdict=q.valid?`<span class="tag t-green">VALID</span>`:`<span class="tag t-red">INVALID</span>`;
    const extra=q.falsePremise?`<span class="tag t-y">but a premise is false</span>`:"";
    const last=i===Q.length-1;
    act.innerHTML=`<div class="vqFb"><div class="top"><span class="tag ${right?"t-green":"t-red"}">${right?"✓ Correct":"✗ Not quite"}</span>It’s ${verdict}${extra}</div>
      <div class="fm">${q.form}${q.trap?` <span style="color:var(--red)">← the trap</span>`:""}</div><div class="why">${q.why}</div>
      <div><button class="btn on" id="vqNext">${last?"See your score":"Next argument →"}</button></div></div>`;
    $("vqNext").onclick=()=>{ i++; if(i<Q.length) ask(); else finish(); };
    header();
  }
  function finish(){
    const n=picks.filter(Boolean).length;
    $("vq1").innerHTML="Every valid argument here has a form a machine can check.";
    $("vq2").innerHTML="No understanding of cats, fish or students needed.";
    $("vq3").innerHTML=fmt("That’s why logic was the first step toward [a:AI].");
    act.innerHTML=`<div class="vqFb"><div class="top"><span class="tag t-y">You got ${n} of ${Q.length}</span>${n===Q.length?"Perfect logician!":n>=4?"Nice reasoning!":"The trap gets almost everyone."}</div>
      <div><button class="btn" id="vqAgain">Play again ↺</button></div></div>`;
    $("vqAgain").onclick=reset;
    header(); $("vqNum").textContent="Done";
  }
  function reset(){ i=0; picks=[]; trapSeen=false; trap.classList.remove("fresh"); ask(); }
  A.form={ enter(){ if(!picks.length) reset(); else header(); } };
  reset();
})();

