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

### Testing Generated Styles

Generated CSS module output skips automatic style injection when `NODE_ENV` is
`test`. Node-based DOM implementations such as jsdom do not reliably support
modern CSS features, so tests that need actual styles in the DOM should
run in a browser environment.

## Package Configuration

Configure your `package.json` with the following optional fields:

### `wpScript`

Controls whether the package is exposed as a bundled WordPress script/module and accessible via the configured global variable.

- **`true`**: The package will be bundled and exposed as a WordPress script. It will be available in WordPress as part of the configured global (e.g., `wp.blockEditor`, `wp.data`, or a custom global name if configured differently).

- **Omitted or `false` (default)**: The package will not be exposed as a WordPress script. Use this for packages designed solely as dependencies for other packages. The package can still be used as a dependency via npm imports by other packages.

```json
{
	"wpScript": true
}
```

For more details on when to omit or set this to `false`, see the [package guidelines](../README.md#when-to-omit-or-set-wpscript-to-false).

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

### `wpWorkers`

Worker bundle definitions for packages that need self-contained Web Worker files.
Workers are bundled with all dependencies included and can be loaded via Blob URLs.

**String shorthand** — entry path only:

```json
{
	"wpWorkers": {
		"./worker": "./src/worker.ts"
	}
}
```

**Object format** — entry path with module resolve redirects:

```json
{
	"wpWorkers": {
		"./worker": {
			"entry": "./src/worker.ts",
			"resolve": {
				"vips-es6.js": "vips.js"
			}
		}
	}
}
```

The `resolve` map redirects module loads during bundling. Keys are filename
patterns to match; values are replacement filenames in the same directory.
This is useful when a dependency's ES module entry point uses `import.meta.url`,
which fails in Blob URL Worker contexts. By redirecting to an alternative
entry point (e.g., a CommonJS version), the issue is avoided.

## Root Configuration

Configure your root `package.json` with a `wpPlugin` object to control global namespace and externalization behavior:

### `wpPlugin.name`

Name used to prefix generated PHP functions. Must follow function name rules in PHP, i.e. valid name starts with a letter or underscore, followed by any number of letters, numbers, or underscores.

```json
{
	"wpPlugin": {
		"name": "myPlugin"
	}
}
```

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

### `wpPlugin.pages` (Experimental)

Define admin pages that support routes. Each page gets generated PHP functions for route registration and can be extended by other plugins.

Pages can be defined as simple strings or as objects with initialization modules:

```json
{
	"wpPlugin": {
		"pages": [
			"my-admin-page",
			{
				"id": "my-other-page",
				"init": ["@my-plugin/my-page-init"]
			}
		]
	}
}
```

**Page Configuration:**
- **String format**: `"my-admin-page"` - Simple page with no init modules
- **Object format**: `{ "id": "page-slug", "init": ["@scope/package"], "experimental": true }` - Page with optional init modules
  - **`id`** (required): The page slug used in WordPress admin URLs
  - **`init`** (optional): Array of script module IDs to execute during page initialization
  - **`experimental`** (optional, default `false`): When `true`, the page is excluded from WordPress Core builds (`IS_WORDPRESS_CORE=true`), along with any route that belongs only to experimental pages.

**Generated Files:**

This generates two page modes:
- `build/pages/my-admin-page/page.php` - Full-page mode (takes over entire admin screen with custom sidebar)
- `build/pages/my-admin-page/page-wp-admin.php` - WP-Admin mode (integrates within standard wp-admin interface)
- `build/pages.php` - Loader for all pages

Each mode provides route/menu registration functions and a render callback. Routes are automatically registered for both modes.

**Registering a menu item for WP-Admin mode:**

WP-Admin mode integrates within the standard WordPress admin interface (keeping the sidebar and header). Menu items should be registered with a simple slug and callback:

```php
add_submenu_page(
	'themes.php',                                      // Parent menu
	__( 'My Page', 'my-plugin' ),                     // Page title
	__( 'My Page', 'my-plugin' ),                     // Menu title
	'edit_theme_options',                              // Capability
	'my-admin-page-wp-admin',                          // Menu slug (simple)
	'my_plugin_my_admin_page_wp_admin_render_page'     // Callback from generated PHP (prefixed)
);
```

Note: The callback function name is prefixed with your plugin name (from `wpPlugin.name` in root `package.json`). For example, if your plugin name is `my-plugin`, the function will be `my_plugin_my_admin_page_wp_admin_render_page`.

The page slug is `my-admin-page-wp-admin` (your page ID + `-wp-admin`). WordPress routes all requests to this callback, and the JavaScript router handles internal navigation.

**Deep linking with the `p` query parameter:**

Users and extensions can link directly to specific routes using the `p` query parameter:
```php
// Link to a specific route
$url = admin_url( 'admin.php?page=my-admin-page-wp-admin&p=' . urlencode( '/settings' ) );
```

When the page loads, the JavaScript boot system reads the `p` parameter and navigates to that route automatically.

**Registering a menu item for full-page mode:**

Full-page mode takes over the entire admin screen with a custom sidebar:

```php
add_menu_page( 'Title', 'Menu', 'capability', 'my-admin-page', 'my_plugin_my_admin_page_render_page', 'icon', 20 );
```

**Init Modules:**
Init modules are JavaScript packages that execute during page initialization, after menu items and routes are registered and before the app renders. They're ideal for:
- Adding icons to menu items (icons can't be passed from PHP)
- Registering command palette entries

**Creating an Init Module:**

In `packages/my-page-init/package.json`:
```json
{
	"name": "@my-plugin/my-page-init",
	"wpScriptModuleExports": "./build-module/index.js",
	"dependencies": {
		"@wordpress/boot": "file:../boot",
		"@wordpress/data": "file:../data",
		"@wordpress/icons": "file:../icons"
	}
}
```

In `packages/my-page-init/src/index.ts`:
```typescript
import { home, styles } from '@wordpress/icons';
import { dispatch } from '@wordpress/data';
import { store as bootStore } from '@wordpress/boot';

/**
 * Initialize page - this function is mandatory.
 * All init modules must export an 'init' function.
 */
export async function init() {
	// Add icons to menu items
	dispatch( bootStore ).updateMenuItem( 'home', { icon: home } );
	dispatch( bootStore ).updateMenuItem( 'styles', { icon: styles } );
}
```

The `init()` function is **mandatory** - all init modules must export this named function. Init modules are loaded as static dependencies and executed sequentially after the boot system registers menu items and routes, before the app renders.

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
		"name": "acme",
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
require_once plugin_dir_path( __FILE__ ) . 'build/build.php';
```

## Routes (Experimental)

Routes provide a file-based routing system for WordPress admin pages. Each route must be associated with a page defined in `wpPlugin.pages` (see above). Create a `routes/` directory at your repository root with subdirectories for each route.

### Structure

```
routes/
  home/
    package.json    # Route configuration
    stage.tsx       # Main content component
    inspector.tsx   # Optional sidebar component
    canvas.tsx      # Optional custom canvas component
    route.tsx       # Optional lifecycle hooks (beforeLoad, loader, canvas)
```

### Route Configuration

In `routes/{route-name}/package.json`:

```json
{
	"route": {
		"path": "/",
		"page": "my-admin-page"
	}
}
```

For routes that should appear on multiple pages:

```json
{
	"route": {
		"path": "/settings",
		"page": ["my-admin-page", "other-page"]
	}
}
```

The `page` field can be either:
- **String**: Route belongs to a single page
- **Array**: Route appears on multiple pages (the build system will register the route for each page)

Each page ID must match one of the pages defined in `wpPlugin.pages` in your root `package.json`. This tells the build system which page(s) this route belongs to. It can also map to existing pages registered by other plugins.

Multi-page routes are useful for shared functionality across different admin pages, such as settings routes accessible from both a main page and a dedicated settings page.

Routes inherit their experimental status from their pages: a route is excluded from WordPress Core builds only when every page it belongs to is marked `"experimental": true` in `wpPlugin.pages`.

### Components

**stage.tsx** - Main content (required):
```tsx
export const stage = () => <div>Content</div>;
```

**inspector.tsx** - Sidebar content (optional):
```tsx
export const inspector = () => <div>Inspector</div>;
```

**canvas.tsx** - Custom canvas component (optional):
```tsx
export const canvas = () => <div>Custom Canvas</div>;
```

The canvas is a full-screen area typically used for editor previews. You can provide a custom canvas component that will be conditionally rendered based on the `canvas()` function's return value in `route.tsx`.

**route.tsx** - Lifecycle hooks (optional):
```tsx
export const route = {
	beforeLoad: ({ params, search }) => {
		// Pre-navigation validation, auth checks
	},
	loader: ({ params, search }) => {
		// Data preloading
	},
	canvas: ({ params, search }) => {
		// Return CanvasData to use default canvas (editor)
		return {
			postType: 'post',
			postId: '123',
			isPreview: true
		};

		// Return null to use custom canvas.tsx component
		// return null;

		// Return undefined to show no canvas
		// return undefined;
	}
};
```

The `canvas()` function controls which canvas is rendered:
- Returns `CanvasData` object (`{ postType, postId, isPreview? }`) → Renders the default WordPress editor canvas
- Returns `null` → Renders the custom canvas component from `canvas.tsx` (if provided)
- Returns `undefined` or is omitted → No canvas is rendered

### Build Output

The build system generates:
- `build/routes/{route-name}/content.js` - Bundled stage/inspector/canvas components
- `build/routes/{route-name}/route.js` - Bundled lifecycle hooks (if present)
- `build/routes/registry.php` - Route registry data
- `build/routes.php` - Route registration logic

The boot package in Gutenberg will automatically use these routes and make them available.

## Widgets (Experimental)

> [!NOTE]
> Widgets are still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.

Widgets provide a file-based discovery system for building self-contained UI components that are registered as WordPress script modules. Each widget lives in its own directory under `widgets/` at the repository root.

### Structure

```
widgets/
  hello-world/
    widget.json     # Static discovery metadata (required)
    widget.ts       # Runtime schema entry point (optional)
    render.tsx      # UI component entry point (optional)
    render.scss     # Optional styles (bundled inline when imported from render.tsx)
    package.json    # Optional npm dependencies manifest
```

### Why two entries?

Widgets use a dual-entry pattern, similar in spirit to how blocks split metadata between `block.json` and `edit.js`:

| Concern | Lives in | Reason |
|---|---|---|
| Identity (`name`) | both (must match) | server needs it to register; client uses it to resolve the runtime entry |
| Static metadata (`title`, `description`, `category`) | `widget.json` | plain JSON the host can read without a JS runtime |
| Translated title / labels (`__()`) | `widget.ts` | i18n calls need a JS runtime; JSON can only carry static strings |
| Attribute schema (types, options) | `widget.ts` | needs TypeScript coupling with `render` props; may include translated `elements`/labels |
| `example` | `widget.ts` | co-located with the attribute schema it shapes |

Rule of thumb: anything expressible as plain JSON goes in `widget.json`. Anything that needs types, i18n, or runtime logic goes in `widget.ts`. The generated `build/widgets/registry.php` currently exposes only `name`, `dir_name`, and which entry files exist; forwarding the rest of `widget.json` to PHP is a follow-up.

### `widget.json` — static discovery metadata

```json
{
	"name": "my-plugin/hello-world",
	"title": "Hello World",
	"description": "A simple example widget.",
	"category": "demo"
}
```

**Fields:**
- **`name`** (required): Namespaced identifier (e.g., `"my-plugin/hello-world"`)
- **`title`** (optional): Human-readable title
- **`description`** (optional): Short description for listings
- **`category`** (optional): Grouping category for filtering

### `widget.ts` — runtime schema

Exports a default object that describes the widget's runtime contract: typed attributes, translated labels, example data. The build system injects the `render_module` handle at registration time, so authors don't need to declare it.

```ts
import { wordpress } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

type HelloWorldAttributes = {
	greeting: string;
	showDate: boolean;
};

const widget = {
	name: 'my-plugin/hello-world',
	title: __( 'Hello World', 'my-plugin' ),
	icon: wordpress,
	attributes: [
		{
			id: 'greeting',
			type: 'text',
			label: __( 'Greeting', 'my-plugin' ),
		},
		{
			id: 'showDate',
			type: 'boolean',
			label: __( 'Show current date', 'my-plugin' ),
		},
	],
	example: {
		greeting: 'World',
		showDate: true,
	},
};

export default widget;
```

The same `HelloWorldAttributes` type is consumed by `render.tsx`, giving the author a single source of truth for the data contract.

### `render.tsx` — UI component

The render entry receives `attributes` matching the schema declared in `widget.ts`. It is bundled with CSS support (import `.scss` / `.css` directly).

```tsx
interface HelloWorldRenderProps {
	attributes: {
		greeting?: string;
		showDate?: boolean;
	};
}

export default function HelloWorld( { attributes }: HelloWorldRenderProps ) {
	return (
		<div>
			Hello, { attributes.greeting ?? 'World' }!
			{ attributes.showDate && <time>{ new Date().toLocaleDateString() }</time> }
		</div>
	);
}
```

All non-JSON entries are optional. The build system checks for files with extensions in priority order: `.tsx`, `.ts`, `.jsx`, `.js`, `.mjs`.

### Build Output

The build system generates:

- `build/widgets/{widget-name}/render.min.js` + `render.js` — Bundled UI component (ESM)
- `build/widgets/{widget-name}/render.min.asset.php` — Asset metadata for render module
- `build/widgets/{widget-name}/widget.min.js` + `widget.js` — Bundled metadata (ESM)
- `build/widgets/{widget-name}/widget.min.asset.php` — Asset metadata for widget module
- `build/widgets/registry.php` — Widget registry data
- `build/widgets.php` — Script module registration logic

### PHP Registration

The generated `widgets.php` registers each widget's entries as script modules via `wp_register_script_module()`. Module handles follow the pattern:

```
{handlePrefix}/widgets/{widget-dir-name}/render
{handlePrefix}/widgets/{widget-dir-name}/widget
```

Registration is hooked into the `init` action. The `SCRIPT_DEBUG` constant controls whether minified (`.min.js`) or non-minified (`.js`) files are loaded.

### Watch Mode

In development (`wp-build --watch`), widget source files are watched for changes. When a file inside `widgets/{name}/` changes, only that widget is rebuilt.

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose.

The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

## License

GPL-2.0-or-later © The WordPress Contributors
