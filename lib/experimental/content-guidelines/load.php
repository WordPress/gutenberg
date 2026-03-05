<?php
/**
 * Bootstraps the Content Guidelines page in wp-admin under Settings.
 *
 * @package gutenberg
 */

add_action( 'admin_menu', 'gutenberg_register_content_guidelines_settings_submenu', 10 );

/**
 * Registers the Content Guidelines submenu item under Settings.
 * Uses the same layout/style as the Font Library admin page (wp-admin integrated).
 */
function gutenberg_register_content_guidelines_settings_submenu() {
	add_submenu_page(
		'options-general.php',
		__( 'Content Guidelines', 'gutenberg' ),
		__( 'Content Guidelines', 'gutenberg' ),
		'manage_options',
		'content-guidelines-wp-admin',
		'gutenberg_content_guidelines_wp_admin_render_page'
	);
}
