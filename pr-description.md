## What?

Adds a new `disableContentOnlyForUnsyncedPatterns` block editor setting that allows opting out of content-only editing mode for unsynced pattern sections.

## Why?

Closes #71573

Currently, blocks with a `patternName` in their metadata are automatically treated as section blocks, which puts them into content-only editing mode. This restricts what users can edit within those patterns. While this behavior is desirable in the site editor, other contexts (like the post editor) may want to disable it so users can freely edit all blocks inside unsynced patterns.

## How?

The new `disableContentOnlyForUnsyncedPatterns` setting defaults to `undefined`/`false` (preserving existing behavior, with content-only sections enabled). When set to `true`:

- **`isSectionBlock` selector**: Blocks with `patternName` metadata are no longer treated as section blocks. Template parts and synced patterns (`core/block`) remain unaffected.
- **`getDerivedBlockEditingModesForTree`**: Unsynced patterns are excluded from the content-only parent list, so no `contentOnly` editing modes are derived for their children.
- **`withDerivedBlockEditingModes` reducer**: The `UPDATE_BLOCK_ATTRIBUTES` handler skips pattern-related editing mode derivation entirely. The `UPDATE_SETTINGS` handler compares effective boolean values (via `!!` coercion) to avoid unnecessary tree recomputes when the raw value changes between equivalent falsey states (e.g. `undefined` to `false`).

The setting is passed through from the editor settings via the `BLOCK_EDITOR_SETTINGS` allowlist in `use-block-editor-settings.js`.

## Testing Instructions

1. Open the site editor and verify that unsynced patterns still behave as content-only sections by default (existing behavior unchanged).
2. In a context where `disableContentOnlyForUnsyncedPatterns: true` is set in the block editor settings, insert an unsynced pattern and confirm all inner blocks are fully editable (not restricted to content-only mode).
3. Confirm template parts and synced patterns (`core/block`) still behave as section blocks regardless of the setting value.
4. Run unit tests:
   ```
   npm run test:unit -- --testPathPattern="block-editor/src/store/test/(private-selectors|reducer)"
   ```

### Testing Instructions for Keyboard

No UI changes — this is a settings-level opt-out. Keyboard accessibility is not affected.
