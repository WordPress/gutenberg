# `@wordpress/components`

## Status

This package contains UI components that are intended to be used anywhere in a general way (global), or specifically in the block editor.

We are currently in the process of rewriting the global components to be in the new `@wordpress/ui` package. Refer to the [`use-recommended-components` ESLint rule](../eslint-plugin/rules/use-recommended-components.js) for guidance on which components to use.

For components not explicitly listed in the `use-recommended-components` rule, locate the component's Storybook source within this package and use its status guidance. This guidance is more authoritative than the `experimental` tag or component prefix.

## Forms

Is the form going to edit items of a dataset, rather than simply submitting data somewhere? If so, consider using `DataForm` from the `@wordpress/dataviews` package.

For adding validation, consider using the [Validated Form Components](./src/validated-form-controls).

## Storybook

Don't forget to check a component's Storybook documentation for additional usage guidance. The Storybook links ([public base URL](https://wordpress.github.io/gutenberg/)) are also useful to present to a human when they are asking for help with a component.

## Maintaining this package

For changes to `@wordpress/components`, first read the package
[contribution guide](CONTRIBUTING.md) and the cross-package
[Design System package guide](../../docs/contributors/design/design-system-packages.md).
Use the `design-system-contribution` or `design-system-code-review` skill for
package changes or reviews. Assess public API compatibility and consumers
before relying on package-internal conventions.
