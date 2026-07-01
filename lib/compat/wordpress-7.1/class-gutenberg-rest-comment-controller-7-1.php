<?php
/**
 * REST controller overrides for suggestion edits on `note`-type comments.
 *
 * Block notes (and the base note REST controller) graduated to WordPress 6.9
 * core. Suggestions - a note that carries a `_wp_suggestion` payload describing
 * a proposed edit - are a Gutenberg 7.1 feature layered on top, so only the
 * suggestion-specific behavior lives here as a thin subclass of the core
 * comments controller.
 *
 * Default WordPress comment auth assumes the actor is a comment moderator - for
 * example, `update_item` requires `edit_comment` on the target. That model is
 * too restrictive for suggestions: a post editor needs to apply or reject a
 * suggestion left on a post they own, regardless of whether they have
 * `moderate_comments`. This subclass remaps the relevant checks for
 * suggestions:
 *
 *   - `update_item_permissions_check`: post editors can apply or reject
 *     suggestions on notes they did not author via
 *     `is_suggestion_lifecycle_update()` - an allowlist limited to `status`
 *     and `meta._wp_suggestion_status`. The shortcut only WIDENS access for
 *     lifecycle-field-only updates; any other field falls back to core's
 *     `edit_comment` check. Note that core maps `edit_comment` to
 *     `edit_post` on the comment's parent post, so post editors already
 *     hold full note-edit permission through that fallback - the allowlist
 *     limits what this subclass's shortcut grants, it is not a guarantee
 *     that notes can't be rewritten by post editors.
 *   - `prepare_item_for_database`: enforces server-side payload validation
 *     (a `_wp_suggestion` larger than `GUTENBERG_SUGGESTION_PAYLOAD_MAX_BYTES`
 *     is rejected with HTTP 413, and a payload that isn't a valid JSON object
 *     is rejected with HTTP 400, before any storage happens) and surfaces the
 *     suggestion payload to the content-allowed check below.
 *   - `check_is_comment_content_allowed`: a note may have empty
 *     `comment_content` when it carries only a proposed edit.
 *
 * @package gutenberg
 * @since   7.1.0
 */

