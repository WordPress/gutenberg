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
	 * A page that needs classic scripts or styles besides Boot's own can list
	 * their handles by giving an array instead of a slug:
	 *
	 *     array(
	 *         'page'    => 'my-page-wp-admin',
	 *         'scripts' => array( 'my-plugin-legacy-settings' ),
	 *         'styles'  => array( 'my-plugin-legacy-styles' ),
	 *     )
	 *
	 * Those handles are then enqueued on every page in the shell, since a
	 * classic script can't be added to the page once it has loaded.
	 *
	 * @param array<string|array> $pages Pages that can be switched between in place.
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
	foreach ( $listed as $entry ) {
		$entry     = is_string( $entry ) ? array( 'page' => $entry ) : $entry;
		$menu_slug = is_array( $entry ) ? ( $entry['page'] ?? null ) : null;
		if ( ! is_string( $menu_slug ) || isset( $pages[ $menu_slug ] ) ) {
			continue;
		}
		$menu_entry = _gutenberg_admin_shell_menu_entry( $menu_slug );
		if ( ! $menu_entry ) {
			continue;
		}

		// Find the page the menu item renders.
		$hook_name = get_plugin_page_hookname( $menu_slug, $menu_entry['parent'] );
		foreach ( $described as $page_id => $description ) {
			$render_callback = $description['render_callback'] ?? null;
			if (
				is_string( $render_callback ) &&
				false !== has_action( $hook_name, $render_callback ) &&
				is_callable( $description['routes_callback'] ?? null )
			) {
				$pages[ $menu_slug ] = array_merge(
					$description,
					$menu_entry,
					array(
						'page_id'   => (string) $page_id,
						'hook_name' => $hook_name,
						'scripts'   => array_filter( (array) ( $entry['scripts'] ?? array() ), 'is_string' ),
						'styles'    => array_filter( (array) ( $entry['styles'] ?? array() ), 'is_string' ),
					)
				);
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
			'preloadPath' => is_callable( $description['preload_paths_callback'] ?? null )
				? add_query_arg( 'page', rawurlencode( $description['page_id'] ), '/__experimental/admin-shell/preload' )
				: null,
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

	// Classic scripts and styles that listed pages need on top of Boot's.
	foreach ( $pages as $page ) {
		array_map( 'wp_enqueue_script', $page['scripts'] );
		array_map( 'wp_enqueue_style', $page['styles'] );
	}
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

	/**
	 * Filters how many admin pages' apps the admin shell keeps mounted at
	 * most, including the one showing. When a page beyond the limit is shown,
	 * the page shown least recently is unmounted; opening it again boots it
	 * again, at the URL it was left on, without a page load. A page left
	 * mounted keeps its state, such as unsaved input and scroll position.
	 *
	 * @param int $max_alive_pages Maximum number of mounted pages. Default 5.
	 */
	$max_alive_pages = max( 1, (int) apply_filters( 'admin_shell_max_alive_pages', 5 ) );

	$start_js = <<<'JS'
	( pages, maxAlivePages ) => {
		const run = async () => {
			const mod = await import( "@wordpress/boot" );
			mod.startAdminShell?.( { pages, maxAlivePages } );
		};
		if ( document.readyState === "loading" ) {
			document.addEventListener( "DOMContentLoaded", run );
		} else {
			run();
		}
	}
	JS;

	add_action( 'admin_print_footer_scripts', '_gutenberg_admin_shell_print_script_module_data' );

	wp_add_inline_script(
		$pages[ $current ]['script_handle'],
		sprintf(
			'( %s )( %s, %d );',
			$start_js,
			wp_json_encode( $_gutenberg_admin_shell_manifest, JSON_HEX_TAG | JSON_UNESCAPED_SLASHES ),
			$max_alive_pages
		)
	);
}

/**
 * Prints the script module data of the other pages in the shell.
 *
 * WordPress prints a script module's data (the `script_module_data_{$module_id}`
 * filter) only on pages where the module is enqueued or in the import map. A
 * page's own module is registered only on its own page load, so a page the
 * shell opens would otherwise miss its data, as the Connectors page does
 * without the connectors list. This prints it the way WordPress does.
 *
 * @access private
 */
function _gutenberg_admin_shell_print_script_module_data(): void {
	$pages   = _gutenberg_admin_shell_get_pages();
	$current = _gutenberg_admin_shell_current_page();

	foreach ( $pages as $page => $description ) {
		$module_id = $description['script_module'] ?? $description['page_id'] . '-wp-admin';
		if ( $page === $current || ! current_user_can( $description['capability'] ?? 'manage_options' ) ) {
			continue;
		}

		/** This filter is documented in wp-includes/class-wp-script-modules.php */
		$data = apply_filters( "script_module_data_{$module_id}", array() );
		if ( ! is_array( $data ) || array() === $data ) {
			continue;
		}

		wp_print_inline_script_tag(
			wp_json_encode( $data, JSON_HEX_TAG | JSON_UNESCAPED_SLASHES ),
			array(
				'type' => 'application/json',
				'id'   => "wp-script-module-data-{$module_id}",
			)
		);
	}
}

/**
 * Registers the endpoint that returns the REST responses an admin page
 * preloads on its own page load, so the shell can preload them before it
 * opens the page.
 *
 * @access private
 */
function _gutenberg_admin_shell_register_routes(): void {
	register_rest_route(
		'__experimental/admin-shell',
		'/preload',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'args'                => array(
				'page' => array(
					'description' => __( 'ID of the admin page, as built with @wordpress/build.', 'gutenberg' ),
					'type'        => 'string',
					'required'    => true,
				),
			),
			'permission_callback' => static function ( WP_REST_Request $request ) {
				$description = _gutenberg_admin_shell_describe_page( $request['page'] );
				return $description && current_user_can( $description['capability'] ?? 'manage_options' );
			},
			'callback'            => static function ( WP_REST_Request $request ) {
				$description = _gutenberg_admin_shell_describe_page( $request['page'] );
				if ( ! $description || ! is_callable( $description['preload_paths_callback'] ?? null ) ) {
					return new WP_Error( 'rest_not_found', __( 'This page doesn\'t preload any data.', 'gutenberg' ), array( 'status' => 404 ) );
				}

				/*
				 * Each path is requested as the current user, with its own
				 * permission checks, so this returns only what the user could
				 * fetch from those endpoints directly.
				 */
				$preload_data = array_reduce(
					(array) call_user_func( $description['preload_paths_callback'] ),
					'rest_preload_api_request',
					array()
				);

				// Return an object even when nothing was preloaded.
				return rest_ensure_response( (object) $preload_data );
			},
		)
	);
}
add_action( 'rest_api_init', '_gutenberg_admin_shell_register_routes' );

/**
 * Returns the description of an admin page built with @wordpress/build.
 *
 * @access private
 *
 * @param string $page_id Page ID.
 * @return array|null The description, or null when there is no such page.
 */
function _gutenberg_admin_shell_describe_page( string $page_id ): ?array {
	/** This filter is documented in lib/experimental/admin-shell/load.php */
	$described = (array) apply_filters( 'wp_build_admin_pages', array() );
	return isset( $described[ $page_id ] ) && is_array( $described[ $page_id ] ) ? $described[ $page_id ] : null;
}
