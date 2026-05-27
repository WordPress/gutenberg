## PR review guidelines

When reviewing pull requests:

- Only comment on semantically meaningful issues: bugs, incorrect logic, security problems, accessibility regressions, or API contract violations.
- Skip style, formatting, naming, and whitespace observations — these are enforced by lint and PHPCS.
- Keep each comment short — one or two sentences maximum.
- Do not write long descriptions or summaries of what the code does.
- Do not suggest refactors or improvements unrelated to the PR's stated goal.
- Keep the top-level review body empty unless a finding genuinely spans multiple files and can't be attached to a specific line. Put findings in inline comments wherever possible, and never use the review body to restate what the PR is doing.

## What not to flag

- **Do not speculate about external code.** Verify WordPress, PHP, and Node APIs, function signatures, and version constraints against the diff or repo files (`composer.json`, `package.json`, etc.) before flagging compatibility or contract issues. Do not invent strings, error messages, or behaviour in linked codebases such as WordPress core. If a claim cannot be verified from the diff or repository, do not include it.
- **Do not request refactor of inherited duplication.** If a pattern already exists in the codebase before this PR, do not ask the author to extract a helper or deduplicate. Flag it at most once for awareness.
- **Calibrate edge-case warnings.** Do not flag theoretical edge cases (`Number.MAX_VALUE`, subnormals, inputs that cannot occur given current callers). Flag edge cases only when they correspond to inputs that can plausibly reach the code.
- **Do not request tests** when the surrounding test files are out of scope for the PR. Flag missing tests only when the new behaviour is risky and adding a test fits the diff naturally.

## Gutenberg-specific context

- Do not suggest replacing `@wordpress/data` selectors / actions with local React state — this is the project's intentional state pattern.
- Do not suggest replacing `__()` / `_x()` / `_n()` calls with template literals — these are WordPress i18n functions.
- Do not suggest moving code between `block-editor`, `editor`, and `edit-post` packages without considering the layering rule (`block-editor` is WordPress-agnostic; lower layers must not depend on higher ones).
