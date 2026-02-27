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
 * Register default menu items for the site editor page.
 */
function gutenberg_site_editor_register_default_menu_items() {
	gutenberg_register_site_editor_v2_menu_item( 'home', __( 'Home', 'gutenberg' ), '/', '' );
	gutenberg_register_site_editor_v2_menu_item( 'styles', __( 'Styles', 'gutenberg' ), '/styles', '' );
	gutenberg_register_site_editor_v2_menu_item( 'navigation', __( 'Navigation', 'gutenberg' ), '/navigation', '' );
	gutenberg_register_site_editor_v2_menu_item( 'pages', __( 'Pages', 'gutenberg' ), '/types/page', '' );
	gutenberg_register_site_editor_v2_menu_item( 'templates', __( 'Templates', 'gutenberg' ), '/templates', '' );
	gutenberg_register_site_editor_v2_menu_item( 'templateParts', __( 'Template Parts', 'gutenberg' ), '/template-parts', '' );
	gutenberg_register_site_editor_v2_menu_item( 'patterns', __( 'Patterns', 'gutenberg' ), '/patterns', '' );
	gutenberg_register_site_editor_v2_menu_item( 'fontList', __( 'Fonts', 'gutenberg' ), '/font-list', '' );
}
add_action( 'site-editor-v2_init', 'gutenberg_site_editor_register_default_menu_items', 5 );
