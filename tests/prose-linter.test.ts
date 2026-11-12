import { lint, prepForLint } from "../extensions/prose-linter.ts";

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
	if (!ok) failures++;
	console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
}

const rules = (f) => f.map(x => x.rule.split(" ")[0] + ":" + x.rule.split(" ")[1]);

// --- Slop sample: paper's own examples -------------------------------------
const slop = `She knew the answer was wrong, and honestly the part most internet advice glosses over is the config. He spoke slowly so we could follow along. So yes — calendar it. We can roadmap it tomorrow and footnote it today, since the vendor said they'd migrate eventually. You've basically installed a horror movie soundtrack generator in your skull, and the parser config file format handles it. The docstring promises they're skipped sometimes when they appear anywhere in the source path. Sometimes chaos expects you to remember that. It's not just a missing flag, but a design flaw — the test suite was verified red against the original source.`;

const f = lint(slop);
const r = rules(f);
console.log("slop findings:", r.join(", "));
check("slop: finds missing-that (knew the answer was)", r.includes("34:missing-that"), r.join(","));
check("slop: finds denominal verbs (calendar/roadmap/footnote it)", r.includes("35:denominal-verb"));
check("slop: finds noun stacks (soundtrack generator, config file format)", r.includes("36:noun-stack"));
check("slop: finds animate subject (docstring promises / chaos expects)", r.includes("37:animate-subject"));
check("slop: finds reduced so-that (so we could)", r.includes("34:missing-that"));
check("slop: finds not-just-but", r.includes("9:not-just-but"));
check("slop: finds em dashes", r.includes("13:em-dash"));
check("slop: >=6 findings total", f.length >= 6, `got ${f.length}`);

// --- Clean sample -----------------------------------------------------------
const clean = `The parser rejects a bad date, exits with code 2, and writes nothing. If the date is valid, the loader stores the row and the API returns 200. We knew that the bug was in the date handling, so that path now has tests. She knew that the answer was wrong, and she fixed it before lunch.`;
const fc = lint(clean);
check("clean: <=1 findings", fc.length <= 1, rules(fc).join(","));

// --- Code fences are ignored ------------------------------------------------
const withCode = "x\n```js\n// delve tapestry pivotal: the parser config file format\ncalendar it\n```\n" + "y".repeat(220);
check("code fence: no findings from fenced code", lint(withCode).every(x => x.rule !== "36:noun-stack" && x.rule !== "35:denominal-verb"));

// --- Reduced ORC density ----------------------------------------------------
const orcHeavy = `The book he wrote arrived late. The song she sang was quiet. The house they built still stands. The code we shipped works. The name he'd never hear anyone use was Alden.`;
const fo = lint(orcHeavy);
check("orc density: flags >=4 reduced relatives", fo.some(x => x.rule === "34 reduced-relatives"), rules(fo).join(","));

// --- Person subjects exempt -------------------------------------------------
const human = "Sam expects the report tomorrow. The developer knows the parser fails on empty files. You know that feeling when a test flakes.";
check("person subjects: no animate-subject findings", !lint(human).some(x => x.rule === "37:animate-subject"), rules(lint(human)).join(","));

// --- Long sentence ----------------------------------------------------------
const longSentence = "The " + "very ".repeat(0) + "system reads the configuration file on startup, parses every field it finds, validates the values against the schema, stores the results in memory, starts the worker pool, connects to the database, registers the signal handlers, opens the metrics endpoint, and then finally reports that it is ready to serve traffic to anyone who asks for it, which takes a while.";
check("long sentence: flags >45 words", lint(longSentence).some(x => x.rule === "39 long-dependency"));

// --- prepForLint strips code -------------------------------------------------
check("prep: strips fences and inline code", !/delve|cache/.test(prepForLint("a `cache` b\n```\ndelve\n```")));

// --- System prompt stays condensed -------------------------------------------
import { statSync } from "node:fs";
const skillPath = new URL("../skills/writing/SKILL.md", import.meta.url).pathname;
const sysPath = new URL("../skills/writing/SYSTEM_PROMPT.md", import.meta.url).pathname;
const skillBytes = statSync(skillPath).size;
const sysBytes = statSync(sysPath).size;
check("SYSTEM_PROMPT.md exists and stays condensed (<4KB; full skill is 9.5KB)", sysBytes > 500 && sysBytes < 4000, `${sysBytes}B vs full ${skillBytes}B`);

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
