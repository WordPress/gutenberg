<?php
/**
 * PHP and WordPress configuration compatibility functions for the Gutenberg
 * editor plugin changes related to REST API.
 *
 * @package gutenberg
 */

/**
 * Add JavaScript Object with REST API Authentication settings.
 */
function gutenberg_rest_api_frontend_auth() {
	if ( is_admin() ) {
		return;
	}
	wp_register_script( 'wp-rest-nonce', '' );
	wp_enqueue_script( 'wp-rest-nonce' );
	wp_localize_script(
		'wp-rest-nonce',
		'apiSettings',
		array(
			'root'  => esc_url_raw( rest_url() ),
			'nonce' => wp_create_nonce( 'wp_rest' ),
		)
	);
}

add_action( 'init', 'gutenberg_rest_api_frontend_auth' );
