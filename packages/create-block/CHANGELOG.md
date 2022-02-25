<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### Breaking Changes

-   It is no longer mandatory to provide the deprecated `templatesPath` option when configuring the custom project template ([#39049](https://github.com/WordPress/gutenberg/pull/39049)).
-   Custom project templates will use default template files during scaffolding for the WordPress plugin shell and/or individual blocks. It is possible to replace them with a custom set of template files by using the `pluginTemplatesPath` and/or `blockTemplatesPath` options ([#39049](https://github.com/WordPress/gutenberg/pull/39049)).
-   The default `esnext` project template got renamed to `static` ([#39049](https://github.com/WordPress/gutenberg/pull/39049)).

### New Features

-   Added CLI prompts for three additional plugin header fields: `Plugin URI`, `Domain Path`, and `Update URI` ([#39096](https://github.com/WordPress/gutenberg/pull/39096)).

### Deprecations

-   To remove confusion when configuring custom project templates, the `templatesPath` option got renamed to `pluginTemplatesPath`. The old name still works but is considered deprecated, and it might get removed in the future ([#39049](https://github.com/WordPress/gutenberg/pull/39049)).

### Documentation

-   Include a missing note on how to create a zip file for a WordPress plugin ([#39049](https://github.com/WordPress/gutenberg/pull/39049))

## 2.9.0 (2022-02-10)

### New Features

-   Automatically add a `"env": "wp-env"` entry to scripts when the `--wp-env` is passed or when a template sets `wpEnv` to `true` ([#38530](https://github.com/WordPress/gutenberg/pull/38530)).
-   Introduce the `customScripts` property to allow templates to define additional scripts ([#38535](https://github.com/WordPress/gutenberg/pull/38535)).

## 2.8.0 (2022-01-27)

### New Features

-   Integrated a new `plugin-zip` command to create a zip file for a WordPress plugin ([#37687](https://github.com/WordPress/gutenberg/pull/37687)).
-   Add support for handling block templates with the `blockTemplatesPath` field in the external template configuration ([#37612](https://github.com/WordPress/gutenberg/pull/37612)).
-   Add a new field `folderName` for setting the location for the `block.json` file and other optional block files generated from block templates included in the folder set with the `blockTemplatesPath` setting ([#37612](https://github.com/WordPress/gutenberg/pull/37612)).

### Enhancement

-   Speed up scaffolding process by omitting WordPress dependencies in the template ([#37639](https://github.com/WordPress/gutenberg/pull/37639)).
-   Update link to block registration reference ([#37674](https://github.com/WordPress/gutenberg/pull/37674))

### Internal

-   The bundled `npm-package-arg` dependency has been updated from requiring `^8.0.1` to requiring `^8.1.5` ([#37395](https://github.com/WordPress/gutenberg/pull/37395)).

## 2.7.0 (2021-11-07)

### New Features

-   Add $schema definition to generated `block.json` file.

## 2.6.0 (2021-10-22)

### New Features

-   Add passing local directories to --template. ([#35645](https://github.com/WordPress/gutenberg/pull/35645))
-   Add `slugPascalCase` to the list of variables that can be used in templates ([#35462](https://github.com/WordPress/gutenberg/pull/35462))

## 2.5.0 (2021-07-21)

### Enhancements

-   Add support for the new `version` field in the `block.json` metadata file ([#33075](https://github.com/WordPress/gutenberg/pull/33075)).

## 2.4.0 (2021-07-21)

### Enhancement

-   Plugin scaffolded with the `esnext` template requires WordPress 5.8 now ([#33252](https://github.com/WordPress/gutenberg/pull/33252).
-   Block scaffolded with the `esnext` template is now registered from `block.json` with the `register_block_type` helper ([#33252](https://github.com/WordPress/gutenberg/pull/33252)).

## 2.3.0 (2021-04-29)

### Enhancement

-   Rename `format:js` script to `format` ([#30240](https://github.com/WordPress/gutenberg/pull/30240)).
-   Updated `.editorconfig` template files to work with automatic file formatting ([#30794](https://github.com/WordPress/gutenberg/pull/30794)).

## 2.2.0 (2021-04-06)

### Enhancement

-   Scaffolded plugin requires WordPress 5.7 now ([#29757](https://github.com/WordPress/gutenberg/pull/29757)).

### New Features

-   Add new `theme` category to select for the block type ([#30089](https://github.com/WordPress/gutenberg/pull/30089)).

## 2.1.0 (2021-03-17)

### New Features

-   Add a way to provide a default value in the template for `attributes` and `supports` Block API fields ([#28883](https://github.com/WordPress/gutenberg/pull/28883)).

### Enhancement

-   Block scaffolded with `esnext` template is now registered from `block.json` with the `register_block_type_from_metadata` helper ([#28883](https://github.com/WordPress/gutenberg/pull/28883)).

### Bug Fixes

-   Updated `check-node-version` to version `^4.1.0` that no longer processes unrelated engines ([#29066](https://github.com/WordPress/gutenberg/pull/29066)).
-   Fixed the background color used in the CSS file that was invalid on the front-end.

## 2.0.1 (2021-02-01)

### Bug Fix

-   Extract the package name from the value passed as an external template ([#28383](https://github.com/WordPress/gutenberg/pull/28383)).

## 2.0.0 (2021-01-21)

### Breaking Changes

-   Increase the minimum Node.js version to 12 ([#27934](https://github.com/WordPress/gutenberg/pull/27934)).

### New Features

-   Add support for handling static assets with the `assetsPath` field in the external template configuration ([#28038](https://github.com/WordPress/gutenberg/pull/28038)).
-   Allow using locally installed packages with templates ([#28105](https://github.com/WordPress/gutenberg/pull/28105)).
-   Add new CLI option `--wp-env` that lets users override the setting that template defines for integration with `@wordpress/env` package ([#28234](https://github.com/WordPress/gutenberg/pull/28234)).

### Internal

-   Update the demo included in the README file ([#28037](https://github.com/WordPress/gutenberg/pull/28037)).

## 1.1.0 (2021-01-05)

### New Feature

-   Adds the `npmDependencies` field to the template configuration. It allows listing remote npm dependencies that will be installed in the scaffolded project ([#27880](https://github.com/WordPress/gutenberg/pull/27880)).
-   Installs WordPress npm dependencies used in the `esnext` template during the scaffolding process ([#27880](https://github.com/WordPress/gutenberg/pull/27880)).

### Bug Fix

-   Print the block class name in the `save` method in scaffolded templates ([#27988](https://github.com/WordPress/gutenberg/pull/27988)).

## 1.0.2 (2020-12-17)

### Bug Fix

-   Second attempt to fix support for external templates by using a temporary folder when downloading npm package.

## 1.0.1 (2020-12-17)

### Bug Fix

-   Fix support for external templates hosted on npm.

## 1.0.0 (2020-12-17)

### Breaking Changes

-   Set the minimum required version of WordPress to 5.6.0 to ensure that block is correctly registered with the [Block API version 2](https://make.wordpress.org/core/2020/11/18/block-api-version-2/) ([#26098](https://github.com/WordPress/gutenberg/pull/26098)).

### New Features

-   Added basic support for external templates hosted on npm ([#23712](https://github.com/WordPress/gutenberg/pull/23712)).
-   Update templates to work with the [Block API version 2](https://make.wordpress.org/core/2020/11/18/block-api-version-2/) ([#26098](https://github.com/WordPress/gutenberg/pull/26098)).

## 0.18.0 (2020-10-30)

### Breaking Changes

-   Update the list of available block categories to align with changes introduced in WordPress 5.5.0 (https://make.wordpress.org/core/2020/07/30/block-api-updates-in-5-5/).
-   Set the minimum required version of WordPress to 5.5.0 to ensure that block is correctly registered with new block categories.

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
