<?php
/**
 * WP_Yjs_Relay_Engine class
 *
 * @package gutenberg
 */

if ( ! class_exists( 'WP_Yjs_Relay_Engine' ) ) {

	/**
	 * The Yjs relay sync engine.
	 *
	 * Stores opaque Yjs update payloads (sync_step1/sync_step2/update) and
	 * coordinates client-driven compaction: the lowest-client-id session
	 * member is nominated to send a `compaction` update (a full state
	 * snapshot) once the room's update count crosses a threshold. Merge
	 * semantics live entirely in the clients (Y.applyUpdate); the server
	 * relays and never interprets payload bytes.
	 *
	 * This class is a code motion of the engine-specific half of the original
	 * WP_HTTP_Polling_Sync_Server, extracted so engines are swappable behind
	 * WP_Sync_Engine without transport changes.
	 *
	 * @since 7.2.0
	 * @access private
	 */
	class WP_Yjs_Relay_Engine implements WP_Sync_Engine {
		/**
		 * Engine slug.
		 *
		 * @since 7.2.0
		 * @var string
		 */
		const SLUG = 'yjs-relay';

		/**
		 * Engine protocol version. Bump on breaking changes to update payload
		 * format or semantics.
		 *
		 * @since 7.2.0
		 * @var int
		 */
		const PROTOCOL_VERSION = 1;

		/**
		 * Threshold used to signal clients to send a compaction update.
		 *
		 * @since 7.2.0
		 * @var int
		 */
		const COMPACTION_THRESHOLD = 50;

		/**
		 * Sync update type: compaction.
		 *
		 * @since 7.2.0
		 * @var string
		 */
		const UPDATE_TYPE_COMPACTION = 'compaction';

		/**
		 * Sync update type: sync step 1.
		 *
		 * @since 7.2.0
		 * @var string
		 */
		const UPDATE_TYPE_SYNC_STEP1 = 'sync_step1';

		/**
		 * Sync update type: sync step 2.
		 *
		 * @since 7.2.0
		 * @var string
		 */
		const UPDATE_TYPE_SYNC_STEP2 = 'sync_step2';

		/**
		 * Sync update type: regular update.
		 *
		 * @since 7.2.0
		 * @var string
		 */
		const UPDATE_TYPE_UPDATE = 'update';

		/**
		 * Storage backend for sync updates.
		 *
		 * @since 7.2.0
		 */
		private WP_Sync_Storage $storage;

		/**
		 * Constructor.
		 *
		 * @since 7.2.0
		 *
		 * @param WP_Sync_Storage $storage Storage backend for sync updates.
		 */
		public function __construct( WP_Sync_Storage $storage ) {
			$this->storage = $storage;
		}

		/**
		 * Returns the engine slug.
		 *
		 * @since 7.2.0
		 *
		 * @return string Engine slug.
		 */
		public function get_slug(): string {
			return self::SLUG;
		}

		/**
		 * Returns the engine protocol version.
		 *
		 * @since 7.2.0
		 *
		 * @return int Protocol version.
		 */
		public function get_protocol_version(): int {
			return self::PROTOCOL_VERSION;
		}

		/**
		 * Returns the update types this engine accepts.
		 *
		 * @since 7.2.0
		 *
		 * @return string[] Accepted update types.
		 */
		public function get_update_types(): array {
			return array(
				self::UPDATE_TYPE_COMPACTION,
				self::UPDATE_TYPE_SYNC_STEP1,
				self::UPDATE_TYPE_SYNC_STEP2,
				self::UPDATE_TYPE_UPDATE,
			);
		}

		/**
		 * Ingests one client's updates for a room.
		 *
		 * @since 7.2.0
		 *
		 * @param string                                         $room      Room identifier.
		 * @param int                                            $client_id Client identifier.
		 * @param int                                            $cursor    Client cursor.
		 * @param array<int, array{data: string, type: string}>  $updates   Updates to ingest.
		 * @param array<string, mixed>                           $context   Transport context (unused by the relay).
		 * @return array{dispositions: null}|WP_Error Ingest result. The relay produces no
		 *                                            per-update dispositions.
		 */
		public function handle_updates( string $room, int $client_id, int $cursor, array $updates, array $context ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- $context is part of the WP_Sync_Engine contract.
			foreach ( $updates as $update ) {
				$result = $this->process_sync_update( $room, $client_id, $cursor, $update );
				if ( is_wp_error( $result ) ) {
					return $result;
				}
			}

			return array( 'dispositions' => null );
		}

		/**
		 * Returns the room response for a catching-up client.
		 *
		 * Delegates cursor-based retrieval to the storage layer, then applies
		 * client-specific filtering and compaction nomination: the lowest
		 * client ID present in awareness is nominated to perform compaction
		 * when the room's update count exceeds the threshold.
		 *
		 * @since 7.2.0
		 *
		 * @param string               $room      Room identifier.
		 * @param int                  $client_id Client identifier.
		 * @param int                  $cursor    Return updates after this cursor.
		 * @param array<string, mixed> $context   Transport context with merged 'awareness'.
		 * @return array{
		 *   end_cursor: int,
		 *   room: string,
		 *   should_compact: bool,
		 *   total_updates: int,
		 *   updates: array<int, array{data: string, type: string}>,
		 * } Room response data.
		 */
		public function get_updates_since( string $room, int $client_id, int $cursor, array $context ): array {
			$awareness = $context['awareness'] ?? array();

			// The lowest client ID is nominated to perform compaction when needed.
			$is_compactor = false;
			if ( count( $awareness ) > 0 ) {
				$is_compactor = min( array_keys( $awareness ) ) === $client_id;
			}

			$updates_after_cursor = $this->storage->get_updates_after_cursor( $room, $cursor );
			$total_updates        = $this->storage->get_update_count( $room );

			// Filter out this client's updates, except compaction updates.
			$typed_updates = array();
			foreach ( $updates_after_cursor as $update ) {
				if ( $client_id === $update['client_id'] && self::UPDATE_TYPE_COMPACTION !== $update['type'] ) {
					continue;
				}

				$typed_updates[] = array(
					'data' => $update['data'],
					'type' => $update['type'],
				);
			}

			$should_compact = $is_compactor && $total_updates > self::COMPACTION_THRESHOLD;

			return array(
				'end_cursor'     => $this->storage->get_cursor( $room ),
				'room'           => $room,
				'should_compact' => $should_compact,
				'total_updates'  => $total_updates,
				'updates'        => $typed_updates,
			);
		}

		/**
		 * Processes a sync update based on its type.
		 *
		 * @since 7.2.0
		 *
		 * @param string                            $room      Room identifier.
		 * @param int                               $client_id Client identifier.
		 * @param int                               $cursor    Client cursor (marker of last seen update).
		 * @param array{data: string, type: string} $update    Sync update.
		 * @return true|WP_Error True on success, WP_Error on storage failure.
		 */
		private function process_sync_update( string $room, int $client_id, int $cursor, array $update ) {
			$data = $update['data'];
			$type = $update['type'];

			switch ( $type ) {
				case self::UPDATE_TYPE_COMPACTION:
					/*
					 * Compaction replaces updates the client has already seen. Only remove
					 * updates with markers before the client's cursor to preserve updates
					 * that arrived since the client's last sync.
					 *
					 * Check for a newer compaction update first. If one exists, skip this
					 * compaction to avoid overwriting it.
					 */
					$updates_after_cursor = $this->storage->get_updates_after_cursor( $room, $cursor );

					$has_newer_compaction = array_any(
						$updates_after_cursor,
						fn( $existing ) => self::UPDATE_TYPE_COMPACTION === $existing['type']
					);

					if ( ! $has_newer_compaction ) {
						if ( ! $this->storage->remove_updates_before_cursor( $room, $cursor ) ) {
							return new WP_Error(
								'rest_sync_storage_error',
								__( 'Failed to remove updates during compaction.', 'gutenberg' ),
								array( 'status' => 500 )
							);
						}

						return $this->add_update( $room, $client_id, $type, $data );
					}

					/*
					 * A newer compaction already advanced the cursor, but we
					 * can not safely drop an update. The incoming bytes still encode
					 * operations other clients may not have seen, so store them as a
					 * regular update. Y.applyUpdateV2 merges state-as-update blobs
					 * idempotently, so overlap with the existing compaction is safe.
					 */
					return $this->add_update( $room, $client_id, self::UPDATE_TYPE_UPDATE, $data );

				case self::UPDATE_TYPE_SYNC_STEP1:
				case self::UPDATE_TYPE_SYNC_STEP2:
				case self::UPDATE_TYPE_UPDATE:
					/*
					 * Sync step 1 announces a client's state vector. Other clients need
					 * to see it so they can respond with sync_step2 containing missing
					 * updates. The cursor-based filtering prevents re-delivery.
					 *
					 * Sync step 2 contains updates for a specific client.
					 *
					 * All updates are stored persistently.
					 */
					return $this->add_update( $room, $client_id, $type, $data );
			}

			return new WP_Error(
				'rest_invalid_update_type',
				__( 'Invalid sync update type.', 'gutenberg' ),
				array( 'status' => 400 )
			);
		}

		/**
		 * Adds an update to a room's update list via storage.
		 *
		 * @since 7.2.0
		 *
		 * @param string $room      Room identifier.
		 * @param int    $client_id Client identifier.
		 * @param string $type      Update type (sync_step1, sync_step2, update, compaction).
		 * @param string $data      Base64-encoded update data.
		 * @return true|WP_Error True on success, WP_Error on storage failure.
		 */
		private function add_update( string $room, int $client_id, string $type, string $data ) {
			$update = array(
				'client_id' => $client_id,
				'data'      => $data,
				'type'      => $type,
			);

			if ( ! $this->storage->add_update( $room, $update ) ) {
				return new WP_Error(
					'rest_sync_storage_error',
					__( 'Failed to store sync update.', 'gutenberg' ),
					array( 'status' => 500 )
				);
			}

			return true;
		}
	}
}
