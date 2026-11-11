// Prose linter: flags constructions that make AI text hard to read and easy
// to distinguish from human writing, per Clark, Martin & Mahowald (2026),
// "Why is AI-generated language so hard to understand?" (arXiv:2610.29162).
// Post-trained models over-use compressed constructions (dropped complementizer
// "that", denominal verb coinages, stacked noun compounds, inanimate subjects
// on animate verbs, rare phrasings, long dependencies) because RL under length
// penalties rewards information density over readability.
//
// Passive: after each tool result, lints the latest assistant prose and, above
// a threshold, attaches a short coaching note to the next provider request.
// /deslop lints the last assistant message on demand and prints a report.
//
// Known limit: tool-free turns (pure prose replies with no tool calls) get no
// passive lint; use /deslop for those, or upgrade to the "context" event.
// Tests: tests/prose-linter.test.ts (bun tests/prose-linter.test.ts).
//
// Loaded from ~/.omp/agent/extensions (loose extension file).

import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";

const MIN_FINDINGS = 2; // don't nag over a single possible false positive
const MIN_TEXT_CHARS = 200; // short replies have no room for patterns
const REWARN_MS = 10 * 60_000; // at most one passive note per this interval
const MAX_REPORTED = 5; // findings listed in the coaching note
const REDUCED_ORC_DENSITY = 4; // count of "the X he wrote" forms before flagging

interface Finding {
	rule: string; // unslop rule number + short id
	excerpt: string;
	note: string;
}

// ---------------------------------------------------------------------------
// Text preparation: strip code so it is never linted (the paper does the same)
// ---------------------------------------------------------------------------

