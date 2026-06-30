# Boot

Minimal boot package for WordPress admin pages.
It renders a single-page React application into an admin screen
and wires up its routes, menu items, and startup modules.

## Installation

Install the module

```bash
npm install @wordpress/boot --save
```

## Usage

The package exposes two entry points, one per admin page layout.
A page's generated PHP imports `@wordpress/boot` and calls the matching
function with the page configuration.
The pages themselves are declared through the [`@wordpress/build` pages configuration](https://github.com/WordPress/gutenberg/tree/HEAD/packages/wp-build/README.md).

### `init`

Boots a full-screen application that takes over the admin screen with its own sidebar navigation. Used by pages generated in full-page mode (`page.php`).

```js
import { init } from '@wordpress/boot';

init( {
	mountId: 'my-page-app',
	menuItems,
	routes,
	initModules,
	dashboardLink,
} );
```

### `initSinglePage`

Boots an application embedded inside the standard wp-admin chrome, without the full-screen sidebar. Used by pages generated in wp-admin mode (`page-wp-admin.php`).

```js
import { initSinglePage } from '@wordpress/boot';

initSinglePage( {
	mountId: 'my-page-app',
	routes,
	initModules,
} );
```

Both functions follow the same startup sequence:

1. Register the page's `menuItems` and `routes` in the store.
2. Run the page's init modules (see below).
3. Render the application into `mountId`.

## Init modules

Init modules are script modules that run a one-time setup step at page startup, after menu items and routes are registered and before the app renders. They are useful for tasks that cannot be expressed in the page's static PHP configuration, such as assigning menu-item icons or registering core-data entities.

Pass them as the `initModules` array. Each module must export an async `init` function:

```js
export async function init() {
	// One-time startup work.
}
```

Init modules are declared per page through the `wpPlugin.pages[].init` build configuration, which loads them as static dependencies and forwards their IDs to `init` and `initSinglePage`. See the [`@wordpress/build` init modules documentation](https://github.com/WordPress/gutenberg/tree/HEAD/packages/wp-build/README.md) for the configuration details.

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
