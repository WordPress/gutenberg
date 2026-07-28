---
name: design-system-contribution
description: Use when planning or implementing a safe `@wordpress/components`, `@wordpress/ui`, or `@wordpress/theme` change in a local Gutenberg checkout; do not use for consumer-only application changes or infer commit, push, or pull-request authority.
---

# Contribute to the WordPress Design System

## Decide whether a package change is needed

1. State the missing behaviour and affected consumers.
2. Audit existing public composition and similar components or tokens.
3. If supported behaviour already meets the need, recommend it and stop unless
   the request establishes a distinct contract.
4. Classify the remaining change as internal or public.

Read the cross-package guide and the package-specific source guidance that
matches the change:

- [`docs/contributors/design/design-system-packages.md`](../../docs/contributors/design/design-system-packages.md)
- [`packages/components/CONTRIBUTING.md`](../../packages/components/CONTRIBUTING.md)
- [`packages/ui/CONTRIBUTING.md`](../../packages/ui/CONTRIBUTING.md)
- [`packages/theme/tokens/README.md`](../../packages/theme/tokens/README.md)

Use an available WordPress Design System MCP server to learn current direction
when useful, but verify implementation and compatibility against this checkout.

## Scale work to the contract

- For an internal change, preserve the public contract and run focused checks.
- For a public change, define the contract and assess external consumers,
  compatibility, migration, documentation, and generated output.
- For a replacement or rename, compare observable old and new values, states,
  and interaction—not only types or class names.

Follow current package precedents only where they apply. Do not add stories,
documentation, release work, or compatibility machinery to an unchanged public
capability.

## Finish

Run focused tests and required lint, type, generation, or build checks. Verify
interaction or CSS behaviour where source-level tests cannot establish it.

Stop for product or design-system agreement when a public component, token, or
API lacks accepted behaviour. Include consumer evidence, alternatives,
compatibility impact, and the proposed contract.
