<?php
/**
 * Admin shell (proof of concept).
 *
 * Lets admin pages built with @wordpress/build switch between each other
 * without a page load, whichever plugin they come from. The page that loads
 * boots as usual; the shell boots the other pages' apps into the same
 * document when their admin menu links are clicked. See `startAdminShell()`
 * in `packages/boot/src/components/admin-shell`.
 *
 * A page takes part when both hold:
 *
 * - its menu slug, the `page` query argument, is listed in the
 *   `admin_shell_pages` filter (for example `font-library-wp-admin`, or any
 *   other slug the plugin registered the page under);
 * - its menu page is rendered by a page built with a version of
 *   @wordpress/build that describes its pages through the
 *   `wp_build_admin_pages` filter. The shell matches the two through the
 *   menu page's callback, so the menu slug doesn't need to follow a pattern.
 *
 * A listed page should load what it needs through REST or script modules.
 * Classic scripts, styles and inline data that only its own page load
 * enqueues are not loaded when the shell opens it.
 *
 * Only loaded while the `gutenberg-admin-shell` experiment is enabled.
 *
 * @package gutenberg
 */

/**
 * Lists Gutenberg's own pages in the admin shell.
 *
 * @access private
 *
 * @param string[] $pages Pages that can be switched between in place.
 * @return string[] Pages, with Gutenberg's added.
 */
function _gutenberg_admin_shell_add_gutenberg_pages( array $pages ): array {
	return array_merge(
		$pages,
		array(
			'font-library-wp-admin',
			'options-connectors-wp-admin',
			'experiments-wp-admin',
		)
	);
}
add_filter( 'admin_shell_pages', '_gutenberg_admin_shell_add_gutenberg_pages' );

/**
 * Returns the pages that can be switched between in place and that the
 * current user can open, keyed by their menu slug.
 *
 * @access private
 *
 * @return array<string, array> Descriptions of the pages, as given by the
 *                              `wp_build_admin_pages` filter, plus the menu
 *                              page's `parent` and `title`.
 */
function _gutenberg_admin_shell_get_pages(): array {
	/**
	 * Filters the admin pages that the admin shell can switch between without
	 * loading a new document.
	 *
	 * Each entry is the menu slug of an admin page, its `page` query argument,
	 * whose menu callback renders a page built with @wordpress/build. For
	 * example `my-page-wp-admin`, or any slug the page was registered under.
	 *
	 * @param string[] $pages Menu slugs of pages that can be switched between in place.
	 */
	$listed = (array) apply_filters( 'admin_shell_pages', array() );

	/**
	 * Filters the admin pages built with @wordpress/build, keyed by page ID.
	 * Each generated page adds itself.
	 *
	 * @param array<string, array> $pages Page descriptions.
	 */
	$described = (array) apply_filters( 'wp_build_admin_pages', array() );

	$pages = array();
	foreach ( array_unique( array_filter( $listed, 'is_string' ) ) as $menu_slug ) {
		$menu_entry = _gutenberg_admin_shell_menu_entry( $menu_slug );
		if ( ! $menu_entry ) {
			continue;
		}

		// Find the page the menu item renders.
		$hook_name = get_plugin_page_hookname( $menu_slug, $menu_entry['parent'] );
		foreach ( $described as $description ) {
			$render_callback = $description['render_callback'] ?? null;
			if (
				is_string( $render_callback ) &&
				false !== has_action( $hook_name, $render_callback ) &&
				is_callable( $description['routes_callback'] ?? null )
			) {
				$pages[ $menu_slug ] = array_merge( $description, $menu_entry, array( 'hook_name' => $hook_name ) );
				break;
			}
		}
	}
	return $pages;
}

/**
 * Returns the `page` query argument of the current request.
 *
 * @access private
 *
 * @return string The page, or an empty string.
 */
function _gutenberg_admin_shell_current_page(): string {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only routing check.
	return isset( $_GET['page'] ) ? sanitize_text_field( wp_unslash( $_GET['page'] ) ) : '';
}

/**
 * Finds the admin menu entry of a page the current user can open.
 *
 * @access private
 *
 * @param string $page Page query argument, e.g. `font-library-wp-admin`.
 * @return array{parent: string, title: string}|null Parent slug (empty for a
 *                                                   top-level page) and page
 *                                                   title, or null when the
 *                                                   user has no menu item for it.
 */
