// layout-shift check: on every slide with buttons or sliders, click each button and push each slider to both ends,
// then report any panel, heading, button or canvas that moved. (A slide passes when nothing jumps as text changes.)
// usage: node src/tools/shift.mjs <deck url without #> [fromSlide=1] [toSlide=last]
//   e.g. node src/tools/shift.mjs http://localhost:8765/my-deck/index.html
import { open, sleep } from "./cdp.mjs";
const [, , base, from = "1", to] = process.argv;
if (!base) { console.log("usage: node shift.mjs <deck url> [from] [to]"); process.exit(1); }
const b = await open(base + "#s" + from);
const last = +(to || (await b.ev("document.querySelectorAll('.slide').length")));
const SNAP = `(()=>{const s=document.querySelector('.slide.active'),o={};
 s.querySelectorAll('.card,.stage-box,canvas,svg,button,input,h2,p,.callout,.stack>*,.two>*').forEach((e,i)=>{
  if(e.closest('.keyIdea')||(e.closest('svg')&&e.tagName!=='svg')) return;
  const r=e.getBoundingClientRect(); o[i+':'+e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+(typeof e.className==='string'&&e.className.trim()?'.'+e.className.trim().split(/\\s+/).join('.'):'')]=[r.left,r.top].map(Math.round);});
 return o;})()`;
const CTRLS = `[...document.querySelector('.slide.active').querySelectorAll('button,input[type=range]')].map(e=>e.tagName==='BUTTON'?'b':'r')`;
const act = (i, js) => b.ev(`(()=>{const e=[...document.querySelector('.slide.active').querySelectorAll('button,input[type=range]')][${i}];if(!e)return;${js}})()`);
let bad = 0;
for (let n = +from; n <= last; n++) {
  await b.ev(`location.hash='#s${n}'`); await sleep(1800);
  const sid = await b.ev(`document.querySelector('.slide.active').dataset.id`);
  const b0 = await b.ev(SNAP), cs = await b.ev(CTRLS), moved = new Set();
  const cmp = async what => { const s = await b.ev(SNAP);
    for (const k in b0) if (s[k] && (Math.abs(b0[k][0] - s[k][0]) > 1 || Math.abs(b0[k][1] - s[k][1]) > 1))
      moved.add(`${k} moved (${s[k][0] - b0[k][0]},${s[k][1] - b0[k][1]}) after ${what}`); };
  for (let i = 0; i < cs.length; i++) {
    if (cs[i] === "b") { await act(i, "if(!e.disabled&&getComputedStyle(e).pointerEvents!=='none')e.click()"); await sleep(1200); await cmp(`click ${i}`); await sleep(2500); await cmp(`click ${i} (later)`); }
    else for (const end of ["min", "max"]) { await act(i, `e.value=e.${end};e.dispatchEvent(new Event('input',{bubbles:true}))`); await sleep(400); await cmp(`slider ${i} ${end}`); }
  }
  if (cs.length) { console.log(`s${n} ${sid}: ${moved.size ? "\n  " + [...moved].slice(0, 12).join("\n  ") : "ok"}`); if (moved.size) bad++; }
}
console.log("ERRORS:", b.errors.length ? "\n" + b.errors.join("\n") : "none");
console.log(bad ? `${bad} slide(s) with moving parts` : "no layout shifts");
b.close(); process.exit(b.errors.length || bad ? 1 : 0);
