<?php
/**
 * Bootstraps the Fonts library page in wp-admin.
 *
 * @package gutenberg
 */

// Priority 11 to run after Core's menu.php sets up the fonts menu.
add_action( 'admin_menu', 'gutenberg_register_fonts_menu_item', 11 );
add_action( 'setup_theme', 'gutenberg_setup_font_library_theme_support' );

/**
 * Adds default theme support for the font library.
 */
function gutenberg_setup_font_library_theme_support() {
	add_theme_support( 'font-library' );
}

/**
 * Registers the Fonts menu item under Appearance using the font-library page.
 * Removes Core's fonts menu item first to prevent duplication.
 */
function gutenberg_register_fonts_menu_item() {
	$has_font_library_support = current_theme_supports( 'font-library' );

	// Remove Core's fonts menu item if it exists.
	remove_submenu_page( 'themes.php', 'font-library.php' );

	if ( $has_font_library_support ) {
		add_submenu_page(
			'themes.php',
			__( 'Fonts', 'gutenberg' ),
			__( 'Fonts', 'gutenberg' ),
			'edit_theme_options',
			'font-library-wp-admin',
			'gutenberg_font_library_wp_admin_render_page'
		);
	} else {
		// Prevent direct access to the Font Library pages.
		$die_if_disabled = static function () {
			wp_die(
				__( 'This feature has been disabled.', 'gutenberg' ),
				__( 'Disabled', 'gutenberg' ),
				array(
					'response'  => 403,
					'back_link' => true,
				)
			);
		};
		add_action( 'load-appearance_page_font-library', $die_if_disabled );
		add_action( 'load-appearance_page_font-library-wp-admin', $die_if_disabled );
	}
}
