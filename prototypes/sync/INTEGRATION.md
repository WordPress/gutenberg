# Integrating the intent log into Gutenberg — design note

Status: discussion notes (2026-08-04), not a plan of record. Companion to
`SPEC.md`. Records the Redux-mapping analysis, the fate of the existing
`core-data` CRDT utilities, and the text-intent capture design.

## Do intents map to Redux actions?

Partially. Structure and attribute intents map cleanly onto
`core/block-editor` actions; text intents do not exist at action
granularity and must be derived. The intent log is NOT a serialization of
the action stream — it is a derived, identity-addressed vocabulary. The
action stream is the right capture point because it carries semantics a
tree diff cannot recover (move vs delete+insert, split vs replace).

| Intent | Redux counterpart | Translation work |
| --- | --- | --- |
| `set_attr` / `remove_attr` | `updateBlockAttributes` | per-key diff; `observedVersion` from shadow doc |
| `insert_block` | `insertBlock(s)`, `insertDefaultBlock` | index → `afterSiblingId`; mint syncId at creation |
| `remove_block` | `removeBlock(s)`, `__unstableDeleteSelection` | capture `removed` payload |
| `move_block` | `moveBlocksToPosition`, `moveBlocksUp/Down` | index → sibling anchor |
| `merge_blocks` | `mergeBlocks` | nearly 1:1 |
| `split_block` | `__unstableSplitSelection`, RichText `onReplace` | often arrives as `replaceBlocks`; must be recognized |
| `transform_block` | `replaceBlocks` via `switchToBlockType` | 1:1 only; N:M → remove+insert |
| text family | — (no action at this granularity) | derived; see "Capturing text-level intents" |
| `replace_attr_content` | — | server-agent/REST path; no editor counterpart |
| `txnId` | one user gesture / registry batch | e.g. cross-block delete-selection is one unit |

Mismatches to bridge: addressing (ephemeral `clientId` vs persistent
`metadata.syncId` — the arch-decision minter is the bridge), ordering
(indices vs sibling anchors), and the fact that most of the action surface
is UI state (selection, hover, drag, insertion point) that maps to the
awareness channel, not the log. `selectionChange` also matters inbound:
after remote intents apply, the local caret is remapped with the engine's
point transform (the `pointOf` logic in rebase).

## Integration seams

1. **Capture** (new, hardest): a `core/block-editor` subscriber/middleware
   deriving intents from action + before/after tree. Continuously
   verified: apply the derived intent to the shadow doc via the reducer
   and assert equality with the editor's actual new tree; on mismatch,
   fall back to a coarser intent. Suggested first harness: record real
   editor sessions as action logs → derive → replay → compare.
2. **Client engine**: shadow document + `planBatch` (this prototype),
   packaged dependency-free (where `packages/sync` sits today) so
   `block-editor` stays WP-agnostic. On receive: replan, then translate
   the optimistic-doc delta into targeted dispatches (not `resetBlocks`).
3. **Server**: PHP twin of `planBatch` in `lib/experimental/collaboration`,
   replacing the Yjs-shaped `sync_step1/step2` payloads in
   `WP_Sync_Server_Core` with intent batches. Transport shells
   (long-poll, WebSocket), actor stamping at ingest, and the base-version
   CAS survive unchanged.

## Fate of `core-data/src/utils/crdt*`

These files are today's answer to the same problem the capture layer
solves — "Gutenberg hands us full new state; recover deltas" — but they
recover deltas positionally into Yjs types. Under the intent-log
architecture (pending the benchmark decision; nothing is removed until
then):

