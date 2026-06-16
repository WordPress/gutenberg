# Plan: Inline Suggestions on the shared inline-marker primitive (PR #78218)

- **Status:** Proposed (2026-06-16)
- **Decision:** Option B confirmed — suggested inline changes live as marked text in block content (not in an ephemeral overlay).
- **Depends on:** [#78218](https://github.com/WordPress/gutenberg/pull/78218) "Notes: inline (partial-text) notes via hybrid marker + strip-on-render". (Its base is `trunk`; [#75147](https://github.com/WordPress/gutenberg/pull/75147) multiple-notes-per-block already merged.)
- **Supersedes:** the bespoke inline-marking in [#77869](https://github.com/WordPress/gutenberg/pull/77869) (`suggestion-mode/inline-formats.js`).
- **Resolves / addresses:** [#73411](https://github.com/WordPress/gutenberg/issues/73411) (Riad's "brittle baseline" objection), [#79220](https://github.com/WordPress/gutenberg/issues/79220) (multi-author overlay collision).
- **Forward-compat target:** Yjs `AttributionManager` ([#77005](https://github.com/WordPress/gutenberg/issues/77005)).

---

## 1. Motivation

Today an inline suggestion is a **whole-attribute before/after snapshot**: the overlay
(`suggestion-mode/overlay-context.js`, keyed by `clientId`) holds the clean proposed value,
and the visible `<del>/<ins>` diff is **recomputed on every render** by
`markContentDiff(baseline, proposed)` (`inline-formats.js:159`), gated on `!isSelected`
(`with-suggestion-overlay.js:302`), then discarded. Nothing about the diff is persisted; only
the clean payload (`provider.js` `SuggestionPayload`, `operations[]`) crosses the wire.

Riad Benguella's review of the stack (#73411, 2026-06-16) names the core flaw: a `before`/`after`
attribute baseline becomes **inapplicable the moment an unrelated edit lands in the same block**.
If A suggests `"quick brown fox" → "quick red fox"` and B independently edits the block to
`"very quick brown fox"`, A's suggestion can no longer apply without overwriting B's "very". He
asks that inline suggestions instead **depend on the inline-comment anchoring primitive, and that
the primitive land first**.

PR #78218 is that primitive. Its spine:

1. A `core/note` RichText format serializing as `<mark class="wp-note" data-id="N">…</mark>`
   (`collab-sidebar/format.js`).
2. **Offsets derived on read**, never stored — `findNoteRange(value, noteId)` re-scans the
   rich-text `formats` array for the marker (`collab-sidebar/utils.js:147`). This is the single
   offset-resolution chokepoint and the explicit future-CRDT swap point.
3. Runtime decoration via `@wordpress/annotations` (`useAnnotateBlocks`, `hooks.js:562`) — never
   written back to content.
4. Marker stripped from front-end output by a `render_block` PHP filter
   (`gutenberg_strip_inline_note_markers`, `lib/compat/wordpress-7.1/block-comments.php:84`);
   marker kept in raw `post_content`/REST `raw`/revisions.
5. Auto-delete when the marked text is removed — `reconcileInlineNoteMarker` (anchor/delete/skip
   + a session-`Set` guard, `hooks.js:655`).

Adopting this model for suggestions converts an inline suggestion from "the whole attribute
changed" into "**this anchored range is suggested for deletion / this inserted run is suggested
for addition**", re-resolved against current content. That is the point of this plan.

## 2. Goals / non-goals

**Goals**

- Anchor inline suggestions to edit-surviving markers; derive positions on read; never persist
  absolute offsets.
- Make suggested inline text **live in block content** so it syncs via CRDT, survives reload, and
  is visible to all collaborators (Option B).
- Support **N concurrent, per-author** inline suggestions on one block (dissolve #79220).
- Carry `authorId` on every marker end-to-end (hydrate → render → resolve).
- Keep a single localized swap point for the eventual Yjs migration.
- Reuse #78218's primitive rather than maintaining a parallel system.

**Non-goals**

- Block-level structural suggestions (remove/insert/move) — unchanged; they don't use inline marks.
- The Notes feature itself — we generalize its helpers but do not change Notes behavior.
- The Yjs/`AttributionManager` migration — only kept a clean swap point.

## 3. The decision: marks-in-content (Option B)

| | A. Overlay + anchoring | **B. Marks in content (chosen)** |
|---|---|---|
| Deletion | Anchor a marker, keep proposed value in overlay | Wrap existing text in a `del` marker; strip wrapper-only on render (text stays until accepted) |
| Addition | Inject `<ins>` ephemerally at render (today) | Insert proposed text in an `add` marker; strip **wrapper + text** on render until accepted |
| Multi-author | Still needs per-author overlay re-keying | Each marker independent + author-tagged → #79220 dissolves |
| Sync/reload | Proposed text not synced; recomputed per client | Suggested text syncs via CRDT, survives reload, visible to all |
| Cost | Lighter; partial answer to Riad | Heavier; render/save must strip un-accepted added text |

**Chosen: B.** It is the only option that fully satisfies "anchor, don't snapshot", makes additions
multi-author-correct for free, and matches #78218's philosophy. Its distinctive cost is the
**addition-strip semantics** below — the main net-new work beyond reuse.

### Render/save strip semantics (the net-new piece)

#78218 strips the wrapper but keeps inner text (a note annotates existing text). Suggestions need
**type-aware** stripping at `render_block`:

- **Deletion mark** (`data-suggestion-type="del"`): strip the wrapper, **keep** the inner text.
  The text is not removed until the suggestion is accepted.
- **Addition mark** (`data-suggestion-type="add"`): strip the wrapper **and** the inner text. The
  proposed addition must never reach the published front-end until accepted.

Acceptance flips it: accept `del` → remove text + marker; accept `add` → unwrap (text becomes
permanent). Reject: `del` → remove marker only; `add` → remove marker + text (and auto-delete the
suggestion).

## 4. Architecture

### 4.1 Shared inline-marker primitive (generalized from #78218)

Extract a format-agnostic module — `packages/editor/src/components/inline-markers/` — consumed by
**both** Notes and Suggestions:

| New (generic) | Generalized from (#78218) | Notes |
|---|---|---|
| `findMarkerRange(value, { formatType, idAttribute, id })` | `findNoteRange` (`utils.js:147`) | **Single offset-resolution / CRDT swap point.** |
| `wrapInlineMarker(value, { formatType, attributes, start, end })` | `wrapInlineNote` (`hooks.js:446`) | `applyFormat` over `RichTextData`. |
| `readInlineSelection(getSelectionStart, getSelectionEnd)` | same (`hooks.js:409`) | Already generic; move as-is. |
| `reconcileMarkerRemoval(item, attributes, anchoredSet, { getId, onDelete })` | `reconcileInlineNoteMarker` (`hooks.js:655`) | anchor/delete/skip + session-`Set` guard. |
| `useAnnotateRanges({ source, ranges })` | `useAnnotateBlocks` (`hooks.js:562`) | Parameterize the hard-coded `source='core-note'`; each consumer gets its own `annotation-text-{source}` class. |

Refactor Notes to consume the generic module with **no behavior change** (protects #78218's
approval). **Do not** carry over the `_wp_note_selection` meta-offset fallback — ellatrix has an
open objection to it on #78218, and "derive on read" means the in-content marker is the single
source of truth.

### 4.2 Suggestion marker format

Register a distinct format (separate from `core/note` so the two coexist on one block):

```
<mark class="wp-suggestion"
      data-suggestion-id="N"
      data-suggestion-type="del|add"
      data-author="A">…</mark>
```

- Distinct class `wp-suggestion` (exact token) so the PHP strip and CSS never collide with
  `wp-note` or a user/`core/text-color` `<mark>`.
- `data-author` makes per-author tint and attribution structural (the #77869 Q1 fix, now built in).
- `data-suggestion-id` links to the persisted suggestion (the `note`-type comment id), mirroring
  #78218's identity linkage; offsets are always derived, never stored.

### 4.3 Decoration

Decorate via `useAnnotateRanges({ source: 'core-suggestion', ranges })` — runtime-only, never
written to content. CSS targets `.annotation-text-core-suggestion` (independent of Notes'
`.annotation-text-core-note`). Phase 5 aligns the add/remove visual language with the Revisions
diff UI (annezazu, #73411).

### 4.4 Strip filter (PHP)

A `render_block` filter in `lib/compat/wordpress-X.Y/`, analogous to
`gutenberg_strip_inline_note_markers`, but **type-aware** (§3): `del` strips wrapper-only, `add`
strips wrapper + text. Reuse #78218's two-pass `WP_HTML_Tag_Processor` + offset technique (it
already handles overlap/nesting); inherit the same temporary-hack caveat pending HTML API tag
removal ([#54583](https://github.com/WordPress/gutenberg/issues/54583), cc dmsnell).

### 4.5 Persistence & CRDT

`provider.js` keeps the finite, schema-enforced op set (Riad's "keep it bounded"). The inline ops
shift from carrying whole-attribute `before`/`after` to **anchored ranges keyed by marker id**;
`findMarkerRange` is the only place positions are resolved, so the Yjs `AttributionManager` swap
(#77005) stays a single localized change. The `note`-type comment + `metadata.noteId` array
linkage (already in the stack via #75147) is reused.

### 4.6 Multi-author (#79220)

In Option B each suggestion is an independent, identity-keyed, author-tagged marker in content, so
the single-slot `entries[clientId]` overlay (`overlay-context.js:114`) is no longer the inline
source of truth — the structural fix for #79220. Any residual in-progress-edit overlay keys by
**suggestion identity**, not bare `clientId`.

## 5. Branch topology & sequencing

#78218 is `trunk`-based with no hidden unmerged dependency; it shares a recent trunk merge-base
with the combined branch. So we **do not wait for #78218 to merge** — and we **do not rebase the
stack** (it is merge-assembled; rebasing merge commits is destructive, and only the inline layer
needs #78218).

Two mechanisms, two purposes:

1. **Combined testing branch (#78994) → MERGE `add/inline-notes-hybrid` in.** Matches combined's
   existing "Merge X stack into combined branch" pattern. After this, combined has #78218 + all
   suggest-mode phases, so Option-B work is developed and Playground-tested here now. Expect a
   real hand-resolved merge (both #78218 and #77869 touch `collab-sidebar/index.js` format
   registration, `collab-sidebar/hooks.js`/`utils.js`, `content-suggestion.scss`, and the notes
   data model). Resolving it early is itself the Phase 0–1 consolidation.
2. **Inline-suggestions phase branch → STACK on `add/inline-notes-hybrid`.** PR base =
   `add/inline-notes-hybrid` while #78218 is open; **retarget to `trunk` once #78218 merges** (the
   same move #78218 made off #75147). When #78218 changes in review, rebase this one branch onto
   the new tip — normal stacked maintenance, not a stack-wide rebase.

The structural phases (remove/insert/move, autosave, move-ghost) keep their current base.

## 6. Phased delivery

### Phase 0 — Unblock + extract the shared primitive
- Merge `add/inline-notes-hybrid` into combined (#78994); resolve the notes/collab-sidebar/inline
  conflicts.
- Extract `inline-markers/` (§4.1); refactor Notes to consume it with no behavior change.
- Omit the `_wp_note_selection` meta fallback from the primitive.
- *Acceptance:* Notes pass all #78218 tests post-refactor; the primitive has standalone unit tests.

### Phase 1 — Suggestion marker format + decoration + strip
- Register the `wp-suggestion` format (§4.2); decorate via `useAnnotateRanges` source
  `core-suggestion` (§4.3); add the type-aware PHP strip filter (§4.4).
- *Acceptance:* a hand-authored block with `del`/`add` suggestion marks renders decorated
  in-editor; front-end keeps del-text, drops add-text, removes all wrappers.

### Phase 2 — Deletion suggestions on anchored markers
- "Suggest delete" wraps the range with the `del` marker instead of recording a whole-content
  `after`; resolve live range via `findMarkerRange`; accept removes text+marker, reject removes
  marker. Wire through `provider.js` apply/reject.
- *Acceptance:* a deletion suggestion survives an unrelated edit elsewhere in the block and still
  applies to the right range (Riad's flaw gone for deletions).

### Phase 3 — Additions in content (net-new)
- Insert proposed text wrapped in the `add` marker; render-strip (Phase 1) removes wrapper+text on
  front-end; in-editor annotations decorate it as an insertion; accept unwraps, reject removes +
  auto-deletes via `reconcileMarkerRemoval`.
- **Validate autosave / undo-redo / RTC**: marked-added text now lives in synced content — confirm
  autosave persists it (stripped only at front-end), undo crosses marker boundaries, and a peer
  sees it via CRDT.

### Phase 4 — Retire the bespoke layer; dissolve #79220
- Remove `inline-formats.js` (`markContentDiff`, `stripSuggestionMarks`, `wrapAddition/Deletion`,
  the two `gutenberg/suggested-*` formats) and the `applyDiffMarks` / `stripMarksFromIncoming` /
  `isSelected`-gated `mergedAttributes` path in `with-suggestion-overlay.js`. Keep `wordDiff`
  (`suggestion-diff.js:28`) for the sidebar.
- Move `.has-suggestion-deletion/-addition` (`content-suggestion.scss:122`) to the annotation
  decoration; the block-level `is-suggestion-pending*` rules are unaffected.
- Replace/repurpose the single-slot overlay; any in-progress overlay keys by suggestion identity.
- *Acceptance:* two authors leave concurrent inline suggestions on one block, each correctly
  attributed and tinted, each diff baselined to its own author (#79220).

### Phase 5 — Visual alignment & authorship
- Align add/remove visuals with the Revisions diff UI (annezazu).
- `data-author` drives per-author tint surviving reload/reviewer view (#77869 Q1); track author
  color distinguishability ([#78255](https://github.com/WordPress/gutenberg/issues/78255)).
- Inverse cleanup: marks clear when a suggestion resolves elsewhere (the #77869 Q3 pattern, via
  `reconcileMarkerRemoval`).

### Phase 6 — CRDT readiness, tests, docs
- Confirm `findMarkerRange` is the sole offset-resolution point and the op set stays finite +
  schema-enforced.
- Unit tests (primitive), e2e (create / edit-around / accept / reject / multi-author),
  round-trip + PHP render-strip tests.
- Update `docs/explanations/architecture/suggestions.md`.

## 7. How review feedback is addressed

| Feedback (source) | Addressed by |
|---|---|
| Brittle before/after baseline forces lossy overwrite (Riad, #73411) | Anchored markers + derive-on-read (Phases 1–3) |
| Inline suggestions should depend on the inline-comment primitive, land it first (Riad) | Sequenced behind #78218; Phase 0 primitive |
| Multi-author collision on one block (#79220; saroshaga #77869 Q2) | Independent identity+author-keyed markers (Phase 4) |
| Authorship must follow the mark, not the viewer (#77869 Q1) | `data-author` on every marker (Phase 5) |
| Inverse cleanup when resolved elsewhere (#77869 Q3) | `reconcileMarkerRemoval` (Phase 5) |
| Align with Revisions add/remove visuals (annezazu) | Phase 5 |
| Forward-compatible with Yjs, finite op set (Riad, #77005) | Single `findMarkerRange` swap point; bounded ops (Phase 6) |
| Drop fragile meta-offset fallback (ellatrix, #78218) | Primitive omits `_wp_note_selection` fallback (Phase 0) |

## 8. Risks & open decisions

- **Addition-strip semantics** (Phase 3) is the main net-new design vs #78218 — validate
  render-strip + autosave + accept/reject early; it is the highest-risk item.
- **Overlapping / nested marks:** jasmussen's split-vs-nested serialization question on #78218 is
  unresolved. Suggestion marks must coexist with note marks and tolerate whichever lands; the
  offset scan and two-pass PHP strip already handle nesting/overlap, so this is low-risk but
  coupled to #78218's final shape.
- **`@wordpress/annotations` is `__experimental`** — we consume it (allowed); we do not add new
  experimental APIs.
- **PHP two-pass strip is explicitly temporary** (HTML API #54583) — inherited debt.
- **#78218 still in review** (Mamaduka's deep review pending; ellatrix meta-fallback open) — its
  API may move; Phase 0 starts after the merge-into-combined and tracks #78218's tip.
- **Open decision:** whether the `inline-markers/` extraction is upstreamed into #78218 itself
  (primitive ships with Notes) or carried on the inline-suggestions phase branch. Default: carry on
  the phase branch; offer to upstream if maintainers prefer.

## 9. Testing strategy

- **Unit:** the primitive (`findMarkerRange`, `wrapInlineMarker`, `reconcileMarkerRemoval`);
  Notes-unchanged regression after the refactor.
- **PHP:** `render_block` strip — del keeps text, add drops text, wrappers removed, raw/REST `raw`
  retain markers; overlap/nesting cases.
- **e2e:** create del + add suggestions; edit unrelated text in the same block and confirm the
  suggestion still anchors; accept/reject each type; two-author concurrent suggestions
  (attribution + tint); reload persistence.
- **Round-trip:** content with suggestion marks → serialize → parse → resolve ranges unchanged.

## 10. References

- PRs: [#78218](https://github.com/WordPress/gutenberg/pull/78218) (primitive),
  [#77869](https://github.com/WordPress/gutenberg/pull/77869) (interim inline-formats, superseded),
  [#78994](https://github.com/WordPress/gutenberg/pull/78994) (combined testing),
  [#75147](https://github.com/WordPress/gutenberg/pull/75147) (multiple notes per block, merged).
- Issues: [#73411](https://github.com/WordPress/gutenberg/issues/73411) (Suggest Mode tracking),
  [#79220](https://github.com/WordPress/gutenberg/issues/79220) (multi-author),
  [#59445](https://github.com/WordPress/gutenberg/issues/59445) (inline comments),
  [#77005](https://github.com/WordPress/gutenberg/issues/77005) (Yjs AttributionManager),
  [#54583](https://github.com/WordPress/gutenberg/issues/54583) (HTML API tag removal),
  [#78255](https://github.com/WordPress/gutenberg/issues/78255) (author color distinguishability).
- Architecture: `docs/explanations/architecture/suggestions.md`.
