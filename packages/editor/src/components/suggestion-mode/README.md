# Suggestion mode

The editor side of Suggestion mode: capturing edits as suggestions while the editor is in the Suggesting mode, saving them as notes, and accepting or rejecting them. The design is described in the [Suggestion mode architecture guide](/docs/explanations/architecture/suggestions.md); this file is the index of what each module does.

The feature is an experiment, and nothing here is a public API.

## Files in this directory

| File | Role |
|------|------|
| `index.ts`                  | Barrel that re-exports the subsystem's public surface. |
| `gate.ts`                   | `isSuggestionModeEnabled()` / `useCanSuggest`: the single feature-gating predicate for the Suggestion mode experiment. |
| `suggestion-session.tsx`    | `SuggestionSessionProvider`, `useSuggestionSession`. Session coordination only: bypass tokens, handler slots, write queue, deferred insertions, undo adoption, structural capture records. |
| `marker.ts`                 | The `metadata.suggestion` marker: `readSuggestionMarker`, `proposedAttributes`, `withProposedAttributes` (fold an edit into a proposal), `withoutProposedAttributes`, `mergeProposedAttributes` (merge for render). |
| `suggestion-write-queue.ts` | Per-block serial queue shared by the format keyboard and the content reconciler, so their note-then-marker flights can't interleave on one block. |
| `with-suggestion-overlay.tsx`| `editor.BlockEdit` HOC that detects format-only / reconcilable content edits and hands them to the marker singletons, diverting everything else into the block's marker proposal (marker-stripped) and merging a proposal for render in every intent; plus the `editor.BlockListBlock` filter for pending-state classes and move ghosts. |
| `store-interceptor.ts`      | Snapshot/diff/revert subscriber for store-level mutations (attribute and structural); multi-peer accept logic; revert-echo identity tokens. |
| `plan-store-content-edit.ts`| Plans a content change that reached the store directly (outside `setAttributes`) as inline markers where it can. |
| `block-tree-version.ts`     | A cheap "has any block changed?" signal from the identity of the store's block tree. |
| `block-ownership.ts`        | Which blocks in the canvas the current post owns, and the notice for a declined edit to one it does not: the children of a synced pattern, template part or navigation menu, and the template around Post Content. |
| `provider.ts`               | `useSuggestionsProvider`: the `createSuggestion` / `updateSuggestion` / `deleteSuggestion` / `applySuggestion` / `rejectSuggestion` API, a thin composition of the two hooks below. |
| `suggestion-store.ts`       | `SuggestionStore`: the note writes of the submission and decision hooks (the comment, `_wp_suggestion`, `_wp_suggestion_status`). Meant as the swap point for another storage backend; the note collector and many readers still use the comment entity directly. |
| `use-suggestion-submission.ts` | Create, update and delete: builds the payload, saves the note through the store, and links the block to it. |
| `use-suggestion-decisions.ts` | Accept and Reject: the provisional status write, the conflict check, the content change, and the rollback when either half fails. |
| `apply-refusal.ts` | `getAttributeApplyRefusal` and `getPostApplyRefusal`: why an accept is refused before anything is decided (the proposal left the block or differs from the note, another block type, a value the block type does not declare or that is unsafe to save, a post field that cannot be suggested). |
| `decision-state.ts`         | Per-registry record of the decisions made this session, read by the interceptor and the undo guard. |
| `operations/`               | Pure functions over payloads and attributes: `payload.ts` (`SCHEMA_VERSION`, `PAYLOAD_MAX_BYTES`, `parseSuggestionPayload`), `attributes.ts` (`operationsFromMarker`, `applyOperations`, `hasAttributeConflict`, the wrapper-aware equality check), `locate.ts`, `plan.ts`, `structural-apply.ts`, `structural-reject.ts`. |
| `auto-save.ts`              | Debounced persistence of marked blocks as note comments. |
| `operations/structural-from-marker.ts` | `structuralOpFromMarker`: the structural op a marker stands for, derived from the marker and the live tree when no capture was recorded this session. |
| `operations/block-excerpt.ts` | `blockExcerpt`: the bounded plain-text excerpt a structural op names its block by, in place of the block itself. `structuralOperationText`: the text a summary quotes, from the live block, then the excerpt, then the block an older payload carries. |
| `suggestion-summary.tsx`    | Compact sidebar summary ("Add: …", "Delete: …", "Add formatting: …", "Remove formatting: …") used in thread lists, the sole suggestion renderer in the sidebar. Inline format changes carry their direction, since adding and removing a format are opposite proposals. |
| `word-diff.ts`              | `wordDiff`: the word-level LCS behind the summary, bounded by `MAX_DIFF_LENGTH` (characters, applied by callers) and `MAX_DIFF_TOKENS` (tokens, applied internally). |
| `suggestion-deletion-keyboard.ts` | `beforeinput`/`cut`-capture handler turning selection, collapsed-cursor, word/line deletes and cut into `del` markers. |
| `suggestion-addition-keyboard.ts` | `beforeinput`/`paste`-capture handler turning typing, type-over, and single-line paste into `add` markers (and the `del` half of a type-over). |
| `suggestion-format-keyboard.ts` | Singleton owning the write side of `format` markers: opens the note (with `delta`, `beforeHTML` and `afterHTML`) and writes the reformatted run wrapped in one marker, or writes the change straight into the author's own addition. |
| `suggestion-content-reconciler.ts` | Singleton executing marker plans for `onChange`-only text edits (IME commit, autocorrect, drag-drop). |
| `keyboard-target.ts`        | Shared DOM-target guards (`isEventTargetSelectedRichText`, `getCandidateDocuments`) keeping the capture keyboards off sidebar/plugin editables. |
| `grapheme-boundaries.ts`    | Grapheme-safe range stepping for collapsed deletes (surrogate pairs, ZWJ sequences, combining marks). |
| `run-anchor.ts`             | `rebaseRunAnchor`: maps a keyboard run's offsets, read when its first keystroke opened the note, onto the attribute's text when the note id resolves, so the deferred write lands by content rather than at the caret. |
| `refuse-edit.ts`            | The one place Suggestion mode declines an edit outright (a block split inside someone's suggestion, an edit that would hide a marker under a whole-attribute proposal), with its notice. |
| `use-abandoned-note-cleanup.ts` | Trashes the notes opened for a gesture that was abandoned before its marker was written, and drops their ids from the block's note linkage. |
| `suggestion-note-gc.ts`     | `SuggestionNoteGC`: trashes the current user's own pending note whose anchor disappeared (undo, deleting the marked text while Editing), after reading the note fresh from the server, restores it when the anchor comes back, and spares notes with replies. Reopens a note this session decided when undo brings its marker back, and decides it again (provisionally) when redo lands the decision again. |
| `suggestion-decision-refresh.ts` | `SuggestionDecisionRefresh`: reads the notes again after a successful post save while a provisional decision is listed, so the sidebar shows the final status the save pass wrote. |
| `anchor-index.ts`           | Where each suggestion note is anchored in the loaded content, shared by the note collector and the sidebar (`useSuggestionAnchorPresent`). |
| `suggestion-status.ts`      | `_wp_suggestion_status` values and predicates (`getSuggestionStatus`, `isProvisionalStatus`, `getDecision`). |
| `suggestion-undo-guard.ts`  | Suggestion-aware undo/redo: undoing right after a suggestion withdraws it rather than capturing the undo as a new suggestion. Records every redo, in any intent, so the note collector can tell a redone decision from a withdrawal. |
| `clipboard-strip.ts`        | Keeps suggestion state off the clipboard: inline markers, `metadata.suggestion` and note links are stripped from copied and cut content. |
| `multi-block-format-notice.ts` | Explains why a format shortcut does nothing across a multi-block selection in Suggestion mode. |
| `move-ghost-index.ts`       | Pure builder of the anchor-to-ghost index from moved-block descriptors. |
| `use-move-ghosts.tsx`       | `MoveGhostsProvider`: computes the document-wide pending-move ghost index once and shares it over context; per-block `useMoveGhosts()` is a plain context read. |
| `suggestion-move-ghost.tsx` | Renders the non-interactive ghost at a pending move's origin. |
| `annotate-suggestions.ts`   | `SuggestionAnnotations`: re-derives each pending marker's range and decorates it via the annotations API (runtime-only). |
| `suggestion-author-colors.ts` | `SuggestionAuthorColors`: injects per-author `--suggestion-author-color` rules keyed on the marker's `data-author`. |
| `reveal-selected-suggestion.ts` | Thickens the selected suggestion's in-content marker rule, like a selected note's. |
| `post-field-labels.ts`      | Names a post field suggestion's target ("Post title", "Excerpt", "Post meta: key") and its summary label. |
| `use-locked-post-field.ts`  | Read-only treatment for the post settings that cannot be proposed while suggesting. |
| `use-suggest-post-edit-guard.ts` | Installs the `editEntityRecord` guard for the editor's lifetime, before its children first render. |
| `style.scss`                | Sidebar and editor-chrome styles for suggestions (in-canvas treatments live in `block-editor`'s `content-suggestion.scss`). |
| `suggestion-marker-guard.ts` | `SuggestionMarkerGuard`: watches every rich-text attribute, in every intent, and writes the corrections `guardSyncedValue()` computes for markers merged over real-time collaboration. |
| `post-field-proposal-hydration.ts` | `useHydratePostFieldProposals`: restores the current user's post field proposals from their pending notes after a reload. |
| `create-proposed-terms.ts` | `createProposedTerms`: creates the new terms an accepted terms proposal carries, reusing a term of the same name. |
| `use-taxonomy-names.ts` | Taxonomy names by `rest_base`, to name the field a terms suggestion targets. |

## Sibling directories

The inline marker primitive and the suggestion formats live beside this directory. Notes and Suggestions both use the primitive.

| Directory | Role |
|-----------|------|
| `inline-markers/`    | Format-agnostic primitive: `findMarkerRange` (sole offset resolver / CRDT swap point), `wrapInlineMarker`, `readInlineSelection`, `readInlineCaret`, `reconcileMarkerRemoval`, `useAnnotateRanges`. |
| `inline-suggestions/`| The marker formats, one per kind, and their kind helpers and canonical order (`format.ts`), formatting deltas (`format-delta.ts`), and everything that plans or executes marker changes: accept/reject/insert/grow operations (`operations.ts`), the overlap matrix (`overlap.ts`), what a decision does to other suggestions (`resolution.ts`), how a suggestion sits among others (`relations.ts`), the RTC guard's rule (`marker-integrity.ts`), `delete-range.ts` (word/line delete ranges), `reconcile-edit.ts` (`planEditMarkers`/`applyEditPlan`), `reconcile-format.ts` (`planFormatMarkers`/`applyFormatPlan`), `strip-markers.ts` (marker stripping for attribute proposals), `rich-text-record.ts` (reads an attribute value as a rich-text record without a serialize and parse round trip) and `use-annotate-suggestions.ts` (registers the runtime decorations). |
| `attribute-suggestions/` | `revert-guard.ts` — identity tokens the store interceptor uses to recognize its own revert echoes (bounded FIFO queue per block). |

The tests for the overlap model, and how to run, replay and regenerate their fixtures, are described in [`inline-suggestions/test/README.md`](../inline-suggestions/test/README.md).
