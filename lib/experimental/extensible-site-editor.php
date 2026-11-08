<?php
/**
 * Extensible Site Editor experiment integration.
 *
 * Only loaded while the `gutenberg-extensible-site-editor` experiment is
 * enabled (see lib/load.php).
 *
 * @package gutenberg
 */

/**
 * Redirect the Appearance > Design menu to the extensible site editor.
 *
 * @global array $submenu WordPress admin submenu array.
 */
function gutenberg_redirect_to_extensible_site_editor() {
	// Update the Design submenu item to point to the extensible site editor.
	global $submenu;
	if ( $submenu && isset( $submenu['themes.php'] ) ) {
		foreach ( $submenu['themes.php'] as $key => $item ) {
			// Find the Design/site-editor menu item and update its URL.
			if ( isset( $item[2] ) && 'site-editor.php' === $item[2] ) {
				$submenu['themes.php'][ $key ][2] = 'admin.php?page=site-editor-v2';
				break;
			}
		}
	}
}
add_action( 'admin_menu', 'gutenberg_redirect_to_extensible_site_editor', 100 );

/**
 * Unregisters the "View revisions" action of every post type, so the lists of
 * the extensible site editor do not show it.
 *
 * The registry is the same for every screen, so the lists of the site editor
 * and of the other screens lose it too while the experiment is enabled.
 *
 * Hooked at the default priority, after the core actions are registered, see
 * register_core_entity_actions().
 */
function gutenberg_unregister_view_post_revisions_entity_action() {
	foreach ( get_post_types( array( 'show_in_rest' => true ) ) as $post_type ) {
		wp_unregister_entity_actions( 'postType', $post_type, array( 'view-post-revisions' ) );
	}
}
add_action( 'wp_entity_actions_api_init', 'gutenberg_unregister_view_post_revisions_entity_action' );
