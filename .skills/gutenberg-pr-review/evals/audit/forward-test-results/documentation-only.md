# Documentation Only

## Must fix

- `packages/block-editor/src/store/selectors.js:165` — The persistence description is incorrect for synced-pattern overrides. Editing an overridable child updates the containing `core/block` instance’s `content` attribute via `core/pattern-overrides`, so the override is saved with the post or template containing that instance—not to the source pattern. Rephrase this around ownership of the base block structure and explicitly distinguish editing the original pattern from editing per-instance overrides. Apply the same correction to the generated documentation at `docs/reference-guides/data/data-core-block-editor.md:178`.

No files were modified and no network access was used.
