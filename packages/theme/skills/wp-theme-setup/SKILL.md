---
name: wp-theme-setup
description: "Use when setting up WordPress Design System tokens in a project: loading the tokens stylesheet, configuring the Stylelint and ESLint token rules from `@wordpress/theme-build-tools` and `@wordpress/eslint-plugin`, and adding token fallback values automatically at build time."
---

# Set up design tokens in a project

This skill ships with the `@wordpress/theme` package and matches the installed version. To choose tokens once the project is set up, use the `wp-theme` skill.

Inspect the project first: its package manager, its bundler (PostCSS, Lightning CSS, esbuild, Vite or `@wordpress/build`), and its Stylelint and ESLint configuration. Change only what is missing, and do not duplicate setup that already exists.

## 1. Load the tokens

Read the **Design Tokens** section of the `README.md` in the installed `@wordpress/theme` package for how to load the tokens stylesheet, including its Node.js requirement, the setup for iframes and popup windows, and the setup outside WordPress, and apply it to the project.

-   Since WordPress 7.1, WordPress registers the tokens stylesheet as the `wp-theme` style handle and loads it in standard admin and editor screens. Do not bundle it there. If you support WordPress versions before 7.1, which do not register `wp-theme`, load the tokens yourself for them: bundle `@wordpress/theme/design-tokens.css`, or enqueue your own copy only when the `wp-theme` handle is not registered (`wp_style_is( 'wp-theme', 'registered' )`).

## 2. Lint token usage

Install `@wordpress/theme-build-tools` as a development dependency, plus `stylelint` if the project does not have it. Then read the **Stylelint Plugins** section of the `README.md` in the installed `@wordpress/theme-build-tools` package and enable the plugins it lists in the project's Stylelint configuration.

For tokens written in JavaScript, such as inline styles or CSS in template strings, enable the `@wordpress/no-unknown-ds-tokens` and `@wordpress/no-setting-ds-tokens` rules from `@wordpress/eslint-plugin`. See its README, and its **Rules** section for links to each rule. They are part of its `recommended` configuration. If the project enables ESLint rules individually, turn them on explicitly.

Run the linters on the whole project and fix the reports. A report from `no-token-fallback-values` means a hand-written fallback that can drift from the generated ones, so remove it and rely on step 3. Then add the checks to the project's lint script and CI.

## 3. Add token fallback values at build time

The build plugins add the generated fallback to every bare `var(--wpds-*)` reference, so components still render when the tokens stylesheet is not loaded.

-   Projects that build with `@wordpress/build` already get the plugins. Do not add them again.
-   For a custom build, read the **Build Plugins** section of the `README.md` in the installed `@wordpress/theme-build-tools` package and add the plugin for the project's tool: PostCSS, Lightning CSS, esbuild or Vite. It lists the exports and an example for each. With Vite, it needs both the Vite plugin for JavaScript and TypeScript and the PostCSS plugin for CSS.

## 4. Verify

Run the build and check the output for a token reference: it should now have a fallback value. Introduce a misspelled token in a scratch file and confirm that Stylelint reports it, then remove the file. Report any step you could not run.
