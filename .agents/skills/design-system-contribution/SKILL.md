---
name: design-system-contribution
description: Use when planning or implementing changes to @wordpress/components, @wordpress/ui, or @wordpress/theme in a Gutenberg checkout. For application code that only consumes these packages, use design-system-ui-composition.
---

# Contribute to the WordPress Design System

Read the affected package's `AGENTS.md` and the relevant [package contribution guidance](https://github.com/WordPress/gutenberg/blob/trunk/docs/contributors/design/design-system-packages.md#change-a-package-safely).

## Choose the smallest change

Start from the consumer's need. For a bug fix, reproduce the failure and identify the behavior to restore. For a refactor, identify the behavior to preserve. A new capability needs a concrete use case and an explanation of why existing public composition is insufficient.

When choosing a component or token, use the Design System MCP server's `get_components`, `get_component_details`, and `get_design_tokens` as appropriate when available. Without MCP, use the guide's [recommendation sources](https://github.com/WordPress/gutenberg/blob/trunk/docs/contributors/design/design-system-packages.md#choose-a-recommended-component) and the [token reference](https://github.com/WordPress/gutenberg/blob/trunk/packages/theme/docs/tokens.md). Check the current source before adding an API that appears to be missing.

Keep product-specific behavior in the consuming package and use [design-system-ui-composition](https://github.com/WordPress/gutenberg/blob/trunk/.agents/skills/design-system-ui-composition/SKILL.md) for that work. For unresolved public design decisions, follow [Contributing to the Design System](https://github.com/WordPress/gutenberg/blob/trunk/storybook/stories/design-system/contributing.md#fix-it-at-the-source) before implementation; continue work that does not depend on that decision.

## Preserve the affected contracts

- Follow the package's component, prop/ref, state, and styling conventions. Reuse existing composition and helpers instead of rebuilding behavior already provided by a dependency.
- For removals, replacements, or behavior changes, compare the affected old and new contracts using the [compatibility guidance](https://github.com/WordPress/gutenberg/blob/trunk/docs/contributors/design/design-system-packages.md#compare-contracts-before-replacing-an-api). Include plugin and npm consumers, even when all Gutenberg callers have been migrated.
- For token changes, choose by semantic purpose and affected modes, then follow the [token source guide](https://github.com/WordPress/gutenberg/blob/trunk/packages/theme/tokens/README.md) and [build procedure](https://github.com/WordPress/gutenberg/blob/trunk/packages/theme/README.md#building). For Emotion migrations, use [emotion-to-scss-modules](https://github.com/WordPress/gutenberg/blob/trunk/.agents/skills/emotion-to-scss-modules/SKILL.md).
- Use [package-runtime-compatibility](https://github.com/WordPress/gutenberg/blob/trunk/.agents/skills/package-runtime-compatibility/SKILL.md) only when changing a contract between independently updated package and WordPress versions.

## Verify what changed

Start with existing tests and stories. Add coverage only for a concrete regression risk introduced by our code or integration that existing coverage does not address. Rely on dependency tests for behavior the dependency owns; avoid speculative edge cases and exhaustive combinations. Use the guide's [verification choices](https://github.com/WordPress/gutenberg/blob/trunk/docs/contributors/design/design-system-packages.md#verify-the-affected-behavior) for checks that need a browser.

Follow the [completion checks](https://github.com/WordPress/gutenberg/blob/trunk/docs/contributors/design/design-system-packages.md#change-a-package-safely) for affected exports, documentation, generated files, and changelogs, along with the repository's required checks. State any material verification gap without claiming visual parity from snapshots or class assertions.
