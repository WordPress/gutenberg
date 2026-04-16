<?php
/**
 * REST controller that layers suggestion behavior onto core's comments
 * controller.
 *
 * WordPress core handles notes (`note`-type comments) natively, including
 * their permissions and the "empty note with a resolution status" case. Suggest
 * mode only needs to extend two creation behaviors, so this subclass overrides
 * the minimum and defers everything else to core:
 *
 *   - A suggestion-only note legitimately has empty `comment_content` (the
 *     proposed edit lives in the `_wp_suggestion` meta, not the body). Core
 *     only permits empty note content when a resolution status is present, so
 *     this scopes an `allow_empty_comment` override to creates that carry a
 *     suggestion payload.
 *
 * The suggestion meta itself is persisted by core via the registered
 * `_wp_suggestion` meta field; it does not need to be copied in here.
 *
 * @package gutenberg
 * @since   7.1.0
 */
class Gutenberg_REST_Comment_Suggestions_Controller extends WP_REST_Comments_Controller {

	/**
	 * Creates a comment.
	 *
	 * Permits empty `comment_content` when the note carries a suggestion
	 * payload, then defers to core for the actual creation.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, error otherwise.
	 */
	public function create_item( $request ) {
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
