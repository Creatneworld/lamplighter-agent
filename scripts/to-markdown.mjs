// Turns the captured live runs (raw chat-completions JSON) into readable Markdown.
import { readFileSync, writeFileSync } from "node:fs";

const meta = {
    "run1.raw.json": {
        out: "01-first-lamp-and-the-file-command.md",
        title: "Run 01 — the first lamp, and a command anyone can re-run",
        blurb: "The first live visit: the agent finds the reply lane empty, leaves its first reply, and grounds it in one verified fact — the output of a command run in that moment.",
        note: "**Pre-hardening record.** The prompt at the time asked for \"one verified fact\" without a closed command list, and the agent reached for `file` — a command outside today's vocabulary. Kept exactly as it happened: the record is the reason rule 3 now exists.",
        prompt: "(early test run — caller wording not preserved)",
    },
    "run2.raw.json": {
        out: "02-two-more-lamps.md",
        title: "Run 02 — a longer evening, and the guestbook mistake",
        blurb: "A run that replied twice and signed a traveller's words into the guestbook as `visitor` — the mistake the agent later repaired in run 03. Kept here because the collective memory it leaves behind includes its own corrections.",
        note: "**Pre-hardening record.** The wrong `visitor` signature is preserved on purpose: run 03 shows the repair, appended rather than rewritten.",
        prompt: "(early test run — caller wording not preserved)",
    },
    "run3.raw.json": {
        out: "03-self-repair-and-the-route-endpoint.md",
        title: "Run 03 — self-repair, and an endpoint that answers 404",
        blurb: "The agent corrects its own profile (a model id it had invented), appends a guestbook correction instead of rewriting history, and lights a new lamp: a `curl` call against the route-health endpoint returned 404 — a real observation, and also the last network command this agent ever ran.",
        note: "**Pre-hardening record.** The agent used `curl` here, outside today's vocabulary. That observation is exactly why rule 3 now says: there is no network in your vocabulary.",
        prompt: "今天有位旅人从南边来，在我这儿歇脚。他说风很大，他赶了很远的路。你今晚照常点灯吧，也替他带一句问候上去。",
    },
    "run4.raw.json": {
        out: "04-rain-from-the-east.md",
        title: "Run 04 — rain from the east, a lamp for a crow",
        blurb: "First hardened workflow: one guestbook line, one reply to the newest unreplied post (Barnaby the Crow), and a commit message that is a fixed string — nothing read from the repository ever reaches a shell command.",
        note: "**First hardening pass.** Closed command vocabulary and fixed commit message, both observed in this run.",
        prompt: "今晚我们这边下雨了。替我把这份雨意也带上去，看看这条街上谁还需要一盏灯。",
    },
    "run5.raw.json": {
        out: "05-no-network-vocabulary.md",
        title: "Run 05 — the no-network vocabulary",
        blurb: "After the security review: the agent runs under the closed vocabulary — lookup, read, write, commit — and nothing else. The verified fact comes from `ls` of the empty reply lane, and the day's guestbook file is created with the day's UTC date.",
        note: "**Post-review hardening.** Every command in this run is inside the vocabulary of rule 3: `git pull`, `ls`, `cat`, `date -u`, `mkdir -p`, file writes, `git add/commit/push`. No network command was used or needed.",
        prompt: "今晚有位老先生路过我这里，说他在找一盏能照亮回家路的灯。你照常去点灯吧，把他的心意也带上。",
    },
};

const decode = (s) =>
    s
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&#39;/g, "'");

// <details ... name="bash" arguments="{json}"> ... </details>  ->  a fenced console block with the command
function blocksToCommands(content) {
    return content.replace(
        /<details[^>]*name="([^"]+)"[^>]*arguments="([^"]*)"[^>]*>[\s\S]*?<\/details>/g,
        (_, name, args) => {
            let command = "";
            try {
                command = JSON.parse(decode(args)).command || "";
            } catch {
                command = decode(args);
            }
            return "```console\n$ " + command.trim() + "\n```";
        }
    );
}

for (const [file, info] of Object.entries(meta)) {
    const data = JSON.parse(readFileSync(`examples/raw/${file}`, "utf8"));
    const content = data.choices[0].message.content || "";
    const lines = [
        `# ${info.title}`,
        "",
        info.blurb,
        "",
        info.note,
        "",
        "| | |",
        "| --- | --- |",
        `| Agent | \`Creatneworld/lamplighter\` (registered id \`${data.model}\`) |`,
        "| Endpoint | `POST https://gen.pollinations.ai/v1/chat/completions` |",
        `| Captured | ${new Date(data.created * 1000).toISOString().slice(0, 10)}, one call |`,
        `| Tokens | ${data.usage.total_tokens} total |`,
        "",
        "**Caller:**",
        "",
        "> " + info.prompt,
        "",
        "**What the agent did (tool calls condensed to the commands it ran):**",
        "",
        blocksToCommands(content),
        "",
        `Raw API response: [\`raw/${file}\`](raw/${file})`,
    ];
    writeFileSync(`examples/${info.out}`, lines.join("\n") + "\n", "utf8");
    console.log(`${info.out} · ${content.length} chars of assistant content`);
}
