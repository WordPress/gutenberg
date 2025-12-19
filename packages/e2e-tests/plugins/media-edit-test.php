<?php
/**
 * Plugin Name: Gutenberg Test Media Edit
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-media-edit
 */

/**
 * Registers a "featured_media_test" meta field for pages to test MediaEdit with multiple files.
 * This overrides the featured_media field to store an array of attachment IDs.
 */
function gutenberg_test_media_edit_register_meta() {
	register_post_meta(
		'page',
		'featured_media_test',
		array(
			'type'         => 'array',
			'single'       => true,
			'show_in_rest' => array(
				'schema' => array(
					'type'  => 'array',
					'items' => array(
						'type' => 'integer',
					),
				),
			),
		)
	);
}
add_action( 'init', 'gutenberg_test_media_edit_register_meta' );

/**
 * Enqueues the script for registering the downloads field.
 */
function gutenberg_test_media_edit_enqueue_script() {
	wp_enqueue_script(
		'gutenberg-test-media-edit',
		plugins_url( 'media-edit-test/index.js', __FILE__ ),
		array( 'wp-hooks', 'wp-i18n', 'wp-element', 'wp-editor' ),
		'1.0.0',
		true
	);
}
add_action( 'admin_enqueue_scripts', 'gutenberg_test_media_edit_enqueue_script' );
