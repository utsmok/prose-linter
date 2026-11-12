# prose-linter

An omp extension plus a master writing skill that target the constructions
which make AI text hard to read and easy to distinguish from human writing.

The linguistic basis is Clark, Martin & Mahowald, "Why is AI-generated
language so hard to understand?" ([arXiv:2610.29162](https://arxiv.org/abs/2610.29162)).
Post-training rewards information density, so models compress meaning: they
drop optional "that", coin verbs from nouns ("calendar it"), stack bare nouns
("parser config file format"), give person-only verbs to inanimate subjects
("the docstring promises"), and reach for rare word pairings. All of these
raise reader processing cost, and round-trip translation removes them without
changing meaning, which shows they are choices, not necessities.

## What is in the repo

| Path | What it is |
| --- | --- |
| `extensions/prose-linter.ts` | The linter as an omp extension. Passive coaching after tool results, plus the `/deslop` command. |
| `skills/writing/SKILL.md` | One master writing skill merging plain-writing, unslop, technical-writing, and the paper's readability rules. |
| `unslop-rules.md` | Just the paper-derived rules (34 to 39), for appending to an existing unslop skill. |
| `tests/prose-linter.test.ts` | 14 checks against the paper's own slop examples and clean prose. |

## Install (omp)

Requires [omp](https://github.com/oh-my-pi/omp) and [bun](https://bun.sh).

```sh
git clone https://github.com/utsmok/prose-linter
mkdir -p ~/.omp/agent/extensions ~/.omp/agent/skills
cp prose-linter/extensions/prose-linter.ts ~/.omp/agent/extensions/
cp -r prose-linter/skills/writing ~/.omp/agent/skills/
```

The extension auto-loads on the next omp session and does three things:

1. **Always-on style injection (the ponytail mechanism).** On every agent
   start it appends `skills/writing/SYSTEM_PROMPT.md`, a condensed version of
   the rules (about 800 tokens per request), to the system prompt, so every
   session writes under the rules, including tool-free turns. It resolves the
   skill relative to itself (`../skills/writing/`), falls back to the full
   `SKILL.md` when the condensed file is absent, and skips silently when
   neither is installed.
2. **Passive linting.** After each tool result it checks the latest assistant
   prose and, at two or more findings, attaches a coaching note to the next
   model request, at most once per 10 minutes.
3. **The `/deslop` command** lints the last assistant message on demand.

Verify: start a new session, ask it to quote the first line of its prose
style guide (it should answer "One goal: a tired engineer understands it on
the first read."), write some prose, call a tool, and watch for the "Prose
lint" note, or run `/deslop` after a long reply. A test guard keeps the
condensed prompt under budget: `bun prose-linter/tests/prose-linter.test.ts`.

### Alternative: rules file instead of injection

The system-prompt injection costs roughly 2.5k tokens per request. If you
prefer the cheaper mechanism that omp's plain-writing rule uses, copy the
pointer rule instead and skip the extension:

```sh
mkdir -p ~/.omp/agent/rules
cp prose-linter/rules/writing.md ~/.omp/agent/rules/
```

The rule loads on every session and tells the model to read the writing skill
on first use. You lose mechanical enforcement (the passive lint and
`/deslop`), which is why the extension route is recommended.

### If you already run the plain-writing rule

The master skill merges plain-writing, unslop, and technical-writing, so
keeping the old `rules/plain-writing.md` pointer active means two style
authorities per reply. Edit it down to a deferral or set `alwaysApply: false`:

```sh
cp prose-linter/rules/plain-writing.deferred.md ~/.omp/agent/rules/plain-writing.md
```

### Tests

```sh
bun prose-linter/tests/prose-linter.test.ts
```

## Limits

- The checks are regex heuristics. They favor false positives over misses,
  and the passive note is advisory: it never rewrites output.
- The passive lint needs a tool call to fire; the system-prompt injection
  covers tool-free turns instead.
- Rule 38 of the merged skill (prefer known phrasings) is a judgment call,
  not mechanized, and so are the Substance rules (argument shape, the
  any-document test). Those live in the skill, not the linter.
- Machines detect more than people do: in the RAL study, LLM judges caught
  adversarially trained text at 35% while human experts managed only 55%.
  Follow the rules; do not assume polish is enough.

## Citation

Clark, T. H., Martin, M. B., & Mahowald, K. (2026). Why is AI-generated
language so hard to understand? arXiv:2610.29162.

Bou, A., et al. (2026). Learning to Reason from Reference Samples Alone:
Reinforced Adversarial Learning for Modern LLM Post-Training.
[arXiv:2610.38851](https://arxiv.org/abs/2610.38851) ([post](https://advances.edisonscientific.com/research/reinforced-adversarial-learning/)).
Its NIH-grant experiments are the source of the master skill's Substance
rules, and they carry a warning the syntax rules cannot: LLM judges caught
the adversarially trained text at rates humans missed, so fixing surface
tells is necessary but not sufficient.
