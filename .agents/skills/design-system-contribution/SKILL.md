---
name: design-system-contribution
description: Plan and implement a safe change to `@wordpress/components`, `@wordpress/ui`, or `@wordpress/theme` in a local Gutenberg checkout. Use for package maintenance and public-contract work; do not use for consumer-only application changes or infer commit, push, or pull-request authority.
---

# Contribute to the WordPress Design System

## Authority and scope

- Use this skill only in a local Gutenberg checkout when changing
  `packages/components`, `packages/ui`, or `packages/theme`.
- Follow the target repository's package conventions and release policy. A
  change request does not authorize commits, pushes, or pull-request writes.
- Keep package internals distinct from the published contract and assess
  external consumers as well as Gutenberg call sites.

## Establish the problem and public boundary

Before implementation, audit affected consumers and similar components or
tokens. Explain the missing public behaviour, why existing composition is
insufficient, and whether the change is an internal implementation detail or a
new or changed public contract.

Read the cross-package guide and the package-specific source guidance that
matches the change:

- [`docs/contributors/design/design-system-packages.md`](../../docs/contributors/design/design-system-packages.md)
- [`packages/components/CONTRIBUTING.md`](../../packages/components/CONTRIBUTING.md)
- [`packages/ui/CONTRIBUTING.md`](../../packages/ui/CONTRIBUTING.md)
- [`packages/theme/tokens/README.md`](../../packages/theme/tokens/README.md)

Use an available WordPress Design System MCP server to learn current direction
when useful, but verify implementation and compatibility against this checkout.

## Implement deliberately

Follow the relevant package's current source precedents for component/API
design, compatibility, CSS architecture, token sources, exports, stories, and
tests. Keep package internals separate from the published contract. For a
public change, make an explicit decision about compatibility, migration,
documentation, and generated output.

## Verify

Run focused tests, lint/type checks, and required generation or build checks.
Inspect consumers in Gutenberg and assess downstream consumers separately.
Manually verify interaction or CSS behaviour when a module-level test cannot
prove it.

## Escalate decisions

Stop for product or design-system agreement when a public component, token, or
API decision lacks a clear accepted behaviour. Include the consumer evidence,
alternatives considered, compatibility impact, and proposed public contract.
