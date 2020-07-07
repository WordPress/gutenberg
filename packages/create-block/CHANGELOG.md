<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/master/packages#maintaining-changelogs. -->

## Unreleased

## 0.16.0 (2020-06-25)

### New Feature

-   Generate `block.json` file with all metadata necessary for Block Directory ([#23399](https://github.com/WordPress/gutenberg/pull/23399)).

### Bug Fix

-   Fix the error in the scaffolding process caused by the missing `scripts` section in `package.json` file ([#23443](https://github.com/WordPress/gutenberg/pull/23443)).

## 0.15.0-rc.0 (2020-06-24)

### New Feature

-   Add new CLI options: `--no-wp-scripts` and `--wp-scripts` to let users override the settings that template defines for supports for `@wordpress/scripts` package integration ([#23195](https://github.com/WordPress/gutenberg/pull/23195)).

## 0.14.2 (2020-06-16)

### Bug Fix

-   Fix errors reported by CSS linter in ESNext template by using hex colors in CSS files ([#23188](https://github.com/WordPress/gutenberg/pull/23188)).

## 0.14.1 (2020-06-15)

### Bug Fix

-   Fix an error reported by JavaScript linter by improving JSDoc comment in ESNext template in `src/edit.js` file ([#23164](https://github.com/WordPress/gutenberg/pull/23164)).

## 0.14.0 (2020-06-15)

### Enhancements

-   Update `esnext` (default) template to leverage CSS import in JavaScript support added to `@wordpress/scripts` ([#22727](https://github.com/WordPress/gutenberg/pull/22727/files)).

## 0.13.0 (2020-05-28)

### Internal

-   Refactored handling of predefined block templates [#22235](https://github.com/WordPress/gutenberg/pull/22235).

## 0.12.0 (2020-04-30)

### New Features

-   Add more CLI options: `--namespace`, `--title`, `--short-description` and `--category`. The goal is to make it easier to override default values used for scaffolding ([#21751](https://github.com/WordPress/gutenberg/pull/21751)).

### Enhancements

-   Update `esnext` (default) template to scaffold 3 JavaScript source files to illustrate how ES modules help to better organize code ([#21750](https://github.com/WordPress/gutenberg/pull/21750)).

## 0.10.0 (2020-04-01)

### New Features

-   Added readme.txt file to the existing templates to make your entry in the plugin browser most useful ([#20694](https://github.com/WordPress/gutenberg/pull/20694)).
-   Added prompts for the `author`, `license` and `version` of the plugin ([#20694](https://github.com/WordPress/gutenberg/pull/20694)).

### Bug Fixes

-   Make `version` prompt mandatory and provide validation against semantic versioning ([#20756](https://github.com/WordPress/gutenberg/pull/20756)).
-   Omit optional values in the scaffolded files when they aren't provided ([#20756](https://github.com/WordPress/gutenberg/pull/20756)).

## 0.8.3 (2020-02-26)

### Bug Fixes

-   Fixed buggy check for minimum system requirements when run with `npx` and `npm init` ([#20461](https://github.com/WordPress/gutenberg/pull/20461)).

## 0.8.1 (2020-02-25)

### Bug Fixes

-   Added error message when minimum system requirements not met ([#20398](https://github.com/WordPress/gutenberg/pull/20398/)).
-   Corrected the minimum `npm` version required to align with `@wordpress/scripts` package used internally ([#20398](https://github.com/WordPress/gutenberg/pull/20398/)).

## 0.8.0 (2020-02-21)

### New Features

-   Added support for `format:js` script to the block scaffolded with ESNext template ([#20335](https://github.com/WordPress/gutenberg/pull/20335)).

## 0.6.0 (2020-02-04)

### Enhancements

-   Removed the code that clears the terminal while the block is scaffolded ([#19867](https://github.com/WordPress/gutenberg/pull/19867)).

### Bug Fixes

-   Use the description provided to fill the `description` field in `package.json` file in ESNext template ([#19867](https://github.com/WordPress/gutenberg/pull/19867)).
-   Ensure that values provided for slug and namespace get converted to lower case ([#19867](https://github.com/WordPress/gutenberg/pull/19867)).

### Internal

-   Relocated npm packge from `create-wordpress-block` to `@wordpress/create-block` ([#19773](https://github.com/WordPress/gutenberg/pull/19773)).

## 0.5.0 (2020-01-08)

### New Features

-   Update templates to include WordPress plugin metadata by default.

## 0.4.3 (2020-01-08)

### Bug Fix

-   Print available commands only for ESNext template.

## 0.4.0 (2019-12-17)

### New Features

-   Add full support for ESNext template, including `wp-scripts` bootstrapping.

### Enhancements

-   Improve the feedback shared on the console while scaffolding a block.

## 0.3.2 (2019-12-16)

### Bug Fix

-   Fix the paths pointing to the JS build file listed in PHP file in the ESNext template.

## 0.3.0 (2019-12-16)

### New Features

-   Added support for template types. `esnext` becomes the default one. `es5` is still available as an option.
