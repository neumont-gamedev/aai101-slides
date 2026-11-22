// run a scripted interaction on one slide and take screenshots along the way.
// usage: node src/tools/play.mjs <url> <outDir> action action ...
// actions (run in order):
//   wait=1500          wait 1.5 s
//   shot=name          screenshot to <outDir>/NN_name.jpg
//   click=#id          click an element (any CSS selector)
//   key=ArrowRight     press a key
//   js=<code>          run JavaScript in the page (only the first "=" splits, so code may contain "=")
// e.g. node src/tools/play.mjs "http://localhost:8765/my-deck/#s2" ../shots shot=start click=#fire wait=4000 shot=after
import { open, sleep } from "./cdp.mjs";
const [, , url, outDir, ...acts] = process.argv;
if (!url || !outDir) { console.log("usage: node play.mjs <url> <outDir> action ..."); process.exit(1); }
const b = await open(url);
let n = 0;
for (const a of acts) {
  const i = a.indexOf("="), k = a.slice(0, i), v = a.slice(i + 1);
  if (k === "wait") await sleep(+v);
  else if (k === "shot") await b.shot(`${outDir}/${String(n++).padStart(2, "0")}_${v}.jpg`);
  else if (k === "click") { const ok = await b.ev(`(()=>{const e=document.querySelector(${JSON.stringify(v)});if(!e)return false;e.click();return true;})()`); if (!ok) console.log("not found:", v); }
  else if (k === "key") await b.key(v);
  else if (k === "js") console.log(await b.ev(v) ?? "");
  else console.log("unknown action:", a);
}
console.log("ERRORS:", b.errors.length ? "\n" + b.errors.join("\n") : "none");
b.close(); process.exit(b.errors.length ? 1 : 0);
