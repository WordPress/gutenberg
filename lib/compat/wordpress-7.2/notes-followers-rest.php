<?php
/**
 * REST API endpoint for managing the current user's note thread subscription.
 *
 * The follower list registered in notes-followers.php is stored as one meta
 * row per user so concurrent writers cannot clobber each other; writing the
 * whole list through the registered meta would reintroduce that race. This
 * endpoint is the targeted alternative for interfaces: it adds or removes
 * only the current user, via gutenberg_add_note_followers() /
 * gutenberg_remove_note_followers().
 *
 * @package gutenberg
 * @since   7.1.0
 */

if ( ! function_exists( 'gutenberg_register_note_followers_routes' ) ) {
	/**
	 * Registers the follow/unfollow route for note threads.
	 *
	 * POST   /wp/v2/comments/<id>/followers/me — subscribe the current user.
	 * DELETE /wp/v2/comments/<id>/followers/me — unsubscribe the current user.
	 *
	 * The <id> may be any note in the thread; the subscription always applies
	 * to the thread's top-level note, mirroring where the follower meta lives.
	 */
	function gutenberg_register_note_followers_routes(): void {
		register_rest_route(
			'wp/v2',
			'/comments/(?P<id>[\d]+)/followers/me',
			array(
				'args'   => array(
					'id' => array(
						'description' => __( 'Unique identifier for the note.', 'gutenberg' ),
						'type'        => 'integer',
					),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => 'gutenberg_rest_follow_note_thread',
					'permission_callback' => 'gutenberg_rest_note_followers_permissions_check',
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => 'gutenberg_rest_unfollow_note_thread',
					'permission_callback' => 'gutenberg_rest_note_followers_permissions_check',
				),
				'schema' => 'gutenberg_get_note_followers_route_schema',
			)
		);
	}
	add_action( 'rest_api_init', 'gutenberg_register_note_followers_routes' );
}

if ( ! function_exists( 'gutenberg_get_note_followers_route_schema' ) ) {
	/**
	 * Returns the schema for the follow/unfollow response.
	 *
	 * @return array The response schema.
	 */
	function gutenberg_get_note_followers_route_schema(): array {
		return array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'note-thread-follower',
			'type'       => 'object',
			'properties' => array(
				'root'      => array(
					'description' => __( 'The thread’s top-level note ID the subscription applies to.', 'gutenberg' ),
					'type'        => 'integer',
					'readonly'    => true,
				),
				'following' => array(
					'description' => __( 'Whether the current user follows the thread.', 'gutenberg' ),
					'type'        => 'boolean',
					'readonly'    => true,
				),
				'followers' => array(
					'description' => __( 'User IDs following the note thread.', 'gutenberg' ),
					'type'        => 'array',
					'items'       => array( 'type' => 'integer' ),
					'readonly'    => true,
				),
			),
		);
	}
}

if ( ! function_exists( 'gutenberg_rest_get_note_for_follow_request' ) ) {
	/**
	 * Resolves the note a follow/unfollow request targets.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return WP_Comment|WP_Error The note, or an error when the ID does not
	 *                             belong to a note.
	 */
	function gutenberg_rest_get_note_for_follow_request( WP_REST_Request $request ) {
		$comment = get_comment( (int) $request['id'] );

		if ( ! $comment instanceof WP_Comment || 'note' !== $comment->comment_type ) {
			return new WP_Error(
				'rest_comment_invalid_id',
				__( 'Invalid note ID.', 'gutenberg' ),
				array( 'status' => 404 )
			);
		}

		return $comment;
	}
}

if ( ! function_exists( 'gutenberg_rest_note_followers_permissions_check' ) ) {
	/**
	 * Checks whether the current user may manage their subscription to a thread.
	 *
	 * The bar is the same visibility bar the notification paths use: only
	 * users who can read the note (its author, or users who can edit it) may
	 * follow it, so a subscription can never be used to receive content the
	 * user cannot see in the editor. Unfollowing is held to the same bar for
	 * symmetry; the tokenized email unfollow link remains the capability-free
	 * escape hatch.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return true|WP_Error Whether the request may proceed.
	 */
	function gutenberg_rest_note_followers_permissions_check( WP_REST_Request $request ) {
		if ( ! is_user_logged_in() ) {
			return new WP_Error(
				'rest_not_logged_in',
				__( 'You must be logged in to manage note subscriptions.', 'gutenberg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		$comment = gutenberg_rest_get_note_for_follow_request( $request );
		if ( is_wp_error( $comment ) ) {
			return $comment;
		}

		$user_id = get_current_user_id();
		if (
			$user_id !== (int) $comment->user_id &&
			! current_user_can( 'edit_comment', $comment->comment_ID )
		) {
			return new WP_Error(
				'rest_cannot_manage_note_followers',
				__( 'Sorry, you are not allowed to manage subscriptions for this note.', 'gutenberg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}
}

if ( ! function_exists( 'gutenberg_rest_note_followers_response' ) ) {
	/**
	 * Builds the follow/unfollow response payload.
	 *
	 * @param int $root_id Top-level note ID.
	 * @return array{root: int, following: bool, followers: list<int>}
	 */
	function gutenberg_rest_note_followers_response( int $root_id ): array {
		$followers = gutenberg_get_note_followers( $root_id );

		return array(
			'root'      => $root_id,
			'following' => in_array( get_current_user_id(), $followers, true ),
			'followers' => $followers,
		);
	}
}

if ( ! function_exists( 'gutenberg_rest_follow_note_thread' ) ) {
	/**
	 * Subscribes the current user to a note thread.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error The updated subscription state.
	 */
	function gutenberg_rest_follow_note_thread( WP_REST_Request $request ) {
		$comment = gutenberg_rest_get_note_for_follow_request( $request );
		if ( is_wp_error( $comment ) ) {
			return $comment;
		}

		$root_id = gutenberg_get_note_thread_root_id( $comment );
		gutenberg_add_note_followers( $root_id, array( get_current_user_id() ) );

		return rest_ensure_response( gutenberg_rest_note_followers_response( $root_id ) );
	}
}

if ( ! function_exists( 'gutenberg_rest_unfollow_note_thread' ) ) {
	/**
	 * Unsubscribes the current user from a note thread.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error The updated subscription state.
	 */
	function gutenberg_rest_unfollow_note_thread( WP_REST_Request $request ) {
		$comment = gutenberg_rest_get_note_for_follow_request( $request );
		if ( is_wp_error( $comment ) ) {
			return $comment;
		}

		$root_id = gutenberg_get_note_thread_root_id( $comment );
		gutenberg_remove_note_followers( $root_id, array( get_current_user_id() ) );

		return rest_ensure_response( gutenberg_rest_note_followers_response( $root_id ) );
	}
}
