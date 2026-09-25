# Slice 02: Autosave anchor matcher

## Contract

Given the orphaned note ids, the autosaves, and the current blocks, return where each orphan belongs. Or return nothing when there's no confident match.

## Seam

New pure module `packages/editor/src/components/collab-sidebar/find-autosave-anchors.ts`:

```ts
type AnchorMatch = {
	noteId: number;
	clientId: string;
	// Set for inline notes whose text is unchanged: the attribute value that
	// carries the core/note marker, copied from the autosave block.
	inline?: { attributeKey: string; value: unknown };
};

function findAutosaveAnchors( args: {
	orphanNoteIds: number[];
	// The current user's autosave only, or undefined when there is none.
	autosave?: { content: string; modified_gmt: string };
	postModifiedGmt: string;
	blocks: BlockInstance[]; // current editor blocks
} ): AnchorMatch[];
```

Rules, in order:

1. Return nothing when there's no autosave, or when it isn't newer than the post (`modified_gmt <= postModifiedGmt`). A newer save wins. That covers a block that was later deleted on purpose.
2. Parse the autosave's `content` once.
3. For each orphan id, find the autosave block whose ids (read with `getNoteIdsFromMetadata`) include it.
4. Find the same block in the current tree:
   - **Same path**: same index path, same `name`, and the same attributes once `metadata.noteId` and `core/note` markers are stripped. Use that block.
   - **Unique content**: otherwise, if exactly one current block has the same `name` and stripped attributes, use it.
   - Otherwise, no match.
5. For inline notes, only set `inline` when the stripped text of the two attributes is identical. If it isn't, fall back to a block-level anchor, which is still better than an orphan.
6. Never return a block that already carries that note id, and never return two matches for the same note.

## What to run or see

Vitest fixtures only. This slice has no UI.

## Verification

- `find-autosave-anchors.test.ts` (Vitest, `globals: false`, import from `vitest`), covering:
  - The same path match.
  - A block moved to another index but still unique: matched.
  - Duplicate identical blocks at a moved index: not matched.
  - An autosave older than the post: ignored.
  - No autosave: returns nothing.
  - An inline note with unchanged text: `inline` set. With changed text: a block-level match only.
  - A nested block (inside a group or columns): path matching works.
  - A note id not found in any autosave: not returned.
- `npm run typecheck`.

## Must stay green

- The `collab-sidebar/utils` tests. This module reuses `getNoteIdsFromMetadata` rather than copying it.

## Feedback that would change this slice

- If the matching is too strict and misses real cases, loosen the unique content rule to ignore whitespace. Don't add fuzzy text matching. A wrong anchor is worse than an orphan.