function _gutenberg_admin_shell_menu_entry( string $page ): ?array {
	global $menu, $submenu, $_parent_pages;

	// Top-level pages are recorded with a `false` parent.
	if ( ! is_array( $_parent_pages ) || ! array_key_exists( $page, $_parent_pages ) ) {
		return null;
	}
	$parent = (string) $_parent_pages[ $page ];

	// A top-level page is listed in $menu, and usually first in its own submenu.
	$items = $parent ? ( $submenu[ $parent ] ?? array() ) : array_merge( $submenu[ $page ] ?? array(), (array) $menu );
	foreach ( $items as $item ) {
		if ( isset( $item[2] ) && $page === $item[2] && current_user_can( $item[1] ) ) {
			return array(
				'parent' => $parent,
				'title'  => wp_strip_all_tags( $item[3] ?? $item[0] ),
			);
		}
	}
	return null;
}

/**
 * Builds the shell's description of every listed page the user can open,
 * and makes sure the other pages' modules are in the current page's import
 * map.
 *
 * Runs from the current page's boot dependencies filter, so that other pages'
 * routes are registered before the import map is printed. Registering routes
 * only registers script modules: nothing is printed or fetched unless the
 * user switches to the page.
 *
 * @access private
 *
 * @param array $boot_dependencies Boot script module dependencies of the current page.
 * @return array Dependencies, with the other pages' modules added as dynamic imports.
 */
function _gutenberg_admin_shell_add_page_dependencies( array $boot_dependencies ): array {
	global $_gutenberg_admin_shell_manifest;

	$pages   = _gutenberg_admin_shell_get_pages();
	$current = _gutenberg_admin_shell_current_page();
	if ( ! isset( $pages[ $current ] ) || isset( $_gutenberg_admin_shell_manifest ) ) {
		return $boot_dependencies;
	}

	$_gutenberg_admin_shell_manifest = array();
	foreach ( $pages as $page => $description ) {
		$routes       = (array) call_user_func( $description['routes_callback'] );
		$init_modules = array_values( (array) ( $description['init_modules'] ?? array() ) );

		if ( $page !== $current ) {
			$module_ids = $init_modules;
			foreach ( $routes as $route ) {
				$module_ids[] = $route['route_module'] ?? null;
				$module_ids[] = $route['content_module'] ?? null;
			}
			foreach ( array_filter( $module_ids ) as $module_id ) {
				$boot_dependencies[] = array(
					'import' => 'dynamic',
					'id'     => $module_id,
				);
			}
		}

		$_gutenberg_admin_shell_manifest[] = array(
			'pageKey'     => $page,
			'url'         => menu_page_url( $page, false ),
			'mountId'     => $description['mount_id'],
			'title'       => $description['title'],
			'bodyClass'   => preg_replace( '/[^a-z0-9_-]+/i', '-', $description['hook_name'] ),
			'routes'      => $routes,
			'initModules' => $init_modules,
		);
	}

	return $boot_dependencies;
}

/**
 * Hooks the shell into the current page, when it is listed.
 *
 * Runs before the generated page enqueue functions, which run at the default
 * priority and apply the page's boot dependencies filter.
 *
 * @access private
 */
function _gutenberg_admin_shell_prepare(): void {
	$pages   = _gutenberg_admin_shell_get_pages();
	$current = _gutenberg_admin_shell_current_page();
	if ( ! isset( $pages[ $current ] ) ) {
		return;
	}
	add_filter( $pages[ $current ]['boot_dependencies_filter'], '_gutenberg_admin_shell_add_page_dependencies' );
	add_action( 'admin_enqueue_scripts', '_gutenberg_admin_shell_enqueue', 20 );
}
add_action( 'admin_enqueue_scripts', '_gutenberg_admin_shell_prepare', 5 );

/**
 * Starts the shell, once the current page's own startup script is queued.
 *
 * @access private
 */
function _gutenberg_admin_shell_enqueue(): void {
	global $_gutenberg_admin_shell_manifest;

	$pages   = _gutenberg_admin_shell_get_pages();
	$current = _gutenberg_admin_shell_current_page();
	if ( ! isset( $pages[ $current ] ) || empty( $_gutenberg_admin_shell_manifest ) || count( $_gutenberg_admin_shell_manifest ) < 2 ) {
		return;
	}

	$start_js = <<<'JS'
	( pages ) => {
		const run = async () => {
			const mod = await import( "@wordpress/boot" );
			mod.startAdminShell?.( { pages } );
		};
		if ( document.readyState === "loading" ) {
			document.addEventListener( "DOMContentLoaded", run );
		} else {
			run();
		}
	}
	JS;

	wp_add_inline_script(
		$pages[ $current ]['script_handle'],
		sprintf(
			'( %s )( %s );',
			$start_js,
			wp_json_encode( $_gutenberg_admin_shell_manifest, JSON_HEX_TAG | JSON_UNESCAPED_SLASHES )
		)
	);
}
