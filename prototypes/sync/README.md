# Sync prototype (graduated)

The intent-log engine prototyped here graduated to the sync stack, and —
with the whole engine/transport layer — now lives in the **Gutenberg Sync
Engines plugin** (`~/Code/gutenberg-sync-engines`, its own repo): the client
engine (bridge/manager/session), the frozen cross-language core
(`src/engines/intent-log/` — engine modules, SPEC.md, jest suites, simulator,
frozen vectors, generator/sweep tools), and the PHP twins
(`WP_Intent_Log_Document`, `WP_Intent_Log_Planner`).

The Gutenberg framework keeps only the engine-neutral **substrate** (see
`ARCHITECTURE.md` → _The framework/plugin split_). It still ships a
byte-identical copy of the frozen core at
`packages/sync/src/engines/intent-log/` solely so the e2e can import
`genesisSyncId` at compile time — a TODO to consolidate.

This directory retains the planning documents:

- `ARCHITECTURE.md` — the three-plane integration design (transport /
  engine / bridge), the swappable-engine constraints, and per-phase status.
- `INTEGRATION.md` — the Redux-mapping analysis, the disposition of the
  `core-data` crdt\* utilities, and the text-intent capture design.
