<?php
/**
 * Bootstraping the Gutenberg Navigation page.
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

	$settings = array_merge(
		gutenberg_get_common_block_editor_settings(),
		array(
			'blockNavMenus' => get_theme_support( 'block-nav-menus' ),
		)
	);
	$settings = gutenberg_experimental_global_styles_settings( $settings );

	wp_add_inline_script(
		'wp-edit-navigation',
		sprintf(
			'wp.domReady( function() {
				wp.editNavigation.initialize( "navigation-editor", %s );
			} );',
			wp_json_encode( $settings )
		)
	);

	// Preload server-registered block schemas.
	wp_add_inline_script(
		'wp-blocks',
		'wp.blocks.unstable__bootstrapServerSideBlockDefinitions(' . wp_json_encode( get_block_editor_server_block_settings() ) . ');'
	);

	wp_enqueue_script( 'wp-edit-navigation' );
	wp_enqueue_style( 'wp-edit-navigation' );
	wp_enqueue_style( 'wp-block-library' );
	wp_enqueue_script( 'wp-format-library' );
	wp_enqueue_style( 'wp-format-library' );
}
add_action( 'admin_enqueue_scripts', 'gutenberg_navigation_init' );
