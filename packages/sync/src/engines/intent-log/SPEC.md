# Sync Foundations — Prototype Spec

Status: prototype / investigation (originally branch
`chriszarate/investigate-rtc-arch`; continued on `chriszarate/try-intent-log`).
This directory is a standalone, dependency-free library. It is **not** wired
into the Gutenberg build or npm workspaces, and nothing here is a shipping API.

## Purpose

Validate the composed architecture explored in the RTC re-architecture
discussion:

- **Per-block sync map** for the entity graph: per-key versioned registers and
  curated ordering, keyed by persistent block identity.
- **Server-sequenced intent log with client rebase** for rich text and
  structure: convergence via a single server-assigned total order and a
  deterministic reducer, not CRDT math.

The layers are deliberately separable so they can be reused by *other*
architectural approaches (including a server-materialized CRDT):

| Layer | Reusable by |
| --- | --- |
| Identity (`syncId`) | Any engine; also Notes anchoring, deep links |
| Intent vocabulary | Any server-authoritative engine; fuzzer generator spec |
| Reducer | Materialization on client and server; source for the PHP twin |
| Rebase + escalation | The intent-log engine; escalation policy reusable by review lane |
| Simulator + oracles | Validation of ANY engine (can drive a CRDT baseline on the same fixtures) |

## Decided policy

Offline: **never lose work, merge what's clean, review what isn't.** Silent
automatic prose merging after deep divergence is explicitly not a requirement.
Offline is the far end of the latency-tier spectrum: reconnect catch-up is the
same code path as poll catch-up, with a bigger batch.

## Block identity (`syncId`)

Two-regime minting:

1. **Genesis** — blocks that exist in a saved revision without IDs:
   `syncId = base64url( sha256( "postId:revisionId:path.join('.')" )[0..16) )`.
   A pure function of an immutable saved revision. Never computed against live
   editor state. Deterministic, so any number of independent minters (clients
   or server) agree with zero coordination.
2. **Creation** — blocks born during a session (insert, paste-as-new,
   split-second-half): fresh random UUID at creation time.

Invariants:

- A stamped block is never re-minted.
- The genesis minter takes a revision object; it structurally cannot see
  in-flight edits.
- IDs are opaque after minting. Nothing may parse meaning back out of them.

`test-vectors/sync-id.json` is the frozen cross-language contract: the PHP
implementation must reproduce these bytes exactly.

Lifecycle: duplication remints; 1:1 transforms carry the ID; split keeps the
ID on the first half and mints fresh for the second (stamping `syncParent`);
merge keeps the survivor's ID.

## Intent envelope

```
{ intentId,   // client-minted UUID — idempotency key, server dedupes
  actorId,    // server-verified at ingest; NEVER trusted from the client
  baseSeq,    // log position the client had observed when authoring
  txnId?,     // atomic group: applies or escalates as a unit
  type, payload }
```

Attribution model: `actorId` is a server-side fact about log rows (stamped
from the authenticated request), never stored in document content, and is the
only attribution usable for authorization. An optional advisory
`onBehalfOf` descriptor may be displayed but never trusted. On proposal
acceptance, applied intents preserve the original author's `actorId`; the
acceptance is a separately attributed event (dual attribution: suggested by X,
accepted by Y). Capability checks bind to the accepter and to exactly the
reviewed (hash-pinned) intents.

## Intent vocabulary (14 types)

Design principles: identity-addressed (never position-addressed); closed
vocabulary with explicit lifecycle ops (split/merge are first-class, never
delete+insert); invertible (destructive ops carry removed content); atomic
groups via `txnId`.

Map family:

- `set_attr { syncId, key, value, observedVersion }`
- `remove_attr { syncId, key, observedVersion }`

Entity family (document-level properties — title, excerpt, … — as per-name
registers on the document itself, the entity analog of the block attr map;
carried as `props`/`propVersions` on the document, present only once
written so pre-entity documents canonicalize unchanged):

- `set_property { name, value, observedVersion }`

Concurrent writes to the SAME property escalate (`property-conflict`, the
rule-3 analog); different properties, and property-vs-block edits, always
merge clean. Whole-value registers, not text merging: entity properties are
short scalars where "review the loser" beats character interleaving.

Structure family:

- `insert_block { block(subtree with pre-minted syncIds), parentId, afterSiblingId }`
- `remove_block { syncId, removed }`
- `move_block { syncId, newParentId, afterSiblingId }`
- `split_block { syncId, field, offset, newSyncId }`
- `merge_blocks { survivorId, absorbedId, field, joinOffset }`
- `transform_block { syncId, newBlockType, attrMap }` (1:1 only)

