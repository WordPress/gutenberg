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
 * Whether Suggestion mode is available for a post.
 *
 * True when the experiment is on and the post's type supports notes, which
 * is when the editor offers Suggesting and shows suggestion notes for it.
 *
 * @param int|WP_Post $post Post ID or object.
 * @return bool Whether suggestions can be made on the post.
 */
function gutenberg_suggestions_enabled( $post ): bool {
	if ( ! gutenberg_is_experiment_enabled( 'gutenberg-suggestion-mode' ) ) {
		return false;
	}
	$post = get_post( $post );
	return $post instanceof WP_Post && Gutenberg_Suggestion_Reconciler::post_type_supports_notes( $post->post_type );
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
		gutenberg_update_suggestion_server_meta( (int) $comment_id, '_wp_suggestion_decided_by', get_current_user_id() );
	} elseif ( 'pending' === $meta_value ) {
		gutenberg_delete_suggestion_server_meta( (int) $comment_id, '_wp_suggestion_decided_by' );
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
	$allowed = (bool) apply_filters( 'gutenberg_allow_client_final_suggestion_status', false, $request );
	gutenberg_client_final_suggestion_status_allowed( $allowed );
	if ( $allowed ) {
		return $prepared_comment;
	}
	return new WP_Error(
		'rest_suggestion_status_server_only',
		__( 'A suggestion decision becomes final when the post is saved.', 'gutenberg' ),
		array( 'status' => 403 )
	);
}
add_filter( 'rest_preprocess_comment', 'gutenberg_refuse_client_final_suggestion_status', 10, 2 );

/**
 * Whether the `gutenberg_allow_client_final_suggestion_status` filter let a
 * REST client write a final status in this request.
 *
 * @param bool|null $allowed True to record that it did, null to only ask.
 * @return bool Whether a client may write a final status.
 */
function gutenberg_client_final_suggestion_status_allowed( ?bool $allowed = null ): bool {
	static $is_allowed = false;
	if ( null !== $allowed ) {
		$is_allowed = $allowed;
	}
	return true === $is_allowed;
}

/**
 * Refuses a suggestion status the writer may not set.
 *
 * Holds callers outside REST, such as the wp-admin comment edit screen, to
 * the rule REST clients follow: anyone who can edit the note may write
 * `pending` or a provisional status, and only the save pass writes a final
 * one.
 *
 * @param bool|null $check      Whether to short-circuit the write. Null lets it proceed.
 * @param int       $note_id    Comment ID. Unused.
 * @param string    $meta_key   Meta key.
 * @param mixed     $meta_value Meta value.
 * @return bool|null False to refuse the write, the incoming value otherwise.
 */
function gutenberg_guard_suggestion_status_meta( $check, $note_id, $meta_key, $meta_value ) {
	if ( null !== $check || '_wp_suggestion_status' !== $meta_key || gutenberg_suggestion_server_write() ) {
		return $check;
	}
	if ( 'pending' === $meta_value || in_array( $meta_value, gutenberg_get_provisional_suggestion_statuses(), true ) ) {
		return $check;
	}
	if ( in_array( $meta_value, gutenberg_get_final_suggestion_statuses(), true ) && gutenberg_client_final_suggestion_status_allowed() ) {
		return $check;
	}
	return false;
}
add_filter( 'add_comment_metadata', 'gutenberg_guard_suggestion_status_meta', 10, 4 );
add_filter( 'update_comment_metadata', 'gutenberg_guard_suggestion_status_meta', 10, 4 );

/**
 * Refuses a REST write that resolves an undecided suggestion note.
 *
 * Resolving hides the note but leaves its anchor in the content, where it
 * can still be accepted. The editor offers Accept and Reject instead of
 * Resolve on a suggestion; this holds REST clients to the same rule until
 * the save pass has made the decision final.
 *
 * @param array<string, mixed>|WP_Error $prepared_comment Comment data about to be written.
 * @param WP_REST_Request                $request          Request.
 * @return array<string, mixed>|WP_Error The comment data, or an error for an undecided suggestion.
 */
function gutenberg_refuse_resolving_undecided_suggestion( $prepared_comment, $request ) {
	if ( is_wp_error( $prepared_comment ) || ! in_array( $request['status'], array( 'approved', 'approve', '1' ), true ) ) {
		return $prepared_comment;
	}
	$meta    = is_array( $request['meta'] ) ? $request['meta'] : array();
	$comment = isset( $request['id'] ) ? get_comment( absint( $request['id'] ) ) : null;
	$type    = $comment ? $comment->comment_type : $request['type'];
	$parent  = $comment ? (int) $comment->comment_parent : absint( $request['parent'] );
	if ( 'note' !== $type || 0 !== $parent ) {
		return $prepared_comment;
	}

	$payload = isset( $meta['_wp_suggestion'] ) ? $meta['_wp_suggestion'] : ( $comment ? get_comment_meta( (int) $comment->comment_ID, '_wp_suggestion', true ) : '' );
	if ( empty( $payload ) ) {
		return $prepared_comment;
	}
	$status = isset( $meta['_wp_suggestion_status'] ) ? $meta['_wp_suggestion_status'] : ( $comment ? get_comment_meta( (int) $comment->comment_ID, '_wp_suggestion_status', true ) : '' );
	if ( in_array( $status, gutenberg_get_final_suggestion_statuses(), true ) ) {
		return $prepared_comment;
	}
	return new WP_Error(
		'rest_suggestion_pending',
		__( 'Accept or reject the suggestion before resolving it.', 'gutenberg' ),
		array( 'status' => 409 )
	);
}
add_filter( 'rest_preprocess_comment', 'gutenberg_refuse_resolving_undecided_suggestion', 10, 2 );
