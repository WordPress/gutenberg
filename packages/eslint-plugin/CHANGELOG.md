<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### Breaking Changes

-   The peer dependency constraint for ESLint has been updated from `^6 || ^7` to `^8`.
-   The bundled `@typescript-eslint/eslint-plugin` dependency has been updated from requiring `^4.31.0` to requiring `^5.3.0` ([#36283](https://github.com/WordPress/gutenberg/pull/36283)).
-   The bundled `@typescript-eslint/parser` dependency has been updated from requiring `^4.31.0` to requiring `^5.3.0` ([#36283](https://github.com/WordPress/gutenberg/pull/36283)).
-   The bundled `eslint-config-prettier` dependency has been updated from requiring `^7.1.0` to requiring `^8.3.0` ([#36283](https://github.com/WordPress/gutenberg/pull/36283)).
-   The bundled `eslint-plugin-jest` dependency has been updated from requiring `^24.1.3` to requiring `^25.2.3` ([#36283](https://github.com/WordPress/gutenberg/pull/36283)).
-   The bundled `eslint-plugin-jsdoc` dependency has been updated from requiring `^36.0.8` to requiring `^37.0.3` ([#36283](https://github.com/WordPress/gutenberg/pull/36283)).
-   The bundled `globals` dependency has been updated from requiring `^12.0.0` to requiring `^13.12.0` ([#36283](https://github.com/WordPress/gutenberg/pull/36283)).

### Enhancement

-   Omit verification for WordPress dependencies in the import statements since they get externalized when used with WordPress ([#37639](https://github.com/WordPress/gutenberg/pull/37639)).

### Bug Fix

-   Fix Babel config resolution when a custom ESLint config present ([#37406](https://github.com/WordPress/gutenberg/pull/37406)). Warning: it won't recognize the `babel.config.json` file present in the project until the upstream bug in `cosmiconfig` is fixed.

## 9.3.0 (2021-11-15)

### Enhancements

-   Replaced deprecated `babel-eslint` dependency with `@babel/eslint-parser` ([#36244](https://github.com/WordPress/gutenberg/pull/36244)).
-   The bundled `eslint-plugin-import` dependency has been updated from requiring `^2.23.4` to requiring `^2.25.2` ([#36244](https://github.com/WordPress/gutenberg/pull/36244)).

## 9.2.0 (2021-10-12)

### Enhancement

-   The bundled `eslint-plugin-jsdoc` dependency has been updated from requiring `^34.1.0` to requiring `^36.0.8` ([#34338](https://github.com/WordPress/gutenberg/pull/34338)).

### Bug Fix

-   Use Jest related rules only when the `jest` package is installed ([#33120](https://github.com/WordPress/gutenberg/pull/33120)).

## 9.1.2 (2021-09-09)

### Bug Fix

-   The recommended configuration will now respect `type` imports in TypeScript files ([#34055](https://github.com/WordPress/gutenberg/pull/34055)).

## 9.1.1 (2021-08-23)

### Bug Fix

-   Include `.jsx` extension when linting import statements in case TypeScript not present ([#33746](https://github.com/WordPress/gutenberg/pull/33746)).

## 9.1.0 (2021-07-21)

### Enhancement

-   Adds JSDoc alignment check ([#25300](https://github.com/WordPress/gutenberg/pull/25300)).

## 9.0.1 (2021-03-19)

### Bug Fix

-   Adds TypeScript as a peer dependency and makes it optional when not installed ([#29942](https://github.com/WordPress/gutenberg/pull/29942)).

## 9.0.0 (2021-03-17)

### Breaking Changes

-   Add support and configuration for TypeScript files. [#27143](https://github.com/WordPress/gutenberg/pull/27143)

### New Features

-   Enabled `import/default` and `import/named` rules in the `recommended` ruleset. [#28513](https://github.com/WordPress/gutenberg/pull/28513)
-   Add new rule `@wordpress/data-no-store-string-literals` to discourage passing string literals to reference data stores ([#28726](https://github.com/WordPress/gutenberg/pull/28726)).

## 8.0.1 (2021-01-28)

### Bug Fix

-   Add missing `eslint-plugin-import` npm dependency ([#28545](https://github.com/WordPress/gutenberg/pull/28545)).

## 8.0.0 (2021-01-21)

### Breaking Changes

-   Increase the minimum Node.js version to 12 ([#27934](https://github.com/WordPress/gutenberg/pull/27934)).
-   Enabled `import/no-extraneous-dependencies` rule in the `recommended` ruleset.
-   Enabled `import/no-unresolved` rule in the `recommended` ruleset.
-   Enabled `no-unsafe-wp-apis` rule in the `recommended` ruleset ([#27327](https://github.com/WordPress/gutenberg/pull/27327)).
-   The bundled `eslint-config-prettier` dependency has been updated from requiring `^6.10.1` to requiring `^7.1.0` ([#27965](https://github.com/WordPress/gutenberg/pull/27965)).
-   The bundled `eslint-plugin-jest` dependency has been updated from requiring `^23.8.2` to requiring `^24.1.3` ([#27965](https://github.com/WordPress/gutenberg/pull/27965)).

### Enhancements

-   The bundled `eslint-plugin-jsdoc` dependency has been updated from requiring `^30.2.2` to requiring `^30.7.13` ([#27965](https://github.com/WordPress/gutenberg/pull/27965)).
-   The bundled `eslint-plugin-jsx-a11y` dependency has been updated from requiring `^6.2.3` to requiring `^6.4.1` ([#27965](https://github.com/WordPress/gutenberg/pull/27965)).
-   The bundled `eslint-plugin-prettier` dependency has been updated from requiring `^3.1.2` to requiring `^3.3.0` ([#27965](https://github.com/WordPress/gutenberg/pull/27965)).
-   The bundled `eslint-plugin-react` dependency has been updated from requiring `^7.20.0` to requiring `^7.22.0` ([#27965](https://github.com/WordPress/gutenberg/pull/27965)).
-   The bundled `eslint-plugin-react-hooks` dependency has been updated from requiring `^4.0.4` to requiring `^4.2.0` ([#27965](https://github.com/WordPress/gutenberg/pull/27965)).

## 7.4.0 (2020-12-17)

### New Feature

-   Add `no-unsafe-wp-apis` rule to discourage usage of unsafe APIs ([#27301](https://github.com/WordPress/gutenberg/pull/27301)).

### Enhancements

-   The bundled `wp-prettier` dependency has been upgraded from `2.0.5` to `2.2.1`.

### Documentation

-   Include a note about the minimum version required for `node` (10.0.0) and `npm` (6.9.0).

## 7.2.1 (2020-09-17)

### Bug Fixes

-   Fix TypeError for projects without a local Prettier configuration.

## 7.2.0 (2020-09-03)

### Enhancements

-   The bundled `eslint-plugin-jsdoc` dependency has been updated from requiring `^26.0.0` to requiring `^30.2.2`.

### Bug Fixes

-   The recommended configuration will now respect local Prettier configuration. These are merged to the default WordPress configuration.

## 7.1.0-rc.0 (2020-06-24)

### Enhancements

-   Support ESLint `^7` as peer dependency.

## 7.0.0 (2020-06-15)

### Breaking Changes

-   The bundled `wp-prettier` dependency has been upgraded from `1.19.1` to `2.0.5`. Refer to the [Prettier 2.0 "2020" blog post](https://prettier.io/blog/2020/03/21/2.0.0.html) for full details about the major changes included in Prettier 2.0.
-   The bundled `eslint-plugin-react-hooks` dependency has been updated from requiring `^3.0.0` to requiring `^4.0.4`.
-   The bundled `eslint-plugin-jsdoc` dependency has been updated from requiring `^22.1.0` to requiring `^26.0.0`.

### Enhancements

-   The bundled `eslint-plugin-react` dependency has been updated from requiring `^7.19.0` to requiring `^7.20.0`.

## 6.1.0 (2020-05-28)

### Bug Fixes

-   `@wordpress/dependency-group` will now correctly identify issues associated with CommonJS (`require`) module imports.

## 6.0.0 (2020-05-14)

### Breaking Changes

-   The severity of the rule, `jsdoc/no-undefined-types`, has been increased from `warn` to `error`. In addition, `JSX` has been added to the default list of defined types.

### Improvements

-   `'AsyncIterableIterator'` is now allowed as a valid TypeScript utility type.

## 5.1.0 (2020-04-30)

### Bug Fixes

-   The `@wordpress/no-unused-vars-before-return` rule will now correctly identify valid usage of a variable as a JSX identifier.
-   Make `@wordpress/i18n-text-domain` rule less strict by default. When `allowedTextDomain` option is not provided it allows now skipping text domain or providing any string ([#21928](https://github.com/WordPress/gutenberg/pull/21928)).

## 5.0.1 (2020-04-15)

### Bug Fixes

-   Fixes an error caused by missing `utils` directory from published package ([#21609](https://github.com/WordPress/gutenberg/pull/21609)).
-   Added the recommended `Prettier` config that enforces WordPress coding style guidelines ([#21602](https://github.com/WordPress/gutenberg/pull/21602)).

## 5.0.0 (2020-04-15)

### Breaking Changes

-   There is a new `i18n` ruleset that includes all i18n-related rules and is included in the `recommended` ruleset.
-   The `@wordpress/valid-sprintf` rule has been moved from the `custom` ruleset to the `i18n` ruleset.
-   The `@wordpress/valid-sprintf` rule now recognizes mix of ordered and non-ordered placeholders.
-   The bundled `eslint-plugin-jest` dependency has been updated from requiring `^22.15.1` to requiring `^23.8.2` ([#21424](https://github.com/WordPress/gutenberg/pull/21424)).
-   The bundled `eslint-plugin-jsdoc` dependency has been updated from requiring `^21.0.0` to requiring `^22.1.0` ([#21424](https://github.com/WordPress/gutenberg/pull/21424)).
-   The bundled `eslint-plugin-react-hooks` dependency has been updated from requiring `^1.6.1` to requiring `^3.0.0` ([#21424](https://github.com/WordPress/gutenberg/pull/21424)).

### New Features

-   New Rule: [`@wordpress/i18n-text-domain`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/eslint-plugin/docs/rules/i18n-text-domain.md)
-   New Rule: [`@wordpress/i18n-translator-comments`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/eslint-plugin/docs/rules/i18n-translator-comments.md)
-   New Rule: [`@wordpress/i18n-no-variables`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/eslint-plugin/docs/rules/i18n-no-variables.md)
-   New Rule: [`@wordpress/i18n-no-placeholders-only`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/eslint-plugin/docs/rules/i18n-no-placeholders-only.md)
-   New Rule: [`@wordpress/i18n-no-collapsible-whitespace`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/eslint-plugin/docs/rules/i18n-no-collapsible-whitespace.md)
-   New Rule: [`@wordpress/i18n-ellipsis`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/eslint-plugin/docs/rules/i18n-ellipsis.md)
-   The bundled `eslint-plugin-react` dependency has been updated from requiring `^7.14.3` to requiring `^7.19.0` ([#21424](https://github.com/WordPress/gutenberg/pull/21424)).

### Bug Fixes

-   The `@wordpress/valid-sprintf` rule now detects usage of `sprintf` via `i18n.sprintf` (e.g. when using `import * as i18n from '@wordpress/i18n'`).
-   `@wordpress/no-unused-vars-before-return` will correctly consider other unused variables after encountering an instance of an `excludePattern` option exception.

## 4.1.0 (2020-04-01)

### New Features

-   The `prefer-const` rule included in the `recommended` and `esnext` rulesets has been relaxed to allow a `let` assignment if any of a [destructuring assignment](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment) are reassigned.

## 4.0.0 (2020-02-10)

### Breaking Changes

-   The `recommended` ruleset checks again code formatting (whitespace, indenting, etc.). These rules are now enforced by Prettier itself through a plugin that diffs the code with its formatted output and reports the differences as lint errors. `eslint-plugin-prettier` was chosen over options like `prettier-eslint` because we don't run `eslint --fix` in hooks as we'd rather leave certain linting errors to be resolved or ignored at the author's discretion. We also don't apply any additional formatting with `eslint` over `prettier`, so the overhead would be unnecessary. `eslint-plugin-prettier` was chosen over options like `prettier --check` because it's nice to see format errors as you type as it leads you to write code with a more optimal auto-formatted output and it avoids issues like comment directives being moved out of place by `prettier` and the author not realizing it.

## 3.4.1 (2020-02-04)

### Bug Fix

-   Removed `plugin:prettier/recommended` from `recommended` ruleset as it introduces breaking changes.

## 3.4.0 (2020-02-04)

### New Features

-   The `recommended` ruleset no longer enables rules that check code formatting (whitespace, indenting, etc.) and that could conflict with Prettier.
-   There is a new `recommended-with-formatting` ruleset that has the code formatting rules still enabled, for projects that want to opt out from Prettier and continue checking code formatting with ESLint.

## 3.3.0 (2019-12-19)

### Bug Fixes

-   The React ruleset now correctly references the WordPress ESLint plugin, resolving an error about an unfound rule.

## 3.0.0 (2019-08-29)

### Breaking Changes

-   The [`@wordpress/no-unused-vars-before-return` rule](https://github.com/WordPress/gutenberg/blob/HEAD/packages/eslint-plugin/docs/rules/no-unused-vars-before-return.md) has been improved to exempt object destructuring only if destructuring to more than one property.
-   Stricter JSDoc linting using [`eslint-plugin-jsdoc`](https://github.com/gajus/eslint-plugin-jsdoc).
-   Stricter validation enabled for test files only using new `test-e2e` and `test-unit` rulesets.

### New Features

-   New Rule: [`@wordpress/no-unguarded-get-range-at`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/eslint-plugin/docs/rules/no-unguarded-get-range-at.md)
-   Enable `wp` global by default in the `recommended` config.
-   New ruleset `test-e2e` added for end-to-end tests validation.
-   New ruleset `test-unit` added for unit tests validation.

### Enhancements

-   Remove `@wordpress/dependency-group` and `@wordpress/gutenberg-phase` rules from the `custom` and `recommended` configs and leave them as opt-in features.

## 2.4.0 (2019-08-05)

### New Features

-   [`@wordpress/no-unused-vars-before-return`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/eslint-plugin/docs/rules/no-unused-vars-before-return.md) now supports an `excludePattern` option to exempt function calls by name.

### Improvements

-   The recommended `react` configuration specifies an option to [`@wordpress/no-unused-vars-before-return`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/eslint-plugin/docs/rules/no-unused-vars-before-return.md) to exempt React hooks usage, by convention of hooks beginning with "use" prefix.
-   The plugin now uses [`eslint-plugin-jsdoc`](https://github.com/gajus/eslint-plugin-jsdoc), rather than the `valid-jsdoc` rule, for more reliable linting of JSDoc blocks.

## 2.3.0 (2019-06-12)

### Bug Fix

-   Fixed custom regular expression for the `no-restricted-syntax` rule enforcing translate function arguments. [#15839](https://github.com/WordPress/gutenberg/pull/15839).
-   Fixed arguments checking of `_nx` for the `no-restricted-syntax` rule enforcing translate function arguments. [#15839](https://github.com/WordPress/gutenberg/pull/15839).
-   Fixed false positive with `react-no-unsafe-timeout` which would wrongly flag errors when assigning `setTimeout` result to a variable (for example, in a `useEffect` hook).

## 2.2.0 (2019-05-21)

### New Features

-   New Rule: [`@wordpress/react-no-unsafe-timeout`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/eslint-plugin/docs/rules/react-no-unsafe-timeout.md)
-   Add [React Hooks Rules](https://reactjs.org/docs/hooks-rules.html) config.

## 2.1.0 (2019-03-20)

### New Features

-   The bundled `eslint-plugin-jsx-a11y` dependency has been updated from requiring `^6.0.2` to requiring `^6.2.1` (see new features added in [6.2.0](https://github.com/evcohen/eslint-plugin-jsx-a11y/releases/tag/v6.2.0) and [6.1.0](https://github.com/evcohen/eslint-plugin-jsx-a11y/releases/tag/v6.1.0)).
-   The bundled `eslint-plugin-react` dependency has been updated from requiring `7.7.0` to requiring `^7.12.4` (see new features added in [7.12.0](https://github.com/yannickcr/eslint-plugin-react/releases/tag/v7.12.0), [7.11.0](https://github.com/yannickcr/eslint-plugin-react/releases/tag/v7.11.0), [7.10.0](https://github.com/yannickcr/eslint-plugin-react/releases/tag/v7.10.0), [7.9.0](https://github.com/yannickcr/eslint-plugin-react/releases/tag/v7.9.0) and [7.8.0](https://github.com/yannickcr/eslint-plugin-react/releases/tag/v7.8.0)).

## 2.0.0 (2019-03-06)

### Breaking Changes

-   The `esnext` and `recommended` rulesets now enforce [`object-shorthand`](https://eslint.org/docs/rules/object-shorthand)
-   The `es5` and `recommended` rulesets now enforce [`array-callback-return`](https://eslint.org/docs/rules/array-callback-return)

### New Features

-   New Rule: [`@wordpress/no-unused-vars-before-return`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/eslint-plugin/docs/rules/no-unused-vars-before-return.md)
-   New Rule: [`@wordpress/dependency-group`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/eslint-plugin/docs/rules/dependency-group.md)
-   New Rule: [`@wordpress/valid-sprintf`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/eslint-plugin/docs/rules/valid-sprintf.md)
-   New Rule: [`@wordpress/gutenberg-phase`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/eslint-plugin/docs/rules/gutenberg-phase.md)
-   New Rule: [`@wordpress/no-base-control-with-label-without-id`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/eslint-plugin/docs/rules/no-base-control-with-label-without-id.md)

## 1.0.0 (2018-12-12)

### New Features

-   Initial release.
