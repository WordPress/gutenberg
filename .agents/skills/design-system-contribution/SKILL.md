---
name: design-system-contribution
description: Use when planning or implementing changes to @wordpress/components, @wordpress/ui, or @wordpress/theme in a Gutenberg checkout. For application code that only consumes these packages, use design-system-ui-composition.
---

# Contribute to the WordPress Design System

## Establish the contract

1. Identify the requested outcome, affected package, and consumers. For a proposal, distinguish agreed behaviour from open design decisions.
2. Read [Working with WordPress Design System packages](../../../docs/contributors/design/design-system-packages.md#change-a-package-safely) and the affected package's `AGENTS.md`. Follow its links for the component, styling, theming, or token work at hand.
3. Classify the change by its effect. Internal work preserves supported behaviour; public changes include additions, removals, renames, and changes to observable behaviour, even without a type change.
4. For a new capability, check existing public composition and similar components or tokens. If they meet the need, use them within the requested scope. For unresolved public design decisions, follow [Contributing to the Design System](../../../storybook/stories/design-system/contributing.md#fix-it-at-the-source) before implementation. Continue independent work that does not depend on that decision.

## Implement within the boundary

- Keep product-specific behaviour in the consuming package. A mixed package-and-consumer task also uses [design-system-ui-composition](../design-system-ui-composition/SKILL.md) for the application changes.
- For replacements and migrations, compare the affected old and new contracts using the [compatibility guidance](../../../docs/contributors/design/design-system-packages.md#compare-contracts-before-replacing-an-api). Establish the regression or baseline behaviour before editing.
- Apply [package-runtime-compatibility](../package-runtime-compatibility/SKILL.md) when the change affects a contract between a bundled package and dependencies supplied separately by WordPress. The mere presence of an external dependency does not require a compatibility matrix for an unrelated edit.
- For an Emotion migration, use [emotion-to-scss-modules](../emotion-to-scss-modules/SKILL.md).

## Verify the affected behaviour

Use the public guide's [completion checks](../../../docs/contributors/design/design-system-packages.md#change-a-package-safely) and [verification guidance](../../../docs/contributors/design/design-system-packages.md#verify-the-affected-behaviour). Choose checks for the affected contract; documentation-only edits do not need a component interaction suite. Follow the repository's required lint, type, build, and changelog rules.

Report the resulting behaviour and any unresolved compatibility or verification gap. Do not claim visual parity from types, snapshots, or class assertions alone.
