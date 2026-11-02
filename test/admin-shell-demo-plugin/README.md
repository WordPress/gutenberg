# Admin Shell Demo plugin

A small plugin whose two admin pages, built with `@wordpress/build`, opt into the admin shell. With the shell on, you can switch between these pages, and between them and Gutenberg's own pages (Appearance › Fonts, Settings › Connectors, Settings › Gutenberg), without a page load. Each page you open stays as you left it.

The plugin adds a top-level **Shell Demo** menu with two pages:

-   **Notes**: a text field to show that a page keeps its state while you're on another page, plus links to another page's route and to Gutenberg's Fonts page.
-   **Counter**: a counter, and a second route (`/history`) to show that each page keeps its own route. It also shows a page pausing while hidden (a timer using `usePageVisibility`) and a keyboard shortcut (Shift+Alt+U, or Control+Option+U on a Mac) that only works while the page is showing.
-   **Settings**: a "Pages to keep alive" option, which the plugin passes to the `admin_shell_max_alive_pages` filter, and the list of pages currently in memory. Set it to 2, then open three pages in a row: the first one is unloaded and loses its state, and opening it again boots it again without a page load. Saving also passes the new limit to the running shell with `setMaxAlivePages()`, so it applies right away.

## How it integrates

The integration is one filter. The pages are listed in `wpPlugin.pages` in `package.json`, built with `wp-build`, added to the admin menu with the generated render callbacks, and then listed in `admin_shell_pages`:

```php
add_filter(
	'admin_shell_pages',
	function ( $pages ) {
		$pages[] = 'shell-demo-notes-wp-admin';
		$pages[] = 'shell-counter';
		return $pages;
	}
);
```

The filter takes menu slugs, the `page` query argument of each page. A slug doesn't have to follow a pattern: Notes uses the default `shell-demo-notes-wp-admin`, and Counter is registered as `shell-counter`. The one slug to avoid is the bare page ID (here `shell-demo-counter`), which `@wordpress/build` keeps for the page's full-screen mode. The generated page code describes each page to the shell through the `wp_build_admin_pages` filter, and the shell finds the page behind a menu slug from the menu item's render callback, so the plugin doesn't need to do anything else. See `admin-shell-demo.php`.

To limit how many pages stay in memory, the plugin passes its option to `admin_shell_max_alive_pages`:

```php
add_filter(
	'admin_shell_max_alive_pages',
	function ( $max_alive_pages ) {
		return (int) get_option( 'admin_shell_demo_max_alive_pages', $max_alive_pages );
	}
);
```

A page listed in the shell should load its data through REST or script modules. Before opening a page, the shell preloads the REST responses from the page's preload paths filter. Classic scripts and styles a page needs can be listed in its `admin_shell_pages` entry, as `array( 'page' => …, 'scripts' => …, 'styles' => … )`; inline data that only its own page load prints isn't available when the shell opens it.

## Try it

1. Build Gutenberg and the demo plugin:

    ```bash
    npm run build
    npm run build:plugin --workspace @wordpress/admin-shell-demo-plugin
    ```

2. Start the test environment, which mounts this plugin, and activate it:

    ```bash
    npm run wp-env-test start
    npm run wp-env-test -- run cli wp plugin activate admin-shell-demo
    ```

3. Turn on **Instant admin page switching** under Settings › Gutenberg, the Experiments page.
4. Open Shell Demo › Notes and click between Notes, Counter, Settings, Appearance › Fonts and Settings › Connectors.
