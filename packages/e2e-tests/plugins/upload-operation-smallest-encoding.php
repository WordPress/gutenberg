<?php
/**
 * Plugin Name: Gutenberg Test Plugin: Upload Operation Smallest Encoding
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * A consumer of the upload operation API that replaces a core step: it
 * unregisters `core/transcode-image` and registers its own step under the
 * same name, one that encodes the image with the browser's own encoders in
 * several formats and uploads whichever came out smallest. The step records
 * what it compared as a field of the upload request, so a test can check the
 * file the server received is the one the step picked.
 *
 * @package gutenberg-test-upload-operation-smallest-encoding
 */

/**
 * Accepts the record of what the client compared as a field of the media
 * endpoint.
 */
function gutenberg_test_upload_operation_smallest_encoding_register_field() {
	register_rest_field(
		'attachment',
		'smallest_encoding',
		array(
			'get_callback'    => static function ( $attachment ) {
				$record = get_post_meta( $attachment['id'], 'smallest_encoding', true );
				if ( ! is_string( $record ) || '' === $record ) {
					return null;
				}
				$decoded = json_decode( $record, true );
				return is_array( $decoded ) ? $decoded : null;
			},
			'update_callback' => static function ( $value, $attachment ) {
				if ( ! is_string( $value ) || ! is_array( json_decode( $value, true ) ) ) {
					return new WP_Error(
						'rest_invalid_smallest_encoding',
						'The encoding record must be a JSON object.',
						array( 'status' => 400 )
					);
				}
				update_post_meta( $attachment->ID, 'smallest_encoding', wp_slash( $value ) );
				return true;
			},
			'schema'          => array(
				'description' => 'Which encodings the browser compared before uploading, and which one it picked.',
				'type'        => array( 'object', 'null' ),
				'context'     => array( 'view', 'edit' ),
			),
		)
	);
}

add_action( 'rest_api_init', 'gutenberg_test_upload_operation_smallest_encoding_register_field' );

/**
 * Registers the replacement step in the editor.
 */
function gutenberg_test_upload_operation_smallest_encoding_enqueue_script() {
	wp_enqueue_script(
		'gutenberg-test-upload-operation-smallest-encoding',
		plugins_url( 'upload-operation-smallest-encoding/index.js', __FILE__ ),
		array( 'wp-upload-media', 'wp-i18n' ),
		filemtime( plugin_dir_path( __FILE__ ) . 'upload-operation-smallest-encoding/index.js' ),
		true
	);
}

add_action( 'enqueue_block_editor_assets', 'gutenberg_test_upload_operation_smallest_encoding_enqueue_script' );
