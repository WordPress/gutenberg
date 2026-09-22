<?php
/**
 * Plugin Name: Gutenberg Test Plugin: Upload Operation Video Poster
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * A consumer of the upload operation API that adds a step after a video
 * has been uploaded: it grabs the first frame in the browser and sends it to
 * the plugin's own endpoint as the video's poster. The sideload endpoint only
 * knows the companion files core defines, so a plugin's companion has to go
 * to an endpoint the plugin provides; the step reads the attachment ID the
 * upload step produced and posts the frame there.
 *
 * @package gutenberg-test-upload-operation-video-poster
 */

/**
 * Registers the endpoint that receives the poster, and exposes it on the
 * attachment.
 */
function gutenberg_test_upload_operation_video_poster_rest_api_init() {
	register_rest_route(
		'gutenberg-test/v1',
		'/video-poster/(?P<id>[\d]+)',
		array(
			'methods'             => WP_REST_Server::CREATABLE,
			'permission_callback' => static function ( WP_REST_Request $request ) {
				$id = (int) $request['id'];
				return current_user_can( 'upload_files' ) && current_user_can( 'edit_post', $id );
			},
			'callback'            => static function ( WP_REST_Request $request ) {
				$id = (int) $request['id'];
				if ( 'attachment' !== get_post_type( $id ) || 0 !== strpos( (string) get_post_mime_type( $id ), 'video/' ) ) {
					return new WP_Error( 'rest_not_a_video', 'The attachment is not a video.', array( 'status' => 400 ) );
				}

				$files = $request->get_file_params();
				if ( empty( $files['poster'] ) ) {
					return new WP_Error( 'rest_missing_poster', 'No poster file was sent.', array( 'status' => 400 ) );
				}

				if ( ! function_exists( 'wp_handle_upload' ) ) {
					require_once ABSPATH . 'wp-admin/includes/file.php';
				}
				$upload = wp_handle_upload(
					$files['poster'],
					array(
						'test_form' => false,
						'mimes'     => array( 'jpg|jpeg' => 'image/jpeg' ),
					)
				);
				if ( isset( $upload['error'] ) ) {
					return new WP_Error( 'rest_poster_upload_failed', $upload['error'], array( 'status' => 500 ) );
				}

				update_post_meta( $id, 'video_poster', esc_url_raw( $upload['url'] ) );

				return rest_ensure_response( array( 'poster' => $upload['url'] ) );
			},
			'args'                => array(
				'id' => array(
					'type'     => 'integer',
					'required' => true,
				),
			),
		)
	);

	register_rest_field(
		'attachment',
		'video_poster',
		array(
			'get_callback' => static function ( $attachment ) {
				$poster = get_post_meta( $attachment['id'], 'video_poster', true );
				return is_string( $poster ) && '' !== $poster ? $poster : null;
			},
			'schema'       => array(
				'description' => 'URL of the poster the browser grabbed from the video before it was uploaded.',
				'type'        => array( 'string', 'null' ),
				'format'      => 'uri',
				'context'     => array( 'view', 'edit' ),
				'readonly'    => true,
			),
		)
	);
}

add_action( 'rest_api_init', 'gutenberg_test_upload_operation_video_poster_rest_api_init' );

/**
 * Registers the upload operation in the editor.
 */
function gutenberg_test_upload_operation_video_poster_enqueue_script() {
	wp_enqueue_script(
		'gutenberg-test-upload-operation-video-poster',
		plugins_url( 'upload-operation-video-poster/index.js', __FILE__ ),
		array( 'wp-upload-media', 'wp-api-fetch', 'wp-i18n' ),
		filemtime( plugin_dir_path( __FILE__ ) . 'upload-operation-video-poster/index.js' ),
		true
	);
}

add_action( 'enqueue_block_editor_assets', 'gutenberg_test_upload_operation_video_poster_enqueue_script' );
