# Canonical Plugins

This folder contains additional community plugins that are packaged separately from the Gutenberg plugin. These plugins are distributed in [the WordPress plugins repository](https://wordpress.org/plugins/), and authored by WordPress.org. Anyone is welcome to contribute to these plugins--they are maintained by the community.

Plugins here should follow the same coding, development, testing, and quality standards as the Gutenberg plugin. Scripts and Github workflows are shared across the repo so that all code (from both Gutenberg and these plugins) is checked across the repo with every pull request.

However, plugins should be standalone and work independently from one another, with or without the Gutenberg plugin enabled.

Currently, the main use for canonical plugins in this repository is for single block plugins.

Note that `PLUGIN_NAME` and `PLUGIN-SLUG` are used here as placeholders and should be replaced with the actual plugin name and slug in the following example code.

## Folder structure

`plugins/PLUGIN-SLUG/` directory:
```
- .npmrc
- assets/
	- screenshot-*.png
- block.json (for block plugins)
- package.json
- phpcs.xml.dist
- readme.txt
- src/
	- index.js
	- style.scss
- PLUGIN-SLUG.php
```

### Plugin Header

The header in the plugin's main .php file should use the [standard plugin headers](https://developer.wordpress.org/plugins/plugin-basics/header-requirements/), with the author as "WordPress.org".

```php
<?php
/**
 * Plugin Name:       Plugin Name
 * Plugin URI:        https://github.com/WordPress/gutenberg/tree/trunk/plugins/PLUGIN-SLUG
 * Description:       A description of the plugin.
 * Version:           1.0.0
 * Requires at least: 6.4
 * Requires PHP:      7.0
 * Author:            WordPress.org
 * Author URI:        https://wordpress.org/
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       PLUGIN-SLUG
 *
 */
```

### package.json

- Plugins aren't published to npm, so should be marked as private in the package.json settings.
- `@wordpress/*` packages should specify a `file:` reference to the relevant package in the monorepo.
- Only declare scripts that are unique to the plugin, such as `"build"` and `"plugin-zip"`. Scripts for linting, formatting, tests, etc are shared across the repo.

```json
{
	"private": true,
	"name": "PLUGIN-SLUG",
	"version": "1.0.0",
	"description": "A description of the plugin",
	"author": "WordPress.org",
	"license": "GPL-2.0-or-later",
	"keywords": [ "wordpress", ... ],
	"homepage": "https://github.com/WordPress/gutenberg/tree/trunk/plugins/PLUGIN-SLUG",
	"repository": {
		"type": "git",
		"url": "https://github.com/WordPress/gutenberg.git",
		"directory": "plugins/PLUGIN-SLUG"
	},
	"bugs": {
		"url": "https://github.com/WordPress/gutenberg/issues"
	},
	"main": "build/index.js",
	"dependencies": {
		"@wordpress/block-editor": "file:../../packages/block-editor",
		...
	},
	"publishConfig": {
		"access": "public"
	},
	"scripts": {
		"build": "wp-scripts build",
		"plugin-zip": "wp-scripts plugin-zip",
		"start": "wp-scripts start"
	}
}
```

## Block Plugins

Block plugins intended for the [block directory](https://wordpress.org/documentation/article/block-directory) should follow the [block specific plugin guidelines](https://developer.wordpress.org/plugins/wordpress-org/block-specific-plugin-guidelines/#block-plugins-and-the-block-directory) and contain only one top-level block per plugin.

The block name should use the prefix `gutenberg` (e.g. `gutenberg/block-name` ) to differentiate it from core blocks.

### block.json

Block plugins should define a `block.json` file. Currently the `block.json` file should be located in `plugins/PLUGIN-SLUG/block.json`, rather than `plugins/PLUGIN-SLUG/src/block.json`, so it will be available in the Github PHPUnit test environment for block registration. Plugins should use the most recent `block.json` version supported by the current WordPress release.

`block.json` files for plugins have some differeneces from those for core blocks (from `@wordpress/block-library`)

- The `__experimental:` property should not be used, as it has no effect for block plugins.
- Properties that specify file paths are required, unlike with core blocks: `"editorScript"`, `"script"`, `"viewScript"`, `"viewScriptModule"`, `"editorStyle"`, `"style"`, and `"viewStyle"` properties should be defined explictly, when needed, as they are not infered automatically.

## Development

### Scripts

Top level commands like `npm install`, `npm run build`, `npm run lint` will automatically run the appropriate scripts for all plugins.

`plugins/*` is defined as an [npm workspace](https://docs.npmjs.com/cli/v10/using-npm/workspaces), to support running commands for individual plugins.

For example, `npm run build -w plugins/PLUGIN-SLUG` will build only the specified plugin. Check the plugin's package.json file to see which commands are supported.

### wp-env

New plugins should be added to `.wp-env.json` so that they are available in the wp-env docker environments for development and end-to-end testing.

```json
{
	...
	"plugins": [
		".",
		"./plugins/PLUGIN-SLUG"
	],
	...
}
```

### Linting

Plugin linting and formatting for PHP, JavaScript, CSS, etc is integrated into the main repository scripts, e.g. `npm run lint`.

#### PHPCS

Plugins need their own PHPCS configuration file that inherits shared rules and overrides settings for the text domain:

`plugins/PLUGIN-SLUG/phpcs.xml.dist`

```xml
<?xml version="1.0"?>
<ruleset name="WordPress Coding Standards for the PLUGIN_NAME plugin">
	<description>Includes shared sniffs for Gutenberg, with modifications.</description>

	<!-- Import shared rules for monorepo -->
	<rule ref="../../phpcs.xml.shared"/>

	<rule ref="WordPress.WP.I18n">
		<properties>
			<property name="text_domain" type="array">
				<element value="PLUGIN-SLUG"/>
			</property>
		</properties>
	</rule>

	<file>./</file>
</ruleset>
```

#### ESLint

Add a new override for the i18n text domain in the main `.eslintrc.js` file, at the root of the repo.

```js
...
module.exports = {
	...
	overrides: {
		...
		{
			files: [ 'plugins/PLUGIN-SLUG/src/**' ],
			rules: {
				'@wordpress/i18n-text-domain': [
					'error',
					{
						allowedTextDomain: 'PLUGIN-SLUG',
					},
				],
			},
		},
	}
}
```

## Automated testing

Plugins should have a full suite of automated tests that help ensure code changes do not introduce bugs and regressions.

### JavaScript unit testing

JS test files should be added in a `tests/` directory located in the plugin's `src/` folder, adjacent to the code begin tested. JS files within a `tests/` directory will be run automatically.

See the [JavaScript testing documentation](https://github.com/WordPress/gutenberg/blob/trunk/docs/contributors/code/testing-overview.md) for more details.

### PHPUnit testing

PHP test files should follow the [core PHPUnit test guidelines](https://make.wordpress.org/core/handbook/testing/automated-testing/writing-phpunit-tests/).

- Place test files in `phpunit/plugins/PLUGIN-SLUG/`.
- Test class names should start with `Tests_Plugins_Plugin_Name_`, cooresponding to the path and name of the file.

See the [PHP testing documentation](https://github.com/WordPress/gutenberg/blob/trunk/docs/contributors/code/testing-overview.md#php-testing) for more details.

### End-to-end testing

End-to-end (e2e) tests should be placed in `tests/e2e/specs/plugins/`, named `PLUGIN-SLUG.spec.js`, and use the existing testing utilites.

Be sure to disable the Gutenberg plugin and activate the plugin being tested before each set of tests, and the inverse when the tests are complete, to ensure that Gutenberg and the plugin work independently of each other.

```js
test.describe( 'My Plugin', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'PLUGIN-SLUG' );
		await requestUtils.deactivatePlugin( 'gutenberg' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin( 'PLUGIN-SLUG' );
		await requestUtils.activatePlugin( 'gutenberg' );
	} );
```

See the [end-to-end testing documentation](https://github.com/WordPress/gutenberg/blob/trunk/docs/contributors/code/testing-overview.md#end-to-end-testing) for more details.

### Integration testing

Integration tests are JavaScript tests run in a testing environment that loads a special version of the block editor. They are an alternative to end-to-end tests that can be useful for testing block UI without the overhead of loading all of WordPress in a brower environment.

See the [Integration testing documentation](https://github.com/WordPress/gutenberg/blob/trunk/docs/contributors/code/testing-overview.md#integration-testing-for-block-ui) for more details.

### Test fixtures

For block plugins, place an `.html` file that contains example HTML markup for the block.

`test/integration/fixtures/blocks/gutenberg__time-to-read.html`
```html
<!-- wp:gutenberg/time-to-read /-->
```

Additionally, a separate fixture should be added for each block deprecation that contains markup for the deprecated version of the block.

Then run `npm run fixtures:regenerate` to generate the remaining fixture files for the block.

See the [block test fixtures documentation](https://github.com/WordPress/gutenberg/tree/trunk/test/integration/fixtures/blocks) for more details.
