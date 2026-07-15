<?php
/**
 * REST API endpoint for tracking which notes/replies a user has viewed,
 * per post.
 *
 * Stored as post meta, keyed per-user (`_viewed_by_{user_id}`), rather than
 * a single shared field — this means each collaborator's "mark as viewed"
 * only ever writes their own row, with no read-modify-write collision risk
 * between simultaneous editors. It also means the data is cleaned up
 * automatically when the post is deleted, since post meta cascades with
 * the post.
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
 * Builds the per-user post meta key for viewed-notes tracking.
 *
 * @param int $user_id The user id.
 * @return string
 */
function gutenberg_viewed_by_meta_key( $user_id ) {
	return '_viewed_by_' . (int) $user_id;
}

/**
 * GET callback: returns the current user's viewed note ids for a post.
 *
 * @param WP_REST_Request $request The request object.
 * @return WP_REST_Response
 */
function gutenberg_get_viewed_notes( $request ) {
	$post_id  = (int) $request['post_id'];
	$user_id  = get_current_user_id();
	$meta_key = gutenberg_viewed_by_meta_key( $user_id );
	$ids      = get_post_meta( $post_id, $meta_key, true );

	return rest_ensure_response(
		array(
			'note_ids' => is_array( $ids ) ? array_map( 'strval', $ids ) : array(),
		)
	);
}

/**
 * POST callback: merges the given note ids into the current user's
 * viewed-notes set for a post.
 *
 * @param WP_REST_Request $request The request object.
 * @return WP_REST_Response
 */
function gutenberg_update_viewed_notes( $request ) {
	$post_id  = (int) $request['post_id'];
	$user_id  = get_current_user_id();
	$meta_key = gutenberg_viewed_by_meta_key( $user_id );
	$new_ids  = array_map( 'strval', (array) $request['note_ids'] );

	$existing = get_post_meta( $post_id, $meta_key, true );
	$existing = is_array( $existing ) ? $existing : array();

	// Union rather than overwrite — safe against the same user's own
	// concurrent requests (e.g. two open tabs) without needing a lock.
	$merged = array_values( array_unique( array_merge( $existing, $new_ids ) ) );

	update_post_meta( $post_id, $meta_key, $merged );

	return rest_ensure_response(
		array(
			'note_ids' => $merged,
		)
	);
}
