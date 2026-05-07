<?php
/**
 * WP_Collaboration_Storage interface
 *
 * @package gutenberg
 */

if ( ! interface_exists( 'WP_Collaboration_Storage' ) ) {

	/**
	 * Interface for storing and retrieving updates and awareness
	 * data during a collaborative session.
	 *
	 * @phpstan-type AwarenessState array{client_id: string, state: array<mixed, mixed>, user_id: int, timestamp: int}
	 */
	interface WP_Collaboration_Storage {
		/**
		 * Adds a sync update to a given room.
		 *
		 * @since 7.0.0
		 *
		 * @param string $room   Room identifier.
		 * @param mixed  $update Update data.
		 * @return bool True on success, false on failure.
		 */
		public function add_update( string $room, $update ): bool;

		/**
		 * Gets awareness state for a given room.
		 *
		 * @since 7.0.0
		 *
		 * @param string $room    Room identifier.
		 * @param int    $timeout Seconds before an awareness entry is considered expired.
		 * @return array<int, array> Awareness entries.
		 * @phpstan-return list<AwarenessState>
		 */
		public function get_awareness_state( string $room, int $timeout = 30 ): array;

		/**
		 * Gets the current cursor for a given room. This should return a monotonically
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
		 * Retrieves updates from a room after a given cursor.
		 *
		 * @since 7.0.0
		 *
		 * @param string $room   Room identifier.
		 * @param int    $cursor Return updates after this cursor.
		 * @return array<int, mixed> Sync updates.
		 */
		public function get_updates_after_cursor( string $room, int $cursor ): array;

		/**
		 * Removes updates from a room up to and including the given cursor.
		 *
		 * @since 7.0.0
		 *
		 * @param string $room   Room identifier.
		 * @param int    $cursor Remove updates up to and including this cursor.
		 * @return bool True on success, false on failure.
		 */
		public function remove_updates_through_cursor( string $room, int $cursor ): bool;

		/**
		 * Sets awareness state for a given client in a room.
		 *
		 * @since 7.0.0
		 *
		 * @param string               $room      Room identifier.
		 * @param string               $client_id Client identifier.
		 * @param array<string, mixed> $state     Serializable awareness state for this client.
		 * @param int                  $user_id   WordPress user ID that owns this client.
		 * @return bool True on success, false on failure.
		 */
		public function set_awareness_state( string $room, string $client_id, array $state, int $user_id ): bool;
	}
}
