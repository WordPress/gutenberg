<?php
/**
 * Moves the theme editor menu items for FSE themes.
 *
 * @package gutenberg
 */

/**
 * Moves the "theme editor" under "tools" in FSE themes.
 */
function gutenberg_move_theme_editor_in_block_themes() {
	if ( ! gutenberg_is_fse_theme() || is_multisite() ) {
		return;
	}
	remove_submenu_page( 'themes.php', 'theme-editor.php' );
	add_submenu_page( 'tools.php', __( 'Theme Editor', 'default' ), __( 'Theme Editor', 'default' ), 'edit_themes', 'theme-editor.php' );
}

add_action( 'admin_menu', 'gutenberg_move_theme_editor_in_block_themes', 102 );
