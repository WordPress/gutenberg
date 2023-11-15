<?php
/**
 * PHP and WordPress configuration compatibility functions for the Gutenberg
 * editor plugin changes related to REST API.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * Registers the Global Styles Revisions REST API routes.
 */
function gutenberg_register_global_styles_revisions_endpoints() {
	$global_styles_revisions_controller = new Gutenberg_REST_Global_Styles_Revisions_Controller_6_5();
	$global_styles_revisions_controller->register_routes();
}

add_action( 'rest_api_init', 'gutenberg_register_global_styles_revisions_endpoints' );


/**
 * Updates REST API response for the attachments and adds extra properties.
 *
 * @param WP_REST_Response $response The response object.
 * @param WP_Post          $post    The original attachment post.
 * @return WP_REST_Response $response Updated response object.
 */
function gutenberg_modify_rest_attachments_response( $response, $post ) {
	$uncompressed_media_id = get_post_meta( $post->ID, '_wp_uncompressed_media_id', true );
	if ( $uncompressed_media_id ) {
		$response->data['uncompressed_source_url'] = wp_get_attachment_url( $uncompressed_media_id );
	}
	// There is a cached value for the file size, but it seems that it's
	// not reliable (@see https://core.trac.wordpress.org/ticket/57459).
	$response->data['filesize'] = filesize( get_attached_file( $post->ID ) );
	return $response;
}
add_filter( 'rest_prepare_attachment', 'gutenberg_modify_rest_attachments_response', 10, 2 );


/**
 * Fires after a single attachment is completely created or updated via the REST API.
 *
 * @param WP_Post         $attachment Inserted or updated attachment object.
 * @param WP_REST_Request $request    Request object.
 * @param bool            $creating   True when creating an attachment, false when updating.
 */
function gutenberg_rest_after_insert_attachment_update_meta( $attachment, $request, $creating ) {
	if ( ! $creating ) {
		return;
	}
	$_wp_compression_factor = $request->get_param( '_wp_compression_factor' );
	if ( $_wp_compression_factor ) {
		update_post_meta( $attachment->ID, '_wp_compression_factor', $_wp_compression_factor );
	}
	$_wp_uncompressed_media_id = $request->get_param( '_wp_uncompressed_media_id' );
	if ( $_wp_uncompressed_media_id ) {
		update_post_meta( $attachment->ID, '_wp_uncompressed_media_id', $_wp_uncompressed_media_id );
	}
}
add_action( 'rest_after_insert_attachment', 'gutenberg_rest_after_insert_attachment_update_meta', 10, 3 );


// TODO: probably we should delete all compressed versions when the original is deleted.
// function gutenberg_pre_delete_attachment() {
// }
// add_action( 'pre_delete_attachment', 'gutenberg_pre_delete_attachment', 10, 3 );.


/**
 * Registers additional post meta for the attachment post type.
 *
 * @return void
 */
function gutenberg_register_attachment_post_meta() {
	// TODO: could we do this with a `parent` relationship?
	register_post_meta(
		'attachment',
		'_wp_uncompressed_media_id',
		array(
			'type'         => 'number',
			'description'  => __( 'Id of the linked uncompressed attachment.', 'gutenberg' ),
			'show_in_rest' => array(
				'schema' => array(
					'type' => 'number',
				),
			),
			'single'       => true,
		)
	);
	register_post_meta(
		'attachment',
		'_wp_compression_factor',
		array(
			'type'         => 'number',
			'description'  => __( 'Compression factor of attachment.', 'gutenberg' ),
			'show_in_rest' => array(
				'schema' => array(
					'type' => 'number',
				),
			),
			'single'       => true,
		)
	);
}
add_action( 'rest_api_init', 'gutenberg_register_attachment_post_meta' );
