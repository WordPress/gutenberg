---
name: design-system-ui-composition
description: Use when building or changing a Gutenberg, plugin, or application interface, including custom UI that does not yet use WordPress Design System packages. Covers public component selection, composition, styling, and setup; route package-source changes to design-system-contribution.
---

# Compose a WordPress Design System interface

## Start with the requested behaviour

Inspect the target interface and a relevant nearby precedent. Identify what the user needs to do and which component owns the state. For a plan without a concrete host, state the assumptions that affect the API or interaction decision.

Keep an existing supported component for a narrow copy or prop edit when its behaviour and setup remain suitable. Do not turn that edit into a component migration or inventory unrelated runtime setup.

## Choose components and tokens

Use the Design System MCP server's `get_components` to find the recommended component, then `get_component_details` to check its behaviour, props, usage, and import. Without MCP, follow [Choose a recommended component](../../../docs/contributors/design/design-system-packages.md#choose-a-recommended-component).

Prefer component props for styling they already support. For custom styles, use `get_design_tokens` or the [token reference](../../../packages/theme/docs/tokens.md). Choose semantic `--wpds-*` tokens by the element's purpose and state, not by matching a raw value. Use `--wp--preset--*` for theme presets and content styling, including content previews inside the editor. Do not mechanically replace every CSS literal with a token.

For Gutenberg, verify the API against the current source. For external projects using a different package or WordPress version, follow the [target-version checks](../../../docs/contributors/design/design-system-packages.md#check-the-target-version).

Choose the smallest public composition that meets the interaction contract. A nearby menu or dialog is not a reason to add that behaviour to a simple trigger. Keep product-specific compositions in the consuming package.

## Check the changed integration

- For custom UI, check whether public composition meets the need before adding a control. Do not import package-private source or recreate an existing component just to adjust its presentation.
- For a migration, use the [contract comparison](../../../docs/contributors/design/design-system-packages.md#compare-contracts-before-replacing-an-api), including extension points used outside the repository.
- For overlays or changed rendering destinations, read [Setup depends on the document](../../../docs/contributors/design/design-system-packages.md#setup-depends-on-the-document). Inspect the actual portal container and its owner document. Check style delivery, inherited tokens, and focus there; a same-document portal does not create a new document.
- For a separate app or document, verify setup only for packages that render there. Record unresolved stylesheet, runtime-style, theming, or overlay requirements when they affect completion.

If a public API cannot meet the need, describe the missing behaviour and options using [Contributing to the Design System](../../../storybook/stories/design-system/contributing.md). Respect an existing user decision about the gap; otherwise ask before introducing a workaround. Package fixes use [design-system-contribution](../design-system-contribution/SKILL.md) in a Gutenberg checkout. Outside one, draft an upstream report within the user's authorized scope.

## Verify and finish

Use [Verify the affected behaviour](../../../docs/contributors/design/design-system-packages.md#verify-the-affected-behaviour) to select checks for the changed interaction and rendering context. Reuse existing coverage and rely on dependency tests for behaviour the dependency owns. Add a local test only when our code or integration introduces a meaningful regression risk that existing coverage does not address. Report what was verified and any material uncertainty.
