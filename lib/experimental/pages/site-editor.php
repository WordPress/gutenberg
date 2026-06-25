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
}
add_action( 'site-editor-v2_init', 'gutenberg_site_editor_register_default_menu_items', 5 );

/**
 * Renders the admin bar on the site editor page.
 */
function gutenberg_site_editor_enable_admin_bar() {
	if ( ! is_admin_bar_showing() ) {
		return;
	}

	remove_action( 'admin_bar_menu', 'wp_admin_bar_sidebar_toggle', 0 );
	add_action( 'admin_footer-site-editor-v2', 'wp_admin_bar_render' );

	$admin_color = get_user_option( 'admin_color' );
	if ( empty( $admin_color ) ) {
		$admin_color = 'fresh';
	}
	$admin_color_class = 'admin-color-' . sanitize_html_class( $admin_color );

	add_action(
		'admin_footer-site-editor-v2',
		static function () use ( $admin_color_class ) {
			echo '<script>'
				. 'document.body.classList.add(' . wp_json_encode( $admin_color_class ) . ');'
				. '</script>';
		}
	);

	wp_enqueue_script( 'admin-bar' );
	wp_enqueue_style( 'admin-bar' );
	wp_enqueue_style( 'colors' );

	$css = <<<CSS
#wpadminbar {
	display: block;
}

#site-editor-v2-app {
	position: fixed;
	top: var(--wp-admin--admin-bar--height, 0);
	left: 0;
	right: 0;
	bottom: 0;
	height: calc(100vh - var(--wp-admin--admin-bar--height, 0)) !important;
}
CSS;

	wp_add_inline_style( 'admin-bar', $css );
}
add_action( 'site-editor-v2_init', 'gutenberg_site_editor_enable_admin_bar' );
