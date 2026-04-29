<?php
/**
 * Adds `media_details.root_image` to attachment REST responses.
 *
 * The Gutenberg `/wp/v2/media/{id}/edit` endpoint records the source
 * attachment id under `_wp_attachment_metadata['parent_image']`. This
 * filter walks that chain to the root once, server-side, so the
 * Media Editor modal can offer a "Restore original" action without
 * the client doing N round-trips.
 *
 * @package gutenberg
 */

/**
 * Walk the parent_image chain for an attachment, returning the root id.
 *
 * Stops on cycles, self-references, or after a max-hops cap to defend
 * against malformed metadata. Returns the input id when there is no
 * chain.
 *
 * @param int $attachment_id Starting attachment id.
 * @return int Root attachment id (== $attachment_id when no chain).
 */
function gutenberg_resolve_root_image_id( $attachment_id ) {
	$max_hops = 32;
	$root     = (int) $attachment_id;
	$seen     = array( $root => true );
	$meta     = wp_get_attachment_metadata( $root );

	for ( $hop = 0; $hop < $max_hops; $hop++ ) {
		if ( empty( $meta['parent_image']['attachment_id'] ) ) {
			break;
		}
		$next = (int) $meta['parent_image']['attachment_id'];
		if ( $next <= 0 || isset( $seen[ $next ] ) ) {
			break;
		}
		$seen[ $next ] = true;
		$root          = $next;
		$meta          = wp_get_attachment_metadata( $root );
	}

	return $root;
}

/**
 * Filter `rest_prepare_attachment` to add `media_details.root_image`.
 *
 * @param WP_REST_Response $response REST response.
 * @param WP_Post          $post     Attachment post.
 * @return WP_REST_Response
 */
function gutenberg_add_root_image_to_attachment_response( $response, $post ) {
	$data = $response->get_data();
	if ( empty( $data['media_details'] ) || ! is_array( $data['media_details'] ) ) {
		return $response;
	}

	$root_id = gutenberg_resolve_root_image_id( $post->ID );
	if ( $root_id === (int) $post->ID ) {
		return $response;
	}

	$data['media_details']['root_image'] = array(
		'attachment_id' => $root_id,
		'source_url'    => wp_get_attachment_url( $root_id ),
	);
	$response->set_data( $data );

	return $response;
}
add_filter( 'rest_prepare_attachment', 'gutenberg_add_root_image_to_attachment_response', 10, 2 );
