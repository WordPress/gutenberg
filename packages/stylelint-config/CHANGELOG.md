<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 21.16.0 (2023-05-10)

## 21.15.0 (2023-04-26)

## 21.14.0 (2023-04-12)

## 21.13.0 (2023-03-29)

## 21.12.0 (2023-03-15)

## 21.11.0 (2023-03-01)

## 21.10.0 (2023-02-15)

## 21.9.0 (2023-02-01)

## 21.8.0 (2023-01-11)

## 21.7.0 (2023-01-02)

## 21.6.0 (2022-12-14)

## 21.5.0 (2022-11-16)

## 21.4.0 (2022-11-02)

## 21.3.0 (2022-10-19)

## 21.2.0 (2022-10-05)

## 21.1.0 (2022-09-21)

## 21.0.0 (2022-08-24)

### Breaking Change

-   Increase the minimum Node.js version to 14 ([#43141](https://github.com/WordPress/gutenberg/pull/43141)).

## 20.0.0 (2022-01-27)

### Breaking Change

-   Increased minimum peer dependency of `stylelint` to `14.2.0` ([#38091](https://github.com/WordPress/gutenberg/pull/38091)). See [official migration guide to v14](https://github.com/stylelint/stylelint/blob/14.0.0/docs/migration-guide/to-14.md) for details.

## 19.0.0 (2021-01-21)

### Breaking Change

-   Increase the minimum Node.js version to 12 ([#27934](https://github.com/WordPress/gutenberg/pull/27934)).
-   Increased minimum peer dependency of `stylelint` to `13.7.0`.

### Bug Fixes

-   Fixed deprecation warning for `declaration-property-unit-whitelist`.

## 18.0.0 (2021-01-05)

### Breaking Change

-   Increase the minimum Node.js version to 12 ([#27934](https://github.com/WordPress/gutenberg/pull/27934)).

### Internal

-   Imported from `WordPress-Coding-Standards/stylelint-config-wordpress` repository to `WordPress/gutenberg` ([#22777](https://github.com/WordPress/gutenberg/pull/22777))

## 17.0.0 (2020-05-31)

-   Updated: `stylelint-scss` to `3.17.2`.
-   Updated: `stylelint` to `13.0.0`.

## 16.0.0 (2019-12-31)

-   Fixed: `selector-class-pattern` rule regex to account for numerals, case detection, and ensure kebab-case over snake_case.
-   Fixed: `selector-id-pattern` rule regex to account for numerals, case detection, and ensure kebab-case over snake_case.
-   Updated: `stylelint-config-recommended-scss` to `4.1.0`.
-   Updated: `stylelint-find-rules` to `2.2.0`.
-   Updated: `stylelint-scss` to `3.13.0`.
-   Updated: `stylelint` to `11.0.0`.

## 15.0.0 (2019-10-05)

-   Added: NodeJS 12.x.x support.
-   Updated: `stylelint` to `11.0.0`.
-   Removed: `stylelint < 10.1.0` compatibility.
-   Updated: `stylelint-config-recommended` to `3.0.0`.
-   Updated: `stylelint-config-recommended-scss` to `4.0.0`.
-   Updated: Bump minimum Node.js required version to `10.0.0`.

## 14.0.0 (2019-04-18)

-   Updated: `stylelint` to `10.0.0`.
-   Updated: `stylelint-scss` to `3.6.0`.
-   Updated: `stylelint-config-recommended` to `2.2.0`.

## 13.1.0 (2018-08-19)

-   Added: Added SCSS _shared config_ `extends` tests.
-   Changed: `stylelint-config-wordpress/scss` now extends [`stylelint-config-recommended-scss`](https://github.com/kristerkari/stylelint-config-recommended-scss) (the net result of this change results in no rule changes for this SCSS config).
-   Updated: `stylelint-scss` to `3.3.0`.
-   Updated: `stylelint` to `9.5.0`.

## 13.0.0 (2018-03-19)

-   Added: stylelint `9.1.3` support.
-   Changed: Updated `stylelint` peer dependency version to `^9.1.3`.
-   Changed: Improved `no-duplicate-selectors` tests.
-   Removed: Jest snapshots.
-   Removed: `stylelint < 9.1.3` compatibility.
-   Updated: `selector-pseudo-element-colon-notation` to use `double`
-   Updated: `stylelint-config-recommended` to `2.1.0`.
-   Updated: `stylelint-scss` to `2.1.0`.
-   Updated: Bump minimum Node.js required version to `8.9.3`.

## 12.0.0 (2017-07-18)

-   Changed: `stylelint-config-wordpress` now extends [`stylelint-config-recommended`](https://github.com/stylelint/stylelint-config-recommended), which turns on the `at-rule-no-unknown`, `block-no-empty`, `comment-no-empty`, `declaration-block-no-ignored-properties`, `declaration-block-no-redundant-longhand-properties`, `font-family-no-duplicate-names`, `media-feature-name-no-unknown`, `no-empty-source` rule. These rules are part of stylelint's [possible errors](https://github.com/stylelint/stylelint/blob/HEAD/docs/user-guide/rules/list.md#possible-errors) rules.
-   Removed: `stylelint-scss < 1.5.1` compatibility.
-   Removed: Removed style guide docs.
-   Removed: `at-rule-no-unknown` custom `ignoreAtRules` options in `stylelint-config-wordpress/scss` shared config.
-   Added: `scss/at-rule-no-unknown` rule in `stylelint-config-wordpress/scss` shared config.
-   Added: NodeJS 8.x.x support.
-   Added: npm 5.x.x support.
-   Added: Jest snapshots to help detect and prevent regressions.

## 11.0.0 (2017-05-16)

-   Added: `declaration-property-unit-whitelist` rule to allow `px` and exclude `%` and `em` units in `line-height` values.
-   Changed: Relocated repo to https://github.com/WordPress-Coding-Standards.
-   Fixed: Include CSS config `at-rule-empty-line-before` rules in SCSS config.

## 10.0.2 (2017-04-29)

-   Added: Added `import` to `ignoreAtRules` option in `at-rule-empty-line-before` rule for SCSS config.

## 10.0.1 (2017-04-21)

-   Removed: `rule-non-nested-empty-line-before` rule from SCSS config. This rule is deprecated in stylelint v8, the new `rule-empty-line-before` rule already exists in the primary config.

## 10.0.0 (2017-04-21)

-   Added: `scss/selector-no-redundant-nesting-selector` rule in `stylelint-config-wordpress/scss` shared config.
-   Added: `selector-no-empty` rule.
-   Added: NodeJS 7.x.x support
-   Fixed: Added `stylelint-scss` plugin @if/@else placement rules.
-   Fixed: Ignore `relative` keyword names in `font-weight-notation` rule.
-   Fixed: Ignore proprietary `DXImageTransform.Microsoft` MS filters
-   Fixed: Removed `@debug` from `ignoreAtRules` array of `at-rule-no-unknown` rule in `stylelint-config-wordpress/scss` chared config.
-   Deprecated `blockless-group` option for `at-rule-empty-line-before` rule. Use the new `blockless-after-blockless` option instead.
-   Deprecated `media-feature-no-missing-punctuation` rule.
-   Deprecated `rule-nested-empty-line-before` and `rule-non-nested-empty-line-before` rules. Use the new `rule-empty-line-before` rule instead.
-   Deprecated `selector-no-empty` rule.
-   Refactor: Switch from AVA to Jest for tests.
-   Refactor: Switch from eslint-plugin-ava to eslint-plugin-jest.
-   Removed: `stylelint < 7.10.1` compatibility.
-   Removed: `stylelint-scss < 1.4.4` compatibility.
-   Removed: NodeJS 4.x support, `stylelint` and `stylelint-config-wordpress` now require NodeJS > 6.9.1 LTS or greater

## 9.1.1 (2016-09-30)

-   Fixed: Re-releasing failed npmjs.com 9.1.0 release as 9.1.1.

## 9.1.0 (2016-09-30)

-   Added: `stylelint-config-wordpress/scss` preset.

## 9.0.0 (2016-09-10)

-   Removed: `stylelint < 7.2.0` compatibility.
-   Removed: NodeJS 0.12.x support, `stylelint` and `stylelint-config-wordpress` now require NodeJS > 4.2.1 LTS or greater
-   Added: `at-rule-no-unknown` rule.
-   Added: `selector-attribute-quotes` rule.
-   Added: `font-weight-notation` rule.
-   Added: `max-line-length` rule.
-   Added: `property-no-unknown` rule.
-   Added: `selector-class-pattern` rule.
-   Added: `selector-id-pattern` rule.
-   Deprecated `no-missing-eof-newline` rule. Use the new `no-missing-end-of-source-newline` rule instead.
-   Fixed `font-family-name-quotes` test warning message in `values.js`.

## 8.0.0 (2016-06-14)

-   Removed: `stylelint < 6.6.0` compatibility.
-   Removed: `number-zero-length-no-unit` rule.
-   Added: `length-zero-no-unit` rule.
-   Added: `value-keyword-case` rule.

## 7.1.1 (2016-05-30)

-   Fixed: Re-releasing failed npmjs.com 7.0.0 release as 7.1.1.

## 7.1.0 (2016-05-30)

-   Fixed: `font-family-name-quotes` rule deprecated option `double-where-recommended` to new `always-where-recommended` option.
-   Fixed: `function-url-quotes` rule deprecated option `none` to new `never` option.
-   Removed: `stylelint < 6.5.1` compatibility.
-   Changed: Improved tests and documentation.
-   Added: `comment-empty-line-before` rule.

## 7.0.0 (2016-05-20)

-   Added: `keyframe-declaration-no-important` rule.
-   Added: `selector-pseudo-class-no-unknown` rule.
-   Added: `selector-pseudo-element-no-unknown` rule.
-   Added: `selector-type-no-unknown` rule.

## 6.0.0 (2016-05-17)

-   Added: `at-rule-name-space-after` rule.
-   Added: `no-extra-semicolons` rule.
-   Added: `selector-attribute-operator-space-after` rule.
-   Added: `selector-attribute-operator-space-before` rule.
-   Added: `selector-max-empty-liness` rule.

## 5.0.0 (2016-04-24)

-   Added: `at-rule-name-case` rule.
-   Added: `declaration-block-no-duplicate-properties` rule.
-   Added: `function-max-empty-lines` rule.
-   Added: `function-name-case` rule.
-   Added: `property-case` rule.
-   Added: `selector-attribute-brackets-space-inside` rule.
-   Added: `selector-pseudo-class-case` rule.
-   Added: `selector-pseudo-class-parentheses-space-inside` rule.
-   Added: `selector-pseudo-element-case` rule.
-   Added: `shorthand-property-no-redundant-values` rule.
-   Added: `unit-case` rule.
-   Added: `unit-no-unknown` rule.

## 4.0.0 (2016-03-25)

-   Removed: `stylelint < 5.2.0` compatibility.
-   Added: `at-rule-semicolon-newline-after` rule.
-   Added: `selector-type-case` rule.

## 3.0.1 (2016-03-10)

-   Added: `stylelint` version `^4.5.0` as a peer dependency to `peerDependencies` in `package.json`

## 3.0.0 (2016-03-08)

-   Removed: `stylelint < 4.5.0` compatibility.
-   Deprecated: `rule-no-shorthand-property-overrides` rule. Use the new `declaration-block-no-shorthand-property-overrides` rule instead.
-   Deprecated: `rule-trailing-semicolon` rule. Use the new `declaration-block-trailing-semicolon` rule instead.
-   Added: `color-named` rule.
-   Added: `declaration-block-no-shorthand-property-overrides` rule.
-   Added: `declaration-block-trailing-semicolon` rule.
-   Added: `string-no-newline` rule.

## 2.1.0 (2016-03-03)

-   Added: `max-empty-lines` rule, limits the number of adjacent empty lines to 2.
-   Changed: `rule-nested-empty-line-before` rule option `ignore: ["after-comment"]`.
-   Removed all vendor prefixes, lets autoprefixer handle vendor prefixes:
    -   Removed: `at-rule-no-vendor-prefix`
    -   Removed: `media-feature-name-no-vendor-prefix`
    -   Removed: `property-no-vendor-prefix`
    -   Removed: `selector-no-vendor-prefix`
    -   Removed: `value-no-vendor-prefix`

## 2.0.2 (2016-02-17)

-   Fixed another npmjs.com release issue

## 2.0.1 (2016-02-17)

-   Fixed npmjs.com release

## 2.0.0 (2016-02-17)

-   Removed: `media-query-parentheses-space-inside` rule.
-   Removed: `stylelint < 4.3.4` compatibility.
-   Added: `font-family-name-quotes` rule with double quotes where recommended option.
-   Added: `media-feature-no-missing-punctuation` rule.
-   Added: `no-invalid-double-slash-comments` rule.

## 1.1.1 (2016-01-19)

-   Changed: `rule-non-nested-empty-line-before` with option `ignore: ["after-comment"],`.

## 1.1.0 (2016-01-18)

-   Added: `selector-pseudo-element-colon-notation` with option `single`

## 1.0.1 (2015-12-11)

-   Changed: config syntax.

## 1.0.0 (2015-12-11)

-   Removed: `stylelint < 3.0.0` compatibility.
-   Changed: renamed the `function-space-after` rule to `function-whitespace-after`.
-   Changed: `at-rule-empty-line-before` with option `ignore: ["after-comment"],`.
-   Changed: `declaration-colon-space-after` with option `always-single-line`.
-   Added: `declaration-colon-newline-after` with option `always-multi-line`.
-   Added: `function-linear-gradient-no-nonstandard-direction`.

## 0.2.0 (2015-09-04)

-   Fixed: No quotes for URLs -> `"function-url-quotes": [ 2, "none" ]`.

## 0.1.0 (2015-08-01)

Initial release.
