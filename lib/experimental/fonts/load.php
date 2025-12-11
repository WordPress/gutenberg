<?php
/**
 * Bootstraps the Fonts library page in wp-admin.
 *
 * @package gutenberg
 */

add_action( 'admin_menu', 'gutenberg_register_fonts_menu_item' );

/**
 * Registers the Fonts menu item under Appearance using the gutenberg-boot-wp-admin routing infrastructure.
 */
function gutenberg_register_fonts_menu_item() {
	if ( ! wp_is_block_theme() && ! wp_theme_has_theme_json() ) {
		return;
	}

	$url = admin_url( 'admin.php?page=gutenberg-boot-wp-admin&p=' . urlencode( '/font-list' ) );

	add_submenu_page(
		'themes.php',
		__( 'Fonts', 'gutenberg' ),
		__( 'Fonts', 'gutenberg' ),
		'edit_theme_options',
		$url,
		''
	);
}
