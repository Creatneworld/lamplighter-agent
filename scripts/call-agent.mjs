// Runs one live visit against the registered agent and stores the raw response.
//   POLLI_KEY=sk_... node scripts/call-agent.mjs "tell it about your day" run5
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const KEY = process.env.POLLI_KEY;
const MODEL = process.env.MODEL || "Creatneworld/lamplighter";
const API = "https://gen.pollinations.ai/v1/chat/completions";

const userMessage = process.argv[2];
const outName = process.argv[3] || "run";

if (!KEY) {
    console.error("Set POLLI_KEY first, e.g. POLLI_KEY=sk_... node scripts/call-agent.mjs \"...\" run5");
    process.exit(1);
}
if (!userMessage) {
    console.error('usage: node scripts/call-agent.mjs "<user message>" [out-name]');
    process.exit(1);
}

const started = Date.now();
const resp = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + KEY },
    body: JSON.stringify({ model: MODEL, messages: [{ role: "user", content: userMessage }] }),
});
const text = await resp.text();
const seconds = ((Date.now() - started) / 1000).toFixed(1);

mkdirSync("examples/raw", { recursive: true });
writeFileSync(join("examples/raw", `${outName}.raw.json`), text, "utf8");

let parsed = null;
try {
    parsed = JSON.parse(text);
} catch {}

console.log(`status=${resp.status} ${seconds}s`);
if (parsed?.choices?.[0]) {
    console.log("--- reply ---");
    console.log(parsed.choices[0].message.content || "(empty)");
    console.log("--- usage ---");
    console.log(JSON.stringify(parsed.usage || {}));
} else {
    console.log(text.slice(0, 1500));
}
