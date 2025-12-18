<?php
/**
 * Bootstraps the Fonts library page in wp-admin.
 *
 * @package gutenberg
 */

add_action( 'admin_menu', 'gutenberg_register_fonts_menu_item' );

/**
 * Registers the Fonts menu item under Appearance using the font-library page.
 */
function gutenberg_register_fonts_menu_item() {
	if ( ! wp_is_block_theme() && ! wp_theme_has_theme_json() ) {
		return;
	}

	add_submenu_page(
		'themes.php',
		__( 'Fonts', 'gutenberg' ),
		__( 'Fonts', 'gutenberg' ),
		'edit_theme_options',
		'font-library-wp-admin',
		'font_library_wp_admin_render_page'
	);
}
