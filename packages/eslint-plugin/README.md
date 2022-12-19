# ESLint Plugin

[ESLint](https://eslint.org/) plugin including configurations and custom rules for WordPress development.

## Installation

Install the module

```bash
npm install @wordpress/eslint-plugin --save-dev
```

**Note**: This package requires `node` 14.0.0 or later, and `npm` 6.14.4 or later. It is not compatible with older versions.

## Usage

To opt-in to the default configuration, extend your own project's `.eslintrc` file:

```json
{
	"extends": [ "plugin:@wordpress/eslint-plugin/recommended" ]
}
```

Refer to the [ESLint documentation on Shareable Configs](http://eslint.org/docs/developer-guide/shareable-configs) for more information.

The `recommended` preset will include rules governing an ES2015+ environment, and includes rules from the [`eslint-plugin-jsdoc`](https://github.com/gajus/eslint-plugin-jsdoc), [`eslint-plugin-jsx-a11y`](https://github.com/evcohen/eslint-plugin-jsx-a11y), [`eslint-plugin-react`](https://github.com/yannickcr/eslint-plugin-react), and other similar plugins.

This preset offers an optional integration with the [`eslint-plugin-prettier`](https://github.com/prettier/eslint-plugin-prettier) package that runs [Prettier](https://prettier.io) code formatter and reports differences as individual ESLint issues. You can activate it by installing the [`prettier`](https://www.npmjs.com/package/prettier) package separately with:

```bash
npm install prettier --save-dev
```

Finally, this ruleset also includes an optional integration with the [`@typescript-eslint/eslint-plugin`](https://github.com/typescript-eslint/typescript-eslint) package that enables ESLint to support [TypeScript](https://www.typescriptlang.org) language. You can activate it by installing the [`typescript`](https://www.npmjs.com/package/typescript) package separately with:

```bash
npm install typescript --save-dev
```

There is also `recommended-with-formatting` ruleset for projects that want to ensure that [Prettier](https://prettier.io) and [TypeScript](https://www.typescriptlang.org) integration is never activated. This preset has the native ESLint code formatting rules enabled instead.

### Rulesets

Alternatively, you can opt-in to only the more granular rulesets offered by the plugin. These include:

-   `custom` – custom rules for WordPress development.
-   `es5` – rules for legacy ES5 environments.
-   `esnext` – rules for ES2015+ environments.
-   `i18n` – rules for internationalization.
-   `jsdoc` – rules for JSDoc comments.
-   `jsx-a11y` – rules for accessibility in JSX.
-   `react` – rules for React components.
-   `test-e2e` – rules for end-to-end tests written in Puppeteer.
-   `test-unit`– rules for unit tests written in Jest.

For example, if your project does not use React, you could consider extending including only the ESNext rules in your project using the following `extends` definition:

```json
{
	"extends": [ "plugin:@wordpress/eslint-plugin/esnext" ]
}
```

These rules can be used additively, so you could extend both `esnext` and `custom` rulesets, but omit the `react` and `jsx-a11y` configurations.

The granular rulesets will not define any environment globals. As such, if they are required for your project, you will need to define them yourself.

### Rules

| Rule                                                                                                                                                                 | Description                                                                                    | Recommended |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------- |
| [data-no-store-string-literals](https://github.com/WordPress/gutenberg/tree/HEAD/packages/eslint-plugin/docs/rules/data-no-store-string-literals.md)                 | Discourage passing string literals to reference data stores                                    |             |
| [dependency-group](https://github.com/WordPress/gutenberg/tree/HEAD/packages/eslint-plugin/docs/rules/dependency-group.md)                                           | Enforce dependencies docblocks formatting                                                      | ✓           |
| [is-gutenberg-plugin](docs/rules/is-gutenberg-plugin.md)                                                                                                             | Governs the use of the `process.env.IS_GUTENBERG_PLUGIN` constant                              | ✓           |
| [no-base-control-with-label-without-id](https://github.com/WordPress/gutenberg/tree/HEAD/packages/eslint-plugin/docs/rules/no-base-control-with-label-without-id.md) | Disallow the usage of BaseControl component with a label prop set but omitting the id property | ✓           |
| [no-unguarded-get-range-at](https://github.com/WordPress/gutenberg/tree/HEAD/packages/eslint-plugin/docs/rules/no-unguarded-get-range-at.md)                         | Disallow the usage of unguarded `getRangeAt` calls                                             | ✓           |
| [no-unsafe-wp-apis](https://github.com/WordPress/gutenberg/tree/HEAD/packages/eslint-plugin/docs/rules/no-unsafe-wp-apis.md)                                         | Disallow the usage of unsafe APIs from `@wordpress/*` packages                                 | ✓           |
| [no-unused-vars-before-return](https://github.com/WordPress/gutenberg/tree/HEAD/packages/eslint-plugin/docs/rules/no-unused-vars-before-return.md)                   | Disallow assigning variable values if unused before a return                                   | ✓           |
| [react-no-unsafe-timeout](https://github.com/WordPress/gutenberg/tree/HEAD/packages/eslint-plugin/docs/rules/react-no-unsafe-timeout.md)                             | Disallow unsafe `setTimeout` in component                                                      |             |
| [valid-sprintf](https://github.com/WordPress/gutenberg/tree/HEAD/packages/eslint-plugin/docs/rules/valid-sprintf.md)                                                 | Enforce valid sprintf usage                                                                    | ✓           |
| [i18n-ellipsis](https://github.com/WordPress/gutenberg/tree/HEAD/packages/eslint-plugin/docs/rules/i18n-ellipsis.md)                                                 | Disallow using three dots in translatable strings                                              | ✓           |
| [i18n-no-collapsible-whitespace](https://github.com/WordPress/gutenberg/tree/HEAD/packages/eslint-plugin/docs/rules/i18n-no-collapsible-whitespace.md)               | Disallow collapsible whitespace in translatable strings                                        | ✓           |
| [i18n-no-placeholders-only](https://github.com/WordPress/gutenberg/tree/HEAD/packages/eslint-plugin/docs/rules/i18n-no-placeholders-only.md)                         | Prevent using only placeholders in translatable strings                                        | ✓           |
| [i18n-no-variables](https://github.com/WordPress/gutenberg/tree/HEAD/packages/eslint-plugin/docs/rules/i18n-no-variables.md)                                         | Enforce string literals as translation function arguments                                      | ✓           |
| [i18n-text-domain](https://github.com/WordPress/gutenberg/tree/HEAD/packages/eslint-plugin/docs/rules/i18n-text-domain.md)                                           | Enforce passing valid text domains                                                             | ✓           |
| [i18n-translator-comments](https://github.com/WordPress/gutenberg/tree/HEAD/packages/eslint-plugin/docs/rules/i18n-translator-comments.md)                           | Enforce adding translator comments                                                             | ✓           |
| [i18n-no-flanking-whitespace](https://github.com/WordPress/gutenberg/tree/HEAD/packages/eslint-plugin/docs/rules/i18n-no-flanking-whitespace.md)                     | Disallow leading or trailing whitespace in translatable strings                                |             |
| [i18n-hyphenated-range](https://github.com/WordPress/gutenberg/tree/HEAD/packages/eslint-plugin/docs/rules/i18n-hyphenated-range.md)                                 | Disallow hyphenated numerical ranges in translatable strings                                   |             |

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
