---
name: package-runtime-compatibility
description: Use when changing or reviewing a published package across independently updated package and WordPress versions, including API, dependency, entrypoint, registration, allowlist, opt-in, and compatibility changes.
---

# Assess package and runtime compatibility

1. Read [Testing published packages across WordPress versions](../../../docs/contributors/code/package-runtime-compatibility.md).
2. Identify what the consumer bundles, what WordPress supplies, and which versions can run together. Include every supported entrypoint.
3. Run the guide's existing-consumer check and, when WordPress supplies a dependency, its four version combinations. Use the built package. Check published types, dependency extraction, behaviour, and any state that separate package copies must share.
4. Before removing compatibility code, find the maintained bundles that still use it. Mark every required combination as `pass`, `fail`, or `unverified`. Do not remove the code while a required combination is unverified.
5. When adding coverage, follow the [testing skill](../testing/SKILL.md) and reproduce the unsupported combination before adding its fallback.
6. Report the evidence, release order, required support change, and any unverified combination.
