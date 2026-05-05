<?php
/**
 * WP_Sync_Post_Meta_Storage class
 *
 * @package gutenberg
 */

if ( ! class_exists( 'WP_Sync_Post_Meta_Storage' ) ) {

	/**
	 * Core class that provides an interface for storing and retrieving sync
	 * updates and awareness data during a collaborative session.
	 *
	 * Data is stored as post meta on a dedicated post per room of a custom post type.
	 *
	 * @since 7.0.0
	 *
	 * @access private
	 */
	class WP_Sync_Post_Meta_Storage implements WP_Sync_Storage {
		/**
		 * Post type for sync storage.
		 *
		 * @since 7.0.0
		 * @var string
		 */
		const POST_TYPE = 'wp_sync_storage';

		/**
		 * Meta key for awareness state.
		 *
		 * @since 7.0.0
		 * @var string
		 */
		const AWARENESS_META_KEY = 'wp_sync_awareness_state';

		/**
		 * Meta key for sync updates.
		 *
		 * @since 7.0.0
		 * @var string
		 */
		const SYNC_UPDATE_META_KEY = 'wp_sync_update_data';

		/**
		 * Cache of cursors by room.
		 *
		 * @since 7.0.0
		 * @var array<string, int>
		 */
		private array $room_cursors = array();

		/**
		 * Cache of update counts by room.
		 *
		 * @since 7.0.0
		 * @var array<string, int>
		 */
		private array $room_update_counts = array();

		/**
		 * Cache of storage post IDs by room hash.
		 *
		 * @since 7.0.0
		 * @var array<string, int>
		 */
		private static array $storage_post_ids = array();

		/**
		 * Adds a sync update to a given room.
		 *
		 * @since 7.0.0
		 *
		 * @global wpdb $wpdb WordPress database abstraction object.
		 *
		 * @param string $room   Room identifier.
		 * @param mixed  $update Sync update.
		 * @return bool True on success, false on failure.
		 */
		public function add_update( string $room, $update ): bool {
			global $wpdb;

			$room_hash = md5( $room );
			$post_id   = $this->get_storage_post_id( $room );
			if ( null === $post_id ) {
				return false;
			}

			// Use direct database operation to avoid cache invalidation performed by
			// post meta functions (`wp_cache_set_posts_last_changed()` and direct
			// `wp_cache_delete()` calls).
			$result = $wpdb->insert(
				$wpdb->postmeta,
				array(
					'post_id'    => $post_id,
					'meta_key'   => self::SYNC_UPDATE_META_KEY,
					'meta_value' => wp_json_encode( $update ),
				),
				array( '%d', '%s', '%s' )
			);

			if ( $result ) {
				self::$storage_post_ids[ $room_hash ] = $this->merge_duplicate_storage_posts( $room_hash, $post_id );
			}

			return (bool) $result;
		}

		/**
		 * Gets awareness state for a given room.
		 *
		 * @since 7.0.0
		 *
		 * @global wpdb $wpdb WordPress database abstraction object.
		 *
		 * @param string $room Room identifier.
		 * @return array<int, mixed> Awareness state.
		 */
		public function get_awareness_state( string $room ): array {
			global $wpdb;

			$post_id = $this->get_storage_post_id( $room );
			if ( null === $post_id ) {
				return array();
			}

			// Use direct database operation to avoid updating the post meta cache.
			// ORDER BY meta_id DESC ensures the latest row wins if duplicates exist
			// from a past race condition in set_awareness_state().
			$meta_value = $wpdb->get_var(
				$wpdb->prepare(
					"SELECT meta_value FROM $wpdb->postmeta WHERE post_id = %d AND meta_key = %s ORDER BY meta_id DESC LIMIT 1",
					$post_id,
					self::AWARENESS_META_KEY
				)
			);

			if ( null === $meta_value ) {
				return array();
			}

			$awareness = json_decode( $meta_value, true );

			if ( ! is_array( $awareness ) ) {
				return array();
			}

			return array_values( $awareness );
		}

		/**
		 * Sets awareness state for a given room.
		 *
		 * @since 7.0.0
		 *
		 * @global wpdb $wpdb WordPress database abstraction object.
		 *
		 * @param string            $room      Room identifier.
		 * @param array<int, mixed> $awareness Serializable awareness state.
		 * @return bool True on success, false on failure.
		 */
		public function set_awareness_state( string $room, array $awareness ): bool {
			global $wpdb;

			$room_hash = md5( $room );
			$post_id   = $this->get_storage_post_id( $room );
			if ( null === $post_id ) {
				return false;
			}

			// Use direct database operation to avoid cache invalidation performed by
			// post meta functions (`wp_cache_set_posts_last_changed()` and direct
			// `wp_cache_delete()` calls).
			//
			// If two concurrent requests both see no row and both INSERT, the
			// duplicate is harmless: get_awareness_state() reads the latest row
			// (ORDER BY meta_id DESC).
			$meta_id = $wpdb->get_var(
				$wpdb->prepare(
					"SELECT meta_id FROM $wpdb->postmeta WHERE post_id = %d AND meta_key = %s ORDER BY meta_id DESC LIMIT 1",
					$post_id,
					self::AWARENESS_META_KEY
				)
			);

			if ( $meta_id ) {
				$result = $wpdb->update(
					$wpdb->postmeta,
					array( 'meta_value' => wp_json_encode( $awareness ) ),
					array( 'meta_id' => $meta_id ),
					array( '%s' ),
					array( '%d' )
				);

				if ( false !== $result ) {
					self::$storage_post_ids[ $room_hash ] = $this->merge_duplicate_storage_posts( $room_hash, $post_id );
				}

				return false !== $result;
			}

			$result = $wpdb->insert(
				$wpdb->postmeta,
				array(
					'post_id'    => $post_id,
					'meta_key'   => self::AWARENESS_META_KEY,
					'meta_value' => wp_json_encode( $awareness ),
				),
				array( '%d', '%s', '%s' )
			);

			if ( $result ) {
				self::$storage_post_ids[ $room_hash ] = $this->merge_duplicate_storage_posts( $room_hash, $post_id );
			}

			return (bool) $result;
		}

		/**
		 * Gets the current cursor for a given room.
		 *
		 * The cursor is set during get_updates_after_cursor() and represents the
		 * highest meta_id seen for the room's sync updates.
		 *
		 * @since 7.0.0
		 *
		 * @param string $room Room identifier.
		 * @return int Current cursor for the room.
		 */
		public function get_cursor( string $room ): int {
			return $this->room_cursors[ $room ] ?? 0;
		}

		/**
		 * Gets or creates the storage post for a given room.
		 *
		 * Each room gets its own dedicated post so that post meta cache
		 * invalidation is scoped to a single room rather than all of them.
		 *
		 * @since 7.0.0
		 *
		 * @param string $room Room identifier.
		 * @return int|null Post ID.
		 */
		private function get_storage_post_id( string $room ): ?int {
			$room_hash = md5( $room );

			if ( isset( self::$storage_post_ids[ $room_hash ] ) ) {
				return self::$storage_post_ids[ $room_hash ];
			}

			// Try to find an existing post for this room.
			$posts = get_posts(
				array(
					'post_type'      => self::POST_TYPE,
					'posts_per_page' => 1,
					'post_status'    => 'publish',
					'name'           => $room_hash,
					'fields'         => 'ids',
					'orderby'        => 'ID',
					'order'          => 'ASC',
				)
			);

			/*
			 * array_first() is a PHP 8.5 function. WordPress added
			 * a polyfill in WP 6.9 (see https://core.trac.wordpress.org/ticket/63853).
			 * Since Gutenberg must support the two most recent WordPress
			 * versions (currently 6.8+), we cannot rely on it here.
			 */
			$post_id = $posts[0] ?? null;
			if ( is_int( $post_id ) ) {
				self::$storage_post_ids[ $room_hash ] = $post_id;
				return $post_id;
			}

			// Create new post for this room.
			$post_id = wp_insert_post(
				array(
					'post_type'   => self::POST_TYPE,
					'post_status' => 'publish',
					'post_title'  => 'Sync Storage',
					'post_name'   => $room_hash,
				)
			);

			if ( is_int( $post_id ) && $post_id > 0 ) {
				$canonical_post_id = $this->resolve_canonical_storage_post_id_after_insert( $room_hash, $post_id );
				if ( null === $canonical_post_id ) {
					return null;
				}

				self::$storage_post_ids[ $room_hash ] = $canonical_post_id;
				return $canonical_post_id;
			}

			return null;
		}

		/**
		 * Resolves the canonical room storage post after inserting a new post.
		 *
		 * Two concurrent first writers can both miss the lookup above and create
		 * storage posts for the same room hash. Depending on the exact interleaving,
		 * WordPress may create either a duplicate exact slug or a suffixed slug.
		 * When that happens, merge everything back into one canonical lineage.
		 *
		 * @since 7.0.0
		 *
		 * @param string $room_hash        MD5 hash of the room identifier.
		 * @param int    $inserted_post_id Post ID returned by wp_insert_post().
		 * @return int|null Canonical storage post ID.
		 */
		private function resolve_canonical_storage_post_id_after_insert( string $room_hash, int $inserted_post_id ): ?int {
			$canonical_post_id = $this->find_canonical_storage_post_id( $room_hash );
			if ( null === $canonical_post_id ) {
				$canonical_post_id = $this->promote_storage_post_to_canonical_slug( $room_hash, $inserted_post_id );
			}

			if ( null === $canonical_post_id ) {
				wp_delete_post( $inserted_post_id, true );
				return null;
			}

			return $this->merge_duplicate_storage_posts( $room_hash, $canonical_post_id );
		}

		/**
		 * Merges duplicate storage posts created by a first-access race.
		 *
		 * @since 7.0.0
		 *
		 * @param string $room_hash         MD5 hash of the room identifier.
		 * @param int    $canonical_post_id Preferred post ID that should own the room.
		 * @return int Canonical storage post ID.
		 */
		private function merge_duplicate_storage_posts( string $room_hash, int $canonical_post_id ): int {
			$storage_post_ids = $this->get_storage_post_ids_for_room_hash( $room_hash );
			if ( empty( $storage_post_ids ) ) {
				return $canonical_post_id;
			}

			$exact_post_id = $this->find_canonical_storage_post_id( $room_hash );
			if ( null === $exact_post_id ) {
				$canonical_post_id = in_array( $canonical_post_id, $storage_post_ids, true ) ? $canonical_post_id : (int) $storage_post_ids[0];
				$promoted_post_id  = $this->promote_storage_post_to_canonical_slug( $room_hash, $canonical_post_id );
				if ( null === $promoted_post_id ) {
					return $canonical_post_id;
				}

				$canonical_post_id = $promoted_post_id;
				$storage_post_ids  = $this->get_storage_post_ids_for_room_hash( $room_hash );
			} else {
				$canonical_post_id = $exact_post_id;
			}

			foreach ( $storage_post_ids as $duplicate_id ) {
				if ( $canonical_post_id === $duplicate_id ) {
					continue;
				}

				if ( ! $this->merge_duplicate_storage_post_meta( $canonical_post_id, $duplicate_id ) ) {
					continue;
				}

				wp_delete_post( $duplicate_id, true );
			}

			return $canonical_post_id;
		}

		/**
		 * Merges post meta from a duplicate storage post into the canonical post.
		 *
		 * Sync updates use postmeta.meta_id as a cursor. Moving old rows in place
		 * would keep their old meta_id values and hide them from active readers
		 * that already advanced past those IDs, so updates are appended as new rows.
		 *
		 * @since 7.0.0
		 *
		 * @param int $canonical_post_id Canonical storage post ID.
		 * @param int $duplicate_id      Duplicate storage post ID.
		 * @return bool True when the duplicate can be deleted, false otherwise.
		 */
		private function merge_duplicate_storage_post_meta( int $canonical_post_id, int $duplicate_id ): bool {
			global $wpdb;

			if ( ! $this->acquire_duplicate_storage_merge_lock( $duplicate_id ) ) {
				return false;
			}

			$transaction_started = false;
			$committed           = false;

			try {
				if ( false === $wpdb->query( 'START TRANSACTION' ) ) {
					return false;
				}

				$transaction_started = true;
				$max_meta_id         = $this->get_duplicate_sync_update_max_meta_id( $duplicate_id );
				if ( null === $max_meta_id ) {
					return false;
				}

				if (
					! $this->append_duplicate_sync_updates( $canonical_post_id, $duplicate_id, $max_meta_id ) ||
					! $this->delete_duplicate_sync_updates( $duplicate_id, $max_meta_id ) ||
					! $this->move_duplicate_non_update_meta( $canonical_post_id, $duplicate_id )
				) {
					return false;
				}

				if ( false === $wpdb->query( 'COMMIT' ) ) {
					return false;
				}

				$committed             = true;
				$has_remaining_updates = $this->duplicate_has_sync_updates( $duplicate_id );
				return false === $has_remaining_updates;
			} finally {
				if ( $transaction_started && ! $committed ) {
					$wpdb->query( 'ROLLBACK' );
				}

				$this->release_duplicate_storage_merge_lock( $duplicate_id );
			}
		}

		/**
		 * Acquires a short-lived database lock for merging a duplicate storage post.
		 *
		 * @since 7.0.0
		 *
		 * @global wpdb $wpdb WordPress database abstraction object.
		 *
		 * @param int $duplicate_id Duplicate storage post ID.
		 * @return bool True if the lock was acquired, false otherwise.
		 */
		private function acquire_duplicate_storage_merge_lock( int $duplicate_id ): bool {
			global $wpdb;

			$lock_result = $wpdb->get_var(
				$wpdb->prepare(
					'SELECT GET_LOCK( %s, 0 )',
					$this->get_duplicate_storage_merge_lock_name( $duplicate_id )
				)
			);

			return '1' === (string) $lock_result;
		}

		/**
		 * Releases the database lock for merging a duplicate storage post.
		 *
		 * @since 7.0.0
		 *
		 * @global wpdb $wpdb WordPress database abstraction object.
		 *
		 * @param int $duplicate_id Duplicate storage post ID.
		 */
		private function release_duplicate_storage_merge_lock( int $duplicate_id ): void {
			global $wpdb;

			$wpdb->get_var(
				$wpdb->prepare(
					'SELECT RELEASE_LOCK( %s )',
					$this->get_duplicate_storage_merge_lock_name( $duplicate_id )
				)
			);
		}

		/**
		 * Gets the database lock name for merging a duplicate storage post.
		 *
		 * @since 7.0.0
		 *
		 * @param int $duplicate_id Duplicate storage post ID.
		 * @return string Database lock name.
		 */
		private function get_duplicate_storage_merge_lock_name( int $duplicate_id ): string {
			return 'wp_sync_storage_merge_' . $duplicate_id;
		}

		/**
		 * Gets the highest sync update meta ID currently stored on a duplicate post.
		 *
		 * @since 7.0.0
		 *
		 * @global wpdb $wpdb WordPress database abstraction object.
		 *
		 * @param int $duplicate_id Duplicate storage post ID.
		 * @return int|null Highest sync update meta ID, or null on failure.
		 */
		private function get_duplicate_sync_update_max_meta_id( int $duplicate_id ): ?int {
			global $wpdb;

			$max_meta_id = $wpdb->get_var(
				$wpdb->prepare(
					"SELECT COALESCE( MAX(meta_id), 0 )
					FROM {$wpdb->postmeta}
					WHERE post_id = %d
						AND meta_key = %s",
					$duplicate_id,
					self::SYNC_UPDATE_META_KEY
				)
			);

			return is_numeric( $max_meta_id ) ? (int) $max_meta_id : null;
		}

		/**
		 * Moves duplicate non-update metadata to the canonical storage post.
		 *
		 * Non-update metadata, such as awareness snapshots, does not use meta_id
		 * as a delivery cursor, so it can be moved without creating cursor gaps.
		 *
		 * @since 7.0.0
		 *
		 * @global wpdb $wpdb WordPress database abstraction object.
		 *
		 * @param int $canonical_post_id Canonical storage post ID.
		 * @param int $duplicate_id      Duplicate storage post ID.
		 * @return bool True on success, false on failure.
		 */
		private function move_duplicate_non_update_meta( int $canonical_post_id, int $duplicate_id ): bool {
			global $wpdb;

			$move_result = $wpdb->query(
				$wpdb->prepare(
					"UPDATE {$wpdb->postmeta}
					SET post_id = %d
					WHERE post_id = %d
						AND ( meta_key IS NULL OR meta_key <> %s )",
					$canonical_post_id,
					$duplicate_id,
					self::SYNC_UPDATE_META_KEY
				)
			);

			return false !== $move_result;
		}

		/**
		 * Appends duplicate sync updates to the canonical storage post.
		 *
		 * The source rows are read in meta_id order up to a bounded high-water
		 * mark and inserted as new postmeta rows, giving every repaired update a
		 * fresh cursor greater than any cursor an active reader could have
		 * observed before the repair.
		 *
		 * @since 7.0.0
		 *
		 * @global wpdb $wpdb WordPress database abstraction object.
		 *
		 * @param int $canonical_post_id Canonical storage post ID.
		 * @param int $duplicate_id      Duplicate storage post ID.
		 * @param int $max_meta_id       Highest source meta ID to append.
		 * @return bool True on success, false on failure.
		 */
		private function append_duplicate_sync_updates( int $canonical_post_id, int $duplicate_id, int $max_meta_id ): bool {
			global $wpdb;

			$append_result = $wpdb->query(
				$wpdb->prepare(
					"INSERT INTO {$wpdb->postmeta} ( post_id, meta_key, meta_value )
					SELECT %d, meta_key, meta_value
					FROM {$wpdb->postmeta}
					WHERE post_id = %d
						AND meta_key = %s
						AND meta_id <= %d
					ORDER BY meta_id ASC",
					$canonical_post_id,
					$duplicate_id,
					self::SYNC_UPDATE_META_KEY,
					$max_meta_id
				)
			);

			return false !== $append_result;
		}

		/**
		 * Deletes duplicate sync updates after they have been appended.
		 *
		 * Only rows up to the append high-water mark are deleted. If another
		 * writer adds rows to the duplicate after the repair starts, those rows
		 * remain on the duplicate post for a later repair attempt.
		 *
		 * @since 7.0.0
		 *
		 * @global wpdb $wpdb WordPress database abstraction object.
		 *
		 * @param int $duplicate_id Duplicate storage post ID.
		 * @param int $max_meta_id  Highest source meta ID that was appended.
		 * @return bool True on success, false on failure.
		 */
		private function delete_duplicate_sync_updates( int $duplicate_id, int $max_meta_id ): bool {
			global $wpdb;

			$delete_result = $wpdb->query(
				$wpdb->prepare(
					"DELETE FROM {$wpdb->postmeta}
					WHERE post_id = %d
						AND meta_key = %s
						AND meta_id <= %d",
					$duplicate_id,
					self::SYNC_UPDATE_META_KEY,
					$max_meta_id
				)
			);

			return false !== $delete_result;
		}

		/**
		 * Checks whether a duplicate storage post still has sync updates.
		 *
		 * @since 7.0.0
		 *
		 * @global wpdb $wpdb WordPress database abstraction object.
		 *
		 * @param int $duplicate_id Duplicate storage post ID.
		 * @return bool|null True if sync updates remain, false if none remain, or null on failure.
		 */
		private function duplicate_has_sync_updates( int $duplicate_id ): ?bool {
			global $wpdb;

			$meta_id = $wpdb->get_var(
				$wpdb->prepare(
					"SELECT meta_id
					FROM {$wpdb->postmeta}
					WHERE post_id = %d
						AND meta_key = %s
					LIMIT 1",
					$duplicate_id,
					self::SYNC_UPDATE_META_KEY
				)
			);

			if ( null === $meta_id && '' !== $wpdb->last_error ) {
				return null;
			}

			return null !== $meta_id;
		}

		/**
		 * Finds the canonical storage post for a room hash.
		 *
		 * The canonical post is the oldest published storage post with the exact
		 * room hash slug. Suffixed slugs are repair candidates, not canonical.
		 *
		 * @since 7.0.0
		 *
		 * @param string $room_hash MD5 hash of the room identifier.
		 * @return int|null Canonical storage post ID.
		 */
		private function find_canonical_storage_post_id( string $room_hash ): ?int {
			global $wpdb;

			$post_id = $wpdb->get_var(
				$wpdb->prepare(
					"SELECT ID FROM {$wpdb->posts} WHERE post_type = %s AND post_status = 'publish' AND post_name = %s ORDER BY ID ASC LIMIT 1",
					self::POST_TYPE,
					$room_hash
				)
			);

			return is_numeric( $post_id ) ? (int) $post_id : null;
		}

		/**
		 * Promotes a storage post to the canonical room slug.
		 *
		 * @since 7.0.0
		 *
		 * @param string $room_hash MD5 hash of the room identifier.
		 * @param int    $post_id   Post ID to promote.
		 * @return int|null Promoted post ID on success.
		 */
		private function promote_storage_post_to_canonical_slug( string $room_hash, int $post_id ): ?int {
			global $wpdb;

			$result = $wpdb->update(
				$wpdb->posts,
				array( 'post_name' => $room_hash ),
				array(
					'ID'          => $post_id,
					'post_type'   => self::POST_TYPE,
					'post_status' => 'publish',
				),
				array( '%s' ),
				array( '%d', '%s', '%s' )
			);

			if ( false === $result ) {
				return null;
			}

			clean_post_cache( $post_id );
			return $post_id;
		}

		/**
		 * Lists storage posts belonging to a room hash, including suffixed duplicates.
		 *
		 * @since 7.0.0
		 *
		 * @param string $room_hash MD5 hash of the room identifier.
		 * @return array<int> Storage post IDs.
		 */
		private function get_storage_post_ids_for_room_hash( string $room_hash ): array {
			global $wpdb;

			$post_ids = $wpdb->get_col(
				$wpdb->prepare(
					"SELECT ID FROM {$wpdb->posts}
					WHERE post_type = %s
						AND post_status = 'publish'
						AND ( post_name = %s OR post_name LIKE %s )
					ORDER BY ID ASC",
					self::POST_TYPE,
					$room_hash,
					$wpdb->esc_like( $room_hash . '-' ) . '%'
				)
			);

			return array_map( 'intval', $post_ids );
		}

		/**
		 * Gets the number of updates stored for a given room.
		 *
		 * @since 7.0.0
		 *
		 * @param string $room Room identifier.
		 * @return int Number of updates stored for the room.
		 */
		public function get_update_count( string $room ): int {
			return $this->room_update_counts[ $room ] ?? 0;
		}

		/**
		 * Retrieves sync updates from a room after the given cursor.
		 *
		 * @since 7.0.0
		 *
		 * @global wpdb $wpdb WordPress database abstraction object.
		 *
		 * @param string $room   Room identifier.
		 * @param int    $cursor Return updates after this cursor (meta_id).
		 * @return array<int, mixed> Sync updates.
		 */
		public function get_updates_after_cursor( string $room, int $cursor ): array {
			global $wpdb;

			$post_id = $this->get_storage_post_id( $room );
			if ( null === $post_id ) {
				$this->room_cursors[ $room ]       = 0;
				$this->room_update_counts[ $room ] = 0;
				return array();
			}

			// Capture the current room state first so the returned cursor is race-safe.
			$stats = $wpdb->get_row(
				$wpdb->prepare(
					"SELECT COUNT(*) AS total_updates, COALESCE( MAX(meta_id), 0 ) AS max_meta_id FROM {$wpdb->postmeta} WHERE post_id = %d AND meta_key = %s",
					$post_id,
					self::SYNC_UPDATE_META_KEY
				)
			);

			$total_updates = $stats ? (int) $stats->total_updates : 0;
			$max_meta_id   = $stats ? (int) $stats->max_meta_id : 0;

			$this->room_update_counts[ $room ] = $total_updates;
			$this->room_cursors[ $room ]       = $max_meta_id;

			if ( $max_meta_id <= $cursor ) {
				return array();
			}

			$rows = $wpdb->get_results(
				$wpdb->prepare(
					"SELECT meta_value FROM {$wpdb->postmeta} WHERE post_id = %d AND meta_key = %s AND meta_id > %d AND meta_id <= %d ORDER BY meta_id ASC",
					$post_id,
					self::SYNC_UPDATE_META_KEY,
					$cursor,
					$max_meta_id
				)
			);

			if ( ! $rows ) {
				return array();
			}

			$updates = array();
			foreach ( $rows as $row ) {
				$decoded = json_decode( $row->meta_value, true );
				if ( null !== $decoded ) {
					$updates[] = $decoded;
				}
			}

			return $updates;
		}

		/**
		 * Removes updates from a room that are older than the given cursor.
		 *
		 * @since 7.0.0
		 *
		 * @global wpdb $wpdb WordPress database abstraction object.
		 *
		 * @param string $room   Room identifier.
		 * @param int    $cursor Remove updates with meta_id < this cursor.
		 * @return bool True on success, false on failure.
		 */
		public function remove_updates_before_cursor( string $room, int $cursor ): bool {
			global $wpdb;

			$post_id = $this->get_storage_post_id( $room );
			if ( null === $post_id ) {
				return false;
			}

			$deleted_rows = $wpdb->query(
				$wpdb->prepare(
					"DELETE FROM {$wpdb->postmeta} WHERE post_id = %d AND meta_key = %s AND meta_id < %d",
					$post_id,
					self::SYNC_UPDATE_META_KEY,
					$cursor
				)
			);

			if ( false === $deleted_rows ) {
				return false;
			}

			return true;
		}
	}
}
