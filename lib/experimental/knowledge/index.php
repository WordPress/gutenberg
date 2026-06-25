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
require_once __DIR__ . '/class-gutenberg-content-guidelines-revisions-controller.php';
require_once __DIR__ . '/class-gutenberg-content-guidelines-rest-controller.php';

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
 * before `init` priority 10. The callbacks below — both `register_post_meta`
 * and the controller instantiations — dereference the post type object and
 * would fatal (or trip `_doing_it_wrong`) without this guard.
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

// Register post meta once the REST API loads and the block registry is available.
add_action( 'rest_api_init', array( 'Gutenberg_Knowledge_Post_Type', 'register_post_meta' ) );

/*
 * Register content singleton routes beside the standard CPT routes.
 * The singleton rule is scoped to /wp/v2/content-guidelines for UI handling.
 * The standard /wp/v2/knowledge route keeps default post handling for every
 * `wp_knowledge` post. If `guideline` becomes a data level singleton, add
 * enforcement to the default CPT route too.
 */
add_action(
	'rest_api_init',
	static function () {
		$content_controller = new Gutenberg_Content_Guidelines_REST_Controller();
		$content_controller->register_routes();

		$content_revisions_controller = new Gutenberg_Content_Guidelines_Revisions_Controller();
		$content_revisions_controller->register_routes();
	}
);
