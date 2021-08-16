<?php
/**
 * Init hooks.
 *
 * @package gutenberg
 */

/**
 * Modify WP admin bar.
 *
 * @param WP_Admin_Bar $wp_admin_bar Core class used to implement the Toolbar API.
 */
function modify_admin_bar( $wp_admin_bar ) {
	if (
		gutenberg_use_widgets_block_editor() &&
		! function_exists( 'wp_use_widgets_block_editor' ) &&
		$wp_admin_bar->get_node( 'widgets' ) !== null
	) {
		$wp_admin_bar->add_menu(
			array(
				'id'   => 'widgets',
				'href' => admin_url( 'themes.php?page=gutenberg-widgets' ),
			)
		);
	}
}
add_action( 'admin_bar_menu', 'modify_admin_bar', 40 );

remove_action( 'welcome_panel', 'wp_welcome_panel' );
/**
 * Modify Dashboard welcome panel.
 *
 * When widgets are merged in core this should go into `wp-admin/includes/dashboard.php`
 * and replace the widgets link in the `wp_welcome_panel` checking for the same condition,
 * because then `gutenberg_use_widgets_block_editor` will exist in core.
 */
function modify_welcome_panel() {
	ob_start();
	wp_welcome_panel();
	$welcome_panel = ob_get_clean();
	if (
		gutenberg_use_widgets_block_editor() &&
		! function_exists( 'wp_use_widgets_block_editor' )
	) {
		echo str_replace(
			admin_url( 'widgets.php' ),
			admin_url( 'themes.php?page=gutenberg-widgets' ),
			$welcome_panel
		);
	} else {
		echo $welcome_panel;
	}
}
add_action( 'welcome_panel', 'modify_welcome_panel', 40 );

/**
 * Enable block templates (editor mode) for themes with theme.json.
 */
function gutenberg_enable_block_templates() {
	if ( WP_Theme_JSON_Resolver_Gutenberg::theme_has_support() ) {
		add_theme_support( 'block-templates' );
	}
}

add_action( 'setup_theme', 'gutenberg_enable_block_templates' );

add_theme_support( 'widgets-block-editor' );
