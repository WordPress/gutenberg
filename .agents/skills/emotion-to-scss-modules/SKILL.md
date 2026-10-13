---
name: emotion-to-scss-modules
description: Use when planning or implementing an Emotion-to-SCSS-Modules migration in @wordpress/components, including styled wrappers, css/useCx composition, and migration-related cascade fixes.
---

# Migrate Emotion styles to SCSS Modules

In a Gutenberg checkout, read the relative links below from the checked-out revision. Outside a checkout, resolve them from `.agents/skills/emotion-to-scss-modules/` in [Gutenberg on GitHub](https://github.com/WordPress/gutenberg/tree/trunk).

Read the [migration guide](../../../packages/components/emotion-to-scss-modules.md) and the package's [styling conventions](../../../packages/components/CONTRIBUTING.md#styling) before editing.

## Preserve behavior and consumer overrides

1. Identify the requested component and baseline. Search for consumers of its wrappers, style fragments, and public classes, including outside `packages/components`. Use the guide's [contract audit](../../../packages/components/emotion-to-scss-modules.md#establish-the-component-and-consumer-contract) to select affected states and compositions for comparison.
2. Capture the baseline for those cases. For a reported regression, reproduce it first. Apply the [translation rules](../../../packages/components/emotion-to-scss-modules.md#translate-the-styles), distinguishing static, conditional, and genuinely dynamic values. Preserve the wrapper's element, props, and ref behavior.
3. Check which declarations win after removing the wrapper. Follow the guide's [cascade checks](../../../packages/components/emotion-to-scss-modules.md#preserve-the-winning-declarations) for consumer overrides and remaining Emotion composition. Justify a specificity change with the actual conflicting declaration.

Keep intentional API, interaction, or visual changes within the agreed scope. Consult a [merged example](../../../packages/components/emotion-to-scss-modules.md#reference-migrations) only when it answers a migration question; an older exception is not a rule for this component.

## Verify the migration

Reuse existing tests and stories. A behavior-preserving migration may need no new tests. Add a focused test only for an uncovered risk introduced by the migration; do not duplicate shared helper or dependency suites. Follow the guide's [verification choices](../../../packages/components/emotion-to-scss-modules.md#verify-css-delivery-and-behavior) and the [testing overview](../../../docs/contributors/code/testing-overview.md#folder-structure).

Compare actual styles for the affected states and consumers, including RTL or another document when relevant. Class assertions and mocked styles cannot prove cascade or visual parity. Recheck affected consumers after subsequent selector changes or a rebase that changes relevant styles.

Follow the [completion checks](../../../packages/components/emotion-to-scss-modules.md#complete-the-migration) for scoped cleanup, affected downstream snapshots, generated files, required checks, and the migration changelog. Report any unverified styling case with reproducible manual steps.
