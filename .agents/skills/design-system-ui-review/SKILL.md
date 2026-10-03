---
name: design-system-ui-review
description: Use when reviewing Gutenberg, plugin, or application UI for WordPress Design System usage, including custom UI. For changes to Design System packages themselves, use design-system-code-review.
---

# Review UI for Design System use

In a Gutenberg checkout, read the relative links below from the checked-out revision. Outside a checkout, resolve them from `.agents/skills/design-system-ui-review/` in [Gutenberg on GitHub](https://github.com/WordPress/gutenberg/tree/trunk).

Read [Working with WordPress Design System packages](../../../docs/contributors/design/design-system-packages.md). Inspect the changed UI and styles, and consumers affected by the change. For a mixed package-and-consumer change, also use [design-system-code-review](../design-system-code-review/SKILL.md) on the package source.

## What to look for

1. **Custom UI that duplicates a recommended component.** Check hand-built controls such as notices, buttons, dialogs, and menus. Use the Design System MCP server's `get_components`, then `get_component_details` to verify the recommended component's behavior, props, and import. Without MCP, use the guide's [recommendation sources](../../../docs/contributors/design/design-system-packages.md#choose-a-recommended-component). Recommend a replacement when it meets the requirements and avoids unnecessary custom code or improves consistency; a visible bug is not required.
2. **Hard-coded visual values.** Look for colors, spacing, radii, typography, and shadows that should follow the Design System. Use the Design System MCP server's `get_design_tokens` when available. Without MCP, use the [token reference](../../../packages/theme/docs/tokens.md) to find a semantic token for the element's purpose and state. Prefer an existing component prop when it already expresses the intent. Do not replace every CSS literal or select a token merely because its current value matches.
3. **Tokens used for the wrong purpose.** Use semantic `--wpds-*` tokens for Design System interface styling and `--wp--preset--*` when styling blocks or content previews with the active theme's `theme.json` presets. Judge what is being styled: a content preview inside the editor can still need the active theme's presets. Check token roles and states as well as prefixes.
4. **Dependence on component internals.** Flag imports from package-private paths and selectors that depend on private classes or markup. Use documented props, styling hooks, or composition. If none meets the need, identify the missing capability rather than inventing an unsupported override.
5. **Accessibility problems in custom controls or composition.** Check accessible names, required keyboard behavior, focus indication, and focus handling affected by the change. If a recommended component supplies the missing behavior, name it. Use the guide's [verification guidance](../../../docs/contributors/design/design-system-packages.md#verify-the-affected-behavior) for the applicable standards and browser checks.
6. **Styles or theming lost at the rendering destination.** Inspect the actual portal container and owner document. A same-document portal can lose inherited tokens without needing another stylesheet or root provider. For iframes and new windows, check existing [document setup](../../../docs/contributors/design/design-system-packages.md#setup-depends-on-the-document) before recommending additions.

For Gutenberg, verify recommendations against the reviewed source. For external projects using a different package or WordPress version, follow the guide's [target-version checks](../../../docs/contributors/design/design-system-packages.md#check-the-target-version). For replacements, use its [contract comparison](../../../docs/contributors/design/design-system-packages.md#compare-contracts-before-replacing-an-api), including external extension points.

## Keep the review focused

- Do not request unrelated cleanup or migrate an existing supported component for a narrow copy or prop edit. Downstream breakage caused by the change is still in scope, even when the affected consumer is unchanged.
- Do not request tests merely because coverage is absent. Rely on dependency coverage for behavior the dependency owns. Request a local test only for a concrete, meaningful regression risk introduced by our code or integration that existing coverage does not address. Follow the guide's [test-selection guidance](../../../docs/contributors/design/design-system-packages.md#verify-the-affected-behavior); avoid speculative edge cases and exhaustive combinations.
- Name the verified component or token and explain what it improves. Combine findings when one replacement resolves them. Do not invent a replacement when the correct outcome is to identify a Design System gap.
