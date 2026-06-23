<?php
/**
 * Init hooks.
 *
 * @package gutenberg
 */

/**
 * Gutenberg's Menu.
 *
 * Adds a top-level "Gutenberg" wp-admin menu that links directly to the
 * Experiments screen. The Experiments page is rendered by the auto-generated
 * `gutenberg_experiments_wp_admin_render_page()` callback (see
 * `lib/experimental/experiments/load.php`), and the menu uses its
 * `experiments-wp-admin` slug so no separate submenu is needed.
 *
 * @since 0.1.0
 */
function gutenberg_menu() {
	add_menu_page(
		__( 'Gutenberg', 'gutenberg' ),
		__( 'Gutenberg', 'gutenberg' ),
		'manage_options',
		'experiments-wp-admin',
		'gutenberg_experiments_wp_admin_render_page',
		'dashicons-edit'
	);
}
add_action( 'admin_menu', 'gutenberg_menu', 9 );
