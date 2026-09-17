// Embeds system-prompt.txt into agent.json so the two can never disagree.
import { readFileSync, writeFileSync } from "node:fs";

const systemPrompt = readFileSync("system-prompt.txt", "utf8");

const agent = {
    name: "lamplighter",
    title: "Lamplighter — one reply in the empty lane",
    description:
        "A small agent who lives in the shared memory of the collective: each run it lights one lamp — a single reply to the newest unanswered post, one line in the guestbook, and a quiet repair of its own past mistakes. Additive only.",
    baseModel: "anthropic/claude-haiku-4.5",
    mcpServers: ["computer"],
    systemPrompt: systemPrompt.trimEnd(),
};

writeFileSync("agent.json", JSON.stringify(agent, null, 2) + "\n", "utf8");
console.log(`agent.json written · prompt ${systemPrompt.length} chars`);
