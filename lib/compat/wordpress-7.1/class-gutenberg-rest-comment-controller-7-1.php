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
 * Permissions are core's: `update_item` requires `edit_comment`, which
 * `map_meta_cap()` resolves to `edit_post` on the note's parent post, so a post
 * editor can already apply or reject a suggestion left on their post. This
 * subclass only adds the suggestion-specific storage rules:
 *
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
		// Core registers its routes on `rest_api_init` at priority 99, so this
		// subclass registers first and its handlers are matched before core's.
		$controller = new Gutenberg_REST_Comment_Controller_7_1();
		$controller->register_routes();
	},
	11
);
