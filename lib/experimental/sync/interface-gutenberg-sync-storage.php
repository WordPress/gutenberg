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
	 * Add a sync message to a given room.
	 *
	 * @param string $room Room identifier.
	 * @param array  $message Sync message.
	 */
	public function add_message_to_room( string $room, array $message ): void;

	/**
	 * Retrieve sync messages for a given room.
	 *
	 * @param string $room Room identifier.
	 * @return array Array of sync messages.
	 */
	public function get_messages_for_room( string $room ): array;

	/**
	 * Remove all messages for a given room.
	 *
	 * @param string $room Room identifier.
	 */
	public function remove_all_messages_for_room( string $room ): void;

	/**
	 * Update the last seen message ID for a client in a room.
	 *
	 * @param string $room Room identifier.
	 * @param int    $client_id Client identifier.
	 * @param int    $message_id Last seen message ID.
	 */
	public function update_client_last_seen( string $room, int $client_id, int $message_id ): void;

	/**
	 * Get the last seen message ID for a client in a room.
	 *
	 * @param string $room Room identifier.
	 * @param int    $client_id Client identifier.
	 * @return int Last seen message ID (0 if never seen).
	 */
	public function get_client_last_seen( string $room, int $client_id ): int;

	/**
	 * Get all active clients for a room (clients that have polled recently).
	 *
	 * @param string $room Room identifier.
	 * @param int    $since_timestamp Only include clients active since this timestamp.
	 * @return array Array of client info with 'client_id', 'last_seen_message_id', 'last_activity'.
	 */
	public function get_active_clients( string $room, int $since_timestamp ): array;

	/**
	 * Delete messages before a given message ID.
	 *
	 * @param string $room Room identifier.
	 * @param int    $before_message_id Delete messages with ID less than this.
	 */
	public function delete_messages_before( string $room, int $before_message_id ): void;
}
