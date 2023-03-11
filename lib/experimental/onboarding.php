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
	add_dashboard_page( __( 'Onboarding', 'gutenberg' ), __( 'Onboarding', 'gutenberg' ), 'edit_theme_options', 'onboarding', 'wp_render_onboading_page' );
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

	// TODO
	// So far, activate as soon as the user visited the page,
	// though later this needs to be set up when the user has actually finished the onboarding.
	add_option( 'single_theme_set_up', true );

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
