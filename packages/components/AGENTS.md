## Status

This package contains UI components that are intended to be used anywhere in a general way (global), or specifically in the block editor.

We are currently in the process of rewriting the global components to be in the new `@wordpress/ui` package. Refer to the [`use-recommended-components` ESLint rule](../eslint-plugin/rules/use-recommended-components.js) for guidance on which components to use.

For components not explicitly listed in the `use-recommended-components` rule, check the component status documentation in each Storybook file for up-to-date usage guidance on each component. The component status given in the Storybook file should be considered the most accurate signal, above the `experimental` tag or component prefix.

## Forms

Is the form going to edit items of a dataset, rather than simply submitting data somewhere? If so, consider using `DataForm` from the `@wordpress/dataviews` package.

For adding validation, consider using the [Validated Form Components](./src/validated-form-controls).

## Storybook

Don't forget to check a components's Storybook documentation for additional usage guidance. The Storybook links ([public base URL](https://wordpress.github.io/gutenberg/)) are also useful to present to a human when they are asking for help with a component.
