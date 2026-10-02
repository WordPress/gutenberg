---
name: design-system-code-review
description: Use when reviewing changes to @wordpress/components, @wordpress/ui, or @wordpress/theme and their public contracts. For application code that only consumes these packages, use design-system-ui-review.
---

# Review a WordPress Design System contribution

In a Gutenberg checkout, read the relative links below from the checked-out revision. Outside a checkout, resolve them from `.agents/skills/design-system-code-review/` in [Gutenberg on GitHub](https://github.com/WordPress/gutenberg/tree/trunk).

Read the affected package's `AGENTS.md` and [Working with WordPress Design System packages](../../../docs/contributors/design/design-system-packages.md#change-a-package-safely). Review the proposed source and the consumers it affects. For a mixed package-and-consumer change, also use [design-system-ui-review](../design-system-ui-review/SKILL.md) on the application code.

## What to look for

1. **Behavior in the wrong package or duplicated implementation.** Keep product-specific behavior in the consumer. Check whether existing components, helpers, or tokens already meet the need before adding another API or implementation. Use the MCP server's `get_components` and `get_component_details`, or the guide's [recommendation sources](../../../docs/contributors/design/design-system-packages.md#choose-a-recommended-component), when component selection matters; verify the result against the reviewed source.
2. **Broken component composition.** Check changes to prop and ref forwarding, rendered elements, controlled and uncontrolled state, callback arguments, and default behavior. Inspect affected wrappers and compound components. Test our changed integration where it introduces a meaningful risk; do not duplicate the underlying dependency's behavior tests.
3. **Incompatible public changes.** Use the guide's [contract comparison](../../../docs/contributors/design/design-system-packages.md#compare-contracts-before-replacing-an-api) for removed or changed props, exports, tokens, styling hooks, and extension points. Include external consumers; migrated Gutenberg callers do not prove plugin compatibility. Check that published types resolve through declared dependencies.
4. **Styles that break composition or theming.** Look for inappropriate hard-coded values, tokens selected by value rather than purpose, lost consumer overrides, and declarations that depend on stylesheet order. Use the Design System MCP server's `get_design_tokens` when available. Without MCP, use the [token reference](../../../packages/theme/docs/tokens.md) for semantic choices. Follow the package's styling guidance for its CSS conventions. Check portal destinations and affected theme modes when the change can alter them.
5. **Interaction or accessibility regressions.** Check the semantics, accessible names, keyboard paths, focus, and disabled states the change can affect. Use the guide's [verification guidance](../../../docs/contributors/design/design-system-packages.md#verify-the-affected-behavior) for standards and browser evidence. Passing types or class assertions do not prove interaction or visual parity.
6. **Public documentation or generated output left behind.** Check affected prop documentation, stories, component status and recommendation metadata, generated token assets, and required changelogs. Do not request new stories or documentation for an unchanged capability.

Apply [package-runtime-compatibility](../package-runtime-compatibility/SKILL.md) only when the changed contract crosses independently updated package and WordPress versions. For an Emotion migration, use the [migration guide](../../../packages/components/emotion-to-scss-modules.md) to check cascade and consumer compatibility.

Keep findings tied to the change, including downstream effects. Missing tests alone are not a finding. Reuse existing coverage and request a new check only for a concrete, meaningful risk introduced by our code or integration. Combine concerns that have one coherent fix.
