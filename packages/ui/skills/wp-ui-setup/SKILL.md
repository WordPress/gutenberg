---
name: wp-ui-setup
description: Use when setting up a project to use `@wordpress/ui` and to migrate from `@wordpress/components`: installing the package, loading its setup styles, and configuring the ESLint rule that flags components that have a recommended replacement.
---

# Set up a project for `@wordpress/ui`

This skill ships with the `@wordpress/ui` package and matches the installed version. To build with the components, use the `wp-ui` skill. To migrate a component, use the `wp-ui-migration` skill. For design tokens and their linters, use the `wp-theme-setup` skill from `@wordpress/theme`.

Inspect the project first: its package manager, its ESLint configuration (flat config) and ESLint version, and whether it bundles `@wordpress/components` or receives it from WordPress. Change only what is missing.

## 1. Install and set up the styles

-   Install `@wordpress/ui` as a dependency. It is an npm package that you bundle. WordPress does not provide it.
-   In standard WordPress editor screens, Gutenberg manages the stylesheets and isolation styles. Do not add setup of your own there.
-   Elsewhere, install and load the design tokens stylesheet as described in the `wp-theme-setup` skill, and follow the **Setup** section of the package README: the `isolation: isolate` style on your layout root, `position: relative` on `body`, and the `wp-ui` cascade layer if you order your own layers.
-   If the project bundles both `@wordpress/ui` and `@wordpress/components` and uses overlays from both, follow the README's setup for mixing them (`useEnableWpCompatOverlaySlot()`).

## 2. Lint for migration

The `@wordpress/use-recommended-components` rule in `@wordpress/eslint-plugin` flags imports of components that have a better alternative. It flags legacy components from `@wordpress/components` that have a recommended `@wordpress/ui` replacement, and flags `@wordpress/ui` components that are not recommended yet. The rule is not part of the plugin's `recommended` preset, so turn it on explicitly.

-   Install `@wordpress/eslint-plugin` as a development dependency. It needs ESLint 9 or later, and the examples use flat config.
-   Enable the rule in `eslint.config.mjs`:

```js
import wordpress from '@wordpress/eslint-plugin';

export default [
	...wordpress.configs.recommended,
	{
		files: [ '**/*.{js,jsx,ts,tsx}' ],
		rules: {
			'@wordpress/use-recommended-components': 'error',
		},
	},
];
```

-   Components marked "Use with caution" in the Storybook are flagged by default. To allow them, use `[ 'error', { allowUseWithCaution: true } ]`, and only if you can follow their API changes. Do not mix them with existing `@wordpress/components` in one interface.
-   Run ESLint on the whole project. Every report is a candidate for migration, not a required change.

## 3. Run it in CI and adopt it gradually

-   Add ESLint to the project's lint script and CI, so that new reports fail the build.
-   Do not migrate everything at once. To record the existing reports as a baseline and migrate gradually, follow "Migrate gradually with lint suppressions" in the `wp-ui-migration` skill.

## 4. Verify

Import a legacy component that the rule flags, such as one that has a Migration Guide in the Storybook, in a scratch file and confirm that ESLint reports it. Remove the file. Report any step you could not run.
