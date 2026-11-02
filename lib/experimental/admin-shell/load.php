<?php
/**
 * Admin shell (proof of concept).
 *
 * Lets the wp-build admin pages (Appearance > Fonts, Settings > Connectors,
 * Settings > Gutenberg) switch between each other without a page load. The
 * page that loads boots as usual; the shell boots the other pages' apps into
 * the same document when their admin menu links are clicked. See
 * `startAdminShell()` in `packages/boot/src/components/admin-shell`.
 *
 * Only loaded while the `gutenberg-admin-shell` experiment is enabled.
 *
 * @package gutenberg
 */

/**
 * Returns the wp-build pages that can be switched between in place.
 *
 * Each entry has the page `slug` (as listed in `wpPlugin.pages`) and the
 * page's `init` modules. The page must be rendered in wp-admin through the
 * generated `gutenberg_{slug}_wp_admin_render_page()` callback.
 *
 * A page qualifies when everything it needs is loaded by every member page:
 * Boot's script dependencies, plus script modules loaded on demand. Pages
 * that enqueue extra classic scripts or styles of their own (for example
 * Guidelines, which needs `wp-block-library`) don't qualify yet.
 *
 * @access private
 *
 * @return array<array{slug: string, init: string[]}> Shell pages.
 */
function _gutenberg_admin_shell_pages(): array {
	return array(
		array(
			'slug' => 'font-library',
			'init' => array(),
		),
		array(
			'slug' => 'options-connectors',
			'init' => array(),
		),
		array(
			'slug' => 'experiments',
			'init' => array(),
		),
	);
}

/**
 * Returns the shell page that is being viewed, if any.
 *
 * @access private
 *
 * @return array{slug: string, init: string[]}|null The current shell page.
 */
function _gutenberg_admin_shell_current_page(): ?array {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only routing check.
	$page = isset( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : '';
	foreach ( _gutenberg_admin_shell_pages() as $shell_page ) {
		if ( $shell_page['slug'] . '-wp-admin' === $page ) {
			return $shell_page;
		}
	}
	return null;
}

/**
 * Finds the admin menu entry of a page.
 *
 * @access private
 *
 * @param string $page Page query argument, e.g. `font-library-wp-admin`.
 * @return array{parent: string, title: string}|null Parent file and page title,
 *                                                   or null when the current
 *                                                   user has no menu item for it.
 */
function _gutenberg_admin_shell_menu_entry( string $page ): ?array {
	global $submenu, $_parent_pages;

	$parent = $_parent_pages[ $page ] ?? null;
	if ( ! is_string( $parent ) || empty( $submenu[ $parent ] ) ) {
		return null;
	}

	foreach ( $submenu[ $parent ] as $item ) {
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
 * Builds the shell's description of every page the user can open, and makes
 * sure the other pages' route modules are in the current page's import map.
 *
 * Runs once, from the current page's boot dependencies filter, so that other
 * pages' routes are registered before the import map is printed. Registering
 * routes only registers script modules; nothing is printed or fetched unless
 * the user switches to the page.
 *
 * @access private
 *
 * @param array $boot_dependencies Boot script module dependencies of the current page.
 * @return array Dependencies, with the other pages' route modules added as dynamic imports.
 */
function _gutenberg_admin_shell_add_page_dependencies( array $boot_dependencies ): array {
	global $_gutenberg_admin_shell_manifest;

	$current = _gutenberg_admin_shell_current_page();
	if ( ! $current || isset( $_gutenberg_admin_shell_manifest ) ) {
		return $boot_dependencies;
	}

	$_gutenberg_admin_shell_manifest = array();
	foreach ( _gutenberg_admin_shell_pages() as $shell_page ) {
		$slug            = $shell_page['slug'];
		$slug_underscore = str_replace( '-', '_', $slug );
		$page            = $slug . '-wp-admin';
		$routes_function = "gutenberg_get_{$slug_underscore}_wp_admin_routes";
		$menu_entry      = _gutenberg_admin_shell_menu_entry( $page );

		if ( ! $menu_entry || ! function_exists( $routes_function ) ) {
			continue;
		}

		$is_current = $slug === $current['slug'];
		if ( ! $is_current ) {
			/** This action is documented in the generated page-wp-admin.php. */
			do_action( "{$page}_init" );
		}

		$routes = call_user_func( $routes_function );
		if ( ! $is_current ) {
			foreach ( $routes as $route ) {
				foreach ( array( 'route_module', 'content_module' ) as $module_key ) {
					if ( ! empty( $route[ $module_key ] ) ) {
						$boot_dependencies[] = array(
							'import' => 'dynamic',
							'id'     => $route[ $module_key ],
						);
					}
				}
			}
			foreach ( $shell_page['init'] as $init_module ) {
				$boot_dependencies[] = array(
					'import' => 'dynamic',
					'id'     => $init_module,
				);
			}
		}

		$hook_suffix = get_plugin_page_hookname( $page, $menu_entry['parent'] );

		$_gutenberg_admin_shell_manifest[] = array(
			'pageKey'     => $page,
			'url'         => menu_page_url( $page, false ),
			'mountId'     => $page . '-app',
			'title'       => $menu_entry['title'],
			'bodyClass'   => preg_replace( '/[^a-z0-9_-]+/i', '-', $hook_suffix ),
			'routes'      => $routes,
			'initModules' => $shell_page['init'],
		);
	}

	return $boot_dependencies;
}

foreach ( _gutenberg_admin_shell_pages() as $_gutenberg_admin_shell_page ) {
	add_filter(
		$_gutenberg_admin_shell_page['slug'] . '-wp-admin_boot_dependencies',
		'_gutenberg_admin_shell_add_page_dependencies'
	);
}
unset( $_gutenberg_admin_shell_page );

/**
 * Starts the shell on a shell page, once Boot's own startup script is queued.
 *
 * @access private
 */
function _gutenberg_admin_shell_enqueue(): void {
	global $_gutenberg_admin_shell_manifest;

	$current = _gutenberg_admin_shell_current_page();
	if ( ! $current || empty( $_gutenberg_admin_shell_manifest ) || count( $_gutenberg_admin_shell_manifest ) < 2 ) {
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
		$current['slug'] . '-wp-admin-prerequisites',
		sprintf(
			'( %s )( %s );',
			$start_js,
			wp_json_encode( $_gutenberg_admin_shell_manifest, JSON_HEX_TAG | JSON_UNESCAPED_SLASHES )
		)
	);
}
// After the generated page enqueue functions, which run at the default priority.
add_action( 'admin_enqueue_scripts', '_gutenberg_admin_shell_enqueue', 20 );
