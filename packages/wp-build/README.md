# @wordpress/build

Build tool for WordPress plugins.

## Description

`@wordpress/build` is an opinionated build system designed for WordPress plugins. It provides:

- **Transpilation**: Converts TypeScript/JSX source code to both CommonJS (`build/`) and ESM (`build-module/`) formats using esbuild
- **Style Compilation**: Processes SCSS files and CSS modules, generating LTR and RTL versions
- **Bundling**: Creates browser-ready bundles for WordPress scripts and modules
- **PHP Generation**: Automatically generates PHP registration files for scripts, modules, and styles
- **Watch Mode**: Incremental rebuilds during development

## Installation

```bash
npm install @wordpress/build --save-dev
```

## Usage

### Production Build

```bash
wp-build
```

or via npm script:

```json
{
	"scripts": {
		"build": "wp-build"
	}
}
```

### Development Mode (Watch)

```bash
wp-build --watch
```

or via npm script:

```json
{
	"scripts": {
		"dev": "wp-build --watch"
	}
}
```

## Package Configuration

Configure your `package.json` with the following optional fields:

### `wpScript`

Set to `true` to bundle the package as a WordPress script/module:

```json
{
	"wpScript": true
}
```

### `wpScriptModuleExports`

Define script module entry points:

```json
{
	"wpScriptModuleExports": {
		"./interactivity": "./build-module/interactivity/index.js"
	}
}
```

### `wpScriptDefaultExport`

Handle default export wrapping:

```json
{
	"wpScriptDefaultExport": true
}
```

### `wpScriptExtraDependencies`

Additional script dependencies:

```json
{
	"wpScriptExtraDependencies": ["wp-polyfill"]
}
```

### `wpStyleEntryPoints`

Custom SCSS entry point patterns:

```json
{
	"wpStyleEntryPoints": {
		"style": "src/style.scss"
	}
}
```

### `wpCopyFiles`

Files to copy with optional PHP transformations:

```json
{
	"wpCopyFiles": [
		{
			"from": "src/index.php",
			"to": "build/index.php",
			"transform": "php"
		}
	]
}
```

## Output Structure

The built tool generates several files in the `build/` directory, but the primary output is the PHP registration file.

Make sure to include the generated PHP file in your plugin file.

```php
require_once plugin_dir_path( __FILE__ ) . 'build/index.php';
```

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose.

The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

## License

GPL-2.0-or-later © The WordPress Contributors
