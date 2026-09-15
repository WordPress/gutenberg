---
name: design-system-code-review
description: Use when reviewing a Gutenberg change to a WordPress Design System package or its public contract, including `@wordpress/components`, `@wordpress/ui`, or `@wordpress/theme`; do not use to implement the change or review a consumer-only application.
---

# Review a WordPress Design System contribution

## Establish the review boundary

1. Define the changed public surface and observable behaviour.
2. Scan the complete diff once, then classify it as:
   - **Internal:** no public contract or observable behaviour changes.
   - **Public:** adds, removes, renames, or changes supported behaviour.
3. Read [Working with WordPress Design System packages](../../../docs/contributors/design/design-system-packages.md)
   and the applicable package source guidance.
4. Apply the public guide's evidence precedence: the diff is the proposed
   post-change state, target source is its baseline, and MCP is supplementary
   current-design context.

## Review proportionally

For an internal change, verify contract preservation and focused coverage, then
skip the public-only work below. For a public change:

- assess Gutenberg and external package consumers separately;
- verify compatibility and migration rather than treating repository migration
  as sufficient;
- before drafting findings for a removal, replacement, or rename, compare the
  old and new accepted values, semantics, states, interaction, and styling in
  a compact contract table; complete the comparison even after finding one
  valid defect;

For either classification, use the public guide's
[package completion gate](../../../docs/contributors/design/design-system-packages.md#change-a-package-safely)
and inspect only the surfaces applicable to the change.

If a published package can run with a dependency supplied separately by WordPress, apply the [`package-runtime-compatibility`](../package-runtime-compatibility/SKILL.md) skill before concluding the review.

Use browser evidence when source or class assertions cannot establish visual,
focus, motion, or layout parity.

## Finding evidence gate

Before reporting a finding, identify the exact changed line, affected public
contract or behaviour, target-source or consumer evidence, and concrete impact.
Treat incomplete diff context as a verification gap unless the complete patch
proves the defect. Apply the same evidence and precision standard even when
another valid defect already exists.

## Output contract

Recheck every finding against the complete diff and source. Separate defects,
verification gaps, and optional follow-ups. Report material findings with
proportional severity and the smallest coherent direction; report no findings
when the evidence exposes none.