if ( class_exists( 'WP_REST_Comments_Controller' ) && ! class_exists( 'Gutenberg_REST_Comment_Controller_7_1' ) ) {
	/**
	 * Core class to manage suggestion edits on note comments via the REST API.
	 */
	class Gutenberg_REST_Comment_Controller_7_1 extends WP_REST_Comments_Controller {

		/**
		 * Validates an incoming request's `_wp_suggestion` meta before any
		 * storage happens:
		 *
		 *  - The payload must be within the allowed byte budget. Truncating
		 *    arbitrary JSON corrupts the payload, so we reject with a 413.
		 *  - The payload must decode to a JSON object. Storing garbage would
		 *    make `parseSuggestionPayload` return null on the client and the
		 *    suggestion would silently disappear, so we reject with a 400.
		 *
		 * @param WP_REST_Request $request Full details about the request.
		 * @return true|WP_Error True if no payload or valid, WP_Error otherwise.
		 */
		protected static function validate_suggestion_payload( $request ) {
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
			// An empty string is the documented "no suggestion" value; anything
			// else must decode to a JSON object carrying the payload fields.
			if ( '' !== $value ) {
				$decoded = json_decode( $value, true );
				if ( ! is_array( $decoded ) ) {
					return new WP_Error(
						'rest_suggestion_invalid_json',
						__( 'Suggestion payload must be a valid JSON object.', 'gutenberg' ),
						array( 'status' => 400 )
					);
				}
			}
			return true;
		}

		/**
		 * Determines whether a note-update request touches only the fields used
		 * by the suggestion apply/reject lifecycle.
		 *
		 * Allowed fields:
		 *  - `status` (limited to `approved` or `hold`)
		 *  - `meta._wp_suggestion_status`
		 *
		 * Any other field present in the request disqualifies it from the
		 * `edit_post` shortcut, forcing it through core's `edit_comment` check
		 * instead. Core's `update_item` reads `$request['content']` etc. from
		 * the MERGED param view (JSON > POST > GET > URL), so the inspected
		 * key set is built from every client-supplied channel — a field
		 * smuggled in as a query parameter (`?content=rewritten`) alongside a
		 * lifecycle-only body cannot slip past the allowlist. Server-injected
		 * schema defaults (`post`, `parent`) are excluded: the client didn't
		 * send them and they don't rewrite anything.
		 *
		 * Note this method is a scope limiter, not an authorization boundary:
		 * see `update_item_permissions_check` for what the shortcut does and
		 * does not protect against.
		 *
		 * @param WP_REST_Request $request Full details about the request.
		 * @return bool
		 */
		private static function is_suggestion_lifecycle_update( $request ) {
			// Union of every client-supplied parameter channel, mirroring the
			// precedence core uses when reading `$request[ $key ]`.
			$params = array();
			foreach ( array(
				$request->get_url_params(),
				$request->get_query_params(),
				$request->get_body_params(),
				$request->get_json_params(),
			) as $channel ) {
				if ( is_array( $channel ) ) {
					$params = array_merge( $params, $channel );
				}
			}
			if ( empty( $params ) ) {
				return false;
			}

			/*
			 * Keys that are always present or can't write comment fields:
			 * `id` comes from the route; the underscore-prefixed keys are
			 * REST meta-parameters (`_locale` is added by api-fetch on every
			 * editor request); `context` shapes the response, not the write.
			 */
			$ignored_keys = array(
				'id',
				'context',
				'_locale',
				'_fields',
				'_embed',
				'_envelope',
				'_jsonp',
				'_method',
			);

			$allowed_keys = array( 'status', 'meta' );
			$inspected    = array_diff( array_keys( $params ), $ignored_keys );
			if ( empty( $inspected ) ) {
				return false;
			}
			foreach ( $inspected as $key ) {
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
		 * Checks if a given request has access to update a comment.
		 *
		 * Extends core's check so that users who can `edit_post` on the parent
		 * post are also allowed to update note-type comments for
		 * suggestion-lifecycle fields (status and `_wp_suggestion_status`
		 * meta). This unblocks the suggestion workflow where a post editor
		 * applies or rejects a suggestion authored by someone else.
		 *
		 * Scope note: the lifecycle allowlist limits what THIS shortcut
		 * grants; it does not (and cannot) prevent note rewrites in general.
		 * Requests that touch other fields fall through to core's
		 * `edit_comment` check, and core's `map_meta_cap` resolves
		 * `edit_comment` to `edit_post` on the comment's parent post - so a
		 * post editor already holds full edit permission over notes on their
		 * posts through the core fallback.
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
		 * Prepares a single comment for create or update.
		 *
		 * Wraps core's preparation with two suggestion-specific concerns:
		 *
		 *  - Rejects oversized `_wp_suggestion` payloads with a clean 413, and
		 *    payloads that aren't valid JSON objects with a 400, before any
		 *    storage happens (both create and update call this and return
		 *    its WP_Error).
		 *  - Surfaces the `_wp_suggestion` payload in the prepared `meta` so the
		 *    content-allowed check can recognize a payload-only note, mirroring
		 *    how core copies `_wp_note_status` for the same check.
		 *
		 * @param WP_REST_Request $request Request object.
		 * @return array|WP_Error Prepared comment, or WP_Error.
		 */
		protected function prepare_item_for_database( $request ) {
			$payload_check = self::validate_suggestion_payload( $request );
			if ( is_wp_error( $payload_check ) ) {
				return $payload_check;
			}

			$prepared_comment = parent::prepare_item_for_database( $request );
			if ( is_wp_error( $prepared_comment ) ) {
				return $prepared_comment;
			}

			if ( isset( $request['meta']['_wp_suggestion'] ) ) {
				if ( ! isset( $prepared_comment['meta'] ) || ! is_array( $prepared_comment['meta'] ) ) {
					$prepared_comment['meta'] = array();
				}
				$prepared_comment['meta']['_wp_suggestion'] = $request['meta']['_wp_suggestion'];
			}

			return $prepared_comment;
		}

		/**
		 * Allows a note comment to have empty content when it carries a
		 * suggestion payload.
		 *
		 * A pure suggestion (a proposed edit with no discussion text) has empty
		 * `comment_content`; core would otherwise reject it. Everything else
		 * defers to core's check.
		 *
		 * @param array $prepared_comment Prepared comment data.
		 * @return bool
		 */
		protected function check_is_comment_content_allowed( $prepared_comment ) {
			if (
				isset( $prepared_comment['comment_type'] ) &&
				'note' === $prepared_comment['comment_type'] &&
				! empty( $prepared_comment['meta']['_wp_suggestion'] )
			) {
				return true;
			}

			return parent::check_is_comment_content_allowed( $prepared_comment );
		}
	}
}

add_action(
	'rest_api_init',
	function () {
		// Register after core's default comments controller (priority 10) so the
		// note-aware /wp/v2/comments routes are overridden with the
		// suggestion-aware subclass.
		$controller = new Gutenberg_REST_Comment_Controller_7_1();
		$controller->register_routes();
	},
	11
);
