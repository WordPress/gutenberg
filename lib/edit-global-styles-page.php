<?php
/**
 * Bootstraping the Gutenberg Edit Global Styles page.
 *
 * @package gutenberg
 */

function the_gutenberg_edit_global_styles() {
	?>
	<div
		id="edit-global-styles"
		class="edit-global-styles"
	>
	</div>
	<?php
}

/**
 * Initialize the Gutenberg Edit Global Styles Page.
 *
 * @since 7.4.0
 *
 * @param string $hook Page.
 */
function gutenberg_edit_global_styles_init( $hook ) {
	if ( 'admin_page_gutenberg-edit-global-styles' !== $hook ) {
		return;
	}

	// Initialize editor.
	wp_add_inline_script(
		'wp-edit-global-styles',
		sprintf(
			'wp.domReady( function() {
				wp.editGlobalStyles.initialize( "edit-global-styles", %s );
			} );',
			wp_json_encode( array() )
		)
	);

	wp_enqueue_script( 'wp-edit-global-styles' );
	wp_enqueue_style( 'wp-edit-global-styles' );
}
add_action( 'admin_enqueue_scripts', 'gutenberg_edit_global_styles_init' );

