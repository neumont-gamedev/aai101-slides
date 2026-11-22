// step through a deck with → (or ←), screenshot every press, report script errors.
// usage: node src/tools/shoot.mjs <url> <outDir> [maxPresses=200] [fwd|back]
//   e.g. node src/tools/shoot.mjs http://localhost:8765/my-deck/#s1 ../shots
// back mode starts wherever the url's #sN points and doesn't take screenshots.
import { open, sleep } from "./cdp.mjs";
const [, , url, outDir, maxPress = "200", mode = "fwd"] = process.argv;
if (!url || !outDir) { console.log("usage: node shoot.mjs <url> <outDir> [maxPresses] [fwd|back]"); process.exit(1); }
const b = await open(url), log = [];
let same = 0, prev = "";
for (let p = 0; p < +maxPress; p++) {
  await sleep(1300);
  const c = await b.ev("document.getElementById('count').textContent");
  if (mode === "fwd") await b.shot(`${outDir}/${String(p).padStart(3, "0")}_${c.split(" / ")[0]}.jpg`);
  log.push(`${p}: ${c}`);
  const [at, of] = c.split(" / ");
  same = c === prev ? same + 1 : 0; prev = c;
  if (same >= 3 && (mode === "fwd" ? at === of : at === "1")) break;   // stuck at the end
  await b.key(mode === "fwd" ? "ArrowRight" : "ArrowLeft");
}
console.log(log.join("\n"));
console.log("ERRORS:", b.errors.length ? "\n" + b.errors.join("\n") : "none");
b.close(); process.exit(b.errors.length ? 1 : 0);
