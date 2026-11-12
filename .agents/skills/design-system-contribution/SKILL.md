---
name: design-system-contribution
description: Use when planning or implementing changes to @wordpress/components, @wordpress/ui, or @wordpress/theme in a Gutenberg checkout. For application code that only consumes these packages, use design-system-ui-composition.
---

# Contribute to the WordPress Design System

In a Gutenberg checkout, read the relative links below from the checked-out revision. Outside a checkout, resolve them from `.agents/skills/design-system-contribution/` in [Gutenberg on GitHub](https://github.com/WordPress/gutenberg/tree/trunk).

Read the affected package's `AGENTS.md` and the relevant [package contribution guidance](../../../docs/contributors/design/design-system-packages.md#change-a-package-safely).

## Choose the smallest change

Start from the consumer's need. For a bug fix, reproduce the failure and identify the behavior to restore. For a refactor, identify the behavior to preserve. A new capability needs a concrete use case and an explanation of why existing public composition is insufficient.

When choosing a component or token, use the Design System MCP server's `get_components`, `get_component_details`, and `get_design_tokens` as appropriate when available. Without MCP, use the guide's [recommendation sources](../../../docs/contributors/design/design-system-packages.md#choose-a-recommended-component) and the [token reference](../../../packages/theme/docs/tokens.md). Check the current source before adding an API that appears to be missing.

Before choosing color tokens, read [Keep color roles aligned](../../../packages/theme/docs/tokens.md#keep-color-roles-aligned). Preserve the target, tone, and emphasis across interaction states. Change only the state segment unless a documented component-specific pattern requires otherwise. For example, brand-toned secondary, tertiary, and link Button text should use `--wpds-color-foreground-interactive-brand-disabled` when disabled. Equal current values do not make brand and neutral tokens interchangeable.

Keep product-specific behavior in the consuming package and use [design-system-ui-composition](../design-system-ui-composition/SKILL.md) for that work. For unresolved public design decisions, follow [Contributing to the Design System](../../../storybook/stories/design-system/contributing.md#fix-it-at-the-source) before implementation; continue work that does not depend on that decision.

## Preserve the affected contracts

- Follow the package's component, prop/ref, state, and styling conventions. Reuse existing composition and helpers instead of rebuilding behavior already provided by a dependency.
- For removals, replacements, or behavior changes, compare the affected old and new contracts using the [compatibility guidance](../../../docs/contributors/design/design-system-packages.md#compare-contracts-before-replacing-an-api). Include plugin and npm consumers, even when all Gutenberg callers have been migrated.
- For token changes, choose by semantic purpose and affected modes, then follow the [token source guide](../../../packages/theme/tokens/README.md) and [build procedure](../../../packages/theme/README.md#building).
- Use [package-runtime-compatibility](../package-runtime-compatibility/SKILL.md) only when changing a contract between independently updated package and WordPress versions.

## Verify what changed

Start with existing tests and stories. Add coverage only for a concrete regression risk introduced by our code or integration that existing coverage does not address. Rely on dependency tests for behavior the dependency owns; avoid speculative edge cases and exhaustive combinations. Use the guide's [verification choices](../../../docs/contributors/design/design-system-packages.md#verify-the-affected-behavior) for checks that need a browser.

When changing component recommendations, follow the [component status guidance](../../../packages/ui/CONTRIBUTING.md#component-status) to update Storybook status, curated `manifest` tags, ESLint recommendation lists, migration guidance, and generated manifest snapshots together. When a `@wordpress/ui` component replaces a `@wordpress/components` component, follow the stages in [Replace a legacy component](../../../docs/contributors/design/design-system-packages.md#replace-a-legacy-component).

Follow the [completion checks](../../../docs/contributors/design/design-system-packages.md#change-a-package-safely) for affected exports, documentation, generated files, and changelogs, along with the repository's required checks. State any material verification gap without claiming visual parity from snapshots or class assertions.

## Maintain the published agent skills

`@wordpress/ui` and `@wordpress/theme` ship consumer skills in `packages/<package>/skills/<name>/SKILL.md`, which consumers link into their agent skills directories. Consumer setup is in [Using with AI: Skills](../../../storybook/stories/design-system/agent-skills.md).

- Name each skill `wp-` plus the short package name, such as `wp-ui` for `@wordpress/ui`, with a suffix for a narrower topic, such as `wp-ui-migration`, and keep `skills` in the package's `files` list so it is published.
- Keep each skill self-contained. It is copied into consumer projects, so relative links into this repository do not resolve there. Link to the published Storybook or packages instead.
- Do not publish the skills in `.agents/skills/` as they are. They are for contributors working in a Gutenberg checkout and link into the repository. [design-system-ui-composition](../design-system-ui-composition/SKILL.md) and [design-system-ui-review](../design-system-ui-review/SKILL.md) are written for application code that only consumes the packages, so adapt them as the source for the published skills. The consumer-facing sections of the [package guide](../../../docs/contributors/design/design-system-packages.md) (work boundary, target version, choosing a component, setup per document) can be adapted the same way. The other skills cover contributing, testing, security and release compatibility, and are not useful to consumers.
- When a published skill changes, add a changelog entry to the affected package.
- `packages/theme/skills/wp-theme/references/tokens.md` is a generated copy of `packages/theme/docs/tokens.md`, written by the token build. Edit the source, then run the token build instead of editing the copy.
