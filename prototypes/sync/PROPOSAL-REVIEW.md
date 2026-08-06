# Proposal review: the read API and resolution lifecycle

Design for review finding 1.3b's second half (REVIEW-2026-08-05.md): parked
escalations were durable (compaction re-appends proposal rows) but no user
could enumerate, inspect, or resolve them. Guiding principle: **proposals
are already rows in the room stream; the read API is the stream, not a new
surface.** Resolution is one new row type; everything else composes from
existing machinery.

## Wire

- **`resolved` rows** (client → server → clients): JSON
  `{ proposalId, resolution: 'restored'|'dismissed' }`. The server
  validates, stamps `resolvedBy` (actor id) and `time`, appends, relays.
  Idempotent by `proposalId` (= the escalated intent's intentId): a
  redelivered or concurrent second resolve settles identically with no new
  row, acked through the dispositions array as
  `{ intentId: proposalId, status: 'resolved' }`. An unknown proposalId
  acks the same way — it may be a resolved-and-trimmed proposal, and
  at-least-once transports must be able to settle.
- **Enriched proposal rows**: at write time (engine layer — the planner
  core stays pure and clock-free) the row gains `at` (engine seq at
  settlement), `time`, and `context.excerpt` (a short slice of the target
  field's text at escalation time), so review renders content-centrically
  after the document moves on. Rule-4 unit members share `txnId`; clients
  group them into one review item.
- **Restore is not a server operation.** Restoring parked content is the
  client authoring ORDINARY intents at the current head, then resolving.
  Restored content passes through the same planning rules as any edit —
  no privileged replay path.

## Server (WP_Intent_Log_Engine)

1. `handle_updates` accepts `resolved` beside `intent` (validation,
   idempotency, relay; no planning).
2. `load_room` derives open proposals (proposal rows − resolved rows) for
   validation.
3. **Retention rule**: compaction re-appends only UNRESOLVED proposals
   across a trim. Unresolved parked work is user content and persists
   indefinitely; resolved pairs age out with normal compaction.

No new REST route: a fresh or reset client receives all open proposals in
its bootstrap window (they are always above the trim floor). An
out-of-session read endpoint can be added later without changing this
design.

## Client

- **Session**: `getOpenProposals()` (arrival order, resolutions
  subtracted), `onProposalsChange`, `resolveProposal( id, resolution )`
  (emits the wire row; the transport's restore-on-error path re-sends it,
  and server idempotency absorbs duplicates).
- **Manager**: maps open proposals to review items
  `{ id, unitId, isLocal, actorId, reason, intentType, summary,
  excerpt }` and reports them through a new optional
  `RecordHandlers.onProposalsChange`. Actions:
  `resolveProposal( type, id, proposalId, resolution )` and
  `restoreProposal( type, id, proposalId )` — best-effort re-author (text
  family appends the lost text to the target field, attr/property writes
  re-apply at current observed versions, block inserts re-insert at the
  root end) followed by the resolution row. Types with no sensible
  auto-restore resolve without authoring; the UI shows the content for
  manual recovery.
- **core-data**: stores the per-entity review list from
  onProposalsChange; private actions wrap the manager methods. The
  escalation warning notice gains Restore/Dismiss actions (the common
  single-conflict flow); the full list panel is the remaining UI item.

## Properties

- Transport stays engine-blind; the swap story is untouched.
- "Never lose work" becomes checkable: every escalation is enumerable
  with its content, restorable through the normal edit path, and its
  lifecycle is durable and synced — tests can retrieve parked content.
- Bounded by construction: open proposals ride the retained window;
  resolved pairs trim.

Open follow-ups: offset transformation forward from `at` when the gap is
inside the retained log (content-centric fallback is always safe);
notifying an author when someone else dismisses their parked work; the
full review panel UI.
