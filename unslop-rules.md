### Readability rules

Rules 34 to 39 come from Clark, Martin & Mahowald, "Why is AI-generated language so hard to understand?" (arXiv:2610.29162). Post-training rewards information density, so models compress meaning at the cost of readability. The paper found that when two phrasings carry the same meaning, models pick the shorter one categorically, while humans pick by context and usually keep the easier-to-parse form. The principle: prefer the phrasing that is easier to read, not the shorter one. The `prose-linter` extension checks rules 34 to 37 and 39 mechanically (run `/deslop`); rule 38 is a judgment call.

34. **Keep the optional "that".** After verbs of thinking and saying, and in purpose clauses, write "that" instead of dropping it: "knew that the answer was wrong", "the book that the professor wrote", "spoke slowly so that we could follow along". Dropped "that" forces the reader to re-parse the sentence. Keep "that" in relative clauses too; reduced relatives ("advice most people gloss over") read as machine-compressed.
   Before: She knew the answer was wrong.
   After: She knew that the answer was wrong.

35. **Don't coin verbs from nouns.** Verbs formed ad-hoc from nouns are marked and trigger re-analysis: "calendar it", "footnote it", "roadmap it", "architected". Write the phrase out.
   Before: So yes — calendar it.
   After: So put it on the calendar.

36. **Don't stack three or more nouns.** Chains of bare nouns force the reader to guess where the phrase divides: "horror movie soundtrack generator", "reader-patience budget", "parser config file format". Break the chain with "of" or "for".
   Before: The reader-patience budget is gone.
   After: The reader's patience is used up.

37. **Match animate verbs with animate subjects.** Person-only verbs (expects, wants, promises, forgets, knows) on inanimate subjects ("chaos expects you to remember", "the docstring promises they're skipped") force re-analysis. Name the actor or use a factual verb. Conventional pairs like "the paper argues" are fine; novel personification is not. (plain-writing rule 20 is the general case.)
   Before: The docstring promises they're skipped.
   After: The docstring says they're skipped sometimes.

38. **Prefer phrasings readers already know.** Uncommon word pairings and invented compounds read as machine text. Use the common collocation; if you're tempted to join two words that don't usually go together, say the plain thing instead.
   Before: Every test was verified red against the original source.
   After: Every test failed against the original source.

39. **Keep subjects, verbs, and objects close together.** Long gaps between words that belong together strain working memory. Don't split a subject from its verb with long modifiers, and split sentences over 45 words.
   Before: A cat who can always get up and away from whatever startled it is a much calmer cat.
   After: A cat that can always get away from whatever startled it is much calmer.
