<?php
/**
 * Guidelines experimental feature.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/guidelines.php';
require_once __DIR__ . '/class-gutenberg-guidelines-post-type.php';
require_once __DIR__ . '/class-gutenberg-content-guidelines-revisions-controller.php';
require_once __DIR__ . '/class-gutenberg-content-guidelines-rest-controller.php';

/*
 * Register the guideline post type.
 * The standard /wp/v2/guidelines collection uses the default posts controller.
 */
add_action( 'init', array( 'Gutenberg_Guidelines_Post_Type', 'register' ) );

// Register post meta once the REST API loads and the block registry is available.
add_action( 'rest_api_init', array( 'Gutenberg_Guidelines_Post_Type', 'register_post_meta' ) );

/*
 * Register content singleton routes beside the standard CPT routes.
 * The singleton rule is scoped to /wp/v2/content-guidelines for UI handling.
 * The standard /wp/v2/guidelines route keeps default post handling for every
 * `wp_guideline` post. If `content` becomes a data level singleton, add
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

add_action(
	'current_screen',
	function ( $screen ) {
		if ( Gutenberg_Guidelines_Post_Type::POST_TYPE !== $screen->post_type ) {
			return;
		}

		// Disable the block editor for this post type.
		add_filter( 'use_block_editor_for_post_type', '__return_false' );

		// Remove the media button.
		remove_action( 'media_buttons', 'media_buttons' );

		// Use a plain textarea by disabling TinyMCE and Quicktags.
		add_filter(
			'wp_editor_settings',
			static function ( $settings, $editor_id ) {
				if ( 'content' === $editor_id ) {
					$settings['tinymce']   = false;
					$settings['quicktags'] = false;
				}
				return $settings;
			},
			10,
			2
		);
	}
);
