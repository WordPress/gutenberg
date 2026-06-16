<?php
/**
 * Site Editor Page - Integration file for admin menu registration.
 *
 * @package gutenberg
 */

/**
 * Register site editor admin page in WordPress admin menu.
 */
function gutenberg_register_site_editor_admin_page() {
	add_submenu_page(
		'nothing',
		__( 'Site Editor', 'gutenberg' ),
		__( 'Site Editor', 'gutenberg' ),
		'manage_options',
		'site-editor-v2',
		'gutenberg_site_editor_v2_render_page'
	);
}
add_action( 'admin_menu', 'gutenberg_register_site_editor_admin_page' );

/**
 * Check whether the current classic theme supports the Style Book.
 *
 * @return bool True if the current classic theme supports the Style Book.
 */
function gutenberg_site_editor_v2_current_classic_theme_supports_style_book() {
	if ( wp_is_block_theme() ) {
		return false;
	}

	if ( current_theme_supports( 'editor-styles' ) ) {
		return true;
	}

	return function_exists( 'wp_theme_has_theme_json' ) &&
		wp_theme_has_theme_json();
}

/**
 * Register default menu items for the site editor page.
 */
function gutenberg_site_editor_register_default_menu_items() {
	$is_block_theme                            = wp_is_block_theme();
	$current_theme_supports_site_editor_styles = $is_block_theme ||
		gutenberg_site_editor_v2_current_classic_theme_supports_style_book();

	gutenberg_register_site_editor_v2_menu_item( 'home', __( 'Home', 'gutenberg' ), '/', '' );

	if ( $current_theme_supports_site_editor_styles ) {
		gutenberg_register_site_editor_v2_menu_item( 'styles', __( 'Styles', 'gutenberg' ), '/styles', '' );
	}

	if ( $is_block_theme ) {
		gutenberg_register_site_editor_v2_menu_item( 'navigation', __( 'Navigation', 'gutenberg' ), '/navigation', '' );
		gutenberg_register_site_editor_v2_menu_item( 'pages', __( 'Pages', 'gutenberg' ), '/types/page', '' );
		gutenberg_register_site_editor_v2_menu_item( 'templates', __( 'Templates', 'gutenberg' ), '/templates', '' );
		gutenberg_register_site_editor_v2_menu_item( 'templateParts', __( 'Template Parts', 'gutenberg' ), '/template-parts', '' );
	}

	gutenberg_register_site_editor_v2_menu_item( 'patterns', __( 'Patterns', 'gutenberg' ), '/patterns', '' );
}
add_action( 'site-editor-v2_init', 'gutenberg_site_editor_register_default_menu_items', 5 );
