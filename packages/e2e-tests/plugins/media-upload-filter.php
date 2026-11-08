<?php
/**
 * Plugin Name: Gutenberg Test Media Upload Filter
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-media-upload-filter
 */

/**
 * Enqueues a script extending the media picker through `editor.MediaUpload`.
 */
function enqueue_media_upload_filter_plugin_script() {
	wp_enqueue_script(
		'gutenberg-test-media-upload-filter',
		plugins_url( 'media-upload-filter/index.js', __FILE__ ),
		array( 'wp-element', 'wp-hooks', 'wp-editor' ),
		filemtime( plugin_dir_path( __FILE__ ) . 'media-upload-filter/index.js' ),
		true
	);
}

add_action( 'enqueue_block_editor_assets', 'enqueue_media_upload_filter_plugin_script' );
