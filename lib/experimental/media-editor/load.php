<?php
/**
 * Bootstraps the Media Editor page in wp-admin.
 *
 * @package gutenberg
 */

add_action( 'admin_menu', 'gutenberg_register_media_editor_admin_page' );

/**
 * Registers a hidden wp-admin page for direct media editor deep links.
 */
function gutenberg_register_media_editor_admin_page() {
	// Register with an empty parent to create a hidden admin.php?page= route
	// without adding a Media submenu item for an editor that requires an ID.
	$hook_suffix = add_submenu_page(
		'',
		__( 'Edit media', 'gutenberg' ),
		__( 'Edit media', 'gutenberg' ),
		'upload_files',
		'media-editor-wp-admin',
		'gutenberg_media_editor_wp_admin_render_page'
	);

	if ( $hook_suffix ) {
		// Hidden pages do not resolve a title from a visible menu item, so set
		// one before admin-header.php formats the page title.
		add_action( "load-$hook_suffix", 'gutenberg_media_editor_wp_admin_set_title' );
	}
}

/**
 * Sets the admin page title before wp-admin/admin-header.php renders.
 *
 * @global string $title The admin page title.
 */
function gutenberg_media_editor_wp_admin_set_title() {
	global $title;

	$title = __( 'Edit media', 'gutenberg' );
}
