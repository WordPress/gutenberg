<?php
/**
 * WP_Sync_Server_Core class
 *
 * @package gutenberg
 */

if ( ! class_exists( 'WP_Sync_Config' ) ) {
	require_once __DIR__ . '/class-wp-sync-config.php';
}

if ( ! class_exists( 'WP_Sync_Server_Core' ) ) {

	/**
	 * Transport-agnostic core of the collaborative editing sync server.
	 *
	 * Encapsulates the storage-backed sync semantics (awareness merging,
	 * typed update processing, cursor-based retrieval, and compaction
	 * nomination) shared by the HTTP polling, HTTP long-polling, and
	 * WebSocket transports.
	 *
	 * @since 7.4.0
	 * @access private
	 */
	class WP_Sync_Server_Core {
		/**
		 * Awareness timeout in seconds. Clients that haven't updated
		 * their awareness state within this time are considered disconnected.
		 *
		 * @since 7.4.0
		 * @var int
		 */
		const AWARENESS_TIMEOUT = 30;

		/**
		 * Threshold used to signal clients to send a compaction update.
		 *
		 * @since 7.4.0
		 * @var int
		 */
		const COMPACTION_THRESHOLD = 50;

		/**
		 * Sync update type: compaction.
		 *
		 * @since 7.4.0
		 * @var string
		 */
		const UPDATE_TYPE_COMPACTION = 'compaction';

		/**
		 * Sync update type: sync step 1.
		 *
		 * @since 7.4.0
		 * @var string
		 */
		const UPDATE_TYPE_SYNC_STEP1 = 'sync_step1';

		/**
		 * Sync update type: sync step 2.
		 *
		 * @since 7.4.0
		 * @var string
		 */
		const UPDATE_TYPE_SYNC_STEP2 = 'sync_step2';

		/**
		 * Sync update type: regular update.
		 *
		 * @since 7.4.0
		 * @var string
		 */
		const UPDATE_TYPE_UPDATE = 'update';

		/**
		 * Storage backend for sync updates.
		 *
		 * @since 7.4.0
		 */
		private WP_Sync_Storage $storage;

		/**
		 * Constructor.
		 *
		 * @since 7.4.0
		 *
		 * @param WP_Sync_Storage $storage Storage backend for sync updates.
		 */
		public function __construct( WP_Sync_Storage $storage ) {
			$this->storage = $storage;
		}

		/**
		 * Gets the storage backend.
		 *
		 * @since 7.4.0
		 *
		 * @return WP_Sync_Storage Storage backend for sync updates.
		 */
		public function get_storage(): WP_Sync_Storage {
			return $this->storage;
		}

		/**
		 * Checks whether the current user may sync the given rooms.
		 *
		 * The caller is responsible for the minimum capability check
		 * (`current_user_can( 'edit_posts' )`) and for establishing the
		 * current user before calling this method.
		 *
		 * @since 7.4.0
		 *
		 * @param array<int, array{room: string, client_id: int}> $rooms Room requests.
		 * @return true|WP_Error True if user has permission, otherwise WP_Error with details.
		 */
		public function check_rooms_permissions( array $rooms ) {
			$wp_user_id      = get_current_user_id();
			$forbidden_rooms = array();

			foreach ( $rooms as $room ) {
				$client_id = $room['client_id'];
				$room      = $room['room'];

				// Check that the client_id is not already owned by another user.
				$existing_awareness = $this->storage->get_awareness_state( $room );
				foreach ( $existing_awareness as $entry ) {
					if ( $client_id === $entry['client_id'] && $wp_user_id !== $entry['wp_user_id'] ) {
						return new WP_Error(
							'rest_cannot_edit',
							__( 'Client ID is already in use by another user.', 'gutenberg' ),
							array( 'status' => 403 )
						);
					}
				}

				$parsed_room = WP_Sync_Config::parse_room( $room );
				if ( null === $parsed_room || ! WP_Sync_Config::can_user_sync_entity_type( $parsed_room['entity_kind'], $parsed_room['entity_name'], $parsed_room['object_id'] ) ) {
					$forbidden_rooms[] = $room;
				}
			}

			if ( ! empty( $forbidden_rooms ) ) {
				return new WP_Error(
					'rest_cannot_edit',
					sprintf(
						/* translators: %s: Comma-separated list of room names. */
						__( 'You do not have permission to sync one or more entities: %s.', 'gutenberg' ),
						implode( ', ', $forbidden_rooms )
					),
					array(
						'status' => rest_authorization_required_code(),
						'rooms'  => $forbidden_rooms,
					)
				);
			}

			return true;
		}

		/**
		 * Processes a full room request: merges awareness, stores incoming
		 * updates, and returns the updates the client is missing.
		 *
		 * @since 7.4.0
		 *
		 * @param array{
		 *   after: int,
		 *   awareness: array<string, mixed>|null,
		 *   client_id: int,
		 *   room: string,
		 *   updates: array<int, array{data: string, type: string}>,
		 * } $room_request Room request.
		 * @return array|WP_Error Response data for this room, or WP_Error on failure.
		 */
		public function process_room_request( array $room_request ) {
			$awareness = $room_request['awareness'];
			$client_id = $room_request['client_id'];
			$cursor    = $room_request['after'];
			$room      = $room_request['room'];

			// Merge awareness state.
			$merged_awareness = $this->process_awareness_update( $room, $client_id, $awareness );

			// The lowest client ID is nominated to perform compaction when needed.
			$is_compactor = false;
			if ( count( $merged_awareness ) > 0 ) {
				$is_compactor = min( array_keys( $merged_awareness ) ) === $client_id;
			}

			// Process each update according to its type.
			foreach ( $room_request['updates'] as $update ) {
				$result = $this->process_sync_update( $room, $client_id, $cursor, $update );
				if ( is_wp_error( $result ) ) {
					return $result;
				}
			}

			// Get updates for this client.
			$room_response              = $this->get_updates( $room, $client_id, $cursor, $is_compactor );
			$room_response['awareness'] = $merged_awareness;

			$base_version = $this->get_room_base_version( $room );
			if ( null !== $base_version ) {
				$room_response['base_version'] = $base_version;
			}

			return $room_response;
		}

		/**
		 * Returns the persisted base-version token for a post-entity room.
		 *
		 * Broadcasting the persisted version through the sync channel is what
		 * makes a base-version save guard correct for session participants: a
		 * caught-up client always holds the current token, and a drifted
		 * client (offline through a save, or saving before catch-up) is the
		 * one that gets fenced.
		 *
		 * @param string $room Room identifier (e.g. `postType/post:123`).
		 * @return string|null Version token, or null for non-post rooms.
		 */
		public function get_room_base_version( string $room ) {
			if ( ! preg_match( '/^postType\/[\w-]+:(\d+)$/', $room, $matches ) ) {
				return null;
			}
			$post = get_post( (int) $matches[1] );
			if ( ! $post ) {
				return null;
			}
			// Token format matches Gutenberg_Distributed_Editing_Engine::get_version(),
			// so the save-guard middleware can consume either source.
			return 'v1:' . hash( 'sha256', $post->post_content );
		}

		/**
		 * Processes and stores an awareness update from a client.
		 *
		 * @since 7.4.0
		 *
		 * @param string                    $room             Room identifier.
		 * @param int                       $client_id        Client identifier.
		 * @param array<string, mixed>|null $awareness_update Awareness state sent by the client.
		 * @return array<int, array<string, mixed>> Map of client ID to awareness state.
		 */
		public function process_awareness_update( string $room, int $client_id, ?array $awareness_update ): array {
			$existing_awareness = $this->storage->get_awareness_state( $room );
			$updated_awareness  = array();
			$current_time       = time();

			foreach ( $existing_awareness as $entry ) {
				// Remove this client's entry (it will be updated below).
				if ( $client_id === $entry['client_id'] ) {
					continue;
				}

				// Remove entries that have expired.
				if ( $current_time - $entry['updated_at'] >= self::AWARENESS_TIMEOUT ) {
					continue;
				}

				$updated_awareness[] = $entry;
			}

			// Add this client's awareness state.
			if ( null !== $awareness_update ) {
				$updated_awareness[] = array(
					'client_id'  => $client_id,
					'state'      => $awareness_update,
					'updated_at' => $current_time,
					'wp_user_id' => get_current_user_id(),
				);
			}

			// This action can fail, but it shouldn't fail the entire request.
			$this->storage->set_awareness_state( $room, $updated_awareness );

			// Convert to client_id => state map for response.
			$response = array();
			foreach ( $updated_awareness as $entry ) {
				$response[ $entry['client_id'] ] = $entry['state'];
			}

			return $response;
		}

		/**
		 * Processes a sync update based on its type.
		 *
		 * @since 7.4.0
		 *
		 * @param string                            $room      Room identifier.
		 * @param int                               $client_id Client identifier.
		 * @param int                               $cursor    Client cursor (marker of last seen update).
		 * @param array{data: string, type: string} $update    Sync update.
		 * @return true|WP_Error True on success, WP_Error on storage failure.
		 */
		public function process_sync_update( string $room, int $client_id, int $cursor, array $update ) {
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
		 * @since 7.4.0
		 *
		 * @param string $room      Room identifier.
		 * @param int    $client_id Client identifier.
		 * @param string $type      Update type (sync_step1, sync_step2, update, compaction).
		 * @param string $data      Base64-encoded update data.
		 * @return true|WP_Error True on success, WP_Error on storage failure.
		 */
		public function add_update( string $room, int $client_id, string $type, string $data ) {
			$update = array(
				'client_id' => $client_id,
				'data'      => $data,
				'type'      => $type,
				/*
				 * Actor stamp: the authenticated user behind this ingest,
				 * recorded server-side at the moment of storage. The payload
				 * stays opaque, so this is update-level attribution, not
				 * content-level — but it is a fact the server established, not
				 * a claim the client made, and it is the substrate any future
				 * engine needs to attribute content. Every transport
				 * authenticates before reaching this point (REST cookie/nonce
				 * for polling and long-poll; per-message wp_set_current_user
				 * in the WebSocket daemon).
				 */
				'actor'     => get_current_user_id(),
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

		/**
		 * Gets sync updates for a specific client from a room after a given cursor.
		 *
		 * Delegates cursor-based retrieval to the storage layer, then applies
		 * client-specific filtering and compaction logic.
		 *
		 * @since 7.4.0
		 *
		 * @param string $room         Room identifier.
		 * @param int    $client_id    Client identifier.
		 * @param int    $cursor       Return updates after this cursor.
		 * @param bool   $is_compactor True if this client is nominated to perform compaction.
		 * @return array{
		 *   end_cursor: int,
		 *   should_compact: bool,
		 *   room: string,
		 *   total_updates: int,
		 *   updates: array<int, array{data: string, type: string}>,
		 * } Response data for this room.
		 */
		public function get_updates( string $room, int $client_id, int $cursor, bool $is_compactor ): array {
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
		 * Reads the current (non-expired) awareness map for a room without
		 * modifying stored state.
		 *
		 * @since 7.4.0
		 *
		 * @param string $room Room identifier.
		 * @return array<int, mixed> Map of client ID to awareness state.
		 */
		public function get_current_awareness_map( string $room ): array {
			$entries      = $this->storage->get_awareness_state( $room );
			$current_time = time();
			$map          = array();

			foreach ( $entries as $entry ) {
				if ( $current_time - $entry['updated_at'] >= self::AWARENESS_TIMEOUT ) {
					continue;
				}

				$map[ $entry['client_id'] ] = $entry['state'];
			}

			return $map;
		}

		/**
		 * Checks whether new updates exist for a client after a given cursor.
		 *
		 * Applies the same client filtering as get_updates() (a client's own
		 * non-compaction updates are not deliverable to it), so a waiting
		 * long-poll request is only woken by updates the client will actually
		 * receive.
		 *
		 * @since 7.4.0
		 *
		 * @param string $room      Room identifier.
		 * @param int    $client_id Client identifier.
		 * @param int    $cursor    Check for updates after this cursor.
		 * @return bool True if deliverable updates exist after the cursor.
		 */
		public function has_updates_for_client( string $room, int $client_id, int $cursor ): bool {
			$updates_after_cursor = $this->storage->get_updates_after_cursor( $room, $cursor );

			foreach ( $updates_after_cursor as $update ) {
				if ( $client_id === $update['client_id'] && self::UPDATE_TYPE_COMPACTION !== $update['type'] ) {
					continue;
				}

				return true;
			}

			return false;
		}
	}
}
