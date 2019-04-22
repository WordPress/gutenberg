<?php
/**
 * Bootstraping the Gutenberg widgets page.
 *
 * @package gutenberg
 */

/**
 * The main entry point for the Gutenberg widgets page.
 *
 * @since 5.2.0
 */
function the_gutenberg_widgets() {
	?>
	<div id="widgets-editor" class="blocks-widgets-container">
	</div>
	<?php
}

/**
 * Initialize the Gutenberg widgets page.
 *
 * @since 5.2.0
 *
 * @param string $hook Page.
 */
function gutenberg_widgets_init( $hook ) {
	if ( 'gutenberg_page_gutenberg-widgets' !== $hook ) {
			return;
	}

	wp_add_inline_script(
		'wp-edit-widgets',
		'wp.editWidgets.initialize( "widgets-editor" );'
	);
	wp_enqueue_script( 'wp-edit-widgets' );
	wp_enqueue_style( 'wp-edit-widgets' );
}
add_action( 'admin_enqueue_scripts', 'gutenberg_widgets_init' );
