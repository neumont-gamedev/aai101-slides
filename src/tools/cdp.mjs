// tiny headless-Chrome driver (Chrome DevTools Protocol) shared by the test tools. needs node 22+ (built-in WebSocket).
// set CHROME=<path to chrome> if Chrome isn't in a standard place.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const CHROME = process.env.CHROME || [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
].find(p => fs.existsSync(p));

export const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function open(url) {
  if (!CHROME) throw new Error("Chrome not found: set CHROME=<path to chrome>");
  const port = 9300 + Math.floor(Math.random() * 600);
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), "slides-chrome-"));
  const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${port}`, "--window-size=1600,900",
    "--hide-scrollbars", "--force-device-scale-factor=1", `--user-data-dir=${prof}`, "about:blank"], { stdio: "ignore" });
  let page;
  for (let i = 0; i < 75 && !page; i++) {
    try { page = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === "page"); } catch {}
    if (!page) await sleep(200);
  }
  if (!page) { chrome.kill(); throw new Error("Chrome didn't start"); }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 0; const pending = new Map(), errors = [];
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errors.push("console.error: " + m.params.args.map(a => a.value ?? a.description).join(" "));
  };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send("Runtime.enable"); await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(2500);
  const ev = async expr => (await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true })).result.result?.value;
  const shot = async file => { const r = await send("Page.captureScreenshot", { format: "jpeg", quality: 75 }); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, Buffer.from(r.result.data, "base64")); };
  const key = async k => { const code = { ArrowRight: 39, ArrowLeft: 37 }[k] || 0;
    for (const type of ["keyDown", "keyUp"]) await send("Input.dispatchKeyEvent", { type, key: k, code: k, windowsVirtualKeyCode: code }); };
  const close = () => { ws.close(); chrome.kill(); setTimeout(() => { try { fs.rmSync(prof, { recursive: true, force: true }); } catch {} }, 500); };
  return { send, ev, shot, key, errors, close };
}
