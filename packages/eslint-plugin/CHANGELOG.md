## 2.3.0 (2019-06-12)

### Bug Fix

- Fixed custom regular expression for the `no-restricted-syntax` rule enforcing translate function arguments. [#15839](https://github.com/WordPress/gutenberg/pull/15839).
- Fixed arguments checking of `_nx` for the `no-restricted-syntax` rule enforcing translate function arguments. [#15839](https://github.com/WordPress/gutenberg/pull/15839).

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
