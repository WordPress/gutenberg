# Slice 01: Autosave after an anchor change

## Contract

After a top-level note is created or deleted, the editor asks for an autosave right away when the post is autosaveable. On an author's own draft this persists the anchor, so leaving without saving no longer orphans the note.

## Seam

- `useNoteActions` in `packages/editor/src/components/collab-sidebar/hooks.js`: `onCreate` (after `updateBlockAttributes`) and `onDelete` (after the marker or id is removed).
- A small helper, `requestNoteAnchorAutosave( registry )`, in a new `collab-sidebar/autosave-anchor.ts`:
  - Returns early unless `select( editorStore ).isEditedPostAutosaveable()`.
  - Otherwise `dispatch( editorStore ).autosave()`. Don't await it in the UI path, and never show an error notice for it. A failed autosave behaves like trunk.
- Replies and edits don't call it. They don't change anchors.

## What to run or see

1. Create a draft as the author and add a paragraph. Add a note to it. Don't save.
2. Reload. The note is still attached to the paragraph, and there's no unsaved changes prompt.

## Verification

- **E2E first.** Add to `test/e2e/specs/editor/various/block-notes.spec.js`: "keeps a note attached after reload without saving (author draft)". Confirm it fails on trunk before adding the fix.
- E2E: "deleting a note on a draft leaves no stale noteId after reload".
- Vitest for the helper: it doesn't autosave when the post isn't autosaveable, and does when it is.
- `npm run lint:js`, `npm run typecheck`.

## Must stay green

- `block-notes.spec.js`, `block-notes-floating.spec.js`, and the autosave e2e specs.
- The 60 second autosave interval (`AutosaveMonitor`) still works as before.

## Feedback that would change this slice

- If reviewers don't want an autosave that also flushes unrelated edits, the fallback is to shorten the next `AutosaveMonitor` tick instead of calling `autosave()` directly. Same effect, less direct.
