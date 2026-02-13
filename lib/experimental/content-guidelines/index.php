<?php
/**
 * Content Guidelines experimental feature.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

require_once __DIR__ . '/class-gutenberg-content-guidelines-post-type.php';
require_once __DIR__ . '/class-gutenberg-content-guidelines-rest-controller.php';

// Register CPT.
add_action( 'init', array( 'Gutenberg_Content_Guidelines_Post_Type', 'register' ) );

// Register REST routes and post meta (at rest_api_init so block registry is available).
add_action(
	'rest_api_init',
	function () {
		Gutenberg_Content_Guidelines_Post_Type::register_post_meta();

		$controller = new Gutenberg_Content_Guidelines_REST_Controller();
		$controller->register_routes();
	}
);

