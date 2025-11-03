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

## Root Configuration

Configure your root `package.json` with a `wpPlugin` object to control global namespace and externalization behavior:

### `wpPlugin.scriptGlobal`

The global variable name for your packages (e.g., `"wp"`, `"myPlugin"`). Set to `false` to disable global exposure:

```json
{
	"wpPlugin": {
		"scriptGlobal": "myPlugin"
	}
}
```

### `wpPlugin.packageNamespace`

The package scope to match for global exposure (without `@` prefix). Only packages matching `@{packageNamespace}/*` will expose globals:

```json
{
	"wpPlugin": {
		"scriptGlobal": "myPlugin",
		"packageNamespace": "my-plugin"
	}
}
```

### `wpPlugin.handlePrefix`

The prefix used for WordPress script handles in `.asset.php` files (e.g., `wp-data`, `my-plugin-editor`). Defaults to `packageNamespace`:

```json
{
	"wpPlugin": {
		"scriptGlobal": "myPlugin",
		"packageNamespace": "my-plugin",
		"handlePrefix": "mp"
	}
}
```

With this configuration:
- `@my-plugin/editor` → `window.myPlugin.editor` with handle `mp-editor`
- `@my-plugin/data` → `window.myPlugin.data` with handle `mp-data`

### `wpPlugin.externalNamespaces`

Additional package namespaces to externalize (consume as externals, not expose). Each namespace must be an object with `global` and optional `handlePrefix`:

```json
{
	"wpPlugin": {
		"externalNamespaces": {
			"woo": {
				"global": "woo",
				"handlePrefix": "woocommerce"
			},
			"acme": {
				"global": "acme",
				"handlePrefix": "acme-plugin"
			}
		}
	}
}
```

This allows your packages to consume third-party dependencies as externals:
- `import { Cart } from '@woo/cart'` → `window.woo.cart` with handle `woocommerce-cart`
- `import { Button } from '@acme/ui'` → `window.acme.ui` with handle `acme-plugin-ui`
- Dependencies are tracked in `.asset.php` files

If `handlePrefix` is omitted, it defaults to the namespace key (e.g., `"woo"` → `woo-cart`).

### Example: WordPress Core (Gutenberg)

```json
{
	"wpPlugin": {
		"scriptGlobal": "wp",
		"packageNamespace": "wordpress"
	}
}
```

This configuration:
- Packages like `@wordpress/data` expose `window.wp.data`
- Packages like `@wordpress/block-editor` expose `window.wp.blockEditor`
- All packages can consume `@wordpress/*` as externals

### Example: Third-Party Plugin

```json
{
	"wpPlugin": {
		"scriptGlobal": "acme",
		"packageNamespace": "acme"
	}
}
```

This configuration:
- Packages like `@acme/editor` expose `window.acme.editor`
- Packages like `@acme/data` expose `window.acme.data`
- All packages can still consume `@wordpress/*` → `window.wp.*`
- All packages can still consume vendors (react, lodash) → `window.React`, `window.lodash`

### Behavior

- **Packages with `wpScript: true` matching the namespace**: Bundled with global exposure
- **Packages with `wpScript: true` not matching the namespace**: Bundled without global exposure
- **Dependencies**: `@wordpress/*` packages are always externalized to `wp.*` globals
- **Vendors**: React, lodash, jQuery, moment are always externalized to their standard globals
- **Asset files**: `.asset.php` files are always generated for WordPress dependency management

## Output Structure

The built tool generates several files in the `build/` directory, but the primary output is the PHP registration file.

Make sure to include the generated PHP file in your plugin file.

```php
require_once plugin_dir_path( __FILE__ ) . 'build/index.php';
```

## Routes (Experimental)

Routes provide a file-based routing system for WordPress admin pages. Create a `routes/` directory at your repository root with subdirectories for each route.

### Structure

```
routes/
  home/
    package.json    # Route configuration
    stage.tsx       # Main content component
    inspector.tsx   # Optional sidebar component
    route.tsx       # Optional lifecycle hooks (beforeLoad, loader)
```

### Route Configuration

In `routes/{route-name}/package.json`:

```json
{
	"route": {
		"path": "/"
	}
}
```

### Components

**stage.tsx** - Main content (required):
```tsx
export const stage = () => <div>Content</div>;
```

**inspector.tsx** - Sidebar content (optional):
```tsx
export const inspector = () => <div>Inspector</div>;
```

**route.tsx** - Lifecycle hooks (optional):
```tsx
export const route = {
	beforeLoad: ({ params, search }) => {
		// Pre-navigation validation, auth checks
	},
	loader: ({ params, search }) => {
		// Data preloading
	}
};
```

### Build Output

The build system generates:
- `build/routes/{route-name}/content.js` - Bundled stage/inspector components
- `build/routes/{route-name}/route.js` - Bundled lifecycle hooks (if present)
- `build/routes/index.php` - Route registry data
- `build/routes.php` - Route registration logic

The boot package in Gutenberg will automatically use these routes and make them available.

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose.

The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

## License

GPL-2.0-or-later © The WordPress Contributors
