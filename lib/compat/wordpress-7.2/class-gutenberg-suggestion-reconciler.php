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
	 * - `wp_insert_post_data` (late, after kses) moves what the suggestions
	 *   propose out of the incoming content (see `Gutenberg_Suggestion_Content`)
	 *   so the stored `post_content` holds the public baseline plus anchors,
	 *   and records the content the post had before this write.
	 * - `wp_insert_post` (early, after the row is written and before a REST
	 *   response is prepared) stores the extracted proposals on their notes,
	 *   then compares the anchors of the previous and the saved content and
	 *   updates the notes:
	 *   - a provisional decision (`applied-unsaved` / `rejected-unsaved`) whose
	 *     anchor is gone becomes final, whoever saved;
	 *   - another author's pending suggestion whose anchor this write removed
	 *     becomes `outdated` rather than being lost. The saver's own pending
	 *     notes are left to the editor's note collector.
	 * - `wp_after_insert_post` finalizes post-field suggestions (title, terms,
	 *   meta, featured image), since REST writes terms and meta after the row.
	 *
	 * A proposal already in anchor form (a plugin, the classic editor or the
	 * code editor sending the stored content back) keeps what its note stores.
	 * Edit-context REST responses of the post, its autosaves and revisions put
	 * the proposals back for users who can read suggestions, so the editor
	 * loads and saves full markers and never sees the anchors.
	 *
	 * Revisions and autosave revisions are not post writes: their proposals
	 * are stored on the revision (`_wp_suggestion_snapshot`) and they neither
	 * finalize nor outdate anything. An own-draft autosave updates the post
	 * itself and counts as a post write.
	 */
	class Gutenberg_Suggestion_Reconciler {

		/**
		 * Pending writes per post, a stack so a nested `wp_update_post()` from
		 * a `save_post` handler pairs with its own commit. Each entry holds the
		 * content the post had before the write (`previous`, as stored, and
		 * `previous_full`, re-inflated), the stored items before the write
		 * (`stored`), every item the write may keep (`candidates`), the
		 * suggestion notes of the post (`notes`) and the notes whose proposals
		 * were too large to extract (`skipped`).
		 *
		 * @var array<int, array[]>
		 */
		private static $previous = array();

		/**
		 * Items a pending revision write may keep, per parent post.
		 *
		 * @var array<int, array[]>
		 */
		private static $revisions = array();

		/**
		 * Hooks the pass.
		 */
		public static function register() {
			add_filter( 'wp_insert_post_data', array( __CLASS__, 'transform' ), 999, 4 );
			add_action( 'wp_insert_post', array( __CLASS__, 'commit' ), 1 );
			add_action( 'wp_after_insert_post', array( __CLASS__, 'finalize_post_fields' ), 10, 2 );
			add_action( 'wp_restore_post_revision', array( __CLASS__, 'reseed_from_revision' ), 10, 2 );
			add_action( 'registered_post_type', array( __CLASS__, 'register_rest_filter' ) );
			foreach ( get_post_types() as $post_type ) {
				self::register_rest_filter( $post_type );
			}
			add_filter( 'rest_prepare_autosave', array( __CLASS__, 'inflate_response' ), 10, 3 );
			add_filter( 'rest_prepare_revision', array( __CLASS__, 'inflate_response' ), 10, 3 );
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
		 * Transform phase: moves proposals out of the incoming content and
		 * remembers the content the post had before the write.
		 *
		 * Runs after kses (`content_save_pre`), so every extracted proposal is
		 * exactly what kses let through for the saving user.
		 *
		 * @param array $data                Slashed post data about to be written.
		 * @param array $postarr             Sanitized post array.
		 * @param array $unsanitized_postarr Unsanitized post array. Unused.
		 * @param bool  $update              Whether this is an update.
		 * @return array Post data, its content anchored.
		 */
		public static function transform( $data, $postarr, $unsanitized_postarr = array(), $update = false ) {
			if ( ! isset( $data['post_type'] ) ) {
				return $data;
			}
			$incoming = isset( $data['post_content'] ) ? wp_unslash( $data['post_content'] ) : '';

			if ( 'revision' === $data['post_type'] ) {
				$parent_id = isset( $data['post_parent'] ) ? (int) $data['post_parent'] : 0;
				if ( $parent_id <= 0 || ! self::post_type_supports_notes( (string) get_post_type( $parent_id ) ) || ! Gutenberg_Suggestion_Content::may_carry_proposals( $incoming ) ) {
					return $data;
				}
				$state     = self::stored_state( $parent_id );
				$extracted = self::extract( $incoming, $state['notes'], $state['originals'] );

				self::$revisions[ $parent_id ][] = self::merge_items( $state['items'], $extracted['items'] );
				$data['post_content']            = wp_slash( $extracted['content'] );
				return $data;
			}

			$post_id = isset( $postarr['ID'] ) ? (int) $postarr['ID'] : 0;
			if ( ! $update || $post_id <= 0 || ! self::post_type_supports_notes( $data['post_type'] ) ) {
				return $data;
			}
			$previous = (string) get_post_field( 'post_content', $post_id, 'raw' );
			if ( ! Gutenberg_Suggestion_Content::may_carry_proposals( $previous ) && ! Gutenberg_Suggestion_Content::may_carry_proposals( $incoming ) && ! self::has_provisional_notes( $post_id ) ) {
				return $data;
			}

			$state     = self::stored_state( $post_id );
			$extracted = self::extract( $incoming, $state['notes'], $state['originals'] );

			self::$previous[ $post_id ][] = array(
				'previous'      => $previous,
				'previous_full' => Gutenberg_Suggestion_Content::inflate( $previous, $state['items'] ),
				'stored'        => $state['items'],
				'candidates'    => self::merge_items( $state['items'], $extracted['items'] ),
				'notes'         => $state['notes'],
				'skipped'       => $extracted['skipped'],
			);
			$data['post_content']         = wp_slash( $extracted['content'] );
			return $data;
		}

		/**
		 * Commit phase: stores the proposals and updates the post's notes.
		 *
		 * The post is read again rather than taken from the hook: a nested
		 * write from a `save_post` handler may have replaced its content since,
		 * so only the items whose anchors are in the saved content are kept.
		 *
		 * @param int $post_id Post ID.
		 */
		public static function commit( $post_id ) {
			$saved = get_post( $post_id );
			if ( ! $saved ) {
				return;
			}
			if ( 'revision' === $saved->post_type ) {
				self::commit_revision( $saved );
				return;
			}
			if ( empty( self::$previous[ $post_id ] ) ) {
				return;
			}
			$entry = array_pop( self::$previous[ $post_id ] );
			if ( empty( self::$previous[ $post_id ] ) ) {
				unset( self::$previous[ $post_id ] );
			}

			$effective = Gutenberg_Suggestion_Content::filter_present( $entry['candidates'], $saved->post_content );
			$touched   = array_unique( array_merge( array_keys( $entry['stored'] ), array_keys( $effective ) ) );
			foreach ( $touched as $note_id ) {
				$stored = (string) get_comment_meta( $note_id, '_wp_suggestion_content', true );
				if ( empty( $effective[ $note_id ] ) ) {
					if ( '' !== $stored ) {
						delete_comment_meta( $note_id, '_wp_suggestion_content' );
					}
					continue;
				}
				$encoded = Gutenberg_Suggestion_Content::encode( $effective[ $note_id ] );
				if ( $encoded !== $stored ) {
					update_comment_meta( $note_id, '_wp_suggestion_content', wp_slash( $encoded ) );
				}
			}
			foreach ( array_keys( $entry['notes'] ) as $note_id ) {
				if ( isset( $entry['skipped'][ $note_id ] ) ) {
					update_comment_meta( $note_id, '_wp_suggestion_extraction_skipped', true );
				} elseif ( '' !== (string) get_comment_meta( $note_id, '_wp_suggestion_extraction_skipped', true ) ) {
					delete_comment_meta( $note_id, '_wp_suggestion_extraction_skipped' );
				}
			}

			if ( self::saver_can_change_notes( $post_id ) ) {
				self::reconcile( $saved, $entry['previous'], $entry['previous_full'], $effective );
			}
		}

		/**
		 * Whether the current write may change the post's note statuses.
		 *
		 * Finalizing and outdating change notes on the saver's behalf, so they
		 * are held to the gate a REST write of those notes needs
		 * (`edit_comment`, which maps to `edit_post`). `wp_insert_post()`
		 * itself checks no capability, so a write a plugin makes during another
		 * user's request leaves the statuses alone; its proposals are still
		 * stored, since the content it wrote holds their anchors. A write with
		 * no user (cron, WP-CLI) is server code and still acts.
		 *
		 * @param int $post_id Post ID.
		 * @return bool
		 */
		private static function saver_can_change_notes( $post_id ) {
			return 0 === get_current_user_id() || current_user_can( 'edit_post', $post_id );
		}

		/**
		 * Applies the finalize and outdate rules to a post's notes.
		 *
		 * Idempotent: running it again on the same content changes nothing. A
		 * note's anchor counts as present when it is in the stored content in
		 * any form, or nested inside another note's stored proposal (a
		 * suggestion made inside someone else's suggested block).
		 *
		 * @param WP_Post             $post          The saved post.
		 * @param string              $previous      Content the post had before the write.
		 * @param string|null         $previous_full The same, re-inflated. Defaults to `$previous`.
		 * @param array<int, array[]> $items         Proposals stored for the saved content.
		 */
		public static function reconcile( $post, $previous, $previous_full = null, $items = array() ) {
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

			$before  = self::merge_indexes(
				gutenberg_get_suggestion_anchor_index( $previous ),
				gutenberg_get_suggestion_anchor_index( null === $previous_full ? $previous : $previous_full )
			);
			$after   = self::merge_indexes(
				gutenberg_get_suggestion_anchor_index( $post->post_content ),
				gutenberg_get_suggestion_anchor_index( Gutenberg_Suggestion_Content::inflate( $post->post_content, $items ) )
			);
			$user_id = get_current_user_id();

			foreach ( $notes as $note ) {
				$note_id = (int) $note->comment_ID;
				$payload = json_decode( (string) get_comment_meta( $note_id, '_wp_suggestion', true ), true );
				$kind    = self::anchor_kind( $payload );
				// Post-field suggestions have no anchor; see `finalize_post_fields()`.
				if ( null === $kind || 'post' === $kind ) {
					continue;
				}
				$status = self::status_of( $note_id );

				if ( in_array( $status, gutenberg_get_provisional_suggestion_statuses(), true ) ) {
					if ( ! isset( $after[ $note_id ][ $kind ] ) ) {
						self::resolve( $note_id, 'applied-unsaved' === $status ? 'applied' : 'rejected', $user_id );
					}
					continue;
				}

				if (
					'pending' === $status &&
					'0' === (string) $note->comment_approved &&
					isset( $before[ $note_id ][ $kind ] ) &&
					! isset( $after[ $note_id ][ $kind ] ) &&
					( 0 === $user_id || (int) $note->user_id !== $user_id )
				) {
					self::resolve( $note_id, 'outdated', $user_id );
				}
			}
		}

		/**
		 * Finalizes provisional post-field decisions once the post holds them.
		 *
		 * Runs on `wp_after_insert_post`, which a REST write fires only after it
		 * has saved the post's terms, meta and featured image.
		 *
		 * @param int     $post_id Post ID.
		 * @param WP_Post $post    Post.
		 */
		public static function finalize_post_fields( $post_id, $post ) {
			if ( ! $post instanceof WP_Post || 'revision' === $post->post_type || ! self::post_type_supports_notes( $post->post_type ) ) {
				return;
			}
			if ( ! self::saver_can_change_notes( $post_id ) || ! self::has_provisional_notes( $post_id ) ) {
				return;
			}
			$notes = get_comments(
				array(
					'post_id'    => $post_id,
					'type'       => 'note',
					'parent'     => 0,
					'status'     => 'hold',
					'number'     => 0,
					'meta_query' => array( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_query_meta_query
						array(
							'key'     => '_wp_suggestion_status',
							'value'   => gutenberg_get_provisional_suggestion_statuses(),
							'compare' => 'IN',
						),
					),
				)
			);
			$post  = get_post( $post_id );
			foreach ( $notes as $note ) {
				$note_id = (int) $note->comment_ID;
				$payload = json_decode( (string) get_comment_meta( $note_id, '_wp_suggestion', true ), true );
				if ( 'post' !== self::anchor_kind( $payload ) ) {
					continue;
				}
				$status = self::status_of( $note_id );
				if ( 'rejected-unsaved' === $status || self::post_holds_proposal( $post, $payload ) ) {
					self::resolve( $note_id, 'applied-unsaved' === $status ? 'applied' : 'rejected', get_current_user_id() );
				}
			}
		}

		/**
		 * Puts back the proposals of a restored revision.
		 *
		 * The restore writes the revision's anchored content; the commit keeps
		 * whatever the notes still store for those anchors. Anchors whose note
		 * no longer stores them get the revision's copy. Nothing is overwritten
		 * and no status changes.
		 *
		 * @param int $post_id     Post ID.
		 * @param int $revision_id Revision ID.
		 */
		public static function reseed_from_revision( $post_id, $revision_id ) {
			$snapshot = self::read_snapshot( $revision_id );
			$post     = get_post( $post_id );
			if ( ! $snapshot || ! $post ) {
				return;
			}
			$notes   = self::suggestion_notes( $post_id );
			$present = Gutenberg_Suggestion_Content::anchor_runs( $post->post_content );
			foreach ( $snapshot as $note_id => $items ) {
				if ( ! isset( $notes[ $note_id ] ) ) {
					continue;
				}
				$stored = Gutenberg_Suggestion_Content::decode( get_comment_meta( $note_id, '_wp_suggestion_content', true ) );
				$keys   = array();
				foreach ( $stored as $item ) {
					$keys[ $item['kind'] . ':' . (int) $item['run'] ] = true;
				}
				$changed = false;
				foreach ( $items as $item ) {
					$key = $item['kind'] . ':' . (int) $item['run'];
					if ( isset( $present[ $note_id ][ $key ] ) && ! isset( $keys[ $key ] ) ) {
						$stored[]     = $item;
						$keys[ $key ] = true;
						$changed      = true;
					}
				}
				if ( $changed ) {
					update_comment_meta( $note_id, '_wp_suggestion_content', wp_slash( Gutenberg_Suggestion_Content::encode( $stored ) ) );
				}
			}
		}

		/**
		 * Hooks the re-inflation of a post type's edit-context REST responses.
		 *
		 * Every type is hooked, since `notes` support can be added after a type
		 * registers; `inflate_response()` checks it.
		 *
		 * @param string $post_type Post type.
		 */
		public static function register_rest_filter( $post_type ) {
			if ( 'revision' !== $post_type ) {
				add_filter( "rest_prepare_{$post_type}", array( __CLASS__, 'inflate_response' ), 10, 3 );
			}
		}

		/**
		 * Puts the proposals back into `content.raw` of an edit-context
		 * response, for a user who can read the post's suggestions.
		 *
		 * `content.rendered` is left alone: it went through the render strip.
		 * A revision or autosave is inflated from its own snapshot, falling
		 * back to what the notes store. Proposals of trashed notes stay out
		 * until the note is restored.
		 *
		 * @param WP_REST_Response $response Response.
		 * @param WP_Post          $post     Post, autosave or revision.
		 * @param WP_REST_Request  $request  Request.
		 * @return WP_REST_Response Response.
		 */
		public static function inflate_response( $response, $post, $request ) {
			if ( ! $response instanceof WP_REST_Response || ! $post instanceof WP_Post ) {
				return $response;
			}
			if ( 'edit' !== ( isset( $request['context'] ) ? $request['context'] : 'view' ) ) {
				return $response;
			}
			$data = $response->get_data();
			if ( ! isset( $data['content']['raw'] ) || ! is_string( $data['content']['raw'] ) || ! Gutenberg_Suggestion_Content::may_carry_proposals( $data['content']['raw'] ) ) {
				return $response;
			}
			$is_revision = 'revision' === $post->post_type;
			$parent_id   = $is_revision ? (int) $post->post_parent : (int) $post->ID;
			if ( ! self::post_type_supports_notes( (string) get_post_type( $parent_id ) ) || ! gutenberg_can_read_suggestions( $parent_id ) ) {
				return $response;
			}

			$notes = self::suggestion_notes( $parent_id );
			$items = $is_revision ? self::read_snapshot( $post->ID ) : null;
			if ( ! $items ) {
				$items = self::load_items( $notes );
			}
			foreach ( array_keys( $items ) as $note_id ) {
				if ( ! isset( $notes[ $note_id ] ) || 'trash' === $notes[ $note_id ] ) {
					unset( $items[ $note_id ] );
				}
			}

			$data['content']['raw'] = Gutenberg_Suggestion_Content::inflate( $data['content']['raw'], $items );
			$response->set_data( $data );
			return $response;
		}

		/**
		 * Stores a revision's proposals on the revision.
		 *
		 * @param WP_Post $revision Revision or autosave.
		 */
		private static function commit_revision( $revision ) {
			$parent_id = (int) $revision->post_parent;
			if ( empty( self::$revisions[ $parent_id ] ) ) {
				return;
			}
			$candidates = array_pop( self::$revisions[ $parent_id ] );
			if ( empty( self::$revisions[ $parent_id ] ) ) {
				unset( self::$revisions[ $parent_id ] );
			}
			$snapshot = Gutenberg_Suggestion_Content::filter_present( $candidates, $revision->post_content );
			// Not `update_post_meta()`, which writes a revision's meta to its parent.
			if ( $snapshot ) {
				update_metadata( 'post', $revision->ID, '_wp_suggestion_snapshot', wp_slash( self::encode_snapshot( $snapshot ) ) );
			} else {
				delete_metadata( 'post', $revision->ID, '_wp_suggestion_snapshot' );
			}
		}

		/**
		 * Extracts proposals, leaving any note whose proposals would exceed the
		 * size limit in full form.
		 *
		 * @param string             $content   Content.
		 * @param array<int, true>   $notes     Suggestion notes of the post.
		 * @param array<int, string> $originals Original run of each formatting suggestion.
		 * @return array{content: string, items: array<int, array[]>, skipped: array<int, true>}
		 */
		private static function extract( $content, $notes, $originals ) {
			$exclude = array();
			while ( true ) {
				$result = Gutenberg_Suggestion_Content::extract( $content, $notes, $exclude, $originals );
				$over   = array();
				foreach ( $result['items'] as $note_id => $items ) {
					if ( strlen( Gutenberg_Suggestion_Content::encode( $items ) ) > GUTENBERG_SUGGESTION_CONTENT_MAX_BYTES ) {
						$over[ $note_id ] = true;
					}
				}
				if ( ! $over ) {
					$result['skipped'] = $exclude;
					return $result;
				}
				$exclude += $over;
			}
		}

		/**
		 * The suggestion notes of a post and what they store, preferring the
		 * items of a write still being committed (a nested write sees the
		 * outer write's proposals as stored).
		 *
		 * @param int $post_id Post ID.
		 * @return array{notes: array<int, string>, items: array<int, array[]>, originals: array<int, string>}
		 */
		private static function stored_state( $post_id ) {
			$notes     = self::suggestion_notes( $post_id );
			$originals = array();
			foreach ( array_keys( $notes ) as $note_id ) {
				$original = self::format_original( $note_id );
				if ( null !== $original ) {
					$originals[ $note_id ] = $original;
				}
			}
			if ( ! empty( self::$previous[ $post_id ] ) ) {
				$pending = end( self::$previous[ $post_id ] );
				$items   = $pending['candidates'];
			} else {
				$items = self::load_items( $notes );
			}
			return array(
				'notes'     => $notes,
				'items'     => $items,
				'originals' => $originals,
			);
		}

		/**
		 * The original run a formatting suggestion recorded (`beforeHTML`).
		 *
		 * @param int $note_id Note ID.
		 * @return string|null The run, or null for any other suggestion.
		 */
		private static function format_original( $note_id ) {
			$payload = json_decode( (string) get_comment_meta( $note_id, '_wp_suggestion', true ), true );
			if ( ! is_array( $payload ) || ! isset( $payload['operations'] ) || ! is_array( $payload['operations'] ) ) {
				return null;
			}
			foreach ( $payload['operations'] as $operation ) {
				if ( is_array( $operation ) && isset( $operation['suggestionType'], $operation['beforeHTML'] ) && 'format' === $operation['suggestionType'] && is_string( $operation['beforeHTML'] ) ) {
					return $operation['beforeHTML'];
				}
			}
			return null;
		}

		/**
		 * Root suggestion notes of a post, in any status.
		 *
		 * @param int $post_id Post ID.
		 * @return array<int, string> Note ID => comment status, as
		 *                            `wp_get_comment_status()` names it.
		 */
		private static function suggestion_notes( $post_id ) {
			$comments = get_comments(
				array(
					'post_id'      => $post_id,
					'type'         => 'note',
					'parent'       => 0,
					'status'       => 'any',
					'meta_key'     => '_wp_suggestion', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_query_meta_key
					'meta_compare' => 'EXISTS',
					'number'       => 0,
				)
			);
			$notes    = array();
			foreach ( $comments as $comment ) {
				$notes[ (int) $comment->comment_ID ] = (string) wp_get_comment_status( $comment );
			}
			return $notes;
		}

		/**
		 * Reads what a set of notes store.
		 *
		 * @param array<int, string> $notes Note ID => status.
		 * @return array<int, array[]> Items per note id.
		 */
		private static function load_items( $notes ) {
			$items = array();
			foreach ( array_keys( $notes ) as $note_id ) {
				$list = Gutenberg_Suggestion_Content::decode( get_comment_meta( $note_id, '_wp_suggestion_content', true ) );
				if ( $list ) {
					$items[ $note_id ] = $list;
				}
			}
			return $items;
		}

		/**
		 * Overlays newly extracted items on stored ones, by run.
		 *
		 * @param array<int, array[]> $stored    Stored items per note id.
		 * @param array<int, array[]> $extracted Extracted items per note id.
		 * @return array<int, array[]> Items per note id.
		 */
		private static function merge_items( $stored, $extracted ) {
			$merged = array();
			foreach ( array( $stored, $extracted ) as $source ) {
				foreach ( $source as $note_id => $items ) {
					foreach ( $items as $item ) {
						$merged[ $note_id ][ $item['kind'] . ':' . (int) $item['run'] ] = $item;
					}
				}
			}
			foreach ( $merged as $note_id => $items ) {
				$merged[ $note_id ] = array_values( $items );
			}
			return $merged;
		}

		/**
		 * Reads a revision's snapshot.
		 *
		 * @param int $revision_id Revision ID.
		 * @return array<int, array[]> Items per note id.
		 */
		private static function read_snapshot( $revision_id ) {
			$decoded = json_decode( (string) get_metadata( 'post', $revision_id, '_wp_suggestion_snapshot', true ), true );
			if ( ! is_array( $decoded ) || ! isset( $decoded['notes'] ) || ! is_array( $decoded['notes'] ) ) {
				return array();
			}
			$items = array();
			foreach ( $decoded['notes'] as $note_id => $list ) {
				$list = Gutenberg_Suggestion_Content::decode( wp_json_encode( $list ) );
				if ( $list ) {
					$items[ (int) $note_id ] = $list;
				}
			}
			return $items;
		}

		/**
		 * Encodes a revision snapshot.
		 *
		 * @param array<int, array[]> $items Items per note id.
		 * @return string JSON.
		 */
		private static function encode_snapshot( $items ) {
			$notes = array();
			foreach ( $items as $note_id => $list ) {
				$notes[ (string) $note_id ] = json_decode( Gutenberg_Suggestion_Content::encode( $list ), true );
			}
			return (string) wp_json_encode( array( 'notes' => $notes ) );
		}

		/**
		 * Unions two anchor indexes.
		 *
		 * @param array $a Index.
		 * @param array $b Index.
		 * @return array Index.
		 */
		private static function merge_indexes( $a, $b ) {
			foreach ( $b as $note_id => $kinds ) {
				$a[ $note_id ] = isset( $a[ $note_id ] ) ? $a[ $note_id ] + $kinds : $kinds;
			}
			return $a;
		}

		/**
		 * The status of a note, `pending` when unset.
		 *
		 * @param int $note_id Note ID.
		 * @return string
		 */
		private static function status_of( $note_id ) {
			$status = (string) get_comment_meta( $note_id, '_wp_suggestion_status', true );
			return '' === $status ? 'pending' : $status;
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
		 * Whether a post holds every value a post-field suggestion proposes.
		 *
		 * @param WP_Post $post    Post.
		 * @param array   $payload Decoded payload.
		 * @return bool
		 */
		private static function post_holds_proposal( $post, $payload ) {
			$fields = array(
				'title'   => 'post_title',
				'excerpt' => 'post_excerpt',
				'slug'    => 'post_name',
			);
			$found  = false;
			foreach ( $payload['operations'] as $operation ) {
				if ( ! is_array( $operation ) || ! isset( $operation['type'], $operation['attribute'] ) || 'post-attribute-set' !== $operation['type'] || ! array_key_exists( 'after', $operation ) ) {
					continue;
				}
				$found     = true;
				$attribute = $operation['attribute'];
				$after     = $operation['after'];
				if ( isset( $fields[ $attribute ] ) ) {
					if ( ! is_string( $after ) || $post->{ $fields[ $attribute ] } !== $after ) {
						return false;
					}
					continue;
				}
				if ( 'featured_media' === $attribute ) {
					if ( (int) get_post_thumbnail_id( $post ) !== (int) $after ) {
						return false;
					}
					continue;
				}
				if ( 'meta' === $attribute ) {
					$key = isset( $operation['key'] ) && is_string( $operation['key'] ) ? $operation['key'] : '';
					if ( '' === $key || ! self::values_match( get_post_meta( $post->ID, $key, true ), $after ) ) {
						return false;
					}
					continue;
				}
				if ( ! self::post_holds_terms( $post, $attribute, $after ) ) {
					return false;
				}
			}
			return $found;
		}

		/**
		 * Whether a post's terms in the taxonomy exposed as `$rest_base` are
		 * exactly the proposed ones (term ids, or `{ name }` for a term the
		 * proposal creates).
		 *
		 * @param WP_Post $post      Post.
		 * @param string  $rest_base Taxonomy REST base.
		 * @param mixed   $proposed  Proposed terms.
		 * @return bool
		 */
		private static function post_holds_terms( $post, $rest_base, $proposed ) {
			if ( ! is_array( $proposed ) ) {
				return false;
			}
			foreach ( get_object_taxonomies( $post->post_type, 'objects' ) as $taxonomy ) {
				if ( empty( $taxonomy->show_in_rest ) || ( $taxonomy->rest_base ? $taxonomy->rest_base : $taxonomy->name ) !== $rest_base ) {
					continue;
				}
				$terms = wp_get_object_terms( $post->ID, $taxonomy->name );
				if ( is_wp_error( $terms ) || count( $terms ) !== count( $proposed ) ) {
					return false;
				}
				$ids   = wp_list_pluck( $terms, 'term_id' );
				$names = array_map( 'strtolower', wp_list_pluck( $terms, 'name' ) );
				foreach ( $proposed as $term ) {
					if ( is_int( $term ) ? ! in_array( $term, $ids, true ) : ! ( is_array( $term ) && isset( $term['name'] ) && in_array( strtolower( (string) $term['name'] ), $names, true ) ) ) {
						return false;
					}
				}
				return true;
			}
			return false;
		}

		/**
		 * Loose comparison of a stored meta value with a proposed one.
		 *
		 * @param mixed $stored   Stored value.
		 * @param mixed $proposed Proposed value.
		 * @return bool
		 */
		private static function values_match( $stored, $proposed ) {
			if ( is_scalar( $proposed ) || null === $proposed ) {
				$expected = is_bool( $proposed ) ? ( $proposed ? '1' : '' ) : (string) $proposed;
				return is_scalar( $stored ) && strval( $stored ) === $expected;
			}
			return maybe_serialize( $stored ) === maybe_serialize( $proposed );
		}

		/**
		 * Writes a final status and resolves the note.
		 *
		 * The note keeps its thread; its comment status goes `approved`, the same
		 * resolved state a reviewer's manual resolve gives it. A decided note's
		 * stored proposal is dropped: it is now real content, or gone.
		 *
		 * @param int    $note_id Note ID.
		 * @param string $status  Final status.
		 * @param int    $user_id User whose write resolved it.
		 */
		private static function resolve( $note_id, $status, $user_id ) {
			update_comment_meta( $note_id, '_wp_suggestion_status', $status );
			update_comment_meta( $note_id, '_wp_suggestion_resolved_by', $user_id );
			if ( 'outdated' !== $status ) {
				delete_comment_meta( $note_id, '_wp_suggestion_content' );
				delete_comment_meta( $note_id, '_wp_suggestion_extraction_skipped' );
			}
			wp_set_comment_status( $note_id, 'approve' );
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
