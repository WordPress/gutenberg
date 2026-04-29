<?php
/**
 * Records and exposes the chain root for attachments edited via
 * `/wp/v2/media/{id}/edit`.
 *
 * Each call to core's `edit_media_item` creates a new child attachment
 * and writes `parent_image` to its metadata. We piggy-back on that path
 * to also write `root_attachment_id` — the id at the top of the chain
 * — so the Media Editor modal can offer a "Restore original" action
 * without walking the chain on every read.
 *
 * No backfill: this is tied to the (unreleased) media editor cropper,
 * so anything edited before this code lands is intentionally out of
 * scope.
 *
 * @package gutenberg
 */

/**
 * Persist the chain root id when /edit creates a new edited attachment.
 *
 * Hooks `wp_edited_image_metadata` (fired by core inside
 * `WP_REST_Attachments_Controller::edit_media_item`). The new child's
 * root is the parent's root if the parent has one, otherwise the
 * parent itself.
 *
 * @param array $new_image_meta    Metadata for the new edited attachment.
 * @param int   $new_attachment_id The new attachment id.
 * @param int   $attachment_id     The parent (source) attachment id.
 * @return array Filtered metadata.
 */
function gutenberg_record_root_attachment_id( $new_image_meta, $new_attachment_id, $attachment_id ) {
	$parent_meta = wp_get_attachment_metadata( $attachment_id );
	$root_id     = ! empty( $parent_meta['root_attachment_id'] )
		? (int) $parent_meta['root_attachment_id']
		: (int) $attachment_id;

	$new_image_meta['root_attachment_id'] = $root_id;

	return $new_image_meta;
}
add_filter( 'wp_edited_image_metadata', 'gutenberg_record_root_attachment_id', 10, 3 );

/**
 * Filter `rest_prepare_attachment` to expose the chain root.
 *
 * Reads `root_attachment_id` from metadata (written by the
 * `wp_edited_image_metadata` hook above) and adds the resolved
 * attachment id and URL to the response under
 * `media_details.original_attachment`. Absent for attachments with
 * no chain.
 *
 * @param WP_REST_Response $response REST response.
 * @param WP_Post          $post     Attachment post.
 * @return WP_REST_Response
 */
function gutenberg_add_original_attachment_to_response( $response, $post ) {
	$data = $response->get_data();
	if ( empty( $data['media_details'] ) || ! is_array( $data['media_details'] ) ) {
		return $response;
	}

	$meta = wp_get_attachment_metadata( $post->ID );
	if ( empty( $meta['root_attachment_id'] ) ) {
		return $response;
	}

	$root_id = (int) $meta['root_attachment_id'];
	if ( $root_id === (int) $post->ID || $root_id <= 0 ) {
		return $response;
	}

	$data['media_details']['original_attachment'] = array(
		'attachment_id' => $root_id,
		'source_url'    => wp_get_attachment_url( $root_id ),
	);
	$response->set_data( $data );

	return $response;
}
add_filter( 'rest_prepare_attachment', 'gutenberg_add_original_attachment_to_response', 10, 2 );
