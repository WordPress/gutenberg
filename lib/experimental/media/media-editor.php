<?php
/**
 * Registers the Media Editor route.
 *
 * @package gutenberg
 */

add_action( 'admin_menu', 'gutenberg_register_media_editor_menu_item' );

/**
 * Registers the Media Editor menu item under Media.
 */
function gutenberg_register_media_editor_menu_item() {
	add_submenu_page(
		'upload.php',
		__( 'Media Editor', 'gutenberg' ),
		__( 'Media Editor', 'gutenberg' ),
		'upload_files',
		'media-library-wp-admin',
		'media_library_wp_admin_render_page'
	);
}
