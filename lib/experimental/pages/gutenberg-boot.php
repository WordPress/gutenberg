<?php
/**
 * Gutenberg Boot Page - Integration file for admin menu registration.
 *
 * @package gutenberg
 */

/**
 * Register boot admin page in WordPress admin menu.
 */
function gutenberg_register_boot_admin_page() {
	add_submenu_page(
		'nothing',
		__( 'Boot Demo', 'gutenberg' ),
		__( 'Boot Demo', 'gutenberg' ),
		'manage_options',
		'gutenberg-boot',
		'gutenberg_boot_render_page'
	);
}
add_action( 'admin_menu', 'gutenberg_register_boot_admin_page' );

/**
 * Register default menu items for the boot page.
 */
function gutenberg_boot_register_default_menu_items() {
	register_gutenberg_boot_menu_item( 'home', __( 'Home', 'gutenberg' ), '/', '' );
	register_gutenberg_boot_menu_item( 'styles', __( 'Styles', 'gutenberg' ), '/styles', '' );
	register_gutenberg_boot_menu_item( 'navigation', __( 'Navigation', 'gutenberg' ), '/navigation', '' );
	register_gutenberg_boot_menu_item( 'pages', __( 'Pages', 'gutenberg' ), '/types/page', '' );
	if ( gutenberg_is_experiment_enabled( 'active_templates' ) ) {
		register_gutenberg_boot_menu_item( 'templates', __( 'Templates', 'gutenberg' ), '/templates', '' );
	}
	register_gutenberg_boot_menu_item( 'templateParts', __( 'Template Parts', 'gutenberg' ), '/template-parts', '' );
	register_gutenberg_boot_menu_item( 'patterns', __( 'Patterns', 'gutenberg' ), '/patterns', '' );
}
add_action( 'gutenberg-boot_init', 'gutenberg_boot_register_default_menu_items', 5 );
