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

			$post_id = $this->get_storage_post_id( $room );
			if ( null === $post_id ) {
				return false;
			}

			// Use direct database operation to avoid cache invalidation performed by
			// post meta functions (`wp_cache_set_posts_last_changed()` and direct
			// `wp_cache_delete()` calls).
			return (bool) $wpdb->insert(
				$wpdb->postmeta,
				array(
					'post_id'    => $post_id,
					'meta_key'   => self::SYNC_UPDATE_META_KEY,
					'meta_value' => wp_json_encode( $update ),
				),
				array( '%d', '%s', '%s' )
			);
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

			$post_id = $this->get_storage_post_id( $room );
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
				return (bool) $wpdb->update(
					$wpdb->postmeta,
					array( 'meta_value' => wp_json_encode( $awareness ) ),
					array( 'meta_id' => $meta_id ),
					array( '%s' ),
					array( '%d' )
				);
			}

			return (bool) $wpdb->insert(
				$wpdb->postmeta,
				array(
					'post_id'    => $post_id,
					'meta_key'   => self::AWARENESS_META_KEY,
					'meta_value' => wp_json_encode( $awareness ),
				),
				array( '%d', '%s', '%s' )
			);
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
			 * a polyfill in WP 6.9 (see https://core.trac.wordpress.org/changeset/60672).
			 */
			$post_id = array_first( $posts );
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
		 * When this request receives a non-canonical post, redirect it to the
		 * canonical storage before any sync or awareness data is written.
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

			if ( $inserted_post_id !== $canonical_post_id ) {
				/*
				 * This request just created a duplicate empty storage post because
				 * another first writer won the exact-slug race. Delete only that
				 * just-created empty post and write this request's data to canonical
				 * storage.
				 *
				 * Do not merge or delete older duplicate storage posts here. A stale
				 * request may already hold a duplicate post ID, and MySQL advisory
				 * locks/raw transactions are not a reliable cross-server fence under
				 * HyperDB or database proxies. Future historical repair should be
				 * bounded and idempotent, or run out of band with primary-pinned
				 * verification and a grace period before deleting duplicates.
				 */
				wp_delete_post( $inserted_post_id, true );
			}

			return $canonical_post_id;
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

			if ( empty( $posts ) ) {
				return null;
			}

			return $posts[0];
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

			/*
			 * @todo Could this be replaced by {@see wp_update_post()}? Could we experience
			 *       a race with other posts having a different post type or post status?
			 */
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
