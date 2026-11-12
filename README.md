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
cp prose-linter/extensions/prose-linter.ts ~/.omp/agent/extensions/
```

The extension auto-loads on the next omp session. Nothing else is required for
the linter. Verify with `bun prose-linter/tests/prose-linter.test.ts`, or in a
session: write some deliberately slopped prose, call any tool, and watch for
the "Prose lint" note, or run `/deslop` after a long reply.

### Optional: install the master skill

```sh
cp -r prose-linter/skills/writing ~/.omp/agent/skills/
```

This adds a standalone `writing` skill (trigger it by asking to draft or
deslop prose). It is a condensed merge of the plain-writing, unslop, and
technical-writing skills plus the paper's findings, so it also works without
those skills installed. If you only want the paper rules in an existing unslop
skill instead, append `unslop-rules.md` to
`~/.omp/agent/skills/unslop/SKILL.md`.

## Behavior

Passive mode: after each tool result, the linter checks the latest assistant
prose (code fences, inline code, and links stripped first). At two or more
findings it attaches a short coaching note to the next model request, at most
once per 10 minutes. Findings cite the merged rule numbers, so the note reads
as a checklist, not a scolding.

`/deslop`: lints the last assistant message on demand and prints every finding
with a suggested fix.

Checks: missing complementizer and relative "that", reduced "so that",
reduced-relative density, denominal coinages, noun stacks (three or more bare
nouns), person-only verbs on inanimate subjects, sentences over 45 words, AI
vocabulary, negative parallelism, em dash piles.

## Limits

- Tool-free turns (pure prose, no tool calls) get no passive lint; `/deslop`
  covers those.
- The checks are regex heuristics. They favor false positives over misses,
  and the passive note is advisory: it never rewrites output.
- Rule 38 of the merged skill (prefer known phrasings) is a judgment call, not
  mechanized.

## Test

```sh
bun tests/prose-linter.test.ts
```

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
