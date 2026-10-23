<?php
/**
 * Suggestion mode: decision statuses.
 *
 * A reviewer's Accept or Reject is provisional until the post is saved. The
 * editor writes `applied-unsaved` / `rejected-unsaved` to `_wp_suggestion_status`
 * and keeps the note `hold`, and the save pass
 * (`suggestion-reconciliation.php`) finalizes it once a saved post no longer
 * carries the suggestion's anchor. The final values (`applied`, `rejected`,
 * `outdated`) are therefore the server's to write; a REST write of one is
 * refused.
 *
 * @package gutenberg
 */

/**
 * Statuses a client writes while a decision is not saved with the post yet.
 *
 * @return string[] Provisional statuses.
 */
function gutenberg_get_provisional_suggestion_statuses() {
	return array( 'applied-unsaved', 'rejected-unsaved' );
}

/**
 * Statuses only the save pass writes.
 *
 * @return string[] Final statuses.
 */
function gutenberg_get_final_suggestion_statuses() {
	return array( 'applied', 'rejected', 'outdated' );
}

/**
 * Records who made a provisional decision, and forgets it on reopen.
 *
 * Stamped here rather than sent by the client, so the name the sidebar shows
 * next to "accepted, but the post was not saved" cannot be forged.
 *
 * @param int    $meta_id    Meta row ID. Unused.
 * @param int    $comment_id Comment ID.
 * @param string $meta_key   Meta key.
 * @param mixed  $meta_value Meta value.
 */
function gutenberg_stamp_suggestion_decided_by( $meta_id, $comment_id, $meta_key, $meta_value ) {
	if ( '_wp_suggestion_status' !== $meta_key ) {
		return;
	}
	if ( in_array( $meta_value, gutenberg_get_provisional_suggestion_statuses(), true ) ) {
		update_comment_meta( $comment_id, '_wp_suggestion_decided_by', get_current_user_id() );
	} elseif ( 'pending' === $meta_value ) {
		delete_comment_meta( $comment_id, '_wp_suggestion_decided_by' );
	}
}
add_action( 'added_comment_meta', 'gutenberg_stamp_suggestion_decided_by', 10, 4 );
add_action( 'updated_comment_meta', 'gutenberg_stamp_suggestion_decided_by', 10, 4 );

/**
 * Refuses a REST write of a final suggestion status.
 *
 * Only a post save can show that a decision reached the content, so only the
 * save pass may write `applied`, `rejected` or `outdated`. A client that does
 * (an editor session loaded before this change, for one) gets a 403 and its
 * note stays as it was.
 *
 * @param array|WP_Error  $prepared_comment Comment data about to be written.
 * @param WP_REST_Request $request          Request.
 * @return array|WP_Error The comment data, or an error for a final status.
 */
function gutenberg_refuse_client_final_suggestion_status( $prepared_comment, $request ) {
	if ( is_wp_error( $prepared_comment ) ) {
		return $prepared_comment;
	}
	$meta = $request['meta'];
	if ( ! is_array( $meta ) || ! isset( $meta['_wp_suggestion_status'] ) ) {
		return $prepared_comment;
	}
	if ( ! in_array( $meta['_wp_suggestion_status'], gutenberg_get_final_suggestion_statuses(), true ) ) {
		return $prepared_comment;
	}
	/**
	 * Filters whether a REST client may write a final suggestion status.
	 *
	 * @since 7.2.0
	 *
	 * @param bool            $allowed Whether to allow the write. Default false.
	 * @param WP_REST_Request $request Request.
	 */
	if ( apply_filters( 'gutenberg_allow_client_final_suggestion_status', false, $request ) ) {
		return $prepared_comment;
	}
	return new WP_Error(
		'rest_suggestion_status_server_only',
		__( 'A suggestion decision becomes final when the post is saved.', 'gutenberg' ),
		array( 'status' => 403 )
	);
}
add_filter( 'rest_preprocess_comment', 'gutenberg_refuse_client_final_suggestion_status', 10, 2 );
