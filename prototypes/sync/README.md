# Sync prototype (graduated)

The intent-log engine prototyped here has graduated to
`packages/sync/src/engines/intent-log/` — engine modules, SPEC.md, jest
test suites, deterministic simulator, frozen cross-language test vectors,
and generator/sweep tools all live there now. The PHP twin lives in
`lib/experimental/collaboration/` (`WP_Intent_Log_Document`,
`WP_Intent_Log_Planner`), validated against the same frozen vectors.

This directory retains the planning documents:

- `ARCHITECTURE.md` — the three-plane integration design (transport /
  engine / bridge), the swappable-engine constraints, and per-phase status.
- `INTEGRATION.md` — the Redux-mapping analysis, the disposition of the
  `core-data` crdt\* utilities, and the text-intent capture design.
