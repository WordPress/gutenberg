# Suggestions Architecture

## Overview

Suggestions extend the Notes feature (block-level comments) to support proposed content changes. A reviewer switches to **Suggest** intent and edits the content; each change is captured as a suggestion linked to a note comment, and the post author then **Accepts** (merges the change) or **Rejects** (dismisses it) from the notes sidebar.

There are two complementary mechanisms, by change type:

- **Inline text and formatting changes** (typing, deleting, type-over, paste, bold/italic/link toggles, and the residual `onChange` seams — IME commits, autocorrect, drag-drop, multi-line paste) live as anchored `core/suggestion` `<mark>` markers **in block content** (Option B), re-resolved on read — edit-resilient and per-author. See [Inline suggestion markers](#inline-suggestion-markers).
- **Non-text attribute changes** (alignment, heading level, color) and **structural changes** (insert / remove / move blocks) are captured as versioned operation payloads on a note comment via an in-memory **overlay**, auto-saved in the background after a short idle window. The overlay's remaining role is this attribute-only revert shim — it never renders inline content diffs anymore.

The feature is designed around a swappable provider interface so the storage backend can evolve from comment-meta (today) to Yjs `AttributionManager` (future) without changing the UI or accept/reject logic.

## End-to-end lifecycle

```mermaid
sequenceDiagram
    autonumber
    participant U as Reviewer
    participant B as Block
    participant O as Overlay store
    participant AS as AutoSave (debounced)
    participant P as SuggestionsProvider
    participant R as REST (/wp/v2/comments)
    participant A as Post author

    U->>B: Switch to Suggest intent, edit block
    B->>O: setAttributes → overlay (capture baseline on first edit)
    Note right of O: Block-editor store is NEVER written
    O->>AS: Overlay changed (debounce ~1.5s)
    AS->>P: createSuggestion or updateSuggestion
    P->>R: POST / PUT note + _wp_suggestion meta
    R-->>P: Saved comment
    P->>B: updateBlockAttributes(metadata.noteId) (on create)

    A->>A: Open notes sidebar
    A->>P: Accept (or Reject)
    alt baseRevision stale
        P-->>A: Confirm dialog ("Apply anyway?")
    end
    P->>B: updateBlockAttributes(applyOperations(...))
    P->>R: PUT status=approved + _wp_suggestion_status
```

## Editor Intent

A session-scoped `editorIntent` state (orthogonal to the visual/code `editorMode` preference) controls the editing purpose:

| Intent    | Behaviour |
|-----------|-----------|
| `edit`    | Default — direct editing. |
| `suggest` | Edits are diverted into an in-memory overlay; the block-editor store is never mutated. |
| `view`    | Read-only preview via `isPreviewMode`. |

The intent lives in the `core/editor` store's reducer (not the preferences store), so reloading the editor always returns to `edit`. It is surfaced as an **Edit / Suggest / View** menu in the editor's "Options" kebab, gated behind the `editor.notes` post-type support flag; the `setEditorIntent` / `getEditorIntent` store APIs are private while Suggest mode is experimental.

## Suggestion Overlay

When the intent is `suggest`, an `editor.BlockEdit` filter (`withSuggestionOverlay`) wraps every block's `Edit` component:

1. **Baseline capture** — on the first `setAttributes` call, the block's current attributes are snapshotted.
2. **Diversion** — `setAttributes` writes to a React-context-backed overlay (`SuggestionOverlayProvider`) keyed by `clientId`, not the block-editor store.
3. **Merge for render** — the block receives `{ ...realAttributes, ...overlayAttributes }` so the user sees their in-progress change live.

A companion `editor.BlockListBlock` filter tags each block with a pending change so it is discoverable without relying on the selected-block toolbar. Attribute edits get an `is-suggestion-pending` class (the bracket/outline treatment); pending structural changes get `is-suggestion-pending-remove` (strikethrough/dim), `is-suggestion-pending-insert`, or `is-suggestion-pending-move`, mapped from the block's `metadata.suggestion` marker.

For **attribute suggestions** the store is never touched, so autosave, undo/redo, and RTC sync stay at the real baseline. **Structural suggestions** are different: their pending state (the `metadata.suggestion` markers, and pending-insert blocks themselves) lives in the real block tree, so serializing the post would leak it into `post_content`. While any pending structural state exists, `SuggestionSaveLock` holds the editor's save and autosave locks (`lockPostSaving` / `lockPostAutosaving`), releasing them once every structural suggestion has been applied or rejected.

### Inline text and formatting changes (Option B: marks in content)

Inline **text** changes — typing, deleting (character, word, or line), type-over, cut, and single-line paste — do **not** flow through the overlay. They live as marked text directly in block content (Option B), anchored to the #78218 inline-`<mark>` marker primitive. This is the edit-resilient model Riad asked for ([#73411](https://github.com/WordPress/gutenberg/issues/73411)): a suggestion is "this anchored range is proposed for deletion / this inserted run is proposed for addition", re-resolved against current content on read, rather than a whole-attribute before/after snapshot. It also makes concurrent per-author inline suggestions on one block work for free, dissolving [#79220](https://github.com/WordPress/gutenberg/issues/79220).

Inline **formatting** changes (bold / italic / link toggled over a run, the text unchanged) are markers too: the reformatted run is wrapped in a single `format`-type marker carrying the *proposed* formatting — the Google Docs model, the text shown once and never duplicated into a paired del/ins diff. The overlay HOC's `setAttributes` seam detects the format-only diff (`planFormatMarkers`) and hands it to the singleton `SuggestionFormatKeyboard`, which opens the note (recording the original run as `beforeHTML` so a reject can restore it) and writes the marker.

Text edits that reach a block as a whole new `content` value with no interceptable input event — a committed IME composition, autocorrect (`insertReplacementText`), drag-drop, multi-line paste — are diffed into markers by the singleton content reconciler (`SuggestionContentReconciler`): the HOC plans the edit against the previous value (`planEditMarkers`) and, when every planned action opens a fresh note, the reconciler executes it. Both singletons serialize their note-then-marker writes per block through a shared write queue and re-validate the live content around the async note POST, abandoning (and trashing the note of) a plan the content has moved past.

See [Inline suggestion markers](#inline-suggestion-markers) below for the full model. The overlay path described in this section handles what's left: **non-text attribute** suggestions (alignment, heading level, color) and inline edits the marker planners decline (an edit straddling an existing marker, a format toggle overlapping one). Values captured into the overlay — baseline and proposed alike — are stripped of live `core/suggestion` markers first (`stripSuggestionMarkers`), so accepting an attribute suggestion later can never replay (and resurrect) a marker whose suggestion was resolved in the interim. By construction the overlay no longer renders inline content diffs — the old `<del>`/`<ins>` preview and its display-only format types are gone.

### Auto-save

There is no manual "Submit" step — `SuggestionAutoSave` watches the overlay and, after ~1.5 s of idle time on a given block, persists the current operations as a note comment. The overlay entry tracks the resulting `commentId` and a fingerprint of the last synced operations, so subsequent edits update the same note rather than creating new ones. If an edit is undone back to baseline the auto-saver trashes the note instead.

### Store interceptor

The HOC only catches edits that flow through a block's own `setAttributes` prop. Some Gutenberg paths bypass the prop chain and dispatch `updateBlockAttributes` directly to the block-editor store — most notably the block-switcher's variation picker (e.g. swapping a heading from H2 → H3). Those mutations would otherwise land in the post unchanged, defeating Suggest mode.

`SuggestionStoreInterceptor` is a companion subscriber that closes that gap:

1. On Suggest activation it snapshots every block's attributes.
2. It subscribes to the data registry. On every store update it diffs the live attributes against the snapshot.
3. For drift on a tracked block it routes the changed attributes into the overlay and dispatches a revert that restores the snapshot. A reentrancy gate (`isDispatchingOwnWrite`) suppresses the synchronous subscribe fire the revert itself triggers, while per-revert identity tokens (`createRevertGuard`, in `attribute-suggestions/revert-guard.js`) recognize revert echoes that arrive later — a batched or deferred dispatch — by matching the exact restored values instead of swallowing everything inside a time window.
4. Structural mutations (a block inserted, removed, or moved) are captured too — see [Structural suggestions](#structural-suggestions) below.
5. System-managed metadata (`metadata.noteId` written by the suggestion provider after creating a note comment) is folded into the snapshot before diffing so it's invisible to the diff and never leaks into the user-pending overlay.

The interceptor uses `registry.subscribe` rather than a React `useSelect` because (a) it must run synchronously after each dispatch, before any re-render serializes the now-wrong state, and (b) `subscribe` also catches dispatches from non-React paths.

### Structural suggestions

Inserting, removing, and moving blocks are captured as suggestions, not applied to the post. The interceptor follows the same "keep the store at baseline" principle as attribute edits — it **reverts the structural mutation and tags the block** with a `metadata.suggestion` marker, so the canvas keeps showing blocks at their baseline positions with a pending treatment until the change is accepted or rejected:

| User action | Interceptor response | Persisted op | Reject undoes by |
|-------------|----------------------|--------------|------------------|
| Delete a block | Re-inserts the subtree from the previous-tick snapshot at its prior parent + index, tags it `pending-remove` | `block-remove` (carries the serialized `block`) | clearing the marker (the block stays) |
| Insert a block | Leaves the new block in place, tags it `pending-insert` (it has no baseline to revert to) | `block-insert-after` (with `anchorClientId` / `parentClientId`) | dispatching `removeBlock` |
| Move a block | Moves it back to its original position, tags it `pending-move` with the from/to anchors | `block-move` (`from*` / `to*` anchor + index fields) | dispatching `moveBlockToPosition` back |

Each marker is written into the overlay so auto-save persists the corresponding structural operation as its own note (attribute-set ops can ride along in the same payload, but the structural op leads). Apply dispatches the real block-editor action (`removeBlock` / `insertBlock` / `moveBlockToPosition`); both Apply and Reject finish by clearing the `metadata.suggestion` marker via `clearSuggestionMarkerAttributes`.

### Apply-time bypass and the collaborative round-trip

Apply is a deliberate exception to the "store is never written" rule: when the post author clicks **Apply**, the merged attributes do need to land on the live block. The provider opts the next dispatch out of interception via `requestInterceptorBypass(clientId)` — without it, the interceptor would treat the apply as a new user edit and revert it back into the overlay, producing a frustrating feedback loop.

In real-time collaboration the same scenario plays out across peers. When peer A clicks Apply, the dispatched attribute change syncs to peer B (the original suggester). Peer B's interceptor sees a delta from its own snapshot and would revert it, which would then sync back to peer A and undo the apply on their screen. To prevent this the interceptor calls `isAcceptedSuggestionChange()`: for each note linked to the block via `metadata.noteId`, it consults the suggestion payload and checks whether every changed attribute lands on a payload's `after` value. If so, the interceptor adopts the new attributes as its baseline rather than reverting.

The two halves are complementary — `requestInterceptorBypass` covers the local apply, `isAcceptedSuggestionChange` covers the synced apply on the other peer.

### Inline suggestion markers

Inline text suggestions are built on a shared, format-agnostic marker primitive in `packages/editor/src/components/inline-markers/`, generalized from the #78218 Notes anchor (`findMarkerRange`, `wrapInlineMarker`, `readInlineSelection`, `readInlineCaret`, `reconcileMarkerRemoval`, `useAnnotateRanges`). Notes and Suggestions both consume it; each passes its own format type, id attribute, and annotation source so the two coexist on one block.

**Marker.** A suggested inline change serializes as

```html
<mark class="wp-suggestion" data-suggestion-id="N" data-suggestion-type="del|add|format" data-author="A">…</mark>
```

where `data-suggestion-id` is the linked note's comment id, `data-suggestion-type` is `del` (existing text proposed for removal), `add` (proposed new text), or `format` (a run whose formatting change is proposed — the run carries the proposed formatting, the note's `beforeHTML` holds the original), and `data-author` tags the suggester. **Offsets are never stored** — `findMarkerRange` re-scans the rich-text `formats` array for the marker by id on every read, so a marker survives unrelated edits elsewhere in the same attribute. This is the single offset-resolution chokepoint and the intended Yjs `AttributionManager` swap point.

**Edit-driven creation.** In Suggest mode every edit is a suggestion, so there are no toolbar buttons — the act of editing produces the marker. Two `beforeinput`-capture keyboards own the input-event paths (plus `paste`/`cut`-capture handlers), cancelling the native edit and writing the marker instead; two singleton `onChange`-side components (the format keyboard and the content reconciler) own edits that surface only as a fresh `content` value. All of them key the marker to a freshly created `note` comment and bypass the store interceptor so the marker lands in content:

| User action | Result |
|-------------|--------|
| Select text + Delete/Backspace | `del` marker over the selection |
| Backspace / Delete at a caret | `del` marker on the adjacent grapheme; repeating in one direction grows a single marker |
| Word / line delete (`deleteWordBackward`, `deleteHardLineForward`, …) | `del` marker over the exact range the delete would remove (`computeDeleteRange`) |
| Cut (Cmd/Ctrl+X) | `del` marker over the selection; the cut run is written to the clipboard as both `text/plain` and `text/html` |
| Type at a caret | `add` marker; contiguous typing grows one marker (the whole span is re-stamped so it stays a single `<mark>`) |
| Type over a selection | `del` marker on the old text + an `add` run for the replacement (two notes) |
| Single-line paste | `add` marker (handled on the `paste` event, ahead of the editor's paste pipeline) |
| Bold / italic / link toggle | single `format` marker wrapping the reformatted run (via `SuggestionFormatKeyboard`) |
| IME commit, autocorrect, drag-drop, multi-line paste | diffed into `add`/`del` markers by `SuggestionContentReconciler` |

The first keystroke of a run opens the note asynchronously; keystrokes during that window are buffered (typing) or counted (deletion) and applied when the comment id resolves. Edits whose range overlaps an existing suggestion marker are left alone (guarded by `formatsRangeHasSuggestion` / `valueRangeHasSuggestion`) rather than nesting or re-attributing another suggestion's marker.

**Decoration.** `SuggestionAnnotations` re-derives each pending marker's live range (`findSuggestionRange`) and decorates it through the annotations API at runtime — nothing is written back to content. `content-suggestion.scss` keys the visual off `data-suggestion-type` (`del` → strikethrough, `add` → underline, `format` → dotted underline marking the already-visible proposed formatting as provisional) and consumes `--suggestion-author-color`; `SuggestionAuthorColors` injects one `.wp-suggestion[data-author="N"]{--suggestion-author-color:…}` rule per author so the **decoration conveys del-vs-add while the color conveys who** (Google-Docs model). The redundant per-thread annotation highlight is neutralized for suggestion markers.

**Render strip (PHP).** `gutenberg_strip_inline_suggestion_markers` (a `render_block` filter in `lib/compat/wordpress-7.1/block-suggestions.php`) is type-aware: a `del` marker has its **wrapper stripped but text kept** (the text is real until the suggestion is accepted); an `add` marker has its **wrapper and text both stripped** (proposed additions never reach the published front-end until accepted). A `format` marker is treated like `del` — wrapper stripped, text kept — which means the run's *proposed* formatting (carried on the text itself) currently renders on the front end before the suggestion is resolved; see Known Limitations. The raw `post_content` / REST `raw` / revisions keep the markers.

**Accept / reject.** Resolved by id against the live marker range: accept `del` removes text + marker; reject `del` drops the marker (text stays); accept `add` unwraps the marker (text becomes permanent); reject `add` removes text + marker; accept `format` unwraps the marker (the proposed formatting, already on the run, becomes permanent); reject `format` restores the original run captured on the note as `beforeHTML`. The inline op records only which attribute carries the marker, the marker kind, and (for `format`) the before/after run HTML — the range is always re-derived. Removal-type resolutions delete only the characters actually carrying the marker's id, so another suggestion's marker interleaved inside a fragmented run survives.

### Implementation files

The Suggest-mode subsystem lives in `packages/editor/src/components/suggestion-mode/`:

| File | Role |
|------|------|
| `index.js`                  | Barrel that re-exports the subsystem's public surface. |
| `constants.js`              | Shared constants (`EDITOR_STORE_NAME`, `SUGGEST_INTENT`) referenced by name to avoid a module cycle with the editor store. |
| `gate.js`                   | `isSuggestionModeEnabled()` / `useCanSuggest` — the single feature-gating predicate for the Suggestion Mode experiment. |
| `overlay-context.js`        | `SuggestionOverlayProvider`, `useSuggestionOverlay`. The in-memory overlay store, interceptor-bypass refs, the format/content handler slots, and the shared per-block suggestion write queue. |
| `suggestion-write-queue.js` | Per-block serial queue shared by the format keyboard and the content reconciler, so their note-then-marker flights can't interleave on one block. |
| `with-suggestion-overlay.js`| `editor.BlockEdit` HOC that detects format-only / reconcilable content edits and hands them to the marker singletons, diverting everything else into the overlay (marker-stripped); plus the `editor.BlockListBlock` filter for pending-state classes and move ghosts. |
| `store-interceptor.js`      | Snapshot/diff/revert subscriber for store-level mutations (attribute and structural); multi-peer accept logic; revert-echo identity tokens. |
| `provider.js`               | `useSuggestionsProvider` — the `createSuggestion` / `applySuggestion` / `rejectSuggestion` API. Owns `operationsFromOverlay`, `applyOperations`, `hasAttributeConflict`, `findStructuralOp`, `clearSuggestionMarkerAttributes`, `parseSuggestionPayload`, and the wrapper-aware equality check. |
| `suggestion-summary.js`     | Compact sidebar summary ("Add: …", "Delete: …", "Formatting: …") used in thread lists — the sole suggestion renderer in the sidebar. |
| `word-diff.js`              | `wordDiff` — the word-level LCS behind the summary, bounded by `MAX_DIFF_LENGTH` (characters, applied by callers) and `MAX_DIFF_TOKENS` (tokens, applied internally). |
| `auto-save.js`              | Debounced background persistence of pending overlays as note comments (replaces the explicit "Submit" affordance from earlier phases). |
| `save-lock.js`              | `SuggestionSaveLock` — holds the editor save/autosave locks while structural suggestions are pending in the live tree. |
| `suggestion-deletion-keyboard.js` | `beforeinput`/`cut`-capture handler turning selection, collapsed-cursor, word/line deletes and cut into `del` markers. |
| `suggestion-addition-keyboard.js` | `beforeinput`/`paste`-capture handler turning typing, type-over, and single-line paste into `add` markers (and the `del` half of a type-over). |
| `suggestion-format-keyboard.js` | Singleton owning the write side of `format` markers: opens the note (with `beforeHTML`/`afterHTML`) and writes the reformatted run wrapped in one marker. |
| `suggestion-content-reconciler.js` | Singleton executing marker plans for `onChange`-only text edits (IME commit, autocorrect, drag-drop, multi-line paste). |
| `keyboard-target.js`        | Shared DOM-target guards (`isEventTargetSelectedRichText`, `getCandidateDocuments`) keeping the capture keyboards off sidebar/plugin editables. |
| `grapheme-boundaries.js`    | Grapheme-safe range stepping for collapsed deletes (surrogate pairs, ZWJ sequences, combining marks). |
| `use-move-ghosts.js`        | `MoveGhostsProvider` — computes the document-wide pending-move ghost index once and shares it over context; per-block `useMoveGhosts()` is a plain context read. |
| `annotate-suggestions.js`   | `SuggestionAnnotations` — re-derives each pending marker's range and decorates it via the annotations API (runtime-only). |
| `suggestion-author-colors.js` | `SuggestionAuthorColors` — injects per-author `--suggestion-author-color` rules keyed on the marker's `data-author`. |

The shared inline-marker primitive and the suggestion format live alongside, consumed by both Notes and Suggestions:

| Directory | Role |
|-----------|------|
| `inline-markers/`    | Format-agnostic primitive: `findMarkerRange` (sole offset resolver / CRDT swap point), `wrapInlineMarker`, `readInlineSelection`, `readInlineCaret`, `reconcileMarkerRemoval`, `useAnnotateRanges`. |
| `inline-suggestions/`| The `core/suggestion` (`wp-suggestion`) marker format and everything that plans or executes marker changes: accept/reject/insert/grow operations and overlap guards (`operations.js`), `delete-range.js` (word/line delete ranges), `reconcile-edit.js` (`planEditMarkers`/`applyEditPlan`), `reconcile-format.js` (`planFormatMarkers`/`applyFormatPlan`), and `strip-markers.js` (marker stripping for overlay captures). |
| `attribute-suggestions/` | `revert-guard.js` — identity tokens the store interceptor uses to recognize its own revert echoes (bounded FIFO queue per block). |

REST/PHP surface lives in `lib/compat/wordpress-6.9/` and `lib/compat/wordpress-7.1/`:

| File | Role |
|------|------|
| `block-comments.php`                              | Registers the `_wp_note_status`, `_wp_suggestion`, and `_wp_suggestion_status` comment meta and adds `editor.notes` post-type support. |
| `class-gutenberg-rest-comment-controller-6-9.php` | REST controller subclass remapping permissions for `note`-type comments (post editors get `edit_post`-based access; updates are gated by an allowlist of suggestion-lifecycle fields). |
| `wordpress-7.1/block-suggestions.php`             | `gutenberg_strip_inline_suggestion_markers` — the type-aware `render_block` strip for inline `wp-suggestion` markers (del keeps text, add drops text, wrappers removed). |

## Suggestion Payload (v2)

Stored as a JSON string in the `_wp_suggestion` comment meta on a `note` comment:

```json
{
  "schemaVersion": 2,
  "blockName": "core/paragraph",
  "baseRevision": "2026-04-15T12:34:56",
  "operations": [
    {
      "type": "attribute-set",
      "attribute": "content",
      "before": "Hello world",
      "after": "Hello beautiful world"
    }
  ]
}
```

| Field | Purpose |
|-------|---------|
| `schemaVersion` | Allows future schema evolution without breaking old payloads. |
| `blockName` | Safety check — apply is refused if the block type has changed. |
| `baseRevision` | `post_modified_gmt` at capture time. A mismatch at apply time triggers a staleness warning. |
| `operations` | Declarative transforms on the block tree. v1 emitted `attribute-set` only; v2 adds the structural variants (`block-insert-after`, `block-remove`, `block-move`), tracked in [#77434](https://github.com/WordPress/gutenberg/issues/77434). |

Operations are **declarative transforms**, not HTML diffs. This makes them compatible with Yjs attribution semantics and resilient to concurrent edits on unrelated attributes.

A payload carries at most one structural op (the auto-save loop persists each structural mutation as its own note); `attribute-set` ops may ride along but the structural op leads. The op types and their distinguishing fields:

| `type` | Fields beyond `type` / `blockName` | Apply dispatches |
|--------|------------------------------------|------------------|
| `attribute-set`     | `attribute`, `before`, `after` | `updateBlockAttributes` |
| `block-remove`      | the serialized `block` | `removeBlock` |
| `block-insert-after`| `anchorClientId`, `parentClientId`, the serialized `block` | `insertBlock` |
| `block-move`        | `fromAnchorClientId` / `fromParentClientId` / `fromIndex`, `toAnchorClientId` / `toParentClientId` | `moveBlockToPosition` |

### v1 → v2 compatibility

The shape of a v1 payload is a strict subset of v2 (only `attribute-set` operations). v1 payloads are migrated forward in `parseSuggestionPayload` by stamping `schemaVersion: 2` — no rewriting needed. The bump matters because a v1 reader that encountered a v2 payload with structural ops would silently drop them at apply time; refusing the payload outright surfaces an explicit "newer editor" notice and offers only Reject.

### Schema versioning

`schemaVersion` is incremented whenever the payload shape changes. Consumers apply the following rule:

| Parsed version vs. consumer's known version | Behavior |
|---|---|
| `parsed < known` | Migrate the payload forward to the current shape before applying. Migrations are additive: missing fields are filled with defaults. |
| `parsed === known` | Apply normally. |
| `parsed > known` | Refuse to apply — show a "this suggestion was made by a newer editor" notice and offer only Reject. |

When bumping the version, add a migration step in `parseSuggestionPayload` that lifts `parsed.schemaVersion < SCHEMA_VERSION` payloads into the current shape. Ship the bump and the migration in the same PR; do not read unknown future payloads.

## Provider Interface

```text
useSuggestionsProvider() → {
  createSuggestion({ clientId, blockName, operations })  → Promise<comment>
  updateSuggestion({ commentId, blockName, operations }) → Promise<comment>
  deleteSuggestion({ commentId })                        → Promise<void>
  applySuggestion({ commentId, clientId, payload })      → Promise<void>
  rejectSuggestion({ commentId, clientId, payload })     → Promise<void>
}
```

The current implementation (`provider.js`) uses comment meta. A future Yjs-backed implementation would read from `AttributionManager` and write changes through the CRDT document, exposing the same methods.

## Accept / Reject

- **Accept** (attribute ops): runs `applyOperations(currentAttributes, payload.operations)` to produce new attributes, dispatches `updateBlockAttributes`, marks the note as resolved with `_wp_suggestion_status = 'applied'`.
- **Accept** (structural ops): dispatches the corresponding block-editor action — `removeBlock` for `block-remove`, `insertBlock` for `block-insert-after`, `moveBlockToPosition` for `block-move` — then clears the `metadata.suggestion` marker via `clearSuggestionMarkerAttributes`.
- **Reject**: marks the note as resolved with `_wp_suggestion_status = 'rejected'` and clears any `metadata.suggestion` marker. For structural suggestions it also undoes the in-canvas pending state: `block-insert-after` runs `removeBlock`, `block-move` runs `moveBlockToPosition` back to the original spot, `block-remove` simply drops the marker (the block was never actually removed). Attribute rejects make no content change.
- **Conflict detection**: accept-time staleness is checked at the attribute level, not the post level. `hasAttributeConflict(currentAttributes, operations)` compares each operation's captured `before` to the block's current value; only a real divergence on a targeted attribute prompts the "apply anyway" confirmation. (`block-insert-after` is exempt — its baseline is `{}`, so a comparison against the already-typed-into block would always read as divergence.) Post-level `baseRevision` is still stamped into the payload for provenance, but does not drive the prompt — every auto-save bumps `post_modified_gmt`, so a post-level compare would flag nearly every suggestion as stale.

## Review UI

In the notes sidebar, a suggestion thread renders:

- **`SuggestionSummary`** — a Docs-style "Add: …", "Delete: …", "Formatting: …" summary derived from the operations. It is the sidebar's sole suggestion renderer; the old full-diff `SuggestionDiff` component was deleted with the overlay retirement (its `wordDiff` engine lives on in `word-diff.js`, capped by `MAX_DIFF_LENGTH`/`MAX_DIFF_TOKENS` so a large payload can't freeze the sidebar).
- **Accept / Reject icon buttons** — checkmark and close icons that trigger the provider's apply/reject flows.

## Yjs v2 Migration Path

When PR [#77005](https://github.com/WordPress/gutenberg/pull/77005) (Yjs v14 / `AttributionManager`) stabilizes:

1. Create `yjs-provider.js` implementing the same `useSuggestionsProvider` interface.
2. `createSuggestion` → write attributed changes to the Yjs doc instead of comment meta.
3. `applySuggestion` / `rejectSuggestion` → accept/reject attributed changes in the Yjs doc, then persist the resolution to comment meta for non-RTC users.
4. The overlay and diff UI remain unchanged — they consume operations, not storage details.

Server-side persistence (comment meta) is still needed for users without RTC, so the comment-meta provider won't be fully retired — it becomes the fallback for non-collaborative sessions.

## Implementation wrinkles worth knowing

These are non-obvious quirks reviewers should keep in mind when reading the code:

- **RichTextData / wrapper-vs-primitive comparison**: text-valued block attributes (notably `core/paragraph`'s `content`) are wrapped in `RichTextData` objects whose payload sits in private class fields. Plain `Object.keys()` reflection returns empty arrays for these wrappers, so a deep structural comparison would consider every wrapper "different from itself" after a JSON round-trip. The provider's `isAttributeEqual` and the interceptor's `shallowAttributeEquals` detect the wrapper-vs-primitive case and fall back to `String(a) === String(b)`. Without this, every suggestion would be flagged stale or trigger an apparent attribute conflict on apply.
- **`DEEP_MERGE_KEYS` (object-valued attributes)**: `setAttributes({ style: { color: 'red' } })` semantically replaces the whole `style` object on the live block. The overlay HOC instead does a one-level-deep merge for keys in `DEEP_MERGE_KEYS` (`style`, `metadata`) so that editing `style.color` preserves untouched fields like `style.fontSize`. Other attribute types are replaced wholesale, matching core `setAttributes` semantics. Add a key to `DEEP_MERGE_KEYS` only when the attribute is reliably a flat object.
- **Comment status vs. suggestion status**: a note comment's WP status (`hold` / `approved`) tracks whether the discussion is open or resolved. `_wp_suggestion_status` (`pending` / `applied` / `rejected`) is a parallel axis tracking the suggestion lifecycle. The two are independent: a resolved suggestion can leave its comment thread open for follow-up discussion.
- **Payload size limit**: both the client (`PAYLOAD_MAX_BYTES` in `provider.js`) and the server (`GUTENBERG_SUGGESTION_PAYLOAD_MAX_BYTES` in `block-comments.php`) cap payloads at 64 KB. The client check rejects oversized payloads before they leave the browser; the REST controller is the authoritative gate. The meta `sanitize_callback` rejects (rather than truncates) oversized values because mid-string truncation produces invalid JSON that `parseSuggestionPayload` would silently drop.

## Known Limitations

- **Sub-attribute anchoring**: resolved for inline **text and formatting** changes — these are now edit-resilient `core/suggestion` markers anchored in content and re-resolved on read (see [Inline suggestion markers](#inline-suggestion-markers)), so an unrelated edit elsewhere in the attribute no longer invalidates them. It still applies to **non-text attribute** suggestions (alignment, color), which remain whole-attribute overlay captures: if the author edits the same attribute while one is pending, the captured `before` no longer matches and Apply overwrites the interim edit (after a staleness confirmation) rather than merging it.
- **Marker-planner declines**: an edit that straddles an existing marker, a format toggle whose run overlaps one, or a text diff the planner can't resolve unambiguously falls back to the whole-attribute overlay path (captured marker-stripped). Live IME composition itself is not intercepted — only the committed composition is reconciled into markers.
- **Format markers on the front end**: the render strip treats a `format` marker like `del` (wrapper stripped, text kept), and the run carries the *proposed* formatting inline — so a pending bold/italic renders formatted on the published front end until the suggestion is resolved. Tightening the strip to restore `beforeHTML` is a follow-up.
- **Permissions**: the Gutenberg REST comment controller overrides `update_item_permissions_check` so users with `edit_post` on the parent can update note comments — **but only for suggestion-lifecycle fields** (`status` limited to `approved`/`hold`, plus `meta._wp_suggestion_status`). Any other field in the update body falls back to core's `edit_comment` check, preventing post editors from rewriting another user's note content. The `_wp_suggestion` and `_wp_suggestion_status` meta `auth_callback`s follow the same `edit_post`-on-parent pattern.
- **Payload size**: `_wp_suggestion` meta is capped at 64 KB via a `sanitize_callback`. Requests exceeding that limit are rejected (the callback returns an empty string), not truncated — mid-string truncation would produce invalid JSON that `parseSuggestionPayload` would silently drop.
- **Rich-text format fidelity**: the word-level diff operates on the serialized HTML string, which may produce noisy diffs when formatting (bold, links) changes. Progressive enhancement planned.
- **Orphaned notes and markers (no garbage collection yet)**: an inline marker and its backing note comment can drift apart. Deleting the backing comment leaves an orphaned marker in content — an orphaned `add` marker keeps hiding its text on the front end until the marker is removed manually. Conversely, undoing (or otherwise reverting) the content edit that wrote a marker leaves an orphaned note with no marker to resolve. Copying marked text also duplicates its `data-suggestion-id`, so two markers can point at one note. Reconciling these (marker/note garbage collection) is a pending design discussion.
