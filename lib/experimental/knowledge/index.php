<?php
/**
 * Knowledge experimental feature.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/knowledge.php';
require_once __DIR__ . '/class-gutenberg-knowledge-post-type.php';
require_once __DIR__ . '/class-gutenberg-knowledge-rest-controller.php';
require_once __DIR__ . '/class-gutenberg-guideline-scopes-rest-controller.php';

/*
 * Register the knowledge post type.
 * The standard /wp/v2/knowledge collection is served by the custom
 * Gutenberg_Knowledge_REST_Controller (set via the post type's
 * `rest_controller_class`).
 */
add_action( 'init', array( 'Gutenberg_Knowledge_Post_Type', 'register' ) );

/*
 * Ensure the post type is registered before any other `rest_api_init` callback
 * runs. `init` normally fires before `rest_api_init`, but anything that calls
 * `rest_get_server()` early (e.g. from `plugins_loaded`) fires `rest_api_init`
 * before `init` priority 10. The callback below dereferences the post type
 * object and would fatal (or trip `_doing_it_wrong`) without this guard.
 */
add_action(
	'rest_api_init',
	static function () {
		if ( ! post_type_exists( Gutenberg_Knowledge_Post_Type::POST_TYPE ) ) {
			Gutenberg_Knowledge_Post_Type::register();
		}
	},
	1
);

/*
 * Register the read-only guideline scopes registry route beside the standard
 * CPT routes. Guideline data itself is read and written through the standard
 * /wp/v2/knowledge collection; scope rows are identified by the `guideline-`
 * slug prefix and the `guideline` knowledge type (see the reservation guard in
 * knowledge.php).
 */
add_action(
	'rest_api_init',
	static function () {
		$scopes_controller = new Gutenberg_Guideline_Scopes_REST_Controller();
		$scopes_controller->register_routes();
	}
);
