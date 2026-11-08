<?php
/**
 * Bootstraps the Fonts library page in wp-admin.
 *
 * @package gutenberg
 */

// Priority 11 to run after Core's menu.php sets up the fonts menu.
add_action( 'admin_menu', 'gutenberg_register_fonts_menu_item', 11 );

/**
 * Registers the Fonts menu item under Appearance using the font-library page.
 * Removes Core's fonts menu item first to prevent duplication.
 */
function gutenberg_register_fonts_menu_item() {
	// Remove Core's fonts menu item if it exists.
	remove_submenu_page( 'themes.php', 'font-library.php' );

	add_submenu_page(
		'themes.php',
		__( 'Fonts', 'gutenberg' ),
		__( 'Fonts', 'gutenberg' ),
		'edit_theme_options',
		'font-library-wp-admin',
		'gutenberg_font_library_wp_admin_render_page'
	);
}
