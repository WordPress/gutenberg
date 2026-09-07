---
name: emotion-to-scss-modules
description: Use when planning or implementing an Emotion-to-SCSS-Modules migration in @wordpress/components, including styled wrappers, css/useCx composition, and migration-related cascade fixes.
---

# Migrate Emotion styles to SCSS Modules

## Establish the scope

1. Read the [migration guide](../../../docs/contributors/code/emotion-to-scss-modules.md) and the package's [styling conventions](../../../packages/components/CONTRIBUTING.md#styling) before editing.
2. Identify the requested component or dependency cluster and the baseline revision. Search for imports of its wrappers/style fragments and consumers of its public classes, including outside `packages/components`.
3. Record the contract and the states at risk using the guide's [contract audit](../../../docs/contributors/code/emotion-to-scss-modules.md#establish-the-component-and-consumer-contract). Select a relevant [merged example](../../../docs/contributors/code/emotion-to-scss-modules.md#reference-migrations), then check its lesson against current source.

## Implement and compare

1. Capture baseline behavior for the affected states and at least one relevant composed consumer. For a reported regression, establish a failing test or browser reproduction first.
2. Apply the guide's [translation rules](../../../docs/contributors/code/emotion-to-scss-modules.md#translate-the-styles). Reuse the underlying component or shared polymorphic utility according to the existing contract. Classify values as static, conditional, or genuinely dynamic before choosing Sass, module classes, or custom properties.
3. Audit the [winning declarations](../../../docs/contributors/code/emotion-to-scss-modules.md#preserve-the-winning-declarations) after removing the wrapper. Check consumer overrides, remaining Emotion composition, shorthand/longhand precedence, and nested instances. Explain any required specificity adjustment with the conflicting declaration.
4. Use the guide's [verification choices](../../../docs/contributors/code/emotion-to-scss-modules.md#verify-css-delivery-and-behavior). Class assertions prove wiring only. Check actual styles in a browser, including RTL or root/iframe differences when applicable. Keep fixture-CSS tests limited to the registration or composition mechanism they exercise.
5. Keep intentional API, interaction, or visual changes explicit and within the requested scope. An older migration's exception does not authorize the same change here.

## Finish

Follow the guide's [completion checks](../../../docs/contributors/code/emotion-to-scss-modules.md#complete-the-migration), including scoped cleanup, whole-repository snapshot review, type checking, builds, generated-file checks, and the current migration changelog convention.

Recheck affected consumers after the last selector edit or rebase. Report the preserved behavior, any agreed change, the real-style evidence, and any unverified case. Do not report visual parity from mocked styles or passing snapshots alone.
