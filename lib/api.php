<?php
/**
 * API Endpoints.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * Callback for registering gutenberg API routes.
 *
 * @return void
 */
function gutenburg_register_routes() {
	Gutenberg_User_Preferences::register_routes();
}

add_action( 'rest_api_init', 'gutenburg_register_routes' );
