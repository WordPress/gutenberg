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
- **Calibrate edge-case warnings.** Do not flag theoretical edge cases (`Number.MAX_VALUE`, subnormals, inputs that cannot occur given current callers). Flag edge cases only when they correspond to inputs that can plausibly reach the code.

## Gutenberg-specific context

- Do not suggest replacing `@wordpress/data` selectors / actions with local React state — this is the project's intentional state pattern.
- Do not suggest replacing `__()` / `_x()` / `_n()` calls with template literals — these are WordPress i18n functions.
- Do not suggest moving code between `block-editor`, `editor`, and `edit-post` packages without considering the layering rule (`block-editor` is WordPress-agnostic; lower layers must not depend on higher ones).
- Flag unguarded block attribute or `theme.json` values reaching a strict string operation such as `preg_match()`, `explode()`, `trim()` or `esc_url()`, but only where the value is raw: `$block['attrs']` in render filters, unregistered attributes, and nested `style` or `layout` values. Registered top-level attributes passed to render callbacks or block-support `apply` callbacks are already schema-validated — do not flag those. `sprintf( '%s' )`, `str_replace()`, `preg_replace()` and interpolation only warn, so they are not findings.

## Writing Markdown

- Do not hard-wrap Markdown. Keep each paragraph, list item, and table row on a single line; there is no line length limit (`MD013` is disabled).
- Hard wrapping is an accessibility problem: screen readers and braille displays read the source file line by line, so a wrapped sentence arrives as fragments.
- Do not reflow lines a change does not otherwise touch, in either a suggestion or a commit.
- This applies to `.md` files and to the Markdown in pull request descriptions and comments.
