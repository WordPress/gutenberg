---
name: design-system-ui-review
description: Use when reviewing Gutenberg, plugin, or application UI/UX, including custom UI that does not yet use WordPress Design System packages. Covers public API usage, styling, interaction, accessibility, and setup; route package-source reviews to design-system-code-review.
---

# Review a WordPress Design System interface

## Establish the changed behaviour

Read the complete diff and identify the affected user interactions and consumers. For a narrow copy or supported-prop change, check its semantics and API usage without reopening component selection or auditing unrelated setup.

For component, styling, interaction, migration, or rendering-context changes, read [Working with WordPress Design System packages](../../../docs/contributors/design/design-system-packages.md). Identify the relevant target versions and whether dependencies are bundled or supplied by WordPress. Establish whether the checkout represents the base or proposed head before using it as evidence.

Apply this review even when the interface currently uses custom markup. For a mixed package-and-consumer change, also use [design-system-code-review](../design-system-code-review/SKILL.md) on the package source.

## Investigate material questions

- Use the guide's [recommendation sources](../../../docs/contributors/design/design-system-packages.md#choose-a-recommended-component) when API selection is material. Current Storybook or MCP advice does not establish availability in an older runtime.
- For a replacement, follow the [contract comparison](../../../docs/contributors/design/design-system-packages.md#compare-contracts-before-replacing-an-api). Check extension points as well as migrated repository callers.
- For overlays and separate documents, verify [setup](../../../docs/contributors/design/design-system-packages.md#setup-depends-on-the-document) at the actual rendering destination. React ancestry alone does not prove CSS inheritance or selector reach.
- Assess semantics, interaction, accessibility, responsive behaviour, and relevant themes using the guide's [verification guidance](../../../docs/contributors/design/design-system-packages.md#verify-the-affected-behaviour).

Judge custom UI by demonstrated user, accessibility, consistency, or maintenance impact. The existence of a public alternative alone is not a defect. When a defect exists, decide whether the smallest coherent correction is to repair the custom UI or replace it with a verified public component.

## Report supported findings

For each finding, identify the incorrect behaviour or violated repository requirement, a changed line that causes it, target-version or runtime evidence, and why it needs correction now. Resolve missing context or state the verification gap; do not infer a defect from an incomplete diff or missing test alone.

Recheck findings against the complete proposed change and distinguish defects from optional improvements. Include user impact and a focused way to verify the correction. Report no findings when the evidence supports none. Do not prescribe package-private APIs or make edits as part of this review.
