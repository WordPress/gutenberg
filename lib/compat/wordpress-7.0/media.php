<?php
/**
 * Client-side media processing functions.
 *
 * @package gutenberg
 */

/**
 * Checks whether client-side media processing is enabled.
 *
 * Client-side media processing uses the browser's capabilities to handle
 * tasks like image resizing and compression before uploading to the server.
 *
 * @since 20.8.0
 *
 * @return bool Whether client-side media processing is enabled.
 */
function gutenberg_is_client_side_media_processing_enabled() {
	/**
	 * Filters whether client-side media processing is enabled.
	 *
	 * @since 20.8.0
	 *
	 * @param bool $enabled Whether client-side media processing is enabled. Default true.
	 */
	return apply_filters( 'wp_client_side_media_processing_enabled', true );
}

if ( ! function_exists( 'wp_get_original_attachment_id' ) ) {
	/**
	 * Retrieves the root/original attachment ID for an attachment derivative tree.
	 *
	 * Derivative attachments created by the REST media editing flow store the
	 * root attachment ID in the `_source_attachment_id` meta field. Attachments
	 * without lineage metadata are treated as their own root.
	 *
	 * @since 7.0.0
	 *
	 * @param int $attachment_id Attachment ID.
	 * @return int|false Root attachment ID on success, false if the post does not exist
	 *                   or is not an attachment.
	 */
	function wp_get_original_attachment_id( $attachment_id ) {
		$attachment = get_post( $attachment_id );

		if ( ! $attachment || 'attachment' !== $attachment->post_type ) {
			return false;
		}

		$source_attachment_id = absint( get_post_meta( $attachment->ID, '_source_attachment_id', true ) );

		if ( ! $source_attachment_id ) {
			return (int) $attachment->ID;
		}

		return $source_attachment_id;
	}
}
