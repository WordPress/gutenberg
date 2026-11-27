---
name: wp-ui-setup
description: "Use when setting up a project to use `@wordpress/ui` and to migrate from `@wordpress/components`: loading its setup styles, and configuring the ESLint rule that flags components that have a recommended replacement."
---

# Set up a project for `@wordpress/ui`

This skill ships with the `@wordpress/ui` package and matches the installed version. To build with the components, use the `wp-ui` skill. To migrate a component, use the `wp-ui-migration` skill. For design tokens and their linters, use the `wp-theme-setup` skill from `@wordpress/theme`.

Inspect the project first: its package manager, its ESLint configuration (flat config) and ESLint version, and whether it bundles `@wordpress/components` or receives it from WordPress. Change only what is missing.

## 1. Set up the styles

-   Read the **Setup** section of the `README.md` in the installed `@wordpress/ui` package. It covers loading the design tokens stylesheet, the isolation and `body` styles, the `wp-ui` cascade layer, and mixing with `@wordpress/components` overlays.
-   In standard WordPress editor screens, Gutenberg manages the stylesheets and isolation styles. Do not add setup of your own there.
-   For loading the design tokens stylesheet and for token linters, use the `wp-theme-setup` skill.

## 2. Lint for migration

The `@wordpress/use-recommended-components` rule in `@wordpress/eslint-plugin` flags imports of components that have a better alternative: legacy `@wordpress/components` components that have a recommended `@wordpress/ui` replacement, and `@wordpress/ui` components that are not recommended yet. The rule is not part of the plugin's `recommended` preset, so turn it on explicitly.

-   Install `@wordpress/eslint-plugin` as a development dependency. It needs ESLint 9 or later. Read the **Usage** section of the `README.md` in the installed `@wordpress/eslint-plugin` package for the flat configuration, and the rule's [documentation](https://github.com/WordPress/gutenberg/blob/trunk/packages/eslint-plugin/docs/rules/use-recommended-components.md) for its options. The package does not ship the rule documentation, so it is only available online.
-   Enable `@wordpress/use-recommended-components` as `error` for the project's JavaScript and TypeScript files, in addition to the plugin's `recommended` configuration.
-   Only allow components marked "Use with caution" (the `allowUseWithCaution` option) if you can follow their API changes, and do not mix them with `@wordpress/components` in one interface.
-   Run ESLint on the whole project. Every report is a candidate for migration, not a required change.

## 3. Run it in CI and adopt it gradually

-   Add ESLint to the project's lint script and CI, so that new reports fail the build.
-   Do not migrate everything at once. To record the existing reports as a baseline and migrate gradually, follow "Migrate gradually with lint suppressions" in the `wp-ui-migration` skill.

## 4. Verify

Import a legacy component that the rule flags, such as `CheckboxControl`, in a scratch file and confirm that ESLint reports it. Remove the file. Report any step you could not run.
