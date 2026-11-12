---
name: wp-ui
description: Use when creating or changing an interface with the WordPress Design System components from `@wordpress/ui`, including choosing components, composing them, and styling them. For replacing `@wordpress/components`, use wp-ui-migration.
---

# Build interfaces with `@wordpress/ui`

This skill ships with the `@wordpress/ui` package and matches the installed version. Check the installed package for the exports and props you use. For styling beyond component props, use the `wp-theme` skill from `@wordpress/theme`. To replace a `@wordpress/components` component, use the `wp-ui-migration` skill.

## Start from the interaction

Identify the behavior you are building and find a similar implementation in the project. Use the Design System MCP server when available: `get_patterns` for how to approach an interaction, such as confirming a destructive action, then `get_components` and `get_component_details` for the components, their props and their imports. Without MCP, read the package README and the [Storybook](https://wordpress.github.io/gutenberg/).

## Compose with components

-   Do not hand-roll a component that `@wordpress/ui` or `@wordpress/components` already provides, such as a card, badge, notice, tooltip, popover, dialog or tabs. Check the recommended component first, and keep product-specific compositions in your own package.
-   Prefer a recommended `@wordpress/ui` or `@wordpress/components` component over a similar one from an application or plugin component library.
-   Do not write hand-rolled CSS for layouts and elements that `Stack`, `Text` and `Link` can easily provide. Use `Stack` instead of `display: flex` or grid with gap or margin, `Text` instead of a paragraph, heading or span with custom font styles, and `Link` instead of a styled anchor. Reach for custom CSS only for sizing and layout that these primitives do not cover.
-   Choose the component by its documented purpose, not only by the props it accepts.

## Create product-specific components

When the product needs its own component, build it by composing existing components.

-   First check that no existing component or composition meets the need.
-   Use as many `@wordpress/ui` components and primitives as possible, such as `Card`, `Stack`, `Text`, `Link`, `Badge` and `Button`. Write raw markup only where no component fits.
-   Use the components' props and design as they are, with no overrides of their appearance.
-   Keep custom CSS to the sizing and layout of the composition itself, such as its width or the gaps that `Stack` does not cover. Use `--wpds-*` design tokens for any value in that CSS, chosen by semantic role as described in the `wp-theme` skill, and never fixed colors, font sizes, radii or spacing.
-   Do not copy the implementation of a design system component. Compose it, and keep the new component's own API small.
-   If you think the component would be generally useful in the design system, propose it as a feature request in [WordPress/gutenberg](https://github.com/WordPress/gutenberg/issues).

## Style with props first

-   Use a component's props for variants, sizes and tones instead of restyling it with CSS. For example, use a size prop on `Text`, not a font size in CSS.
-   Adding position, width or margin around a component is fine, because it does not change the component's appearance.
-   Do not heavily override a component's styles. If an override only reproduces old visuals or stacks on another override, ask whether it is needed or whether the shared component should change.
-   Do not target internal class names, such as `.components-button` or `.components-popover__content`, or private class names and markup. They are not stable. Use documented props, styling hooks or composition.
-   If a component looks wrong, suspect a CSS reset or a specificity conflict in your project before accepting a local workaround.
-   For colors, spacing, radii, typography and motion in your own styles, use the `wp-theme` skill.

## When a component lacks something

If a feature or design is missing from the existing components, do not override the component's styles to get it. First check whether the latest version of `@wordpress/ui` already has the feature or component, in the package changelog, the [Storybook](https://wordpress.github.io/gutenberg/) or the latest release on npm. If it does, suggest updating the package. Then search the [WordPress/gutenberg issues](https://github.com/WordPress/gutenberg/issues) for an existing request for the feature. If there is none, raise a feature request that describes the missing feature or design and what you tried. Use the component as it is in the meantime.

If a workaround for missing behavior or composition cannot wait, keep it temporary and add a code comment that links the issue, so it reads as deliberate and can be removed once the issue is fixed. Do not import from package-private paths.

## Verify

Check the keyboard and pointer paths, accessible names, focus handling and dismissal in a browser. Check overlays in the document where they render, including iframes and popup windows, and follow the setup in the package README for each document. Report what you verified.
