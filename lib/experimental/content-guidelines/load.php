<?php
/**
 * Bootstraps the Content Guidelines page in wp-admin under Settings.
 *
 * @package gutenberg
 */

add_action( 'admin_menu', 'gutenberg_register_content_guidelines_settings_submenu', 10 );
add_action( 'admin_enqueue_scripts', 'gutenberg_content_guidelines_enqueue_block_registry_scripts', 5 );

/**
 * Registers the Content Guidelines submenu item under Settings.
 * Uses the same layout/style as the Font Library admin page (wp-admin integrated).
 */
function gutenberg_register_content_guidelines_settings_submenu() {
	add_submenu_page(
		'options-general.php',
		__( 'Guidelines', 'gutenberg' ),
		__( 'Guidelines', 'gutenberg' ),
		'manage_options',
		'guidelines-wp-admin',
		'gutenberg_guidelines_wp_admin_render_page'
	);
}

/**
 * Enqueues wp-block-library on the Content Guidelines admin page so
 * registerCoreBlocks() is available when the app bootstraps the block
 * registry (Core blocks only) on the client.
 *
 * Priority 5 ensures this runs before the main asset enqueue (priority 10).
 */
function gutenberg_content_guidelines_enqueue_block_registry_scripts( $hook_suffix ) {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	if ( 'settings_page_guidelines-wp-admin' !== $hook_suffix ) {
		return;
	}

	wp_enqueue_script( 'wp-block-library' );
}