Text family (offsets valid at `baseSeq`; code units):

- `insert_text { syncId, field, offset, text }`
- `delete_text { syncId, field, start, end, removedText }`
- `format_text { syncId, field, start, end, format, on }`
- `replace_text { syncId, field, start, end, removedText, text }` (atomic delete+insert)

Coarse family (server-agent decomposer fallback; escalation storm by design —
its measured cost enforces decomposer granularity):

- `replace_attr_content { syncId, field, newText, observedVersion }`

### The field dimension

Blocks carry NAMED rich-text fields (`fields: name → { text, formats }`),
mirroring real blocks' multiple rich-text attributes (quote value +
citation). Every text-coordinate-bearing intent names its `field`
(`createIntent` defaults an omitted field to `content`; the frozen payload
always carries it explicitly). Consequences:

- **Conflict granularity is per field.** Concurrent edits to different
  fields of the same block never conflict — not in rebase transforms, not
  in the frame rules (frame keys are `syncId::field`; a whole-block key
  covers all of a block's fields, used when a merge consumes a block).
- **Split** divides only the split field; the block's other fields stay
  whole on the head, and the tail carries only the split field (matches
  editor split semantics). Concurrent edits to other fields ride through
  untouched.
- **Merge** joins only the named field; the absorbed block's other fields
  are dropped (matches editor merge semantics — merging into a paragraph
  discards a citation). A concurrent edit to a dropped field escalates
  (`merge-dropped-field`), so the drop can never silently swallow another
  actor's work.
- The capture layer derives `field` from the rich-text attribute key it is
  diffing (see INTEGRATION.md).

Proposal-lane operations (propose/accept/reject) are NOT document intents;
a proposal is a parked bundle of the above plus review state.

## Rebase (one-sided transform)

Because the server assigns a total order, the only required property is
one-sided (no OT/TP2): rebasing a client's pending intents over the acked
slice `(baseSeq, head]` and appending them yields the server's document.

Same-actor rule: intents are authored sequentially per actor against local
state that already includes that actor's earlier intents, so rebase skips
transforming over priors from the same actor (both shifts and escalation).
Prototype assumes one active session per actor.

**Soundness limit of the one-sided transform (frame rules).** The same-actor
rule makes a pending intent's text offsets valid only in its author's local
frame: base state plus the author's OWN earlier pending edits. Transforming
such an intent over another actor's edit compares offsets across mismatched
frames — reconciling both shifts would require a two-sided OT with TP-1
obligations. The engine does not attempt that. Instead it tracks, per batch
and per block, whether the author's local text frame has diverged from the
server's, and escalates coordinates it cannot express (rules 5 and 6 below).
Under the decided policy this is the correct trade: silently misplacing text
is worse than asking for review. The `frame-conflict` regression test in
`test/client.test.js` pins the misplacement this prevents.

## The batch planner (shared client/server core)

`planBatch( units, log, docAt )` in `src/rebase.js` is a pure function that
plans one client's batch against a log: frame checks, rebase, rule-4 unit
settlement, and the apply phase. The server commits a plan at ingest; a
caught-up client runs the SAME function over its verbatim log copy to
predict dispositions and build its optimistic document. Prediction parity is
therefore by construction, and the simulator's prediction oracle guards the
construction (any server-only state or client-side shortcut surfaces as a
mismatch). The PHP twin must mirror exactly this function.

Client model (`src/client.js`): a replica keeps `log` (observed prefix),
`baseDoc` (acked state), and `outbox` (pending intents exactly as authored —
the server always receives originals and re-derives transforms itself). On
every catch-up it replans; escalated/voided pending intents drop out of the
optimistic document but stay in the outbox so the server records their
dispositions and files proposals.

Settlement positions (`atSeq`): every non-clean outcome carries the log
index of the entry that settled it. A well-behaved client observes that
entry, drops the effect locally, and re-authors on a clean frame — so
phantom state only poisons intents whose `baseSeq` predates the settlement
(rule 6), and a rule-4 unit settles at the EARLIEST trigger among its
members (any other choice would depend on how entries were batched during
delivery).

## Escalation rules (complete list)

An intent escalates to the proposal lane iff:

1. `target-deleted` — its target block (or required ancestor) was deleted by
   another actor.
2. Its text position/range intersects another actor's concurrent destructive
   edit in the SAME block field — intersection, not adjacency
   (`position-in-deleted-range`, `concurrent-insert-in-range`,
   `concurrent-replace-overlap`, `range-crosses-split`, `content-replaced`
   for the coarse family, and `merge-dropped-field` when a concurrent merge
   dropped the field the intent addresses).
3. `attr-conflict` — it is a map write whose `observedVersion` lost the
   versioned-register race on the same key to another actor.
   `property-conflict` is the entity analog: a `set_property` racing another
   actor's write to the same property name.
4. It shares a `txnId` with an intent that escalated (settled as a unit at
   the earliest member trigger).
5. `frame-conflict` — its text coordinates read a block FIELD that BOTH an
   earlier own applied intent and another actor's concurrent intent have
   written (one-sided transform cannot reconcile the frames). Includes the
   intra-unit case where the own write is an earlier member of the same txn.
   Field-scoped: a remote write to a different field of the same block does
   not conflict.
6. `dependent-on-escalated` — it depends on an earlier own intent that did
   not apply: it reads a frame containing a phantom write, or addresses a
   block only a phantom intent created. Scoped by `baseSeq`: intents
   authored after the author observed the settling entry are clean.

Everything else auto-merges. Formats avoid POSITIONAL escalation (a format
range crossing a concurrent split clips to the first half; format frames may
drift — cosmetic, recoverable), but a format over content a concurrent
replace-class prior rewrote still escalates with that prior's reason — the
content under the range is gone, not merely shifted. Moves never conflict
with content edits (identity addressing). Idempotent convergence voids
rather than escalating: deleting the same content twice (`already-deleted`),
removing an already-removed block (`already-removed`), and merging an
already-merged pair (`already-merged`) are clean voids, not conflicts. A
concurrent merge into a DIFFERENT survivor, or any other identity-addressed
intent on a merge-absorbed block, escalates (`target-deleted`): the
absorption must never silently swallow another actor's work.

`ESCALATION_REASONS` in `src/rebase.js` is the closed set of reasons; the
escalation-soundness oracle rejects anything else.

## Server policy escalations (outside the planner)

`requires-approval` is a WordPress-side POLICY escalation, not a planner
rule: it never appears in the frozen vectors and has no JS-twin analog. At
ingest, before planning, the PHP engine parks any unit containing an intent
whose payload would materialize markup its author may not publish (per
`wp_kses_post`, when the authoring user lacks `unfiltered_html`). The
markup-bearing surfaces are: `format_text` span format ids when turning a
format ON (element formats are judged through the codec's own serializer;
`obj|{"html":…}` object formats re-emit verbatim HTML and are judged
directly), `insert_block` specs (field formats recursively, the `_wrapper`
internal attr — which materialize rebuilds as raw markup — and every other
attr's string leaves), and `set_attr` writes (`_wrapper` judged as a
wrapper; other values by their string leaves). Attr strings matter because
blocks without an html/rich-text-source attribute ride the ATTR lane, not
the codec field lane, and their save() can re-emit the attr as raw markup
client-side — core/html `content` is the canonical case. Plain text
payloads (field text) are entity-encoded by the serializer and always
safe. The soundness of attr judgment RESTS on attrs being register
writes: every `set_attr` carries the complete new value, so a protected
value cannot be composed from individually-benign edits (a benign
"[script]…" attr later bracket-swapped to "<script>…" is judged — and
parked — on the swap's full bytes). If attr strings ever gain a delta
lane, each delta must be judged against the RESULTING value, not the
delta's own bytes. The parked proposal
uses the ordinary proposal row shape, so replay, retention, resolution, and
review UI apply unchanged — and a restore re-authors the content as new
intents under the RESTORER's capability, which is what makes restore-by-a-
privileged-reviewer an approval and restore-by-anyone-else a safe no-op
(it simply re-escalates).

Relatedly (validity, not capability): block type names materialize into
comment delimiters unescaped, so `is_valid_payload` rejects names outside
the block-name grammar (`namespace/name`, lowercase alphanumeric-dash) for
every user — a crafted name could close the comment and inject markup.

Invalid rows settle PER-INTENT: an intent failing envelope or payload
validation voids with reason `invalid-payload` (rows without even a
recoverable intentId are dropped), never a request-level 400 — one bad row
(a client bug or a hostile crafted row) must not starve the batch's valid
edits or wedge the author's outbox in a permanent retry loop. Malformed
resolutions and server-emitted update types from clients remain 400s.

## Validation oracles

Checked by the deterministic simulator after every seeded schedule
(`npm run sweep` for the long-running version):

- **Convergence**: after all outboxes drain, every client's acked AND
  optimistic documents equal a fresh replay of the server log.
- **Prediction parity**: at every flush, the client's predicted disposition
  for every pending intent — computed by running the shared planner over its
  own log copy — exactly equals the server's disposition (status and
  reason). This exercises client-side rebase as a client operation and makes
  the convergence oracle non-tautological.
- **Intent accounting** ("never lose work", mechanical): every submitted
  intent has exactly one terminal disposition — applied, escalated (present
  in proposal lane), or voided (recorded reason). No disposition = failure.
- **Effect verification**: for every applied log entry, the documented
  effect of its (transformed) payload is visible in the document at its log
  position (`verifyEffect` in `src/simulator.js`) — "applied" means
  verifiably applied.
- **Escalation soundness**: every proposal's reason is in the documented
  rule set and every proposal is attributed to its author.
- **Idempotency**: randomly redelivered batches change neither the log, the
  proposals, nor any disposition.
- **Determinism**: same seed → identical final state; same log → same
  document on every replay.
- **Attribution preservation**: every applied intent retains its authoring
  `actorId` through rebase; escalated proposals are attributed to their
  author. (Blame-fold oracle across split/merge provenance: follow-up.)

Beyond the simulator, `test/merge-matrix.test.js` runs every ordered pair of
vocabulary operations through real client replicas and asserts the same
invariants pairwise (plus a bounded escalation rate), and
`test/scenarios.test.js` pins exact merge semantics for the cases a human
would reason about.

## Measured escalation profile

The reference sweep (60 seeds × 400 steps × 3 clients, ~17k intents) lands
at ≈67% applied / ≈31% escalated / ≈2% voided. About half the escalations
are `dependent-on-escalated`: the simulator keeps editing a conflicted block
while offline, and each subsequent same-block edit rides its predecessor
into review — one conflict parks its whole dependent chain, which is the
policy-correct behavior ("review what isn't clean") but makes proposal-lane
BUNDLING (grouping a chain into one reviewable proposal) a design
requirement, not a nicety. The schedule is adversarial (3 actors
concurrently editing 5 blocks with frequent offline windows); real-document
escalation rates need the divergence fixtures from the benchmark plan.

## Known simplifications in this prototype

- Format spans are kept unnormalized (overlapping same-type spans allowed).
- Ordering uses ordered child arrays (the log is totally ordered); the
  fractional-index representation for the map layer is deferred.
- A `delete_text`/`replace_text` range that crosses a concurrent split point
  escalates rather than splitting into two intents (open item). Formats clip
  instead (they never escalate).
- Format ranges are exempt from frame rules 5/6: under a frame conflict a
  format span may land shifted (cosmetic drift, recoverable), by design.
- `removedText`/inversion payloads are carried but not updated by transforms
  and undo is not implemented; effect verification derives expectations from
  the document, not from `removedText`.
- The client replans its full outbox against its log copy on every catch-up
  (O(pending × slice)); production needs incremental planning or bounded
  outboxes, without changing planner semantics.
- Code-unit convention: PINNED as UTF-16 code units in both languages. JS
  strings are UTF-16 natively; the PHP twin slices via UTF-16LE conversion
  (`WP_Intent_Log_Document::text_length`/`text_slice`), and the frozen
  vectors carry multibyte BMP content so a byte-offset implementation
  cannot pass. Remaining edge: an offset landing INSIDE a surrogate pair
  (astral characters) is not yet pinned cross-language; vector content
  deliberately stays within the BMP.

## Rich-text codec

Field text is PLAIN text: `rich-text.js` (JS) and `WP_Intent_Log_Rich_Text`
(PHP twin) convert a block's inline HTML into `{ text, formats }` and back,
frozen by `test-vectors/rich-text.json`. Formatting elements (em, strong,
a, code, …) become spans whose format id encodes the tag and its sorted
attributes (`tag` or `tag|{"attr":"value"}`); `<br>` is a newline; any
other element (or a comment) collapses to ONE object replacement character
(U+FFFC) whose span carries the raw source verbatim; unsupported or
malformed input degrades to a whole-field object — round-trip exact,
opaque to merging, never wrong. Consequences: text intents never carry
markup characters, concurrent merges cannot corrupt HTML, and the capture
bridge derives `split_block`/`merge_blocks` from identity + concatenation
signals and `format_text` from span diffs — the engine's split/merge and
format semantics are reachable from real typing.
