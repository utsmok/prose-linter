---
name: writing
description: >-
  Master prose style, merged from plain-writing, unslop, technical-writing,
  and the readability findings of arXiv:2610.29162. Plain words, reader-first
  sentences, no AI tells. Use when drafting or revising any prose: documents,
  reports, READMEs, docs, PR descriptions, commit messages, or chat replies,
  or when asked to simplify, tighten, or deslop text. Not for code, only for
  the words around it.
---

# Writing

One goal: a tired engineer understands it on the first read. Two failure modes
to avoid: human vices (vagueness, decoration, padding) and machine vices
(compression, coinage, personification). The machine vices come from
post-training that rewards information density over readability
(arXiv:2610.29162): when two phrasings carry the same meaning, models pick the
shorter one categorically. You should pick the one that is easier to parse.

## Word choice

1. **Use plain, everyday words.** Don't pick a fancy synonym when a plain word
   works: "use" not "leverage" or "utilize", "help" not "facilitate", "many"
   not "numerous". If a word is not in the dictionary, don't coin it, and
   don't invent hyphenated adjectives to sound compact.
   Before: We leverage the cache to unlock a more robust query experience.
   After: The cache makes repeated queries faster.
2. **No jargon or metaphor nouns.** Use the words a developer would say out
   loud, and write the real symbol, file, flag, or command name. Avoid the
   abstract-metaphor vocabulary: substrate, wedge, vector, nexus, flywheel,
   north star, paradigm, ratchet, endgame. "Substrate" becomes "base";
   "gold-plating" becomes "more than the job needs".
3. **No AI-flavored vocabulary.** Additionally, crucial, delve, enduring,
   enhance, fostering, garner, interplay, intricate, landscape (abstract),
   pivotal, showcase, tapestry, testament, underscore, vibrant. Use the plain
   word.
4. **No puffery or empty emphasis.** Drop "really", "matters", "carries
   weight", "boasts", "quietly". State the point or cut the sentence.
5. **Say what it does, not how it feels.** "SQL you can read" names a feeling;
   "`.toSQL()` returns the exact string sent to the database" names a
   mechanism. If you can't restate a sentence as an instruction, fact, or
   number, cut it.
6. **Be consistent.** One name per thing: pick "document" or "file", not both.
7. **Contractions are fine.** "Don't" beats "do not".
8. **Prefer phrasings readers already know.** Uncommon word pairings and
   invented compounds read as machine text. If two words don't usually go
   together, say the plain thing instead.
   Before: Every test was verified red against the original source.
   After: Every test failed against the original source.

## Sentences and paragraphs

9. **Write complete sentences.** Subject and verb in every one. No fragments,
   no verbless stunts, no symbol-speak. "Parser rejects bad date → exit 2"
   becomes "The parser rejects a bad date, exits with code 2, and writes
   nothing."
10. **One instruction per sentence; at most two clauses per sentence.** For
    sequences use First / Second / Third with one sentence per step.
11. **Lead with the point.** Each paragraph opens with a topic sentence, then
    support ("For example", "Moreover"). Put the conclusion of a document
    first.
12. **Prefer explanatory over punchy.** Write the way people explain out loud:
    longer sentences with commas carry a fact with its condition. Don't stack
    three short staccato sentences for rhythm.
13. **Cut every word that does no work.** "In order to" is "to". "It is
    important to note that" is nothing. Drop side clauses like "before we call
    the work done".
14. **Keep the optional "that".** After verbs of thinking and saying, and in
    purpose clauses: "knew that the answer was wrong", "the book that the
    professor wrote", "spoke slowly so that we could follow along". Dropped
    "that" forces re-parsing.
15. **Keep subjects, verbs, and objects close.** Long gaps between words that
    belong together strain working memory. Split sentences over 45 words.
16. **Vary rhythm on purpose.** Short sentences land a point; longer ones
    carry facts. A page of uniform staccato reads machine-written.
17. **Active voice, with the actor named.** "Queries are validated" becomes
    "the compiler validates queries". Passive is fine when the actor is
    unknown or doesn't matter.
18. **Cut adverbs propping up weak verbs.** "runs quickly" is "is fast" or the
    number; "significantly improves" needs the measured delta.
19. **Address the reader as "you", present tense.** "Will" only for things
    that genuinely happen later. Keep "only" and "not" next to the word they
    change: "only fails on growth" and "fails only on growth" differ.

## Documents

20. **Pick one mode per document and stay in it.** Tutorial (learning by
    doing, expected output shown), how-to (steps to a goal, assume
    competence), reference (describe, no opinion, mirror the code's
    structure), explanation (one bounded topic, opinion allowed here only).
    Don't mix modes; split and link instead.
21. **Headings sentence case, formatting plain.** No bold for decoration, no
    title case, no decorative emoji. Lists to three or four points; convert
    "**Performance:** Performance improved" inline-header bullets to prose.
    A bold lead-in naming the item with genuinely new detail is fine.

## Patterns to avoid

22. **No negative parallelism.** Never "not just X, but Y" or "isn't just X,
    it's Y". State what the thing is.
23. **No fake agency for inanimate things.** Person-only verbs (expects,
    wants, promises, forgets) take people, not systems. "The docstring
    promises" becomes "the docstring says". "The API returns JSON" is fine;
    novel personification ("chaos expects you to remember") is not.
24. **No verbs coined from nouns.** "Calendar it" becomes "put it on the
    calendar"; "footnote it" becomes "add a footnote".
25. **No stacks of three or more bare nouns.** "parser config file format"
    forces the reader to guess the grouping; break the chain with "of" or
    "for".
26. **No rule of three, synonym cycling, or false ranges.** Use the natural
    number of items; repeat one term instead of cycling synonyms; list topics
    directly instead of "from X to Y".
27. **No superficial -ing phrases** ("highlighting...", "ensuring...") and no
    vague attributions ("experts believe"). Name the source or cut it.
28. **No dashes as connectors.** Em and en dashes are out, including in number
    ranges ("10 to 20"). Clauses join with a period or "and".
29. **Colons only to introduce lists or as short labels** ("Summary:"). Not as
    mid-sentence connectors.
30. **No analogies, imagery, or mannered prose.** Describe the thing in
    literal terms. No aphorisms, rhetorical fragments, or stock framing.
31. **No demonstrative openers.** Don't start a sentence with "This" or "That"
    carrying unstated context, and don't open a paragraph with one. Name the
    thing: "The agent applies the rules on the next turn."
32. **No chatbot phrases or sycophancy.** "I hope this helps!", "Let me know
    if...", "Great question!" are out. Respond directly.
33. **No hedging piles or generic conclusions.** "Could potentially possibly"
    is "may". "The future looks bright" becomes the specific plan.

## Process

34. **Draft, then self-lint against this list**, and run `/deslop` (the
    prose-linter extension) on long replies when available. Fix meaning first,
    then compression: every rule above yields to clarity when they conflict.
