# Independent Gutenberg review-skill forward-test evaluation

Evaluate the eight blind review outputs in
`.skills/gutenberg-pr-review/evals/audit/forward-test-results/`.

The corresponding commits are listed in
`.skills/gutenberg-pr-review/evals/audit/forward-test-summary.json`. The reviewed skill is
at `../../SKILL.md`.

For every case:

1. Inspect the raw commit diff and enough surrounding code at that exact commit.
2. Verify each reported finding's factual premise, changed-line relevance,
   failure path, severity, and proposed remedy.
3. Look for a clear high-signal defect the review missed, without inventing
   stylistic or speculative requirements.
4. Check whether a "No findings" result is credible.
5. Judge adherence to the skill's evidence threshold and output contract.

Classify each case as:

- `pass`: no material false positive or missed high-signal defect;
- `pass-with-notes`: useful and materially correct, but wording, severity, or
  evidence needs a minor adjustment;
- `fail`: material false positive, unsupported mandate, or clear missed defect.

Do not edit files or use network access. Do not assume that merged commits are
correct. Produce a concise Markdown report with one section per case, quoting
only enough of a finding title to identify it, followed by a final tally and
specific skill edits required before acceptance. If no skill edit is required,
say so explicitly.
