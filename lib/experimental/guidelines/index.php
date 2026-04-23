<?php
/**
 * Guidelines experimental feature.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/class-gutenberg-guidelines-post-type.php';
require_once __DIR__ . '/class-gutenberg-guidelines-rest-controller.php';
require_once __DIR__ . '/class-gutenberg-guidelines-revisions-controller.php';

// Register CPT (controllers auto-instantiated via post type args).
add_action( 'init', array( 'Gutenberg_Guidelines_Post_Type', 'register' ) );

// Register post meta at rest_api_init (block registry needs to be available).
add_action( 'rest_api_init', array( 'Gutenberg_Guidelines_Post_Type', 'register_post_meta' ) );

add_action(
	'current_screen',
	function ( $screen ) {
		if ( Gutenberg_Guidelines_Post_Type::POST_TYPE !== $screen->post_type ) {
			return;
		}

		// Disable the block editor for this post type.
		add_filter( 'use_block_editor_for_post_type', '__return_false' );

		// Remove the "Add Media" button.
		remove_action( 'media_buttons', 'media_buttons' );

		// Drop the TinyMCE/Quicktags toolbars entirely — a plain textarea suffices.
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
