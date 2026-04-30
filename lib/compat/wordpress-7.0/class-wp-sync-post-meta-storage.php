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
		const AWARENESS_META_KEY = 'wp_sync_awareness';
		const SYNC_UPDATE_META_KEY = 'wp_sync_update';
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

			$meta_id = add_post_meta( $post_id, self::SYNC_UPDATE_META_KEY, $update, false );

			return (bool) $meta_id;
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
			$awareness = get_post_meta( $post_id, self::AWARENESS_META_KEY, true );

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

			// update_post_meta returns false if the value is the same as the existing value.
			update_post_meta( $post_id, self::AWARENESS_META_KEY, $awareness );
			return true;
		}

		/**
		 * Gets the current cursor for a given room.
		 *
		 * The cursor is set during get_updates_after_cursor() and represents the
		 * point in time just before the updates were retrieved, with a small buffer
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
				)
			);

			$post_id = array_first( $posts );
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
		 *
		 * @since 7.0.0
		 *
		 * @param string $room   Room identifier.
		 * @param int    $cursor Return updates after this cursor.
		 * @return array<mixed> Array of sync updates.
		 */
		public function get_updates_after_cursor( string $room, int $cursor ): array {
			$all_updates = $this->get_all_updates( $room );

			foreach ( $all_updates as $update ) {
				if ( $update['timestamp'] > $cursor ) {
					$updates[] = $update;
				}
			}

			// Sort by timestamp to ensure order.
			usort(
				$updates,
				fn ( $a, $b ) => $a['timestamp'] <=> $b['timestamp']
			);

			return wp_list_pluck( $updates, 'value' );
				$updates[] = maybe_unserialize( $row->meta_value );
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

			$all_updates = $this->get_all_updates( $room );
			$meta_key = $this->get_room_meta_key( $room );
			// Remove all updates for the room and re-store only those that are newer than the cursor.

			// Re-store envelopes directly to avoid double-wrapping by add_update().
		}
	}
}
