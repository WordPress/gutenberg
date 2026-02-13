<?php
/**
 * WP_Sync_Storage interface
 *
 * @package gutenberg
 */

if ( ! interface_exists( 'WP_Sync_Storage' ) ) {

	interface WP_Sync_Storage {
		/**
		 * Initializes the storage mechanism.
		 *
		 * @since 7.0.0
		 */
		public function init(): void;

		/**
		 * Adds a sync update to a given room.
		 *
		 * @since 7.0.0
		 *
		 * @param string $room   Room identifier.
		 * @param mixed  $update Serializable sync update, opaque to the storage implementation.
		 */
		public function add_update( string $room, mixed $update ): void;

		/**
		 * Gets awareness state for a given room.
		 *
		 * @since 7.0.0
		 *
		 * @param string $room Room identifier.
		 * @return array<int, mixed> Awareness state.
		 */
		public function get_awareness_state( string $room ): array;

		/**
		 * Get the current cursor for a given room. This should return a monotonically
		 * increasing integer that represents the last update that was returned for the
		 * room during the current request. This allows clients to retrieve updates
		 * after a specific cursor on subsequent requests.
		 *
		 * @since 7.0.0
		 *
		 * @param string $room Room identifier.
		 * @return int Current cursor for the room.
		 */
		public function get_cursor( string $room ): int;

		/**
		 * Gets the total number of stored updates for a given room.
		 *
		 * @since 7.0.0
		 *
		 * @param string $room Room identifier.
		 * @return int Total number of updates.
		 */
		public function get_update_count( string $room ): int;

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
		public function get_updates_after_cursor( string $room, int $cursor ): array;

		/**
		 * Removes updates from a room that are older than the provided cursor.
		 *
		 * @since 7.0.0
		 *
		 * @param string $room   Room identifier.
		 * @param int    $cursor Remove updates with markers < this cursor.
		 */
		public function remove_updates_before_cursor( string $room, int $cursor ): void;

		/**
		 * Sets awareness state for a given room.
		 *
		 * @since 7.0.0
		 *
		 * @param string            $room      Room identifier.
		 * @param array<int, mixed> $awareness Serializable awareness state.
		 */
		public function set_awareness_state( string $room, array $awareness ): void;
	}
}
