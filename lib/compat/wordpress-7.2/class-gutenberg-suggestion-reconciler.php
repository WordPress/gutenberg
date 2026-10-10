<?php
/**
 * Suggestion mode: the save pass.
 *
 * @package gutenberg
 */

if ( ! class_exists( 'Gutenberg_Suggestion_Reconciler' ) ) {
	/**
	 * Reconciles suggestion notes with the content of every post write.
	 *
	 * Post content is the source of truth for a suggestion: its anchor (an
	 * inline marker, a structural `metadata.suggestion` marker, or the proposal
	 * in that marker's `after`) is what Accept and Reject change, and that
	 * change only exists once the post is saved. The pass runs in two phases:
	 *
	 * - `wp_insert_post_data` (late, after kses) records the content the post
	 *   had before this write.
	 * - `wp_insert_post` (early, after the row is written and before a REST
	 *   response is prepared) compares the anchors of the previous and the
	 *   saved content and updates the notes:
	 *   - a provisional decision (`applied-unsaved` / `rejected-unsaved`) whose
	 *     anchor is gone becomes final, whoever saved;
	 *   - another author's pending suggestion whose anchor this write removed
	 *     becomes `outdated` rather than being lost. The saver's own pending
	 *     notes are left to the editor's note collector.
	 *
	 * Revisions and autosave revisions are not post writes and are skipped; an
	 * own-draft autosave updates the post itself and counts as one.
	 */
	class Gutenberg_Suggestion_Reconciler {

		/**
		 * Previous content per post, a stack so a nested `wp_update_post()`
		 * from a `save_post` handler pairs with its own commit.
		 *
		 * @var array<int, string[]>
		 */
		private static $previous = array();

		/**
		 * Hooks the pass.
		 */
		public static function register() {
			add_filter( 'wp_insert_post_data', array( __CLASS__, 'capture_previous_content' ), 999, 4 );
			add_action( 'wp_insert_post', array( __CLASS__, 'commit' ), 1 );
		}

		/**
		 * Whether a post type supports notes (`editor` support with `notes`).
		 *
		 * @param string $post_type Post type.
		 * @return bool
		 */
		public static function post_type_supports_notes( $post_type ) {
			$supports = get_all_post_type_supports( $post_type );
			if ( ! isset( $supports['editor'] ) || ! is_array( $supports['editor'] ) ) {
				return false;
			}
			foreach ( $supports['editor'] as $item ) {
				if ( ! empty( $item['notes'] ) ) {
					return true;
				}
			}
			return false;
		}

		/**
		 * Transform phase: remembers the content the post had before the write.
		 *
		 * Content is not changed yet (extraction comes later); the filter is
		 * only the last point that still sees the stored content.
		 *
		 * @param array $data                Slashed post data about to be written.
		 * @param array $postarr             Sanitized post array.
		 * @param array $unsanitized_postarr Unsanitized post array. Unused.
		 * @param bool  $update              Whether this is an update.
		 * @return array Unchanged post data.
		 */
		public static function capture_previous_content( $data, $postarr, $unsanitized_postarr = array(), $update = false ) {
			$post_id = isset( $postarr['ID'] ) ? (int) $postarr['ID'] : 0;
			if ( ! $update || $post_id <= 0 || ! isset( $data['post_type'] ) ) {
				return $data;
			}
			if ( 'revision' === $data['post_type'] || ! self::post_type_supports_notes( $data['post_type'] ) ) {
				return $data;
			}
			$previous = (string) get_post_field( 'post_content', $post_id, 'raw' );
			$incoming = isset( $data['post_content'] ) ? wp_unslash( $data['post_content'] ) : '';
			if ( ! self::may_carry_anchors( $previous ) && ! self::may_carry_anchors( $incoming ) && ! self::has_provisional_notes( $post_id ) ) {
				return $data;
			}
			self::$previous[ $post_id ][] = $previous;
			return $data;
		}

		/**
		 * Commit phase: updates the post's suggestion notes.
		 *
		 * The post is read again rather than taken from the hook: a nested
		 * write from a `save_post` handler may have replaced its content since.
		 *
		 * @param int $post_id Post ID.
		 */
		public static function commit( $post_id ) {
			if ( empty( self::$previous[ $post_id ] ) ) {
				return;
			}
			$previous = array_pop( self::$previous[ $post_id ] );
			if ( empty( self::$previous[ $post_id ] ) ) {
				unset( self::$previous[ $post_id ] );
			}
			$saved = get_post( $post_id );
			if ( ! $saved ) {
				return;
			}
			self::reconcile( $saved, $previous );
		}

		/**
		 * Applies the finalize and outdate rules to a post's notes.
		 *
		 * Idempotent: running it again on the same content changes nothing.
		 *
		 * @param WP_Post $post     The saved post.
		 * @param string  $previous Content the post had before the write.
		 */
		public static function reconcile( $post, $previous ) {
			$notes = get_comments(
				array(
					'post_id'      => $post->ID,
					'type'         => 'note',
					'parent'       => 0,
					'status'       => 'all',
					'meta_key'     => '_wp_suggestion', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_query_meta_key
					'meta_compare' => 'EXISTS',
					'number'       => 0,
				)
			);
			if ( empty( $notes ) ) {
				return;
			}

			$before  = gutenberg_get_suggestion_anchor_index( $previous );
			$after   = gutenberg_get_suggestion_anchor_index( $post->post_content );
			$user_id = get_current_user_id();

			foreach ( $notes as $note ) {
				$note_id = (int) $note->comment_ID;
				$payload = json_decode( (string) get_comment_meta( $note_id, '_wp_suggestion', true ), true );
				$kind    = self::anchor_kind( $payload );
				if ( null === $kind ) {
					continue;
				}
				$status = (string) get_comment_meta( $note_id, '_wp_suggestion_status', true );
				if ( '' === $status ) {
					$status = 'pending';
				}

				if ( in_array( $status, gutenberg_get_provisional_suggestion_statuses(), true ) ) {
					if ( self::is_decision_saved( $kind, $status, $payload, $post, $after, $note_id ) ) {
						self::resolve( $note_id, 'applied-unsaved' === $status ? 'applied' : 'rejected', $user_id );
					}
					continue;
				}

				if (
					'pending' === $status &&
					'0' === (string) $note->comment_approved &&
					'post' !== $kind &&
					isset( $before[ $note_id ][ $kind ] ) &&
					! isset( $after[ $note_id ][ $kind ] ) &&
					( 0 === $user_id || (int) $note->user_id !== $user_id )
				) {
					self::resolve( $note_id, 'outdated', $user_id );
				}
			}
		}

		/**
		 * The anchor kind a note's payload is held by, matching the editor's
		 * note collector: `inline`, a structural marker type, `pending-attributes`
		 * for an attribute proposal, or `post` for a post field (no anchor).
		 *
		 * @param mixed $payload Decoded `_wp_suggestion` payload.
		 * @return string|null Anchor kind, or null for an unreadable payload.
		 */
		private static function anchor_kind( $payload ) {
			if ( ! is_array( $payload ) || ! isset( $payload['operations'] ) || ! is_array( $payload['operations'] ) ) {
				return null;
			}
			$structural = array(
				'block-remove'       => 'pending-remove',
				'block-insert-after' => 'pending-insert',
				'block-move'         => 'pending-move',
			);
			$types      = array();
			foreach ( $payload['operations'] as $operation ) {
				if ( is_array( $operation ) && isset( $operation['type'] ) && is_string( $operation['type'] ) ) {
					$types[] = $operation['type'];
				}
			}
			foreach ( $types as $type ) {
				if ( isset( $structural[ $type ] ) ) {
					return $structural[ $type ];
				}
			}
			if ( in_array( 'inline-suggestion', $types, true ) ) {
				return 'inline';
			}
			if ( in_array( 'post-attribute-set', $types, true ) ) {
				return 'post';
			}
			return 'pending-attributes';
		}

		/**
		 * Whether a provisional decision has reached the saved post.
		 *
		 * A block or inline suggestion is decided once its anchor is gone. A
		 * post-field suggestion has no anchor: an accept is saved once the field
		 * holds the proposed value, and a reject changes nothing, so any post
		 * write saves it.
		 *
		 * @param string  $kind    Anchor kind.
		 * @param string  $status  Provisional status.
		 * @param array   $payload Decoded payload.
		 * @param WP_Post $post    The saved post.
		 * @param array   $after   Anchor index of the saved content.
		 * @param int     $note_id Note ID.
		 * @return bool
		 */
		private static function is_decision_saved( $kind, $status, $payload, $post, $after, $note_id ) {
			if ( 'post' !== $kind ) {
				return ! isset( $after[ $note_id ][ $kind ] );
			}
			if ( 'rejected-unsaved' === $status ) {
				return true;
			}
			$fields = array(
				'title'   => 'post_title',
				'excerpt' => 'post_excerpt',
			);
			foreach ( $payload['operations'] as $operation ) {
				if ( ! is_array( $operation ) || ! isset( $operation['type'] ) || 'post-attribute-set' !== $operation['type'] ) {
					continue;
				}
				$attribute = isset( $operation['attribute'] ) ? $operation['attribute'] : '';
				if ( ! isset( $fields[ $attribute ] ) || ! isset( $operation['after'] ) || ! is_string( $operation['after'] ) ) {
					return false;
				}
				if ( $post->{ $fields[ $attribute ] } !== $operation['after'] ) {
					return false;
				}
			}
			return true;
		}

		/**
		 * Writes a final status and resolves the note.
		 *
		 * The note keeps its thread; its comment status goes `approved`, the same
		 * resolved state a reviewer's manual resolve gives it.
		 *
		 * @param int    $note_id Note ID.
		 * @param string $status  Final status.
		 * @param int    $user_id User whose write resolved it.
		 */
		private static function resolve( $note_id, $status, $user_id ) {
			update_comment_meta( $note_id, '_wp_suggestion_status', $status );
			update_comment_meta( $note_id, '_wp_suggestion_resolved_by', $user_id );
			wp_set_comment_status( $note_id, 'approve' );
		}

		/**
		 * Cheap probe for content that may hold suggestion anchors.
		 *
		 * @param string $content Post content.
		 * @return bool
		 */
		private static function may_carry_anchors( $content ) {
			return '' !== $content && ( false !== strpos( $content, 'wp-suggestion' ) || false !== strpos( $content, '"suggestion":' ) );
		}

		/**
		 * Whether the post has a provisional decision waiting for a save. Covers
		 * post-field suggestions, which leave nothing in the content to probe.
		 *
		 * @param int $post_id Post ID.
		 * @return bool
		 */
		private static function has_provisional_notes( $post_id ) {
			return (bool) get_comments(
				array(
					'post_id'    => $post_id,
					'type'       => 'note',
					'parent'     => 0,
					'status'     => 'hold',
					'count'      => true,
					'meta_query' => array( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_query_meta_query
						array(
							'key'     => '_wp_suggestion_status',
							'value'   => gutenberg_get_provisional_suggestion_statuses(),
							'compare' => 'IN',
						),
					),
				)
			);
		}
	}
}
