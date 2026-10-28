<?php
/**
 * Site Shell Page - Integration file for admin menu registration.
 *
 * Only loaded while the `gutenberg-site-shell` experiment is enabled (see
 * lib/load.php).
 *
 * @package gutenberg
 */

/**
 * Register the site shell admin page.
 */
function gutenberg_register_site_shell_admin_page() {
	add_submenu_page(
		'nothing',
		__( 'Site', 'gutenberg' ),
		__( 'Site', 'gutenberg' ),
		'manage_options',
		'site-shell',
		'gutenberg_site_shell_render_page'
	);
}
add_action( 'admin_menu', 'gutenberg_register_site_shell_admin_page' );

/**
 * Register the menu items of the site shell's application menu.
 *
 * Every item points at a placeholder route for now. Swapping one for a real
 * screen only means changing its path here.
 */
function gutenberg_site_shell_register_default_menu_items() {
	gutenberg_register_site_shell_menu_item( 'dashboard', __( 'Dashboard', 'gutenberg' ), '/dashboard' );

	gutenberg_register_site_shell_menu_item( 'content', __( 'Content', 'gutenberg' ), '', '', 'section' );
	gutenberg_register_site_shell_menu_item( 'posts', __( 'Posts', 'gutenberg' ), '/posts', 'content' );
	gutenberg_register_site_shell_menu_item( 'pages', __( 'Pages', 'gutenberg' ), '/pages', 'content' );
	gutenberg_register_site_shell_menu_item( 'media', __( 'Media', 'gutenberg' ), '/media', 'content' );
	gutenberg_register_site_shell_menu_item( 'comments', __( 'Comments', 'gutenberg' ), '/comments', 'content' );

	gutenberg_register_site_shell_menu_item( 'design', __( 'Design', 'gutenberg' ), '', '', 'section' );
	gutenberg_register_site_shell_menu_item( 'styles', __( 'Styles', 'gutenberg' ), '/styles', 'design' );
	gutenberg_register_site_shell_menu_item( 'templates', __( 'Templates', 'gutenberg' ), '/templates', 'design' );
	gutenberg_register_site_shell_menu_item( 'templateParts', __( 'Template Parts', 'gutenberg' ), '/template-parts', 'design' );
	gutenberg_register_site_shell_menu_item( 'patterns', __( 'Patterns', 'gutenberg' ), '/patterns', 'design' );
	gutenberg_register_site_shell_menu_item( 'navigation', __( 'Navigation', 'gutenberg' ), '/navigation', 'design' );

	gutenberg_register_site_shell_menu_item( 'manage', __( 'Manage', 'gutenberg' ), '', '', 'section' );
	gutenberg_register_site_shell_menu_item( 'plugins', __( 'Plugins', 'gutenberg' ), '/plugins', 'manage' );
	gutenberg_register_site_shell_menu_item( 'users', __( 'Users', 'gutenberg' ), '/users', 'manage' );
	gutenberg_register_site_shell_menu_item( 'settings', __( 'Settings', 'gutenberg' ), '/settings', 'manage' );
}
add_action( 'site-shell_init', 'gutenberg_site_shell_register_default_menu_items', 5 );
