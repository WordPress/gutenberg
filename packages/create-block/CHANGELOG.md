<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 4.52.0 (2024-10-03)

## 4.51.0 (2024-09-19)

## 4.50.0 (2024-09-05)

### Enhancements

-   Unpin the `@wordpress/scripts` version and set the minimum supported WordPress version to 6.6 ([#64920](https://github.com/WordPress/gutenberg/pull/64920)).

## 4.49.0 (2024-08-21)

## 4.48.0 (2024-08-07)

## 4.47.0 (2024-07-24)

## 4.46.0 (2024-07-10)

## 4.45.0 (2024-06-26)

## 4.44.0 (2024-06-15)

### Bug fix

-   Pin the `@wordpress/scripts` version to a version supported by WordPress 6.5 ([#62234](https://github.com/WordPress/gutenberg/pull/62234)).

## 4.43.0 (2024-05-31)

## 4.42.0 (2024-05-16)

### Breaking Change

-   Increase the minimum required Node.js version to v20.10.0 matching the support defined for Gutenberg and WordPress core ([#61430](https://github.com/WordPress/gutenberg/pull/61430)).

## 4.41.0 (2024-05-02)

## 4.40.0 (2024-04-19)

## 4.39.0 (2024-04-03)

### New Features

-   Add new `namespacePascalCase` template variable ([#60223](https://github.com/WordPress/gutenberg/pull/60223)).

## 4.38.0 (2024-03-21)

## 4.37.0 (2024-03-06)

## 4.36.0 (2024-02-21)

### Bug Fixes

-   Add missing `viewScriptModule` field ([#59140](https://github.com/WordPress/gutenberg/pull/59140)).

### Internal

-   Remove deprecated `viewModule` field ([#59198](https://github.com/WordPress/gutenberg/pull/59198)).

## 4.35.0 (2024-02-09)

## 4.34.0 (2024-01-24)

## 4.33.0 (2024-01-10)

### New Features

-   Add support for the `viewModule` property ([#57712](https://github.com/WordPress/gutenberg/pull/57712)).

## 4.32.0 (2023-12-13)

## 4.31.0 (2023-11-29)

## 4.30.0 (2023-11-16)

## 4.29.0 (2023-11-02)

## 4.28.0 (2023-10-18)

### New Features

-   Add new `transformer` property to external templates to allow customization of any values being passed from cli or the template.[#55423](https://github.com/WordPress/gutenberg/pull/55423)

## 4.27.0 (2023-10-05)

## 4.26.0 (2023-09-20)

## 4.25.0 (2023-08-31)

## 4.24.0 (2023-08-16)

## 4.23.0 (2023-08-10)

### Enhancements

-   Add support for the `example` property and add it to the default template ([#52803](https://github.com/WordPress/gutenberg/pull/52803)).

## 4.22.0 (2023-07-20)

### Enhancements

-   Add support for the `viewScript` property ([#52612](https://github.com/WordPress/gutenberg/pull/52612)).

## 4.21.0 (2023-07-05)

## 4.20.0 (2023-06-23)

## 4.19.0 (2023-06-07)

## 4.18.0 (2023-05-24)

## 4.17.0 (2023-05-10)

## 4.16.0 (2023-04-26)

## 4.15.0 (2023-04-12)

## 4.14.0 (2023-03-29)

## 4.13.0 (2023-03-15)

## 4.12.0 (2023-03-01)

## 4.11.0 (2023-02-15)

## 4.10.0 (2023-02-01)

## 4.9.0 (2023-01-11)

## 4.8.0 (2023-01-02)

## 4.7.0 (2022-12-14)

## 4.6.0 (2022-11-16)

## 4.5.0 (2022-11-02)

### Enhancements

-   Update templates to use the `render` field in `block.json` introduced in WordPress 6.1 ([#44185](https://github.com/WordPress/gutenberg/pull/44185)).

## 4.4.0 (2022-10-19)

### New Features

-   Add new `customPackageJSON` and `customBlockJSON` keys to allow templates to define custom keys for the resulting `package.json` and `block.json` files respectively.[#44649](https://github.com/WordPress/gutenberg/pull/44649)

## 4.3.0 (2022-10-05)

## 4.2.0 (2022-09-21)

## 4.0.0 (2022-08-24)

### Breaking Changes

-   Increase the minimum Node.js version to 14 and minimum npm version to 6.14.4 ([#43141](https://github.com/WordPress/gutenberg/pull/43141)).

### New Features

-   Add `--no-plugin` flag to allow scaffolding of a block in an existing plugin ([#41642](https://github.com/WordPress/gutenberg/pull/41642))
-   Introduce the `--variant` flag to allow selection of a variant as defined in the template ([#41289](https://github.com/WordPress/gutenberg/pull/41289), [#43481](https://github.com/WordPress/gutenberg/pull/43481)).

## 3.6.0 (2022-07-13)

### Enhancements

-   Added prompt to continue when minimum system requirements not met ([#42151](https://github.com/WordPress/gutenberg/pull/42151)).

## 3.3.0 (2022-06-01)

### Enhancements

-   Read the block name from `block.json` file in JavaScript files ([#41273](https://github.com/WordPress/gutenberg/pull/41273)).

## 3.2.0 (2022-05-18)

### Bug Fixes

-   Fix the `.editorconfig` file include to work correctly with YAML files ([#40994](https://github.com/WordPress/gutenberg/pull/40994)).

### Internal

-   Updated `commander` dependency from requiring `^4.1.0` to `^9.2.0` ([#40927](https://github.com/WordPress/gutenberg/pull/40927)).

## 3.1.0 (2022-04-08)

### New Features

-   Add `npmDevDependencies` template variable to allow definition of `devDependencies` as part of a template ([#39723](https://github.com/WordPress/gutenberg/pull/39723)).

## 3.0.0 (2022-03-03)

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

### Enhancements

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

### Enhancements

-   Plugin scaffolded with the `esnext` template requires WordPress 5.8 now ([#33252](https://github.com/WordPress/gutenberg/pull/33252).
-   Block scaffolded with the `esnext` template is now registered from `block.json` with the `register_block_type` helper ([#33252](https://github.com/WordPress/gutenberg/pull/33252)).

## 2.3.0 (2021-04-29)

### Enhancements

-   Rename `format:js` script to `format` ([#30240](https://github.com/WordPress/gutenberg/pull/30240)).
-   Updated `.editorconfig` template files to work with automatic file formatting ([#30794](https://github.com/WordPress/gutenberg/pull/30794)).

## 2.2.0 (2021-04-06)

### Enhancements

-   Scaffolded plugin requires WordPress 5.7 now ([#29757](https://github.com/WordPress/gutenberg/pull/29757)).

### New Features

-   Add new `theme` category to select for the block type ([#30089](https://github.com/WordPress/gutenberg/pull/30089)).

## 2.1.0 (2021-03-17)

### New Features

-   Add a way to provide a default value in the template for `attributes` and `supports` Block API fields ([#28883](https://github.com/WordPress/gutenberg/pull/28883)).

### Enhancements

-   Block scaffolded with `esnext` template is now registered from `block.json` with the `register_block_type_from_metadata` helper ([#28883](https://github.com/WordPress/gutenberg/pull/28883)).

### Bug Fixes

-   Updated `check-node-version` to version `^4.1.0` that no longer processes unrelated engines ([#29066](https://github.com/WordPress/gutenberg/pull/29066)).
-   Fixed the background color used in the CSS file that was invalid on the front-end.

## 2.0.1 (2021-02-01)

### Bug Fixes

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

### New Features

-   Adds the `npmDependencies` field to the template configuration. It allows listing remote npm dependencies that will be installed in the scaffolded project ([#27880](https://github.com/WordPress/gutenberg/pull/27880)).
-   Installs WordPress npm dependencies used in the `esnext` template during the scaffolding process ([#27880](https://github.com/WordPress/gutenberg/pull/27880)).

### Bug Fixes

-   Print the block class name in the `save` method in scaffolded templates ([#27988](https://github.com/WordPress/gutenberg/pull/27988)).

## 1.0.2 (2020-12-17)

### Bug Fixes

-   Second attempt to fix support for external templates by using a temporary folder when downloading npm package.

## 1.0.1 (2020-12-17)

### Bug Fixes

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

### New Features

-   Generate `block.json` file with all metadata necessary for Block Directory ([#23399](https://github.com/WordPress/gutenberg/pull/23399)).

### Bug Fixes

-   Fix the error in the scaffolding process caused by the missing `scripts` section in `package.json` file ([#23443](https://github.com/WordPress/gutenberg/pull/23443)).

## 0.15.0-rc.0 (2020-06-24)

### New Features

-   Add new CLI options: `--no-wp-scripts` and `--wp-scripts` to let users override the settings that template defines for supports for `@wordpress/scripts` package integration ([#23195](https://github.com/WordPress/gutenberg/pull/23195)).

## 0.14.2 (2020-06-16)

### Bug Fixes

-   Fix errors reported by CSS linter in ESNext template by using hex colors in CSS files ([#23188](https://github.com/WordPress/gutenberg/pull/23188)).

## 0.14.1 (2020-06-15)

### Bug Fixes

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

### Bug Fixes

-   Print available commands only for ESNext template.

## 0.4.0 (2019-12-17)

### New Features

-   Add full support for ESNext template, including `wp-scripts` bootstrapping.

### Enhancements

-   Improve the feedback shared on the console while scaffolding a block.

## 0.3.2 (2019-12-16)

### Bug Fixes

-   Fix the paths pointing to the JS build file listed in PHP file in the ESNext template.

## 0.3.0 (2019-12-16)

### New Features

-   Added support for template types. `esnext` becomes the default one. `es5` is still available as an option.
