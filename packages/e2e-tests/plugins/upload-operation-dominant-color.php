<?php
/**
 * Plugin Name: Gutenberg Test Plugin: Upload Operation Dominant Color
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * A consumer of the upload operation API, written the way a plugin would
 * write it: it registers a step that runs before `core/upload`, works out the
 * dominant color of the image in the browser, and hands it to the server as a
 * field of the upload request. The server keeps it as post meta and exposes
 * it on the attachment in the REST API.
 *
 * @package gutenberg-test-upload-operation-dominant-color
 */

/**
 * Accepts the color the client worked out as a field of the media endpoint.
 */
function gutenberg_test_upload_operation_dominant_color_register_field() {
	register_rest_field(
		'attachment',
		'dominant_color',
		array(
			'get_callback'    => static function ( $attachment ) {
				$color = get_post_meta( $attachment['id'], 'dominant_color', true );
				return is_string( $color ) && '' !== $color ? $color : null;
			},
			'update_callback' => static function ( $value, $attachment ) {
				if ( ! is_string( $value ) || ! preg_match( '/^#[0-9a-f]{6}$/', $value ) ) {
					return new WP_Error(
						'rest_invalid_dominant_color',
						'The dominant color must be a lowercase hex color, like #00ff00.',
						array( 'status' => 400 )
					);
				}
				update_post_meta( $attachment->ID, 'dominant_color', $value );
				return true;
			},
			'schema'          => array(
				'description' => 'Dominant color of the image, worked out in the browser before upload.',
				'type'        => array( 'string', 'null' ),
				'context'     => array( 'view', 'edit' ),
			),
		)
	);
}

add_action( 'rest_api_init', 'gutenberg_test_upload_operation_dominant_color_register_field' );

/**
 * Registers the upload operation in the editor.
 */
function gutenberg_test_upload_operation_dominant_color_enqueue_script() {
	wp_enqueue_script(
		'gutenberg-test-upload-operation-dominant-color',
		plugins_url( 'upload-operation-dominant-color/index.js', __FILE__ ),
		array( 'wp-upload-media', 'wp-i18n' ),
		filemtime( plugin_dir_path( __FILE__ ) . 'upload-operation-dominant-color/index.js' ),
		true
	);
}

add_action( 'enqueue_block_editor_assets', 'gutenberg_test_upload_operation_dominant_color_enqueue_script' );
