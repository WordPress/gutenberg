## Master

### Breaking Changes

- The `recommended` ruleset checks again code formatting (whitespace, indenting, etc.). These rules are now enforced by Prettier itself through a plugin that diffs the code with its formatted output and reports the differences as lint errors. `eslint-plugin-prettier` was chosen over options like `prettier-eslint` because we don't run `eslint --fix` in hooks as we'd rather leave certain linting errors to be resolved or ignored at the author's discretion. We also don't apply any additional formatting with `eslint` over `prettier`, so the overhead would be unnecessary. `eslint-plugin-prettier` was chosen over options like `prettier --check` because it's nice to see format errors as you type as it leads you to write code with a more optimal auto-formatted output and it avoids issues like comment directives being moved out of place by `prettier` and the author not realizing it.

## 3.4.1 (2020-02-04)

### Bug Fix

- Removed `plugin:prettier/recommended` from `recommended` ruleset as it introduces breaking changes.

## 3.4.0 (2020-02-04)

### New Features

- The `recommended` ruleset no longer enables rules that check code formatting (whitespace, indenting, etc.) and that could conflict with Prettier.
- There is a new `recommended-with-formatting` ruleset that has the code formatting rules still enabled, for projects that want to opt out from Prettier and continue checking code formatting with ESLint.

## 3.3.0 (2019-12-19)

### Bug Fixes

- The React ruleset now correctly references the WordPress ESLint plugin, resolving an error about an unfound rule.

## 3.0.0 (2019-08-29)

### Breaking Changes

- The [`@wordpress/no-unused-vars-before-return` rule](https://github.com/WordPress/gutenberg/blob/master/packages/eslint-plugin/docs/rules/no-unused-vars-before-return.md) has been improved to exempt object destructuring only if destructuring to more than one property.
- Stricter JSDoc linting using [`eslint-plugin-jsdoc`](https://github.com/gajus/eslint-plugin-jsdoc).
- Stricter validation enabled for test files only using new `test-e2e` and `test-unit` rulesets.

### New Features

- New Rule: [`@wordpress/no-unguarded-get-range-at`](https://github.com/WordPress/gutenberg/blob/master/packages/eslint-plugin/docs/rules/no-unguarded-get-range-at.md)
- Enable `wp` global by default in the `recommended` config.
- New ruleset `test-e2e` added for end-to-end tests validation.
- New ruleset `test-unit` added for unit tests validation.

### Enhancements

- Remove `@wordpress/dependency-group` and `@wordpress/gutenberg-phase` rules from the `custom` and `recommended` configs and leave them as opt-in features.

## 2.4.0 (2019-08-05)

### New Features

- [`@wordpress/no-unused-vars-before-return`](https://github.com/WordPress/gutenberg/blob/master/packages/eslint-plugin/docs/rules/no-unused-vars-before-return.md) now supports an `excludePattern` option to exempt function calls by name.

### Improvements

- The recommended `react` configuration specifies an option to [`@wordpress/no-unused-vars-before-return`](https://github.com/WordPress/gutenberg/blob/master/packages/eslint-plugin/docs/rules/no-unused-vars-before-return.md) to exempt React hooks usage, by convention of hooks beginning with "use" prefix.
- The plugin now uses [`eslint-plugin-jsdoc`](https://github.com/gajus/eslint-plugin-jsdoc), rather than the `valid-jsdoc` rule, for more reliable linting of JSDoc blocks.

## 2.3.0 (2019-06-12)

### Bug Fix

- Fixed custom regular expression for the `no-restricted-syntax` rule enforcing translate function arguments. [#15839](https://github.com/WordPress/gutenberg/pull/15839).
- Fixed arguments checking of `_nx` for the `no-restricted-syntax` rule enforcing translate function arguments. [#15839](https://github.com/WordPress/gutenberg/pull/15839).
- Fixed false positive with `react-no-unsafe-timeout` which would wrongly flag errors when assigning `setTimeout` result to a variable (for example, in a `useEffect` hook).

## 2.2.0 (2019-05-21)

### New Features

- New Rule: [`@wordpress/react-no-unsafe-timeout`](https://github.com/WordPress/gutenberg/blob/master/packages/eslint-plugin/docs/rules/react-no-unsafe-timeout.md)
- Add [React Hooks Rules](https://reactjs.org/docs/hooks-rules.html) config.

## 2.1.0 (2019-03-20)

### New Features

- The bundled `eslint-plugin-jsx-a11y` dependency has been updated from requiring `^6.0.2` to requiring `^6.2.1` (see new features added in [6.2.0](https://github.com/evcohen/eslint-plugin-jsx-a11y/releases/tag/v6.2.0) and [6.1.0](https://github.com/evcohen/eslint-plugin-jsx-a11y/releases/tag/v6.1.0)).
- The bundled `eslint-plugin-react` dependency has been updated from requiring `7.7.0` to requiring `^7.12.4` (see new features added in [7.12.0](https://github.com/yannickcr/eslint-plugin-react/releases/tag/v7.12.0), [7.11.0](https://github.com/yannickcr/eslint-plugin-react/releases/tag/v7.11.0), [7.10.0](https://github.com/yannickcr/eslint-plugin-react/releases/tag/v7.10.0), [7.9.0](https://github.com/yannickcr/eslint-plugin-react/releases/tag/v7.9.0) and [7.8.0](https://github.com/yannickcr/eslint-plugin-react/releases/tag/v7.8.0)).

## 2.0.0 (2019-03-06)

### Breaking Changes

- The `esnext` and `recommended` rulesets now enforce [`object-shorthand`](https://eslint.org/docs/rules/object-shorthand)
- The `es5` and `recommended` rulesets now enforce [`array-callback-return`](https://eslint.org/docs/rules/array-callback-return)

### New Features

- New Rule: [`@wordpress/no-unused-vars-before-return`](https://github.com/WordPress/gutenberg/blob/master/packages/eslint-plugin/docs/rules/no-unused-vars-before-return.md)
- New Rule: [`@wordpress/dependency-group`](https://github.com/WordPress/gutenberg/blob/master/packages/eslint-plugin/docs/rules/dependency-group.md)
- New Rule: [`@wordpress/valid-sprintf`](https://github.com/WordPress/gutenberg/blob/master/packages/eslint-plugin/docs/rules/valid-sprintf.md)
- New Rule: [`@wordpress/gutenberg-phase`](https://github.com/WordPress/gutenberg/blob/master/packages/eslint-plugin/docs/rules/gutenberg-phase.md)
- New Rule: [`@wordpress/no-base-control-with-label-without-id`](https://github.com/WordPress/gutenberg/blob/master/packages/eslint-plugin/docs/rules/no-base-control-with-label-without-id.md)

## 1.0.0 (2018-12-12)

### New Features

- Initial release.
