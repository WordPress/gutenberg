<?php
/**
 * Plugin Name: Gutenberg Test Suggestion Mode Post Meta
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * Registers a post meta key with a document settings panel that edits it, so
 * the Suggestion mode e2e tests can propose a meta change the way a plugin's
 * own UI would.
 *
 * @package gutenberg-test-suggestion-mode-post-meta
 */

/**
 * Registers the test meta key.
 */
function gutenberg_test_suggestion_mode_post_meta_init() {
	register_post_meta(
		'post',
		'suggestion_test_meta',
		array(
			'show_in_rest' => true,
			'single'       => true,
			'type'         => 'string',
			'default'      => '',
		)
	);
}
add_action( 'init', 'gutenberg_test_suggestion_mode_post_meta_init' );

/**
 * Enqueues the document settings panel that edits the test meta key.
 */
function gutenberg_test_suggestion_mode_post_meta_enqueue() {
	wp_enqueue_script(
		'gutenberg-test-suggestion-mode-post-meta',
		plugins_url( 'suggestion-mode-post-meta/index.js', __FILE__ ),
		array(
			'wp-components',
			'wp-data',
			'wp-editor',
			'wp-element',
			'wp-plugins',
		),
		filemtime( plugin_dir_path( __FILE__ ) . 'suggestion-mode-post-meta/index.js' ),
		true
	);
}
add_action( 'enqueue_block_editor_assets', 'gutenberg_test_suggestion_mode_post_meta_enqueue' );
