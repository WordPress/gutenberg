<?php
/**
 * Onboarding administration screen.
 *
 * @package WordPress
 * @subpackage Administration
 */

/**
 * Add an onboarding page to the dashboard menu.
 */
function add_onboarding_menu() {
	$gutenberg_experiments = get_option( 'gutenberg-experiments' );
	if (
		wp_get_theme('emptytheme')->exists() &&
		$gutenberg_experiments && array_key_exists( 'gutenberg-single-theme', $gutenberg_experiments )
	) {
		add_dashboard_page( __( 'Onboarding', 'gutenberg' ), __( 'Onboarding', 'gutenberg' ), 'edit_theme_options', 'onboarding', 'wp_render_onboading_page' );
	}
}
add_action( 'admin_menu', 'add_onboarding_menu' );


function wp_render_onboading_page() {
	/** WordPress Administration Bootstrap */
	if ( ! current_user_can( 'edit_theme_options' ) ) {
		wp_die(
			'<h1>' . __( 'You need a higher level of permission.' ) . '</h1>' .
			'<p>' . __( 'Sorry, you are not allowed to edit theme options on this site.' ) . '</p>',
			403
		);
	}

	if ( ! wp_is_block_theme() ) {
		wp_die( __( 'The theme you are currently using is not compatible with the Site Editor.' ) );
	}

	wp_add_inline_script(
		'wp-onboarding',
		'wp.domReady( function() {
			wp.onboarding.initialize( "wp-onboarding" );
		} );'
	);
	echo '<div id="wp-onboarding" class=""></div>';

	wp_enqueue_script( 'wp-onboarding' );
	wp_enqueue_style( 'wp-onboarding' );

}
/**
 * Remove themes from WP Admin menu
 * and moves the site editor to the top level.
 */
function remove_themes_menu() {
	remove_submenu_page( 'tools.php', 'theme-editor.php' );

	add_menu_page(
		'Designer',
		'Designer',
		'edit_themes',
		'site-editor.php',
		'',
		'dashicons-welcome-widgets-menus',
		60 
	);
	remove_menu_page('themes.php');
	
}
add_action( 'admin_menu', 'remove_themes_menu', 999 );
