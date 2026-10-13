---
name: design-system-ui-composition
description: Use when building or changing a Gutenberg, plugin, or application interface, including custom UI that does not yet use WordPress Design System packages. Covers public component selection, composition, styling, and setup; route package-source changes to design-system-contribution.
---

# Compose a WordPress Design System interface

In a Gutenberg checkout, read the relative links below from the checked-out revision. Outside a checkout, resolve them from `.agents/skills/design-system-ui-composition/` in [Gutenberg on GitHub](https://github.com/WordPress/gutenberg/tree/trunk).

## Start with the requested behavior

Identify the interaction being added or changed and find a similar implementation in the target project. For an existing interface, check which component manages its state before editing.

For a text or prop change, keep the existing supported component unless the requested behavior requires a replacement.

## Choose components and tokens

Use the Design System MCP server's `get_components` to find the recommended component, then `get_component_details` to check its behavior, props, usage, and import. Without MCP, follow [Choose a recommended component](../../../docs/contributors/design/design-system-packages.md#choose-a-recommended-component).

Prefer component props for styling they already support. For custom styles, use the Design System MCP server's `get_design_tokens` when available. Without MCP, use the [token reference](../../../packages/theme/docs/tokens.md). Choose semantic `--wpds-*` tokens by the element's purpose and state, not by matching a raw value. Use `--wp--preset--*` when styling blocks or content previews with the active theme's `theme.json` presets. Do not mechanically replace every CSS literal with a token.

For Gutenberg, verify the API against the current source. For external projects using a different package or WordPress version, follow the [target-version checks](../../../docs/contributors/design/design-system-packages.md#check-the-target-version).

Choose the smallest public composition that meets the interaction contract. Keep product-specific compositions in the consuming package.

## Check the changed integration

- Before building a custom button, dialog, or other UI component, check whether an existing public component or composition meets the need. Use documented props and composition to adjust presentation instead of copying a component's implementation.
- For a migration, use the [contract comparison](../../../docs/contributors/design/design-system-packages.md#compare-contracts-before-replacing-an-api), including extension points used outside the repository.
- For overlays or changed rendering destinations, read [Setup depends on the document](../../../docs/contributors/design/design-system-packages.md#setup-depends-on-the-document). Inspect the actual portal container and its owner document. Check style delivery, inherited tokens, and focus there; a same-document portal does not create a new document.
- For a separate app or document, verify setup only for packages that render there. Record unresolved stylesheet, runtime-style, theming, or overlay requirements when they affect completion.

If a public API cannot meet the need, describe the missing behavior and options using [Contributing to the Design System](../../../storybook/stories/design-system/contributing.md). Respect an existing user decision about the gap; otherwise ask before introducing a workaround. Package fixes use [design-system-contribution](../design-system-contribution/SKILL.md) in a Gutenberg checkout. Outside one, draft an upstream report within the user's authorized scope.

## Verify and finish

Use [Verify the affected behavior](../../../docs/contributors/design/design-system-packages.md#verify-the-affected-behavior) to select checks for the changed interaction and rendering context. Reuse existing coverage and rely on dependency tests for behavior the dependency owns. Add a local test only when our code or integration introduces a meaningful regression risk that existing coverage does not address. Report what was verified and any material uncertainty.
