<?php
/**
 * Server-side rendering of the `core/loginout` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/loginout` block on server.
 *
 * @param array $attributes The block attributes.
 *
 * @return string Returns the login-out link or form.
 */
function render_block_core_loginout( $attributes ) {

	// Build the redirect URL.
	$redirect_url = isset( $attributes['redirectToCurrent'] ) && $attributes['redirectToCurrent']
		? get_permalink( get_the_ID() )
		: '';

	// If logged-out and displayLoginAsForm is true, show the login form.
	if ( ! is_user_logged_in() && isset( $attributes['displayLoginAsForm'] ) && $attributes['displayLoginAsForm'] ) {
		return wp_login_form(
			array(
				'echo'     => false,
				'redirect' => $redirect_url,
			)
		);
	}
	return wp_loginout( $redirect_url, false );
}

/**
 * Registers the `core/latest-posts` block on server.
 */
function register_block_core_loginout() {
	register_block_type_from_metadata(
		__DIR__ . '/loginout',
		array(
			'render_callback' => 'render_block_core_loginout',
		)
	);
}
add_action( 'init', 'register_block_core_loginout' );
