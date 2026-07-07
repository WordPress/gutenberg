<?php
/**
 * Init hooks.
 *
 * @package gutenberg
 */

/**
 * Gutenberg's Menu.
 *
 * Surfaces the "Experiments" screen as a submenu under
 * the core Settings menu, rather than as a dedicated top-level menu. The page
 * is rendered by the auto-generated `gutenberg_experiments_wp_admin_render_page()`
 * callback (see `lib/experimental/experiments/load.php`).
 *
 * @since 0.1.0
 */
function gutenberg_menu() {
	add_submenu_page(
		'options-general.php',
		'Gutenberg',
		'Gutenberg',
		'manage_options',
		'experiments-wp-admin',
		'gutenberg_experiments_wp_admin_render_page'
	);
}
add_action( 'admin_menu', 'gutenberg_menu', 9 );
