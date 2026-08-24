<?php
/**
 * WP_Sync_Engine interface
 *
 * @package gutenberg
 */

if ( ! interface_exists( 'WP_Sync_Engine' ) ) {

	/**
	 * Contract for a collaborative sync engine.
	 *
	 * An engine owns the MEANING of sync update payloads for a room: how
	 * updates are validated, stored, merged, and returned to catching-up
	 * clients. Transports (HTTP short-polling today; long-polling and
	 * WebSockets later) own the MOVEMENT of updates — rooms, cursors,
	 * authentication, awareness — and treat update payloads as opaque.
	 *
	 * Implementations are registered with WP_Sync_Engine_Registry. Selecting a
	 * different engine for a room must never require transport changes, and
	 * vice versa.
	 *
	 * This interface intentionally covers only what the polling transport
	 * needs today. Engine-owned materialization (serializing a room to
	 * post_content), genesis bootstrap payloads, and compaction policy hooks
	 * are added when the first engine that needs them lands.
	 *
	 * @since 7.2.0
	 * @access private
	 */
	interface WP_Sync_Engine {
		/**
		 * Returns the unique engine slug, e.g. 'yjs-relay' or 'intent-log'.
		 *
		 * The slug is part of the client handshake: clients refuse to join
		 * rooms whose engine they cannot provide, and rooms are stamped with
		 * the slug of the engine that first wrote to them.
		 *
		 * @since 7.2.0
		 *
		 * @return string Engine slug.
		 */
		public function get_slug(): string;

		/**
		 * Returns the engine protocol version.
		 *
		 * Incremented on any breaking change to the engine's update payload
		 * format or semantics. A client whose adapter implements a different
		 * protocol version must not join the room.
		 *
		 * @since 7.2.0
		 *
		 * @return int Protocol version.
		 */
		public function get_protocol_version(): int;

		/**
		 * Returns the update `type` values this engine accepts.
		 *
		 * Used to build the transport's request schema. The engine remains
		 * responsible for rejecting types it does not handle, since a route
		 * may serve rooms owned by different engines.
		 *
		 * @since 7.2.0
		 *
		 * @return string[] Accepted update types.
		 */
		public function get_update_types(): array;

		/**
		 * Ingests one client's updates for a room, in client order.
		 *
		 * @since 7.2.0
		 *
		 * @param string                                    $room      Room identifier.
		 * @param int                                       $client_id Client identifier.
		 * @param int                                       $cursor    Client cursor (marker of last seen update).
		 * @param array<int, array{data: string, type: string}> $updates Updates to ingest.
		 * @param array<string, mixed>                      $context   Transport context. Currently:
		 *                                                             'awareness' => array<int, mixed> merged
		 *                                                             awareness map (client_id => state).
		 * @return array{dispositions: array<int, mixed>|null}|WP_Error Ingest result. `dispositions`
		 *                                                             is a per-update outcome list for
		 *                                                             engines that produce one (e.g.
		 *                                                             applied/escalated/voided), or null
		 *                                                             for engines that do not. WP_Error
		 *                                                             fails the whole request.
		 */
		public function handle_updates( string $room, int $client_id, int $cursor, array $updates, array $context );

		/**
		 * Returns the room response for a catching-up client.
		 *
		 * @since 7.2.0
		 *
		 * @param string               $room      Room identifier.
		 * @param int                  $client_id Client identifier.
		 * @param int                  $cursor    Return updates after this cursor.
		 * @param array<string, mixed> $context   Transport context (see handle_updates()).
		 * @return array{
		 *   end_cursor: int,
		 *   room: string,
		 *   should_compact: bool,
		 *   total_updates: int,
		 *   updates: array<int, array{data: string, type: string}>,
		 * } Room response data (transport appends awareness).
		 */
		public function get_updates_since( string $room, int $client_id, int $cursor, array $context ): array;
	}
}
