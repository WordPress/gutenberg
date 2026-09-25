# Slice 02: Autosave anchor matcher

## Contract

Given the orphaned note ids, the autosaves, and the current blocks, return where each orphan belongs. Or return nothing when there's no confident match.

## Seam

New pure module `packages/editor/src/components/collab-sidebar/find-autosave-anchors.ts`:

```ts
type AutosaveAnchors = {
	// Attribute changes to apply, keyed by block client id: the merged
	// `metadata` and, for inline notes, the rich-text value with the marker.
	attributesByClientId: Record< string, Record< string, any > >;
	// Ids of the notes that were placed.
	noteIds: number[];
};

function findAutosaveAnchors( args: {
	orphanNoteIds: number[];
	// The current user's autosave only, or undefined when there is none.
	autosave?: { content?: string | { raw?: string }; modified_gmt?: string };
	postModifiedGmt?: string;
	blocks: Block[]; // current editor blocks
} ): AutosaveAnchors;
```

It returns finished attribute patches rather than a list of matches, so two notes placed on the same block build on each other instead of overwriting.

Rules, in order:

1. Return nothing when there's no autosave, or when it isn't newer than the post (`modified_gmt <= postModifiedGmt`). A newer save wins. That covers a block that was later deleted on purpose.
2. Parse the autosave's `content` once.
3. For each orphan id, find the autosave block whose ids (read with `getNoteIdsFromMetadata`) include it.
4. Find the same block in the current tree:
   - **Same path**: same index path, same `name`, and the same attributes once `metadata.noteId` and `core/note` markers are stripped. Use that block.
   - **Unique content**: otherwise, if exactly one current block has the same `name` and stripped attributes, use it.
   - Otherwise, no match.
5. For inline notes, re-apply the marker at the autosave's offsets. That's safe because rule 4 already required the text to match once markers are stripped.
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
  - An inline note with unchanged text: the marker is restored.
  - Two notes placed on the same block: both ids kept.
  - A nested block (inside a group or columns): path matching works.
  - A note id not found in any autosave: not returned.
- `npm run typecheck`.

## Must stay green

- The `collab-sidebar/utils` tests. This module reuses `getNoteIdsFromMetadata` rather than copying it.

## Feedback that would change this slice

- If the matching is too strict and misses real cases, loosen the unique content rule to ignore whitespace. Don't add fuzzy text matching. A wrong anchor is worse than an orphan.
