<?php
/**
 * WordPress 7.2 compatibility functions for the Gutenberg
 * editor plugin changes related to REST API.
 *
 * @package gutenberg
 */

/**
 * Registers the notes REST API route.
 */
function gutenberg_register_notes_controller_endpoints() {
	$notes_controller = new Gutenberg_REST_Notes_Controller();
	$notes_controller->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_notes_controller_endpoints' );
