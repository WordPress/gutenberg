---
name: design-system-code-review
description: Use when reviewing changes to @wordpress/components, @wordpress/ui, or @wordpress/theme and their public contracts. For application code that only consumes these packages, use design-system-ui-review.
---

# Review a WordPress Design System contribution

## Establish the review boundary

1. Read the complete diff and identify the affected packages and observable behaviour. Distinguish internal changes from additions, removals, renames, or changes to supported behaviour.
2. Read [Working with WordPress Design System packages](../../../docs/contributors/design/design-system-packages.md#change-a-package-safely) and the affected package's `AGENTS.md`. Follow only the source guidance relevant to the change.
3. Establish what the checkout represents: base, proposed head, or another revision. Use the diff and corresponding source together; do not assume the checkout is always the baseline. Check API availability against the target version. Current Storybook or MCP recommendations do not prove older runtime support.
4. For a mixed change, also use [design-system-ui-review](../design-system-ui-review/SKILL.md) on its application consumers.

## Review the affected contracts

For internal work, verify preservation of behaviour and focused coverage. For a public change, assess Gutenberg and external consumers separately, following the guide's [contract comparison](../../../docs/contributors/design/design-system-packages.md#compare-contracts-before-replacing-an-api). Complete the affected comparison even after finding one defect; a table is useful for a multi-part replacement, not required for every edit.

Check applicable exports, types, documentation, recommendation metadata, generated files, and changelog requirements through the guide's [completion checks](../../../docs/contributors/design/design-system-packages.md#change-a-package-safely). Apply [package-runtime-compatibility](../package-runtime-compatibility/SKILL.md) when the changed contract crosses independently updated package and WordPress versions.

Use the guide's [verification guidance](../../../docs/contributors/design/design-system-packages.md#verify-the-affected-behaviour) to distinguish source evidence from behaviour that needs a browser. For an Emotion migration, also read the [migration guide](../../../packages/components/emotion-to-scss-modules.md).

## Report supported findings

Tie each finding to a changed line, the affected contract, source or consumer evidence, and concrete impact. A diff excerpt or an unrun check is a verification gap unless other evidence proves a defect. Repository requirements can justify a finding without a runtime regression; cite the requirement and its consequence.

Recheck findings against the complete proposed change. Separate defects, verification gaps, and optional follow-ups. Give the smallest coherent correction and proportional severity. Report no findings when the evidence supports none. This review does not authorize edits or posting a GitHub review.
