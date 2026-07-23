<?php
/**
 * REST API endpoint for tracking which notes/replies a user has viewed.
 *
 * Read-state is stored in comment meta, per-user, under the key
 * `notes_viewed_by_{user_id}` on each viewed note/reply comment (value is the
 * timestamp of first view). Keeping it with the note rather than on the post
 * means:
 *
 * - No write collisions — each collaborator only ever writes their own
 *   per-user key, so simultaneous editors never race on a shared row.
 * - The data travels with the note and is cleaned up automatically when the
 *   comment is deleted, so it generalizes to notes that may one day live on
 *   entities other than posts (templates, patterns, media).
 *
 * The REST route is still scoped by post id purely as a query convenience for
 * the post editor; the underlying storage is per-comment.
 *
 * @package gutenberg
 */

/**
 * Registers the REST route for reading/writing a user's viewed-note ids
 * for a given post.
 */
function gutenberg_register_notes_viewed_routes() {
	register_rest_route(
		'wp/v2',
		'/notes/(?P<post_id>\d+)/viewed',
		array(
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => 'gutenberg_get_viewed_notes',
				'permission_callback' => 'gutenberg_notes_viewed_permission_check',
				'args'                => array(
					'post_id' => array(
						'type'              => 'integer',
						'required'          => true,
						'validate_callback' => function ( $value ) {
							return is_numeric( $value );
						},
					),
				),
			),
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => 'gutenberg_update_viewed_notes',
				'permission_callback' => 'gutenberg_notes_viewed_permission_check',
				'args'                => array(
					'post_id'  => array(
						'type'              => 'integer',
						'required'          => true,
						'validate_callback' => function ( $value ) {
							return is_numeric( $value );
						},
					),
					'note_ids' => array(
						'type'              => 'array',
						'required'          => true,
						'items'             => array(
							'type' => 'string',
						),
						'validate_callback' => function ( $value ) {
							return is_array( $value );
						},
					),
				),
			),
		)
	);
}
add_action( 'rest_api_init', 'gutenberg_register_notes_viewed_routes' );

/**
 * Permission check: the user must be logged in and able to edit the post
 * whose viewed-notes state they're reading or writing.
 *
 * @param WP_REST_Request $request The request object.
 * @return bool
 */
function gutenberg_notes_viewed_permission_check( $request ) {
	$post_id = (int) $request['post_id'];
	$post    = get_post( $post_id );

	if ( ! $post ) {
		return false;
	}

	return is_user_logged_in() && current_user_can( 'edit_post', $post_id );
}

/**
 * Builds the per-user comment meta key for viewed-note tracking.
 *
 * @param int $user_id The user id.
 * @return string
 */
function gutenberg_note_viewed_meta_key( $user_id ) {
	return 'notes_viewed_by_' . (int) $user_id;
}

/**
 * Returns the ids of the notes/replies on a post that the given user has
 * marked as viewed.
 *
 * @param int $post_id The post id.
 * @param int $user_id The user id.
 * @return string[] Viewed note/reply comment ids, as strings.
 */
function gutenberg_get_user_viewed_note_ids( $post_id, $user_id ) {
	$comment_ids = get_comments(
		array(
			'post_id'    => $post_id,
			'type'       => 'note',
			'fields'     => 'ids',
			'meta_query' => array(
				array(
					'key'     => gutenberg_note_viewed_meta_key( $user_id ),
					'compare' => 'EXISTS',
				),
			),
		)
	);

	return array_map( 'strval', $comment_ids );
}

/**
 * GET callback: returns the current user's viewed note ids for a post.
 *
 * @param WP_REST_Request $request The request object.
 * @return WP_REST_Response
 */
function gutenberg_get_viewed_notes( $request ) {
	$post_id = (int) $request['post_id'];
	$user_id = get_current_user_id();

	return rest_ensure_response(
		array(
			'note_ids' => gutenberg_get_user_viewed_note_ids( $post_id, $user_id ),
		)
	);
}

/**
 * POST callback: marks the given note/reply ids as viewed by the current user.
 *
 * Each id is stored as a per-user key on its own comment, so concurrent
 * collaborators never write the same row. The first-view timestamp is
 * preserved — re-marking an already-viewed note is a no-op.
 *
 * @param WP_REST_Request $request The request object.
 * @return WP_REST_Response
 */
function gutenberg_update_viewed_notes( $request ) {
	$post_id  = (int) $request['post_id'];
	$user_id  = get_current_user_id();
	$meta_key = gutenberg_note_viewed_meta_key( $user_id );
	$note_ids = array_map( 'intval', (array) $request['note_ids'] );

	foreach ( $note_ids as $note_id ) {
		$comment = get_comment( $note_id );

		// Only mark comments that actually belong to this post, so edit
		// access to one post can't write read-state onto another's notes.
		if ( ! $comment || (int) $comment->comment_post_ID !== $post_id ) {
			continue;
		}

		// Preserve the first-view timestamp: only write if not already viewed.
		if ( '' === get_comment_meta( $note_id, $meta_key, true ) ) {
			update_comment_meta( $note_id, $meta_key, time() );
		}
	}

	return rest_ensure_response(
		array(
			'note_ids' => gutenberg_get_user_viewed_note_ids( $post_id, $user_id ),
		)
	);
}

/**
 * Removes a deleted user's viewed-note markers from all comments.
 *
 * Comment deletion already cascades its meta, so this only covers the inverse
 * case: a user being deleted while their per-user markers remain scattered
 * across still-existing notes.
 *
 * @param int $user_id The id of the user being deleted.
 */
function gutenberg_cleanup_viewed_notes_for_user( $user_id ) {
	delete_metadata( 'comment', 0, gutenberg_note_viewed_meta_key( $user_id ), '', true );
}
add_action( 'deleted_user', 'gutenberg_cleanup_viewed_notes_for_user' );
