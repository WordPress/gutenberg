---
name: package-runtime-compatibility
description: Use when planning, implementing, or reviewing a published package change to imports, exports, entrypoints, dependencies, registrations, allowlists, opt-in gates, or compatibility bridges.
---

# Assess package and runtime compatibility

1. Read the package guide's
   [cross-version compatibility procedure](../../../packages/README.md#maintaining-cross-version-compatibility).
2. State the changed contract, its published consumers, its providers, and the
   exact artifact, entrypoint, and runtime versions in scope.
3. Verify each deployment topology from package metadata, build configuration,
   dependency extraction, and generated artifacts. Include module-load gates
   and shared-identity dependencies in the audit.
4. Apply the guide's direct-consumer check and old/new matrix where relevant.
   Trace the affected older package versions into maintained downstream bundles
   before removing a compatibility route.
5. Record every required cell as `pass`, `fail`, or `unverified`. Keep a
   destructive removal blocked while a required cell is unverified.
6. When adding compatibility coverage, follow the
   [testing skill](../testing/SKILL.md) and establish the unsupported pairing
   before implementing its bridge or fallback.
7. Report the evidence, required bridge or support change, release sequence,
   migration target, and any unverified runtime.
