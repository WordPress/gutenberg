# Slice 03: Re-attach on load

## Contract

When the editor opens a post that has orphaned notes and newer autosaves, notes the matcher can place are re-attached to their blocks. It runs once per editor session, and the user doesn't have to do anything.

## Seam

- New hook `useReattachOrphanedNotes( notes, notesResolved )` in `collab-sidebar/use-reattach-orphaned-notes.ts`, called next to `useNoteThreads` in `NotesSidebar`. `useNoteThreads` now also returns `hasResolved`.
- Inputs:
  - The orphan list from `useNoteThreads`. Don't compute orphans again.
  - `select( coreStore ).getAutosave( postType, postId, currentUserId )`. The current user's autosave only, fetched by the existing resolver. Never use other users' autosaves.
  - The post's `modified_gmt`.
  - The current blocks from `blockEditorStore`.
- It waits until the notes and the autosave have both loaded, then runs `findAutosaveAnchors` once, guarded by a ref. It gets exactly one chance per session, even with no orphans, so a block deleted later can't have its note moved onto a duplicate.
- It applies the matcher's patches with one `updateBlockAttributes( clientIds, attributesByClientId, { uniqueByBlock: true } )`, preceded by `__unstableMarkNextChangeAsNotPersistent` so there's no undo level.
- If at least one note was re-attached, it shows one snackbar: "Notes reattached from an autosave." (check `docs/contributors/documentation/copy-guide.md` for the final wording).

The re-attached id is a real unsaved edit, so the post becomes dirty. That's intended: the next autosave or save persists it.

## What to run or see

1. Publish a post with a paragraph. Add a note to the paragraph. Wait for the autosave (or trigger one), then leave without updating.
2. Reopen the post. The note is attached to the paragraph, and the snackbar shows once.
3. Repeat step 1 as an editor who isn't the author, then open the post as the author. The note is still orphaned (autosaves are per user). Reopen it as the editor: the note is attached.

## Verification

- **E2E first**, in `block-notes-unsaved-anchors.spec.ts`:
  - "re-attaches a note on a published post from the autosave".
  - "re-attaches a note added in the editor after a reload" (slices 01 and 03 together).
  - Not written yet: "doesn't use another user's autosave", which needs a second user.
  - "doesn't re-attach when the block was deleted and the post saved afterwards".
- `npm run lint:js`, `npm run typecheck`.

## Must stay green

- The "more recent autosave" notice and its tests (`use-autosave-notice.jsdom.test.js`). Re-attaching doesn't hide or replace that notice.
- Opening a post with no notes makes no extra requests beyond what the editor already does. The autosave is already resolved by `isEditedPostAutosaveable`.

## Feedback that would change this slice

- If a reviewer sees dirty-on-open as a regression, the alternative is to re-attach only in memory and let the next real edit persist it. That can't be done without the non-dirty edit path this spec defers, so it would become its own slice.
