<?php
/**
 * Extensible Site Editor experiment integration.
 *
 * @package gutenberg
 */

/**
 * Redirect the Appearance > Design menu to the extensible site editor
 * when the experiment is enabled.
 *
 * @global array $submenu WordPress admin submenu array.
 */
function gutenberg_redirect_to_extensible_site_editor() {
	// Only proceed if the experiment is enabled.
	if ( ! gutenberg_is_experiment_enabled( 'gutenberg-extensible-site-editor' ) ) {
		return;
	}

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