export function prepForLint(raw: string): string {
	let t = raw.replace(/```[\s\S]*?```/g, " ");
	t = t.replace(/`[^`\n]+`/g, " ");
	t = t.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
	return t;
}

function excerptAround(text: string, index: number, length: number): string {
	const start = Math.max(0, index - 20);
	const end = Math.min(text.length, index + length + 25);
	const body = text.slice(start, end).replace(/\s+/g, " ").trim();
	return (start > 0 ? "…" : "") + body + (end < text.length ? "…" : "");
}

// ---------------------------------------------------------------------------
// Lexicons
// ---------------------------------------------------------------------------

const THAT_TAKING_VERBS =
	"think|thought|know|knew|believes?|believed|hopes?|hoped|means?|meant|feels?|felt|finds?|found|realizes?|realized|remembers?|assumes?|assumed|guesses?|guessed|worries?|worried|argues?|argued|claims?|claimed|suggests?|suggested|insists?|insisted|concludes?|concluded|decides?|decided|forgets?|forgot|admits?|admitted|expects?|expected";

// Complement-clause verbs + determiner + noun + finite verb, with the "that"
// left out: "knew the answer was wrong" instead of "knew that the answer was
// wrong". "that" is deliberately absent from the determiner set so correct
// "that"-clauses never match.
const MISSING_THAT = new RegExp(
	`\\b(?:${THAT_TAKING_VERBS})\\s+(the|a|an|this|these|those|his|her|their|its|my|your|our)\\s+([a-z]+)\\s+` +
		`(is|are|was|were|will|would|can|could|has|have|had|did|does|do|should|might|may|makes?|made|comes?|came|goes?|went|gets?|got|seems?|seemed|looks?|looked|works?|worked|fails?|failed|helps?|helped|needs?|needed)\\b`,
	"gi",
);

// Purpose "so" with the optional "that" dropped: "spoke slowly so we could
// follow along". Restricted to modal verbs to avoid result-clause "so".
const REDUCED_SO_THAT =
	/\bso\s+(he|she|it|they|we|you|I|one)\s+(can|could|will|would|may|might|should|won't|can't|couldn't|wouldn't)\b/gi;

// Reduced object relative clause: "the book the professor wrote". Counted as a
// density signal rather than flagged per instance, because single occurrences
// are ordinary English.
const REDUCED_ORC =
	/\b(the|a|an|this|that|these|those)\s+[a-z]{2,}\s+(he|she|it|they|we|you|I)(?:'ll|'d|'re|'ve|'s)?\s+[a-z]+\b/gi;

// Denominal coinages — nouns used as ad-hoc verbs ("calendar it", paper
// Table 2) plus a few known noun→verb conversions models favor.
const DENOMINAL =
	/\b(?:calendar|journal|footnote|roadmap)\s+(?:it|this|that|them|everything|us)\b|\b(?:calendared?|journaled?|journalled?|footnoted?|roadmapped?|whiteboarded?|architected|paperclipped?)\b/gi;

const ANIMATE_VERBS =
	"expects?|expected|wants?|hopes?|promises?|promised|reminds?|reminded|forgets?|forgot|knows?|knew|thinks?|thought|believes?|believed|argues?|argued|insists?|insisted|feels?|felt|prefers?|preferred|decides?|decided|remembers?|assumes?|complains?|complained|apologizes?|betrays?|forgives?|mourns?|cheats?|dreams?|worries?|eats?|bites?";

const PERSON_WORDS = new Set(
	("i you he she we they who someone anyone everyone nobody somebody anybody people person user users reader readers developer developers customer customers writer author teams team group groups folks folk child children kid kids man woman men women reviewer reviewers " +
		// generic sentence-adverbs that may sit between a clause start and the verb
		"sometimes often always usually still now again also just only never").split(" "),
);

// Inanimate nouns that plausibly appear as subjects of person-only verbs.
const THING_WORDS = new Set(
	"chaos code config cache parser system module function database network test tests suite model algorithm machine clock deadline market policy rule rules feature bug error log logs data schema doc docs file files memory pipeline framework library contract interface protocol process queue buffer server client browser kernel driver hardware software physics math history silence fate fortune luck time nature internet advice industry world city economy weather music movie song game story paper docstring".split(
		" ",
	),
);

const FUNCTION_WORDS = new Set(
	"the a an this that these those and or but if then else of to in on for with at by from as is are was were be been being am it its it's his her their our your my mine yours hers ours theirs i you he she we they me him us them not no nor so than there here which who whom whose what when where how why all any some each every both few more most other such own same very can will just should now would could might must shall may do does did done have has had having that's don't doesn't didn't won't can't isn't aren't wasn't weren't".split(
		" ",
	),
);

const ADJECTIVE_WORDS = new Set(
	"big small large huge tiny new old good bad great high low long short first last next previous own other another same few many much more less least fast slow quick slower earliest early late easy hard simple complex complicated better best worse worst free open closed common rare strong weak rich poor hot cold warm cool dark light red blue green black white left right north south local global public private static final abstract virtual internal external major minor main central key core basic advanced modern classic recent current future past present possible impossible likely unlikely able unable sure clear false true real actual whole full empty null undefined deprecated stable unstable beta alpha new".split(
		" ",
	),
);

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

function checkMissingThat(text: string, out: Finding[]): void {
	for (const m of text.matchAll(MISSING_THAT)) {
		out.push({
			rule: "34 missing-that",
			excerpt: excerptAround(text, m.index ?? 0, m[0].length),
			note: `write "${m[1]} ${m[2]} ${m[3]}" → add "that" after "${m[0].split(/\s+/)[0]}"`,
		});
	}
}

function checkReducedSoThat(text: string, out: Finding[]): void {
	for (const m of text.matchAll(REDUCED_SO_THAT)) {
		out.push({
			rule: "34 missing-that",
			excerpt: excerptAround(text, m.index ?? 0, m[0].length),
			note: 'purpose clause: write "so that" unless "so" means "therefore"',
		});
	}
}

function checkReducedOrcs(text: string, out: Finding[]): number {
	const count = [...text.matchAll(REDUCED_ORC)].length;
	if (count >= REDUCED_ORC_DENSITY) {
		out.push({
			rule: "34 reduced-relatives",
			excerpt: `(${count} in this reply)`,
			note: 'heavy use of relatives without "that"/"which"; keeping the relativizer reads more human',
		});
	}
	return count;
}

function checkDenominal(text: string, out: Finding[]): void {
	for (const m of text.matchAll(DENOMINAL)) {
		out.push({
			rule: "35 denominal-verb",
			excerpt: excerptAround(text, m.index ?? 0, m[0].length),
			note: "noun used as a verb; write the phrase out, e.g. \"calendar it\" → \"put it on the calendar\"",
		});
	}
}

function checkAnimateSubject(text: string, out: Finding[]): void {
	// Sentence/clause starts, lowercased for matching; person subjects exempt.
	const clauses = text.toLowerCase().split(/(?<=[.!?;])\s+|\n+/);
	const verbRe = new RegExp(
		`^(?:sometimes|often|always|usually|still|now|here|there|even|also|yet|again)?\\s*` +
			`((?:the|a|an|this|that|these|those|its|it)\\s+[a-z-]+(?:\\s+[a-z-]+)?|${[...THING_WORDS].join("|")})\\s+(${ANIMATE_VERBS})\\b`,
	);
	for (const clause of clauses) {
		const m = clause.match(verbRe);
		if (!m) continue;
		const subjectWords = (m[1] ?? "").split(/\s+/).filter(Boolean);
		const lastWord = subjectWords[subjectWords.length - 1]?.replace(/[^a-z-]/g, "") ?? "";
		if (subjectWords.every(w => PERSON_WORDS.has(w))) continue;
		// det-less bare nouns must be known inanimate nouns ("chaos expects you")
		if (!/^(the|a|an|this|that|these|those|its|it)\b/.test(m[1]) && !THING_WORDS.has(lastWord)) continue;
		out.push({
			rule: "37 animate-subject",
			excerpt: excerptAround(clause, m.index ?? 0, m[0].length),
			note: `"${lastWord}" gets a person-only verb; name the actor or use a factual verb`,
		});
	}
}

function checkNounStacks(text: string, out: Finding[]): void {
	// Hyphen-split copy: "reader-patience budget" scans as three nouns. Strip
	// contractions so "he'd" doesn't tokenize as a noun.
	const scanText = text
		.replace(/'(?:s|d|ll|re|ve|m)\b/gi, "")
		.replace(/([a-zA-Z]+)-([a-zA-Z]+)/g, "$1 $2");
	const pronouns = "never always still again anyone everyone someone nobody somebody anybody everything nothing something anything".split(" ");
	for (const sentence of scanText.split(/(?<=[.!?])\s+|\n+/)) {
		const words = sentence.split(/\s+/).map(w => w.replace(/[^a-zA-Z-]/g, "").toLowerCase());
		let run: { word: string; index: number }[] = [];
		for (let i = 0; i < words.length; i++) {
			const w = words[i];
			const isNounish =
				w.length >= 3 &&
				!/ly$/.test(w) &&
				!/(?:ed|ing)$/.test(w) &&
				!FUNCTION_WORDS.has(w) &&
				!ADJECTIVE_WORDS.has(w) &&
				!pronouns.includes(w);
			if (isNounish) {
				run.push({ word: words[i], index: i });
			} else {
				run = [];
			}
			if (run.length === 3) {
				out.push({
					rule: "36 noun-stack",
					excerpt: excerptAround(sentence, sentence.toLowerCase().indexOf(run[0].word), 40),
					note: "three or more bare nouns in a row force the reader to guess the grouping; use \"of\" or \"for\"",
				});
				run = [];
			}
		}
	}
}

function checkSentenceLength(text: string, out: Finding[]): void {
	for (const sentence of text.split(/(?<=[.!?])\s+|\n+/)) {
		const words = sentence.split(/\s+/).filter(Boolean);
		if (words.length > 45) {
			out.push({
				rule: "39 long-dependency",
				excerpt: excerptAround(sentence, 0, 40),
				note: `${words.length} words; long sentences stretch dependencies past what readers hold in memory; split it`,
			});
		}
	}
}

const SLOP_WORDS =
	/\b(?:delves?|delving|tapestr(?:y|ies)|pivotal|testament to|underscores?|fosters?|garner(?:s|ed)?|intricate|interplay|vibrant|realm|realm of|navigating the complexit\w*|in the landscape of|rich tapestry)\b/gi;
const NEGATIVE_PARALLELISM =
	/\bnot just\b[^.!?]{1,60}?\bbut\b|\bisn'?t just\b[^.!?]{1,60}?\bit'?s\b/gi;

function checkSlopWords(text: string, out: Finding[]): void {
	for (const m of text.matchAll(SLOP_WORDS)) {
		out.push({
			rule: "7 slop-word",
			excerpt: excerptAround(text, m.index ?? 0, m[0].length),
			note: "AI-overused vocabulary; pick the plain word",
		});
	}
	for (const m of text.matchAll(NEGATIVE_PARALLELISM)) {
		out.push({
			rule: "9 not-just-but",
			excerpt: excerptAround(text, m.index ?? 0, m[0].length),
			note: 'state the point directly instead of "not just X, but Y"',
		});
	}
	const emDashes = (text.match(/—/g) ?? []).length;
	if (emDashes >= 2) {
		out.push({
			rule: "13 em-dash",
			excerpt: `(${emDashes} em dashes in this reply)`,
			note: "plain-writing 15: join clauses with a period or \"and\"",
		});
	}
}

// ---------------------------------------------------------------------------

export function lint(raw: string): Finding[] {
	const text = prepForLint(raw);
	const out: Finding[] = [];
	checkMissingThat(text, out);
	checkReducedSoThat(text, out);
	checkReducedOrcs(text, out);
	checkDenominal(text, out);
	checkAnimateSubject(text, out);
	checkNounStacks(text, out);
	checkSentenceLength(text, out);
	checkSlopWords(text, out);
	return out;
}

function textOf(message: { role?: string; content?: unknown }): string {
	if (message.role !== "assistant" || !Array.isArray(message.content)) return "";
	return message.content
		.filter((b: { type?: string }) => b?.type === "text")
		.map((b: { text?: string }) => b.text ?? "")
		.join("\n");
}

// SessionEntry is not exported for extension authors; narrow to the fields read here.
interface EntryMessage {
	type: string;
	message?: { role?: string; content?: unknown };
}

function entryMessage(entry: unknown): EntryMessage | undefined {
	if (typeof entry === "object" && entry !== null && "type" in entry && "message" in entry) {
		return entry as EntryMessage;
	}
	return undefined;
}

function renderNote(findings: Finding[]): string {
	const lines = findings.slice(0, MAX_REPORTED).map(f => `- [${f.rule}] "${f.excerpt}" — ${f.note}`);
	const more = findings.length > MAX_REPORTED ? `\n- … and ${findings.length - MAX_REPORTED} more` : "";
	return (
		`Prose lint: ${findings.length} patterns in your recent prose.\n` +
		lines.join("\n") +
		more +
		`\nThese constructions are over-represented in AI text and raise reader processing cost (arXiv:2610.29162). ` +
		`When two phrasings carry the same meaning, prefer the one that is easier to parse, not the shorter one. ` +
		`Applies to prose only; never alter code, paths, or diffs.`
	);
}

export default function proseLinter(pi: ExtensionAPI): void {
	let lastNudged = 0;

	pi.on("tool_result", async (_event, ctx) => {
		const branch = ctx.sessionManager.getBranch();
		const lastEntry = [...branch].reverse().find(e => entryMessage(e)?.type === "message");
		if (!lastEntry) return undefined;
		const msg = entryMessage(lastEntry)?.message;
		if (!msg || msg.role !== "assistant") return undefined;
		const text = textOf(msg);
		if (text.length < MIN_TEXT_CHARS) return undefined;
		const findings = lint(text);
		if (findings.length < MIN_FINDINGS) return undefined;
		const now = Date.now();
		if (now - lastNudged < REWARN_MS) return undefined;
		lastNudged = now;
		return { additionalContext: renderNote(findings) };
	});

	pi.registerCommand("deslop", {
		description: "Lint the last assistant message for AI-prose patterns",
		handler: async (_args, ctx) => {
			const branch = ctx.sessionManager.getBranch();
			let lastText: string | undefined;
			for (let i = branch.length - 1; i >= 0; i--) {
				const entry = entryMessage(branch[i]);
				if (entry?.type !== "message" || entry.message?.role !== "assistant") continue;
				const t = textOf(entry.message);
				if (t) {
					lastText = t;
					break;
				}
			}
			if (!lastText) {
				ctx.ui.notify("No assistant message to lint.", "info");
				return;
			}
			const findings = lint(lastText);
			if (findings.length === 0) {
				ctx.ui.notify("Prose lint: no findings.", "info");
				return;
			}
			const report = findings.map(f => `[${f.rule}] "${f.excerpt}"\n  → ${f.note}`).join("\n");
			if (ctx.hasUI) ctx.ui.setEditorText(`Prose lint (${findings.length}):\n${report}\n`);
			else console.log(`Prose lint (${findings.length}):\n${report}`);
		},
	});
}
