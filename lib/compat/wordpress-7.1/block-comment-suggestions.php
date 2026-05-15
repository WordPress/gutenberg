<?php
/**
 * Suggestion support for block notes.
 *
 * Notes ship in WordPress core as `note`-type comments. Suggest mode layers a
 * proposed edit on top of a note by attaching it as comment meta, so the
 * suggestion is reviewable in context and can be applied or rejected without
 * rewriting the note's discussion content. Two meta fields drive it:
 *
 *   - `_wp_suggestion`        — proposed edit, JSON payload. Presence of this
 *                               meta is what makes a note a suggestion.
 *   - `_wp_suggestion_status` — suggestion lifecycle (`pending` / `applied`
 *                               / `rejected`). Set on apply or reject so the
 *                               comment thread persists as evidence even
 *                               after the suggestion is resolved.
 *
 * The suggestion is stored as comment meta rather than `comment_content`
 * because the payload is JSON (surfacing it to comment-feed renderers would
 * break them) and because a note can carry both a discussion and a proposed
 * edit so users can reply to a suggestion.
 *
 * @package gutenberg
 */

/**
 * Maximum byte length of a `_wp_suggestion` payload. Mirrored on the client
 * (`PAYLOAD_MAX_BYTES` in suggestion-mode/provider.js) so the editor refuses
 * to submit anything the server will reject.
 */
if ( ! defined( 'GUTENBERG_SUGGESTION_PAYLOAD_MAX_BYTES' ) ) {
	define( 'GUTENBERG_SUGGESTION_PAYLOAD_MAX_BYTES', 65536 );
}

/**
 * Registers the comment meta fields used by suggest mode.
 *
 * Notes themselves (and their `_wp_note_status` meta) are registered by
 * WordPress core; this only adds the suggestion-specific fields.
 */
function gutenberg_register_block_comment_suggestion_metadata() {
	// Suggestion payload attached to a note. A note comment with this meta set
	// is a suggested edit: the value is a JSON-encoded payload describing the
	// block, baseline revision, and proposed operations. See
	// packages/editor/src/components/suggestion-mode/provider.js for the shape.
	$max_suggestion_payload_bytes = GUTENBERG_SUGGESTION_PAYLOAD_MAX_BYTES;

	register_meta(
		'comment',
		'_wp_suggestion',
		array(
			'type'              => 'string',
			'description'       => __( 'Suggested edit payload (JSON).', 'gutenberg' ),
			'single'            => true,
			'show_in_rest'      => array(
				'schema' => array(
					'type'      => 'string',
					'maxLength' => $max_suggestion_payload_bytes,
				),
			),
			'sanitize_callback' => function ( $value ) use ( $max_suggestion_payload_bytes ) {
				if ( ! is_string( $value ) ) {
					return '';
				}
				// Reject rather than truncate. Truncating mid-string produces
				// invalid JSON; `parseSuggestionPayload` would then return
				// null and the suggestion would silently disappear.
				if ( strlen( $value ) > $max_suggestion_payload_bytes ) {
					return '';
				}
				return $value;
			},
			'auth_callback'     => function ( $allowed, $meta_key, $object_id ) {
				// During comment creation the comment does not yet exist, so
				// `object_id` is 0. Defer to the comment controller's own
				// create permission — if the request can create the
				// comment at all, it can set the suggestion meta on it.
				if ( ! $object_id ) {
					return current_user_can( 'edit_posts' );
				}
				$comment = get_comment( $object_id );
				if ( $comment && 'note' === $comment->comment_type ) {
					return current_user_can( 'edit_post', $comment->comment_post_ID );
				}
				return current_user_can( 'edit_comment', $object_id );
			},
		)
	);

	register_meta(
		'comment',
		'_wp_suggestion_status',
		array(
			'type'          => 'string',
			'description'   => __( 'Suggestion lifecycle status.', 'gutenberg' ),
			'single'        => true,
			'show_in_rest'  => array(
				'schema' => array(
					'type' => 'string',
					'enum' => array( 'pending', 'applied', 'rejected' ),
				),
			),
			'auth_callback' => function ( $allowed, $meta_key, $object_id ) {
				$comment = get_comment( $object_id );
				if ( $comment && 'note' === $comment->comment_type ) {
					return current_user_can( 'edit_post', $comment->comment_post_ID );
				}
				return current_user_can( 'edit_comment', $object_id );
			},
		)
	);
}
add_action( 'init', 'gutenberg_register_block_comment_suggestion_metadata' );

/**
 * Re-registers the comments REST route with the suggestion-aware controller.
 *
 * Runs after core registers `/wp/v2/comments` (priority 10) so the subclass
 * takes over the route. The subclass only adds suggestion behavior; all note
 * and comment handling is inherited from core's controller.
 */
function gutenberg_register_comment_suggestions_rest_route() {
	$controller = new Gutenberg_REST_Comment_Suggestions_Controller();
	$controller->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_comment_suggestions_rest_route', 11 );
