<?php
/**
 * Records and exposes the lineage root for attachments edited via
 * `/wp/v2/media/{id}/edit`.
 *
 * Each call to core's `edit_media_item` creates a new child attachment.
 * On that path, we record the id at the top of the lineage in a
 * dedicated postmeta key (`_wp_attachment_original_id`) so the Media
 * Editor modal can offer a "Restore original" action without walking
 * the chain on every read, and so cleanup on parent delete can use
 * an indexed query.
 *
 * No backfill: this is tied to the (unreleased) media editor cropper,
 * so anything edited before this code lands is intentionally out of
 * scope.
 *
 * @package gutenberg
 */

/**
 * Postmeta key for the lineage root id.
 *
 * Underscore-prefixed so it's treated as private/internal and not
 * exposed by the default postmeta REST surface.
 */
const GUTENBERG_ORIGINAL_ATTACHMENT_ID_META_KEY = '_wp_attachment_original_id';

/**
 * Get the lineage root (original) attachment id for an attachment.
 *
 * Returns the id recorded in `_wp_attachment_original_id` when the
 * attachment was created by editing another one, or the attachment's
 * own id when it has no edit lineage. Callers that want to tell
 * "has an original" apart from "is its own original" should compare
 * the result against the id they passed in.
 *
 * In core this would be `wp_get_original_attachment_id()`.
 *
 * @param int $attachment_id Attachment id to resolve.
 * @return int The original attachment id, or `$attachment_id` when there is no lineage.
 */
function gutenberg_get_original_attachment_id( $attachment_id ) {
	$original_id = (int) get_post_meta(
		$attachment_id,
		GUTENBERG_ORIGINAL_ATTACHMENT_ID_META_KEY,
		true
	);

	return $original_id > 0 ? $original_id : (int) $attachment_id;
}

/**
 * Persist the original attachment id when /edit creates a new edited
 * attachment.
 *
 * Hooks `wp_edited_image_metadata` (fired by core inside
 * `WP_REST_Attachments_Controller::edit_media_item`, after the new
 * attachment id has been inserted but before its image metadata is
 * stored). The new child's original is its parent's original if the
 * parent has one, otherwise the parent itself.
 *
 * @param array $new_image_meta    Metadata for the new edited attachment (unused).
 * @param int   $new_attachment_id The new attachment id.
 * @param int   $attachment_id     The parent (source) attachment id.
 * @return array Filtered metadata (unchanged).
 */
function gutenberg_record_original_attachment_id( $new_image_meta, $new_attachment_id, $attachment_id ) {
	// The new child's original is its parent's original, or the parent
	// itself when the parent has no lineage of its own.
	$original_id = gutenberg_get_original_attachment_id( $attachment_id );

	update_post_meta(
		$new_attachment_id,
		GUTENBERG_ORIGINAL_ATTACHMENT_ID_META_KEY,
		$original_id
	);

	return $new_image_meta;
}
add_filter( 'wp_edited_image_metadata', 'gutenberg_record_original_attachment_id', 10, 3 );

/**
 * Filter `rest_prepare_attachment` to expose the original attachment.
 *
 * Reads `_wp_attachment_original_id` postmeta (written by the
 * `wp_edited_image_metadata` hook above) and adds the resolved
 * attachment id and URL to the response under
 * `media_details.original_attachment`. Absent for attachments with
 * no edit lineage.
 *
 * Only emitted in the `edit` context: the lineage is an editor
 * concern (the Restore-original action), and scoping it here avoids
 * disclosing chain relationships to unauthenticated readers and
 * embed consumers.
 *
 * @param WP_REST_Response $response REST response.
 * @param WP_Post          $post     Attachment post.
 * @param WP_REST_Request  $request  REST request.
 * @return WP_REST_Response
 */
function gutenberg_add_original_attachment_to_response( $response, $post, $request ) {
	if ( 'edit' !== $request['context'] ) {
		return $response;
	}

	$data = $response->get_data();
	if ( empty( $data['media_details'] ) || ! is_array( $data['media_details'] ) ) {
		return $response;
	}

	$original_id = gutenberg_get_original_attachment_id( $post->ID );
	if ( $original_id === (int) $post->ID ) {
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
add_filter( 'rest_prepare_attachment', 'gutenberg_add_original_attachment_to_response', 10, 3 );

/**
 * Clear `_wp_attachment_original_id` from descendants when their
 * original is deleted.
 *
 * Without this, descendants would carry a dangling pointer at a
 * recycled attachment id. The REST filter already skips emitting the
 * field when the URL doesn't resolve, but cleaning up the stored meta
 * keeps the database accurate and prevents the field from
 * resurrecting if the deleted id is later reused.
 *
 * @param int $attachment_id Attachment id being deleted.
 */
function gutenberg_clear_original_attachment_id_on_delete( $attachment_id ) {
	$attachment_id = (int) $attachment_id;
	if ( $attachment_id <= 0 ) {
		return;
	}

	// Indexed lookup on (meta_key, meta_value) — fast at any library
	// size, no serialized-blob LIKE.
	delete_metadata(
		'post',
		0,
		GUTENBERG_ORIGINAL_ATTACHMENT_ID_META_KEY,
		$attachment_id,
		true
	);
}
add_action( 'delete_attachment', 'gutenberg_clear_original_attachment_id_on_delete' );
