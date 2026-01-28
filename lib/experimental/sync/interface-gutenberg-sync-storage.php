<?php
/**
 * Gutenberg_Sync_Storage interface
 *
 * @package Gutenberg
 */

interface Gutenberg_Sync_Storage {
	/**
	 * Initialize the storage mechanism.
	 */
	public function init(): void;

	/**
	 * Add a sync update to a given room.
	 *
	 * @param string $room   Room identifier.
	 * @param array  $update Sync update.
	 */
	public function add_update( string $room, array $update ): void;

	/**
	 * Retrieve sync updates for a given room.
	 *
	 * @param string $room Room identifier.
	 * @return array Array of sync updates.
	 */
	public function get_all_updates( string $room ): array;

	/**
	 * Get awareness state for a given room.
	 *
	 * @param string $room Room identifier.
	 * @return array Merged awarenessstate.
	 */
	public function get_awareness_state( string $room ): array;

	/**
	 * Remove all updates for a given room.
	 *
	 * @param string $room Room identifier.
	 */
	public function remove_all_updates( string $room ): void;

	/**
	 * Set awareness state for a given room.
	 *
	 * @param string $room Room identifier.
	 * @param array  $awareness Merged awareness state.
	 */
	public function set_awareness_state( string $room, array $awareness ): void;
}
