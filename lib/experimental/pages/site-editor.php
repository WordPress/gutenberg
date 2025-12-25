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
		'site-editor',
		'site_editor_render_page'
	);
}
add_action( 'admin_menu', 'gutenberg_register_site_editor_admin_page' );

/**
 * Register default menu items for the site editor page.
 */
function gutenberg_site_editor_register_default_menu_items() {
	register_site_editor_menu_item( 'home', __( 'Home', 'gutenberg' ), '/', '' );
	register_site_editor_menu_item( 'styles', __( 'Styles', 'gutenberg' ), '/styles', '' );
	register_site_editor_menu_item( 'navigation', __( 'Navigation', 'gutenberg' ), '/navigation', '' );
	register_site_editor_menu_item( 'pages', __( 'Pages', 'gutenberg' ), '/types/page', '' );
	register_site_editor_menu_item( 'templates', __( 'Templates', 'gutenberg' ), '/templates', '' );
	register_site_editor_menu_item( 'templateParts', __( 'Template Parts', 'gutenberg' ), '/template-parts', '' );
	register_site_editor_menu_item( 'patterns', __( 'Patterns', 'gutenberg' ), '/patterns', '' );
	register_site_editor_menu_item( 'fontList', __( 'Fonts', 'gutenberg' ), '/font-list', '' );
}
add_action( 'site-editor_init', 'gutenberg_site_editor_register_default_menu_items', 5 );
