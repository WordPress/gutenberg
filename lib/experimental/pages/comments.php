<?php
/**
 * Comments Admin Page - Replaces the core Comments admin page with a modern DataViews-based UI.
 *
 * @package gutenberg
 */

/**
 * Register the Comments admin page, replacing Core's edit-comments.php.
 */
function gutenberg_register_comments_admin_page() {
	// Remove Core's comments menu item.
	remove_menu_page( 'edit-comments.php' );

	// Register the new comments page under the same top-level position.
	add_menu_page(
		__( 'Comments', 'gutenberg' ),
		__( 'Comments', 'gutenberg' ),
		'moderate_comments',
		'comments-admin-wp-admin',
		'gutenberg_comments_admin_wp_admin_render_page',
		'dashicons-admin-comments',
		25 // Same position as the original Comments menu.
	);
}
add_action( 'admin_menu', 'gutenberg_register_comments_admin_page', 11 );
