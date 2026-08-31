---
name: package-runtime-compatibility
description: Use when changing or reviewing a published package API, dependency, entrypoint, or shared runtime gate across independently updated package and WordPress versions.
---

# Assess package and runtime compatibility

1. Read the package guide's
   [cross-version compatibility procedure](../../../packages/README.md#maintaining-cross-version-compatibility).
2. Name the contract that changes and the package and runtime versions that can
   run together in production. Include each supported entrypoint.
3. Confirm what the bundle contains and what WordPress supplies. Check package
   metadata, build configuration, dependency extraction, generated artifacts,
   module-load gates, and dependencies that must share one runtime identity.
4. Run the guide's direct-consumer check and four version pairings where they
   apply.
5. Before removing compatibility code, find the older package versions that
   still use it and check maintained downstream bundles.
6. Mark each required pairing as `pass`, `fail`, or `unverified`. Do not remove
   the compatibility code while a required pairing is unverified.
7. When adding compatibility coverage, follow the
   [testing skill](../testing/SKILL.md) and establish the unsupported pairing
   before implementing its bridge or fallback.
8. Report the evidence, required compatibility or support change, release
   order, migration target, and any unverified runtime.
