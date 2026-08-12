## About this package

This directory is [`@wordpress/ui`](./README.md), the WordPress Design System's library of low-level React UI components built on the [`@wordpress/theme`](../theme/) foundation with token-driven styling and consistent patterns.

The WordPress Design System is a collection of reusable components, design tokens, and guidelines that work together across multiple packages for building the WordPress administrative dashboard. For how foundational packages (`@wordpress/theme`, `@wordpress/ui`, `@wordpress/icons`) and compositional packages (including `@wordpress/dataviews`, `@wordpress/admin-ui`) relate to one another, see [Design System/Introduction](../../../storybook/stories/design-system/introduction.mdx).

[`@wordpress/components`](../components/) is a separate collection of UI components that grew organically over time. It is not the design system, though it remains maintained and contains components which either have no stable alternatives in `@wordpress/ui` yet or serve a niche use-case of the WordPress editors and aren't broadly reusable for building administrative interfaces. See the [`use-recommended-components` ESLint rule](../eslint-plugin/rules/use-recommended-components.js) for the canonical source of component status.

## Guidance

Read [CONTRIBUTING.md](./CONTRIBUTING.md) before adding or changing code here. It is the canonical guidance for this package, including [design principles](./CONTRIBUTING.md#design-principles), folder structure, styling, and APIs.
