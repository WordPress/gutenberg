<?php
/**
 * Moves the theme editor menu items for FSE themes.
 *
 * @package gutenberg
 */

/*
 * If wp_list_users is defined, it means the plugin
 * is running on WordPress 5.9, so no need to change menu location.
 */
if ( ! function_exists( 'wp_list_users' ) ) {
	/**
	 * Moves the "theme editor" under "tools" in block themes.
	 */
	function gutenberg_move_theme_editor_in_block_themes() {
		if ( ! wp_is_block_theme() || is_multisite() ) {
			return;
		}
		remove_submenu_page( 'themes.php', 'theme-editor.php' );
		add_submenu_page( 'tools.php', __( 'Theme File Editor', 'gutenberg' ), __( 'Theme File Editor', 'gutenberg' ), 'edit_themes', 'theme-editor.php' );
	}
	add_action( 'admin_menu', 'gutenberg_move_theme_editor_in_block_themes', 102 );
}
