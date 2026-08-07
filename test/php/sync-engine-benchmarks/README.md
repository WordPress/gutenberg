# Sync-engine benchmark harness

Compares server sync engines **through the production seam** — the same
`WP_Sync_Engine::handle_updates()` / `get_updates_since()` calls the polling
transport makes — so the numbers are the real engine's, not a model's. It
exists to make the architecture decision (which engine, or keep both) a
matter of evidence.

Two engines are registered today:

- **`intent-log`** (`WP_Intent_Log_Engine`) — server-authoritative: the
  server transforms each edit against the log, so it can report exactly how
  every edit settled.
- **`yjs-relay`** (`WP_Yjs_Relay_Engine`) — a dumb relay: the merge happens
  in each client's CRDT, so the server never sees the outcome.

## What it measures

**Cost** (both engines):

- `service_us` — per-request service time of `handle_updates` (p50/p90/p99/
  max/mean, reported in ms). Only storage is swapped for an in-memory
  implementation, so this isolates *engine* CPU (the intent-log planner and
  replay; the relay's append) from database I/O, which is the same
  transport-level cost for either engine and would otherwise dominate.
- `payload_bytes` — request and response sizes on the wire.
- `storage.rows` / `storage.bytes` — how the room grows. This is measured
  exactly even though storage is in-memory, because growth is a real
  differentiator: the intent log checkpoints and trims; a naive relay keeps
  every update forever.

**Quality** — policy-correct, and only where the server can observe it:

- `dispositions` — for the intent log, the count of edits that were
  `applied` (merged), `escalated` (set aside for human review), or `voided`.
- `escalation_rate` — escalated / total. This is **reported, not
  penalized**: sending a genuine conflict to review is the point, not a
  failure.
- `lost_work` — edits that were dropped without being applied or preserved
  for review (a `voided` with a non-benign reason). The project's policy is
  *never lose work*; this asserts it. It is `0` in every scenario here.
- `converged` — a fresh replica that reads the whole room materializes the
  same content the server does.

For `yjs-relay`, quality is reported as **not server-observable**. The relay
does its merge on the client; there is no PHP CRDT to score convergence or
conflict outcome here, so the harness says so rather than inventing a
number.

### Why not a "merge retention" score

An earlier harness scored quality as *silent-merge retention*: how much
concurrently-typed content survived an automatic server merge. That rewards
last-write-wins — precisely the behaviour this project rejects, because it
silently discards one editor's work. Under that metric a lossy engine that
quietly overwrites can outscore one that surfaces the conflict. This harness
inverts it: the signal is **nothing lost**, with conflicts *surfaced for
review* (an outcome, not a demerit).

## Scenarios

| Slug                  | Shape                                                        |
| --------------------- | ----------------------------------------------------------- |
| `solo-typing`         | One editor, one document. Baseline cost, no contention.     |
| `parallel-paragraphs` | N editors, each in their own paragraph. Clean concurrency.  |
| `contended-paragraph` | N editors restyling the SAME block. High escalation.        |
| `mixed-newsroom`      | Mostly parallel, ~25% of rounds collide on one block.       |

Contention is modelled as concurrent writes to a versioned register (a
block's alignment), because concurrent *text* inserts merge cleanly (the
text interleaves — correct, not a conflict). Same seed ⇒ same workload.

## Running

The engines need WordPress (`get_post`, `serialize_block`, and a `$wpdb` for
the ingest lock), so run inside the environment under test via wp-cli.
Options are bare `key=value` tokens — wp-cli would claim `--flags` itself.

```bash
wp eval-file test/php/sync-engine-benchmarks/benchmark.php \
    engine=intent-log scenario=mixed-newsroom \
    rounds=200 clients=4 paragraphs=8 seed=42

# Head-to-head: run both engines over the same scenario and seed.
for e in intent-log yjs-relay; do
  wp eval-file test/php/sync-engine-benchmarks/benchmark.php \
      engine=$e scenario=contended-paragraph rounds=200 clients=4 seed=42
done
```

Add `json=out.json` to also write the full report.

## Reading the results

Representative run (`mixed-newsroom`, 150 rounds, 4 clients, 8 paragraphs,
600 requests):

| Metric              | intent-log       | yjs-relay              |
| ------------------- | ---------------- | ---------------------- |
| service ms (mean)   | ~0.67            | ~0.0004                |
| service ms (p99)    | ~1.19            | ~0.001                 |
| storage rows        | 296 (bounded)    | 600 (one per edit)     |
| quality             | 480 applied, 114 to review, **0 lost**, converged | not observable |

The comparison the decision turns on:

- **intent-log** spends real server CPU per request (it transforms and plans
  the merge) and in return keeps storage bounded through checkpointing and
  gives a server-side, policy-correct quality signal — nothing lost, every
  conflict surfaced for review. Under a `contended-paragraph` load (4
  editors on one block) it escalates ~74% and still loses nothing.
- **yjs-relay** is a near-free relay, but the merge cost and conflict
  outcome live on the client where the server cannot see them, and storage
  grows one row per edit forever (no server-side compaction, because the
  server has no document to snapshot).

## Limitations

- **Single-process, no queueing model.** This measures per-request service
  time and growth, not tail latency under a saturated worker pool. The
  DE-RTC harness's multi-process request-queue simulation could be layered
  on top of these engine adapters later.
- **yjs quality is unmeasured here** by construction (no PHP CRDT), not by
  omission. A fair quality comparison would need a yjs client oracle.
- **In-memory storage** understates absolute per-request time (no real DB
  round-trip) but keeps the *engine* comparison clean; storage growth is
  exact. For end-to-end latency including MySQL, point the runner at
  `WP_Sync_Post_Meta_Storage` instead.
