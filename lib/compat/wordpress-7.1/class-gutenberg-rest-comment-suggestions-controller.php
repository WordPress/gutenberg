<?php
/**
 * REST controller that layers suggestion behavior onto core's comments
 * controller.
 *
 * WordPress core handles notes (`note`-type comments) natively, including
 * their permissions and the "empty note with a resolution status" case. Suggest
 * mode only needs to extend a few behaviors, so this subclass overrides the
 * minimum and defers everything else to core:
 *
 *   - A suggestion-only note legitimately has empty `comment_content` (the
 *     proposed edit lives in the `_wp_suggestion` meta, not the body). Core
 *     only permits empty note content when a resolution status is present, so
 *     `create_item` scopes an `allow_empty_comment` override to creates that
 *     carry a suggestion payload.
 *   - A post editor needs to apply or reject a suggestion authored by someone
 *     else without holding `moderate_comments`. `update_item_permissions_check`
 *     grants `edit_post`-capable users access to note updates, but only for a
 *     scope-tightened allowlist (`status` and `_wp_suggestion_status` meta) so
 *     the path can never rewrite another user's note content or authorship.
 *   - The `_wp_suggestion` payload is capped at
 *     `GUTENBERG_SUGGESTION_PAYLOAD_MAX_BYTES`. Oversized values are rejected
 *     with a 413 before the meta sanitize_callback can silently drop them.
 *
 * The suggestion meta itself is persisted by core via the registered
 * `_wp_suggestion` meta field; it does not need to be copied in here.
 *
 * @package gutenberg
 * @since   7.1.0
 */
class Gutenberg_REST_Comment_Suggestions_Controller extends WP_REST_Comments_Controller {

	/**
	 * Checks if a given request has access to update a comment.
	 *
	 * Extends core's check so that users who can `edit_post` on the parent
	 * post are also allowed to update note-type comments — but only for
	 * suggestion-lifecycle fields (status and `_wp_suggestion_status` meta).
	 * This unblocks the suggestion workflow where a post editor applies or
	 * rejects a suggestion authored by someone else, without granting them
	 * the ability to rewrite the note's content, reassign authorship, or
	 * otherwise modify another user's comment.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has access, WP_Error otherwise.
	 */
	public function update_item_permissions_check( $request ) {
		$comment = $this->get_comment( $request['id'] );
		if ( is_wp_error( $comment ) ) {
			return $comment;
		}

		// For note comments, allow users who can edit the parent post to
		// update suggestion-lifecycle fields only.
		if (
			'note' === $comment->comment_type &&
			self::is_suggestion_lifecycle_update( $request )
		) {
			$post = get_post( $comment->comment_post_ID );
			if ( $post && current_user_can( 'edit_post', $post->ID ) ) {
				return true;
			}
		}

		// Fall back to core's default check (moderate_comments or edit_comment).
		return parent::update_item_permissions_check( $request );
	}

	/**
	 * Determines whether a note-update request touches only the fields used
	 * by the suggestion apply/reject lifecycle.
	 *
	 * Allowed fields:
	 *  - `status` (limited to `approved` or `hold`)
	 *  - `meta._wp_suggestion_status`
	 *
	 * Any other field present in the request body disqualifies the request
	 * from the `edit_post` shortcut, forcing it through core's edit_comment
	 * check instead.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return bool Whether the request is a scoped suggestion-lifecycle update.
	 */
	private static function is_suggestion_lifecycle_update( $request ) {
		// Accept either a JSON body (the block editor client) or a form-
		// encoded body (custom integrations / curl scripts). Either way the
		// shortcut is gated by the same allowlist below — query/URL params
		// are intentionally excluded so the body is the source of truth for
		// what's being written.
		$params = $request->get_json_params();
		if ( ! is_array( $params ) ) {
			$params = $request->get_body_params();
		}
		if ( ! is_array( $params ) || empty( $params ) ) {
			return false;
		}

		$allowed_keys = array( 'id', 'status', 'meta' );
		foreach ( array_keys( $params ) as $key ) {
			if ( ! in_array( $key, $allowed_keys, true ) ) {
				return false;
			}
		}

		if (
			isset( $params['status'] ) &&
			! in_array( $params['status'], array( 'approved', 'hold' ), true )
		) {
			return false;
		}

		if ( isset( $params['meta'] ) ) {
			if ( ! is_array( $params['meta'] ) ) {
				return false;
			}
			$allowed_meta = array( '_wp_suggestion_status' );
			foreach ( array_keys( $params['meta'] ) as $meta_key ) {
				if ( ! in_array( $meta_key, $allowed_meta, true ) ) {
					return false;
				}
			}
		}

		return true;
	}

	/**
	 * Validates that an incoming request's `_wp_suggestion` meta is within the
	 * allowed byte budget. Truncating arbitrary JSON corrupts the payload, so
	 * we reject before any storage happens.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if no payload or within bounds, WP_Error otherwise.
	 */
	protected static function validate_suggestion_payload_size( $request ) {
		$meta = $request['meta'] ?? null;
		if ( ! is_array( $meta ) || ! isset( $meta['_wp_suggestion'] ) ) {
			return true;
		}
		$value = $meta['_wp_suggestion'];
		if ( ! is_string( $value ) ) {
			return true;
		}
		if ( strlen( $value ) > GUTENBERG_SUGGESTION_PAYLOAD_MAX_BYTES ) {
			return new WP_Error(
				'rest_suggestion_too_large',
				sprintf(
					/* translators: %d: maximum allowed byte length. */
					__( 'Suggestion payload exceeds the %d-byte limit.', 'gutenberg' ),
					GUTENBERG_SUGGESTION_PAYLOAD_MAX_BYTES
				),
				array( 'status' => 413 )
			);
		}
		return true;
	}

	/**
	 * Updates a comment.
	 *
	 * Wraps core's update path with a pre-flight size check on the suggestion
	 * payload so oversized values are rejected with a clean 413 instead of
	 * silently dropped by the meta sanitize_callback.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, error otherwise.
	 */
	public function update_item( $request ) {
		$size_check = self::validate_suggestion_payload_size( $request );
		if ( is_wp_error( $size_check ) ) {
			return $size_check;
		}
		return parent::update_item( $request );
	}

	/**
	 * Creates a comment.
	 *
	 * Rejects oversized suggestion payloads with a 413, and permits empty
	 * `comment_content` when the note carries a suggestion payload, then
	 * defers to core for the actual creation.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, error otherwise.
	 */
	public function create_item( $request ) {
		// Reject oversized suggestion payloads with a 413 so the client knows.
		// Without this, the meta sanitize_callback would silently reject the
		// value and the suggestion would disappear server-side.
		$size_check = self::validate_suggestion_payload_size( $request );
		if ( is_wp_error( $size_check ) ) {
			return $size_check;
		}

		$has_suggestion = ! empty( $request['type'] )
			&& 'note' === $request['type']
			&& ! empty( $request['meta']['_wp_suggestion'] );

		if ( ! $has_suggestion ) {
			return parent::create_item( $request );
		}

		// Allow empty content for the note being created here. The closure is
		// scoped to note comments and removed immediately after the create, so
		// it never affects regular comment submission.
		$allow_empty = static function ( $allowed, $commentdata ) {
			if ( isset( $commentdata['comment_type'] ) && 'note' === $commentdata['comment_type'] ) {
				return true;
			}
			return $allowed;
		};

		add_filter( 'allow_empty_comment', $allow_empty, 10, 2 );
		$response = parent::create_item( $request );
		remove_filter( 'allow_empty_comment', $allow_empty, 10 );

		return $response;
	}
}
