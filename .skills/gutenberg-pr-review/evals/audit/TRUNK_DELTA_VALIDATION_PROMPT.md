# Gutenberg skill trunk-delta validation

The review guidance in `.skills/gutenberg-pr-review/` was
validated against commit `49120c3204955ba1f83c7224793f52813689e7e1`.
`origin/trunk` is now `03a6675a25ede7f8e31e5232742615f95358bcb6`.

Inspect the exact six-commit delta and determine whether any statement in the
skill or its six references is contradicted, superseded, or needs narrower
wording. Pay particular attention to the removal of the private Components
Theme API, the URLInput refactor, UI Dialog/Drawer guidance, dependency
updates, and changelog/build conventions.

Do not edit files or use network access. Return a concise Markdown report:

- exact commits and relevant files inspected;
- each affected skill statement, if any, with the required replacement;
- otherwise an explicit conclusion that no rule is invalidated;
- the newer commit that can safely be recorded as the delta-checked head.
