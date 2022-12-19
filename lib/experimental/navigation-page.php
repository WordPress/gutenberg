<?php
/**
 * Bootstrapping the Gutenberg Navigation page.
 *
 * @package gutenberg
 */

/**
 * The main entry point for the Gutenberg Navigation page.
 *
 * @since 7.8.0
 */
function gutenberg_navigation_page() {
	?>
	<div
		id="navigation-editor"
		class="edit-navigation"
	>
	</div>
	<?php
}

/**
 * This function returns an url for the /wp/v2/menus endpoint
 *
 * @since 11.8.0
 *
 * @param  int $results_per_page Results per page.
 * @return string
 */
function gutenberg_navigation_get_menus_endpoint( $results_per_page = 100 ) {
	return '/wp/v2/menus?' . build_query(
		array(
			'per_page' => $results_per_page,
			'context'  => 'edit',
			'_locale'  => 'user',
		)
	);
}

/**
 * This function returns an url for the /wp/v2/menu-items endpoint
 *
 * @since 11.8.0
 *
 * @param int $menu_id Menu ID.
 * @param int $results_per_page Results per page.
 * @return string
 */
function gutenberg_navigation_get_menu_items_endpoint( $menu_id, $results_per_page = 100 ) {
	return '/wp/v2/menu-items?' . build_query(
		array(
			'context'  => 'edit',
			'menus'    => $menu_id,
			'per_page' => $results_per_page,
			'_locale'  => 'user',
		)
	);
}

/**
 * This function returns an url for the /wp/v2/types endpoint
 *
 * @since 11.8.0
 *
 * @return string
 */
function gutenberg_navigation_get_types_endpoint() {
	return '/wp/v2/types?' . build_query(
		array(
			'context' => 'edit',
		)
	);
}

/**
 * Initialize the Gutenberg Navigation page.
 *
 * @param string $hook Page.
 * @since 7.8.0
 */
function gutenberg_navigation_init( $hook ) {
	if ( 'gutenberg_page_gutenberg-navigation' !== $hook ) {
		return;
	}

	$menus         = wp_get_nav_menus();
	$first_menu_id = ! empty( $menus ) ? $menus[0]->term_id : null;

	$preload_paths = array(
		'/wp/v2/menu-locations',
		array( '/wp/v2/pages', 'OPTIONS' ),
		array( '/wp/v2/posts', 'OPTIONS' ),
		gutenberg_navigation_get_types_endpoint(),
	);

	if ( $first_menu_id ) {
		$preload_paths[] = gutenberg_navigation_get_menu_items_endpoint( $first_menu_id );
	}

	$custom_settings = array(
		'blockNavMenus' => false,
		// We should uncomment the line below when the block-nav-menus feature becomes stable.
		// @see https://github.com/WordPress/gutenberg/issues/34265.
		/*'blockNavMenus' => get_theme_support( 'block-nav-menus' ),*/
	);

	$context  = new WP_Block_Editor_Context( array( 'name' => 'core/edit-navigation' ) );
	$settings = get_block_editor_settings( $custom_settings, $context );
	gutenberg_initialize_editor(
		'navigation_editor',
		'edit-navigation',
		array(
			'initializer_name' => 'initialize',
			'editor_settings'  => $settings,
			'preload_paths'    => $preload_paths,
		)
	);

	gutenberg_navigation_editor_preload_menus();

	wp_enqueue_script( 'wp-edit-navigation' );
	wp_enqueue_style( 'wp-edit-navigation' );
	wp_enqueue_script( 'wp-format-library' );
	wp_enqueue_style( 'wp-format-library' );
	do_action( 'enqueue_block_editor_assets' );
}
add_action( 'admin_enqueue_scripts', 'gutenberg_navigation_init' );

/**
 * Tells the script loader to load the scripts and styles of custom block on navigation editor screen.
 *
 * @param bool $is_block_editor_screen Current decision about loading block assets.
 * @return bool Filtered decision about loading block assets.
 */
function gutenberg_navigation_editor_load_block_editor_scripts_and_styles( $is_block_editor_screen ) {
	if ( is_callable( 'get_current_screen' ) && get_current_screen() && 'gutenberg_page_gutenberg-navigation' === get_current_screen()->base ) {
		return true;
	}

	return $is_block_editor_screen;
}

add_filter( 'should_load_block_editor_scripts_and_styles', 'gutenberg_navigation_editor_load_block_editor_scripts_and_styles' );

/**
 * This function calls createMenuPreloadingMiddleware middleware because
 * we need to use custom preloading logic for menus.
 *
 * @return void
 */
function gutenberg_navigation_editor_preload_menus() {
	$menus_data = array_reduce(
		array(
			gutenberg_navigation_get_menus_endpoint(),
		),
		'rest_preload_api_request',
		array()
	);

	if ( ! $menus_data ) {
		return;
	}

	wp_add_inline_script(
		'wp-edit-navigation',
		sprintf(
			'wp.apiFetch.use( wp.editNavigation.__unstableCreateMenuPreloadingMiddleware( %s ) );',
			wp_json_encode( $menus_data )
		),
		'after'
	);
}