| Today | Disposition |
| --- | --- |
| `mergeCrdtBlocks` positional left/right-sweep block diff | **Replaced as capture source** (position-keyed; converts a move into delete+insert — exactly what identity addressing exists to avoid). A syncId-keyed descendant survives in two changed roles: capture VERIFIER, and fallback deriver where no action semantics exist (code editor reparse — see `preserveClientIds`). |
| Y-type machinery (`createNewYBlock`, `mergeYValue`/`mergeYArray`, schema→Y.Text/Y.Array/Y.Map, `applyDelta`) | **Goes away with Yjs.** Shadow doc is plain data + reducer; convergence comes from server total order. |
| Duplicate-clientId repair, `preserveClientIds` | **Replaced by syncId identity** (remint-on-duplicate lives in the minter). |
| `applyPostChangesToCRDTDoc` / `getPostChangesFromCRDTDoc`, sync config, `_crdt_document` persistence | **Role survives, retargeted**: entity bridge points at shadow doc + outbox; persistence becomes log/snapshot persistence. |
| `mergeRichTextUpdate` (full string → Delta `diffWithCursor` → Y.Text) + verification fallback | **Technique survives, promoted; code does not.** It is the seed of text-intent derivation, but it diffs serialized HTML (indices count tag/entity characters) and emits Y deltas. Reincarnated as a rich-text-coordinate diff emitting text intents (below). The verify-then-fallback pattern (`isDeltaVerificationMatch`) is the same idea as the capture fidelity check. |
| `crdt-utils` offset converters (`htmlIndexToRichTextOffset` etc.), `crdt-text` RichTextData cache | **Directly reusable** by the capture layer. |
| `crdt-selection` / `crdt-user-selections` | **Role survives** as awareness + point-transform caret remapping; Y relative-position machinery goes away. |

So: "goes away except the text diffing part" is close, with two
corrections — several non-text pieces survive in changed roles (verifier,
fallback, entity bridge, offset converters), and the text-diffing part
itself survives as a technique, not as code (coordinate space and output
representation both change).

## Capturing text-level intents

Layered, best-effort-with-verification:

1. **Selection-anchored rich-text diff** (phase 1, upgrade of today's
   approach). At `updateBlockAttributes` time for `rich-text` attributes:
   diff old vs new `RichTextData` — plain `text` with the caret as hint
   (before/after selection from the store), classified into
   `insert_text` / `delete_text` / `replace_text`; diff the `formats`
   array separately into `format_text`. Working in RichTextValue
   coordinates (plain-text UTF-16) matches the prototype's convention and
   sidesteps HTML-index pitfalls. The cursor hint resolves the classic
   `aa|a → aaa` ambiguity — same reason `diffWithCursor` exists today.
2. **Verification**: replay derived intents through the reducer on the
   shadow block; mismatch → demote to a single `replace_text` over the
   changed span; ultimate fallback `replace_attr_content` (the coarse
   family exists exactly for this, and its escalation cost enforces
   decomposer granularity, same as for server agents).
3. **Structural text ops are not diffs**: split/merge/paste-replacing
   arrive via `__unstableSplitSelection` / `mergeBlocks` / `onReplace`
   and are captured as `split_block` / `merge_blocks` (+ `insert_text`
   for pasted text), preserving identity lineage.
4. **Input-event capture** (phase 2, higher fidelity): hook the RichText
   change pipeline where `beforeinput`/input types and selection are both
   known (`insertText`, `deleteContentBackward`, IME composition
   boundaries). True intents, no inference; more invasive.

### Engine changes this implies

- ~~Text intents need an `attributeKey` dimension~~ **Done (2026-08-05):**
  blocks carry named fields, every text-coordinate intent names its
  `field`, and conflict granularity (rebase + frame rules) is per field —
  see SPEC.md "The field dimension". The capture layer supplies `field`
  from the rich-text attribute key it is diffing.
- Multiline rich-text attributes have a known scoping wrinkle (see the
  `@todo` in `updateYBlockAttribute`).
- The code-editor path (full HTML reparse per keystroke) cannot yield
  fine intents; it maps to coarse per-block replacement — acceptable, and
  consistent with treating it as an out-of-band-like writer.
