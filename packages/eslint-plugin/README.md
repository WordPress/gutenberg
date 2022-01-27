# ESLint Plugin

[ESLint](https://eslint.org/) plugin including configurations and custom rules for WordPress development.

## Installation

Install the module

```bash
npm install @wordpress/eslint-plugin --save-dev
```

**Note**: This package requires `node` 12.0.0 or later, and `npm` 6.9.0 or later. It is not compatible with older versions.

## Usage

To opt-in to the default configuration, extend your own project's `.eslintrc` file:

```json
{
	"extends": [ "plugin:@wordpress/eslint-plugin/recommended" ]
}
```

Refer to the [ESLint documentation on Shareable Configs](http://eslint.org/docs/developer-guide/shareable-configs) for more information.

The `recommended` preset will include rules governing an ES2015+ environment, and includes rules from the [`eslint-plugin-jsx-a11y`](https://github.com/evcohen/eslint-plugin-jsx-a11y), [`eslint-plugin-react`](https://github.com/yannickcr/eslint-plugin-react), and [`eslint-plugin-prettier`](https://github.com/prettier/eslint-plugin-prettier) projects. It also includes an optional integration with [`@typescript-eslint/eslint-plugin`](https://github.com/typescript-eslint/typescript-eslint) that gets activated when the [`typescript`](https://www.npmjs.com/package/typescript) package is installed in the project.

There is also `recommended-with-formatting` ruleset for projects that want to opt out from [Prettier](https://prettier.io). It has the native ESLint code formatting rules enabled instead.

### Rulesets

Alternatively, you can opt-in to only the more granular rulesets offered by the plugin. These include:

-   `custom`
-   `es5`
-   `esnext`
-   `jsdoc`
-   `jsx-a11y`
-   `react`
-   `i18n`
-   `test-e2e`
-   `test-unit`

For example, if your project does not use React, you could consider extending including only the ESNext rules in your project using the following `extends` definition:

```json
{
	"extends": [ "plugin:@wordpress/eslint-plugin/esnext" ]
}
```

These rules can be used additively, so you could extend both `esnext` and `custom` rulesets, but omit the `react` and `jsx-a11y` configurations.

The granular rulesets will not define any environment globals. As such, if they are required for your project, you will need to define them yourself.

### Rules

| Rule                                                                                                                 | Description                                                                                    | Recommended |
| -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------- |
| [data-no-store-string-literals](/packages/eslint-plugin/docs/rules/data-no-store-string-literals.md)                 | Discourage passing string literals to reference data stores                                    |             |
| [dependency-group](/packages/eslint-plugin/docs/rules/dependency-group.md)                                           | Enforce dependencies docblocks formatting                                                      | ✓           |
| [gutenberg-phase](docs/rules/gutenberg-phase.md)                                                                     | Governs the use of the `process.env.GUTENBERG_PHASE` constant                                  | ✓           |
| [no-base-control-with-label-without-id](/packages/eslint-plugin/docs/rules/no-base-control-with-label-without-id.md) | Disallow the usage of BaseControl component with a label prop set but omitting the id property | ✓           |
| [no-unguarded-get-range-at](/packages/eslint-plugin/docs/rules/no-unguarded-get-range-at.md)                         | Disallow the usage of unguarded `getRangeAt` calls                                             | ✓           |
| [no-unsafe-wp-apis](/packages/eslint-plugin/docs/rules/no-unsafe-wp-apis.md)                                         | Disallow the usage of unsafe APIs from `@wordpress/*` packages                                 | ✓           |
| [no-unused-vars-before-return](/packages/eslint-plugin/docs/rules/no-unused-vars-before-return.md)                   | Disallow assigning variable values if unused before a return                                   | ✓           |
| [react-no-unsafe-timeout](/packages/eslint-plugin/docs/rules/react-no-unsafe-timeout.md)                             | Disallow unsafe `setTimeout` in component                                                      |             |
| [valid-sprintf](/packages/eslint-plugin/docs/rules/valid-sprintf.md)                                                 | Enforce valid sprintf usage                                                                    | ✓           |
| [i18n-ellipsis](/packages/eslint-plugin/docs/rules/i18n-ellipsis.md)                                                 | Disallow using three dots in translatable strings                                              | ✓           |
| [i18n-no-collapsible-whitespace](/packages/eslint-plugin/docs/rules/i18n-no-collapsible-whitespace.md)               | Disallow collapsible whitespace in translatable strings                                        | ✓           |
| [i18n-no-placeholders-only](/packages/eslint-plugin/docs/rules/i18n-no-placeholders-only.md)                         | Prevent using only placeholders in translatable strings                                        | ✓           |
| [i18n-no-variables](/packages/eslint-plugin/docs/rules/i18n-no-variables.md)                                         | Enforce string literals as translation function arguments                                      | ✓           |
| [i18n-text-domain](/packages/eslint-plugin/docs/rules/i18n-text-domain.md)                                           | Enforce passing valid text domains                                                             | ✓           |
| [i18n-translator-comments](/packages/eslint-plugin/docs/rules/i18n-translator-comments.md)                           | Enforce adding translator comments                                                             | ✓           |

### Legacy

If you are using WordPress' `.jshintrc` JSHint configuration and you would like to take the first step to migrate to an ESLint equivalent it is also possible to define your own project's `.eslintrc` file as:

```json
{
	"extends": [ "plugin:@wordpress/eslint-plugin/jshint" ]
}
```

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
