<?php
/**
 * Content Guidelines experimental feature.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/class-gutenberg-content-guidelines-post-type.php';
require_once __DIR__ . '/class-gutenberg-content-guidelines-rest-controller.php';
require_once __DIR__ . '/class-gutenberg-content-guidelines-revisions-controller.php';

// Register CPT (controllers auto-instantiated via post type args).
add_action( 'init', array( 'Gutenberg_Content_Guidelines_Post_Type', 'register' ) );

// Register post meta at rest_api_init (block registry needs to be available).
add_action( 'rest_api_init', array( 'Gutenberg_Content_Guidelines_Post_Type', 'register_post_meta' ) );
