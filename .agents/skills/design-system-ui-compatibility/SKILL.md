---
name: design-system-ui-compatibility
description: Use when planning, implementing, or reviewing a change to `@wordpress/ui` or a WordPress-provided dependency that may break published UI consumers or cross-version runtimes, including UI public API changes, new runtime API assumptions, dependency export changes, private-to-public migrations, or bundled and externalized package boundaries; do not use for consumer-only application work or internal changes with no compatibility risk.
---

# Assess `@wordpress/ui` compatibility

## Establish the boundary

1. State the changed UI contract and every package or runtime that provides it.
2. Read the public guide's
   [bundled and externalized compatibility procedure](../../../docs/contributors/design/design-system-packages.md#assess-bundled-and-externalized-compatibility)
   and [`@wordpress/ui` public API guidance](../../../packages/ui/CONTRIBUTING.md#public-apis).
3. Record whether each dependency is bundled, externalized to a WordPress
   `wp.*` runtime, or can be deployed either way. Verify this from package
   metadata and generated asset data rather than package names alone.

Name exact version pairs. Do not use "backward" or "forward" alone when the
direction could be ambiguous.

## Build the evidence matrix

For a change to the UI package's own public surface, first run representative
existing consumer source against the candidate package. Verify its types,
bundle, and behaviour; migrating Gutenberg call sites is not a substitute.

When the change also crosses a package deployment boundary, use the public
guide's four old/new UI and externalized-runtime pairings. For each supported
cell, record `pass`, `fail`, or `unverified` separately for:

-   dependency installation and resolution;
-   published exports and TypeScript declarations;
-   bundled and externalized builds;
-   the actual WordPress runtime export shape; and
-   the affected UI behaviour.

Use exact published versions and candidate package artifacts in isolated
temporary consumers. Current repository source proves only the new/new cell.
Mocks prove a contract branch, but not dependency extraction, duplicate package
identity, or the runtime shipped by a supported WordPress version.

## Choose a compatible transition

-   Prefer adding the replacement, migrating maintained consumers, and removing
    the old route only after every supported matrix cell is verified.
-   Keep a compatibility bridge when an old bundle must run with a new runtime,
    or a new bundle must run with an old runtime. Centralize capability detection
    rather than spreading version checks through components.
-   Do not treat a private or pre-1.0 label as proof that a removal is harmless.
    Assess the published packages that carry the dependency.
-   If compatibility requires dropping a supported version, make that an explicit
    product and release decision with migration guidance. Do not hide it inside
    an implementation change.

## Finish

Report the matrix, evidence for each cell, required bridge or support change,
release sequence, and any unverified runtime. A destructive removal remains
blocked while a required cross-version cell is unverified.

When adding compatibility coverage, follow the
[testing skill](../testing/SKILL.md) and establish the unsupported pairing
before implementing its bridge or fallback.
