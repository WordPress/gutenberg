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
	 * Data is stored as post meta on a singleton post of a custom post type.
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
		 * Cache of cursors by room.
		 *
		 * @var array<string, int>
		 */
		private $room_cursors = array();

		/**
		 * Cache of update counts by room.
		 *
		 * @var array<string, int>
		 */
		private $room_update_counts = array();

		/**
		 * Singleton post ID for storing sync data.
		 *
		 * @var int|null
		 */
		private static ?int $storage_post_id = null;

		/**
		 * Initializer.
		 *
		 * @since 7.0.0
		 */
		public function init(): void {}

		/**
		 * Adds a sync update to a given room.
		 *
		 * @since 7.0.0
		 *
		 * @param string $room   Room identifier.
		 * @param mixed  $update Sync update.
		 */
		public function add_update( string $room, mixed $update ): void {
			$post_id  = $this->get_storage_post_id();
			$meta_key = $this->get_room_meta_key( $room );

			// Create an envelope and stamp each update to enable cursor-based filtering.
			$envelope = array(
				'timestamp' => $this->get_time_marker(),
				'value'     => $update,
			);

			add_post_meta( $post_id, $meta_key, $envelope, false );
		}

		/**
		 * Retrieve all sync updates for a given room.
		 *
		 * @param string $room Room identifier.
		 * @return array<mixed> Array of sync updates.
		 */
		private function get_all_updates( string $room ): array {
			$this->room_cursors[ $room ] = $this->get_time_marker() - 100; // Small buffer to ensure consistency.

			$post_id  = $this->get_storage_post_id();
			$meta_key = $this->get_room_meta_key( $room );
			$updates  = get_post_meta( $post_id, $meta_key, false );

			if ( ! is_array( $updates ) ) {
				$updates = array();
			}

			$this->room_update_counts[ $room ] = count( $updates );

			return $updates;
		}

		/**
		 * Gets awareness state for a given room.
		 *
		 * @since 7.0.0
		 *
		 * @param string $room Room identifier.
		 * @return array<int, mixed> Awareness state.
		 */
		public function get_awareness_state( string $room ): array {
			$post_id   = $this->get_storage_post_id();
			$meta_key  = $this->get_awareness_meta_key( $room );
			$awareness = get_post_meta( $post_id, $meta_key, true );

			if ( ! is_array( $awareness ) ) {
				return array();
			}

			return $awareness;
		}

		/**
		 * Sets awareness state for a given room.
		 *
		 * @since 7.0.0
		 *
		 * @param string            $room      Room identifier.
		 * @param array<int, mixed> $awareness Serializable awareness state.
		 */
		public function set_awareness_state( string $room, array $awareness ): void {
			$post_id  = $this->get_storage_post_id();
			$meta_key = $this->get_awareness_meta_key( $room );

			update_post_meta( $post_id, $meta_key, $awareness );
		}

		/**
		 * Gets the meta key for a room's awareness state.
		 *
		 * @param string $room Room identifier.
		 * @return string Meta key.
		 */
		private function get_awareness_meta_key( string $room ): string {
			return 'wp_sync_awareness_' . md5( $room );
		}

		/**
		 * Gets the current cursor for a given room.
		 *
		 * The cursor is set during get_updates_after_cursor() and represents the
		 * point in time just before the updates were retrieved, with a small buffer
		 * to ensure consistency.
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
		 * Gets the meta key for a room's updates.
		 *
		 * @param string $room Room identifier.
		 * @return string Meta key.
		 */
		private function get_room_meta_key( string $room ): string {
			return 'wp_sync_update_' . md5( $room );
		}

		/**
		 * Gets or creates the singleton post for storing sync data.
		 *
		 * @return int|null Post ID.
		 */
		private function get_storage_post_id(): ?int {
			if ( is_int( self::$storage_post_id ) ) {
				return self::$storage_post_id;
			}

			// Try to find existing post.
			$posts = get_posts(
				array(
					'post_type'      => self::POST_TYPE,
					'posts_per_page' => 1,
					'post_status'    => 'publish',
					'fields'         => 'ids',
					'order'          => 'ASC',
				)
			);

			// array_first not introduced until WP 6.9
			$post_id = $posts[0] ?? null;
			if ( is_int( $post_id ) ) {
				self::$storage_post_id = $post_id;
				return self::$storage_post_id;
			}

			// Create new post if none exists.
			$post_id = wp_insert_post(
				array(
					'post_type'   => self::POST_TYPE,
					'post_status' => 'publish',
					'post_title'  => 'Sync Storage',
				)
			);

			if ( is_int( $post_id ) ) {
				self::$storage_post_id = $post_id;
			}

			return self::$storage_post_id;
		}

		/**
		 * Gets the current time in milliseconds as a comparable time marker.
		 *
		 * @return int Current time in milliseconds.
		 */
		private function get_time_marker(): int {
			return floor( microtime( true ) * 1000 );
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
		 * Retrieves sync updates from a room for a given client and cursor. Updates
		 * from the specified client should be excluded.
		 *
		 * @since 7.0.0
		 *
		 * @param string $room   Room identifier.
		 * @param int    $cursor Return updates after this cursor.
		 * @return array<mixed> Array of sync updates.
		 */
		public function get_updates_after_cursor( string $room, int $cursor ): array {
			$all_updates = $this->get_all_updates( $room );
			$updates     = array();

			foreach ( $all_updates as $update ) {
				if ( $update['timestamp'] > $cursor ) {
					$updates[] = $update;
				}
			}

			// Sort by timestamp to ensure order.
			usort(
				$updates,
				function ( $a, $b ) {
					return ( $a['timestamp'] ?? 0 ) <=> ( $b['timestamp'] ?? 0 );
				}
			);

			return wp_list_pluck( $updates, 'value' );
		}

		/**
		 * Removes all sync updates for a given room.
		 *
		 * @param string $room Room identifier.
		 */
		private function remove_all_updates( string $room ): void {
			$post_id  = $this->get_storage_post_id();
			$meta_key = $this->get_room_meta_key( $room );

			delete_post_meta( $post_id, $meta_key );
		}

		/**
		 * Removes updates from a room that are older than the given cursor.
		 *
		 * @since 7.0.0
		 *
		 * @param string $room   Room identifier.
		 * @param int    $cursor Remove updates with markers < this cursor.
		 */
		public function remove_updates_before_cursor( string $room, int $cursor ): void {
			$all_updates = $this->get_all_updates( $room );
			$this->remove_all_updates( $room );

			$post_id  = $this->get_storage_post_id();
			$meta_key = $this->get_room_meta_key( $room );

			// Re-store envelopes directly to avoid double-wrapping by add_update().
			foreach ( $all_updates as $envelope ) {
				if ( $envelope['timestamp'] >= $cursor ) {
					add_post_meta( $post_id, $meta_key, $envelope, false );
				}
			}
		}
	}
}
