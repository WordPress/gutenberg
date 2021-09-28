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
 * Initialize the Gutenberg Navigation page.
 *
 * @since 7.8.0
 *
 * @param string $hook Page.
 */
function gutenberg_navigation_init( $hook ) {
	if ( 'gutenberg_page_gutenberg-navigation' !== $hook ) {
			return;
	}

	$preload_paths = array(
		'/__experimental/menu-locations',
		array( '/wp/v2/pages', 'OPTIONS' ),
		array( '/wp/v2/posts', 'OPTIONS' ),
	);

	$settings = array_merge(
		gutenberg_get_default_block_editor_settings(),
		array(
			'blockNavMenus' => false,
			// We should uncomment the line below when the block-nav-menus feature becomes stable.
			// @see https://github.com/WordPress/gutenberg/issues/34265.
			/*'blockNavMenus' => get_theme_support( 'block-nav-menus' ),*/
		)
	);
	$settings = gutenberg_experimental_global_styles_settings( $settings );

	gutenberg_initialize_editor(
		'navigation_editor',
		'edit-navigation',
		array(
			'initializer_name' => 'initialize',
			'editor_settings'  => $settings,
			'preload_paths'    => $preload_paths,
		)
	);

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
