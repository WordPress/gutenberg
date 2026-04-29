<?php
/**
 * Records and exposes the lineage root for attachments edited via
 * `/wp/v2/media/{id}/edit`.
 *
 * Each call to core's `edit_media_item` creates a new child attachment
 * and writes `parent_image` to its metadata. We piggy-back on that path
 * to also write `original_attachment_id` — the id at the top of the
 * lineage — so the Media Editor modal can offer a "Restore original"
 * action without walking the chain on every read.
 *
 * No backfill: this is tied to the (unreleased) media editor cropper,
 * so anything edited before this code lands is intentionally out of
 * scope.
 *
 * @package gutenberg
 */

/**
 * Persist the original attachment id when /edit creates a new edited
 * attachment.
 *
 * Hooks `wp_edited_image_metadata` (fired by core inside
 * `WP_REST_Attachments_Controller::edit_media_item`). The new child's
 * original attachment is its parent's original attachment if the
 * parent has one, otherwise the parent itself.
 *
 * @param array $new_image_meta    Metadata for the new edited attachment.
 * @param int   $new_attachment_id The new attachment id.
 * @param int   $attachment_id     The parent (source) attachment id.
 * @return array Filtered metadata.
 */
function gutenberg_record_original_attachment_id( $new_image_meta, $new_attachment_id, $attachment_id ) {
	$parent_meta = wp_get_attachment_metadata( $attachment_id );
	$original_id = is_array( $parent_meta ) && ! empty( $parent_meta['original_attachment_id'] )
		? (int) $parent_meta['original_attachment_id']
		: (int) $attachment_id;

	$new_image_meta['original_attachment_id'] = $original_id;

	return $new_image_meta;
}
add_filter( 'wp_edited_image_metadata', 'gutenberg_record_original_attachment_id', 10, 3 );

/**
 * Filter `rest_prepare_attachment` to expose the original attachment.
 *
 * Reads `original_attachment_id` from metadata (written by the
 * `wp_edited_image_metadata` hook above) and adds the resolved
 * attachment id and URL to the response under
 * `media_details.original_attachment`. Absent for attachments with
 * no edit lineage.
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
	if ( ! is_array( $meta ) || empty( $meta['original_attachment_id'] ) ) {
		return $response;
	}

	$original_id = (int) $meta['original_attachment_id'];
	if ( $original_id === (int) $post->ID || $original_id <= 0 ) {
		return $response;
	}

	// Skip when the original is unreachable (deleted, missing file).
	// Emitting `source_url: false` would feed a non-string to the
	// client cropper.
	$source_url = wp_get_attachment_url( $original_id );
	if ( ! is_string( $source_url ) || '' === $source_url ) {
		return $response;
	}

	$data['media_details']['original_attachment'] = array(
		'attachment_id' => $original_id,
		'source_url'    => $source_url,
	);
	$response->set_data( $data );

	return $response;
}
add_filter( 'rest_prepare_attachment', 'gutenberg_add_original_attachment_to_response', 10, 2 );
