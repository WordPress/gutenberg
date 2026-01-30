<?php
/**
 * Gutenberg_HTTP_Polling_Sync_Server class
 *
 * @package Gutenberg
 */

/**
 * Gutenberg class that contains an HTTP server used for collaborative editing.
 *
 * @access private
 * @internal
 */
class Gutenberg_HTTP_Polling_Sync_Server {
	/**
	 * REST API namespace.
	 */
	const REST_NAMESPACE = 'wp/v2/sync';

	/**
	 * Awareness timeout in milliseconds. Clients that haven't updated
	 * their awareness state within this time are considered disconnected.
	 */
	const AWARENESS_TIMEOUT_IN_S = 30; // 30 seconds

	/**
	 * Threshold used to signal clients to send a compaction update.
	 */
	const COMPACTION_THRESHOLD = 50;

	/**
	 * Sync update types.
	 */
	const UPDATE_TYPE_COMPACTION = 'compaction';
	const UPDATE_TYPE_SYNC_STEP1 = 'sync_step1';
	const UPDATE_TYPE_SYNC_STEP2 = 'sync_step2';
	const UPDATE_TYPE_UPDATE     = 'update';

	/**
	 * Storage backend for sync updates.
	 *
	 * @var Gutenberg_Sync_Storage
	 */
	private $storage;

	public function __construct( Gutenberg_Sync_Storage $storage ) {
		$this->storage = $storage;
	}

	/**
	 * Initialize the sync server.
	 */
	public function init(): void {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register REST API routes.
	 */
	public function register_routes(): void {
		$typed_update_args = array(
			'properties' => array(
				'data' => array(
					'type'     => 'string',
					'required' => true,
				),
				'type' => array(
					'type'     => 'string',
					'required' => true,
					'enum'     => array(
						self::UPDATE_TYPE_COMPACTION,
						self::UPDATE_TYPE_SYNC_STEP1,
						self::UPDATE_TYPE_SYNC_STEP2,
						self::UPDATE_TYPE_UPDATE,
					),
				),
			),
			'required'   => true,
			'type'       => 'object',
		);

		$room_args = array(
			'after'     => array(
				'minimum'  => 0,
				'required' => true,
				'type'     => 'integer',
			),
			'awareness' => array(
				'required' => true,
			),
			'client_id' => array(
				'minimum'  => 1,
				'required' => true,
				'type'     => 'integer',
			),
			'room'      => array(
				'sanitize_callback' => 'sanitize_text_field',
				'required'          => true,
				'type'              => 'string',
			),
			'updates'   => array(
				'items'    => $typed_update_args,
				'minItems' => 0,
				'required' => true,
				'type'     => 'array',
			),
		);

		// POST /wp/v2/sync/updates
		register_rest_route(
			self::REST_NAMESPACE,
			'/updates',
			array(
				'methods'             => array( WP_REST_Server::CREATABLE ),
				'callback'            => array( $this, 'handle_request' ),
				'permission_callback' => array( $this, 'check_permissions' ),
				'args'                => array_merge(
					array(
						'rooms' => array(
							'items'    => array(
								'properties' => $room_args,
								'type'       => 'object',
							),
							'required' => true,
							'type'     => 'array',
						),
					)
				),
			)
		);
	}

	/**
	 * Check if the current user has permission to access a room.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return bool|WP_Error True if user has permission, otherwise WP_Error with details.
	 */
	public function check_permissions( WP_REST_Request $request ) {
		$rooms = $request->get_param( 'rooms' );

		foreach ( $rooms as $room ) {
			// Parse sync object type (format: kind/name)
			$room         = $room['room'];
			$type_parts   = explode( '/', $room, 2 );
			$object_parts = explode( ':', $type_parts[1] ?? '', 2 );

			if ( 2 !== count( $type_parts ) ) {
				return new WP_Error(
					'invalid_room_format',
					'Invalid room format. Expected: entity_kind/entity_name or entity_kind/entity_name:id',
					array( 'status' => 400 )
				);
			}

			// Extract Gutenberg entity kind, entity name and object ID.
			$entity_kind = $type_parts[0];
			$entity_name = $object_parts[0];
			$object_id   = null;

			if ( isset( $object_parts[1] ) ) {
				$object_id = $object_parts[1];
			}

			if ( ! $this->can_user_sync_entity_type( $entity_kind, $entity_name, $object_id ) ) {
				return new WP_Error(
					'forbidden',
					sprintf( 'You do not have permission to sync this entity: %s.', $room ),
					array( 'status' => 401 )
				);
			}
		}

		return true;
	}

	/**
	 * Check if the current user can sync a specific entity type.
	 *
	 * @param string   $entity_kind The entity kind.
	 * @param string   $entity_name The entity name.
	 * @param int|null $object_id   The object ID (if applicable).
	 * @return bool True if user has permission, otherwise false.
	 */
	private function can_user_sync_entity_type( string $entity_kind, string $entity_name, ?string $object_id ): bool {
		// Handle post type entities.
		if ( 'postType' === $entity_kind && is_numeric( $object_id ) ) {
			return current_user_can( 'edit_post', absint( $object_id ) );
		}

		// All of the remaining checks for for collections. If an object ID is
		// provided, reject the request.
		if ( null !== $object_id ) {
			return false;
		}

		// Collection syncing does not exchange entity data. It only signals if
		// another user has updated an entity in the collection. Therefore, we only
		// compare against an allow list of collection types.
		$allowed_collection_entity_kinds = array(
			'postType',
			'root',
			'taxonomy',
		);

		return in_array( $entity_kind, $allowed_collection_entity_kinds, true );
	}

	/**
	 * Handle request: store sync updates and awareness data, and return updates
	 * the client is missing.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return WP_REST_Response|WP_Error Response object or error.
	 */
	public function handle_request( WP_REST_Request $request ) {
		$rooms    = $request->get_param( 'rooms' );
		$response = array(
			'rooms' => array(),
		);

		foreach ( $rooms as $room_request ) {
			$awareness = $room_request['awareness'];
			$client_id = $room_request['client_id'];
			$cursor    = $room_request['after'];
			$room      = $room_request['room'];

			// Merge awareness state.
			$merged_awareness = $this->process_awareness_update( $room, $client_id, $awareness );

			// The lowest client ID is nominated to perform compaction when needed.
			$is_compactor = min( array_keys( $merged_awareness ) ) === $client_id;

			// Process each update according to its type.
			foreach ( $room_request['updates'] as $update ) {
				$this->process_sync_update( $room, $client_id, $cursor, $update );
			}

			// Get updates for this client.
			$room_response              = $this->get_updates_after( $room, $client_id, $cursor, $is_compactor );
			$room_response['awareness'] = $merged_awareness;

			$response['rooms'][] = $room_response;
		}

		return new WP_REST_Response( $response, 200 );
	}

	/**
	 * Process and store an awareness update from a client.
	 *
	 * @param string     $room             Room identifier.
	 * @param int        $client_id        Client identifier.
	 * @param array|null $awareness_update Awareness state sent by the client.
	 * @return array Updated awareness state for the room.
	 */
	private function process_awareness_update( string $room, int $client_id, ?array $awareness_update ): array {
		// Get existing awareness state and filter out expired clients.
		$existing_awareness = $this->storage->get_awareness_state( $room );
		$updated_awareness  = array();
		$current_time       = time();

		foreach ( $existing_awareness as $entry ) {
			// Remove this client's entry (it will be updated below).
			if ( $client_id === $entry['client_id'] ) {
				continue;
			}

			// Remove entries that have expired.
			if ( $current_time - $entry['updated_at'] >= self::AWARENESS_TIMEOUT_IN_S ) {
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
			);
		}

		// Save updated awareness state.
		$this->storage->set_awareness_state( $room, $updated_awareness );

		// Convert to client_id => state map for response.
		$response = array();
		foreach ( $updated_awareness as $entry ) {
			$response[ $entry['client_id'] ] = (object) $entry['state'];
		}

		return $response;
	}

	/**
	 * Process a sync update based on its type.
	 *
	 * @param string $room      Room identifier.
	 * @param int    $client_id Client identifier.
	 * @param int    $cursor    Client cursor (marker of last seen update).
	 * @param array  $update    Sync update with 'type' and 'data' fields.
	 */
	private function process_sync_update( string $room, int $client_id, int $cursor, array $update ): void {
		$data = $update['data'];
		$type = $update['type'];

		switch ( $type ) {
			case self::UPDATE_TYPE_COMPACTION:
				// Compaction replaces updates the client has already seen. Only remove
				// updates with markers before the client's cursor to preserve updates
				// that arrived since the client's last sync.
				//
				// The `remove_updates_before_compaction` method returns false if there
				// is a newer compaction update already stored.
				if ( $this->remove_updates_before_cursor( $room, $cursor ) ) {
					$this->add_update( $room, $client_id, $type, $data );
				}
				break;

			case self::UPDATE_TYPE_SYNC_STEP1:
				// Sync step 1 announces a client's state vector. Other clients need
				// to see it so they can respond with sync_step2 containing missing
				// updates. The cursor-based filtering prevents re-delivery.
				$this->add_update( $room, $client_id, $type, $data );
				break;

			case self::UPDATE_TYPE_SYNC_STEP2:
				// Sync step 2 contains updates for a specific client.
				// Store it but mark for single delivery (will be cleaned up after delivery).
				$this->add_update( $room, $client_id, $type, $data );
				break;

			case self::UPDATE_TYPE_UPDATE:
				// Regular document updates are stored persistently.
				$this->add_update( $room, $client_id, $type, $data );
				break;
		}
	}

	/**
	 * Add an update to a room's update list.
	 *
	 * @param string $room      Room identifier.
	 * @param int    $client_id Client identifier.
	 * @param string $type      Update type (sync_step1, sync_step2, update, compaction).
	 * @param string $data      Base64-encoded update data.
	 */
	private function add_update( string $room, int $client_id, string $type, string $data ): void {
		$update_envelope = array(
			'client_id' => $client_id,
			'type'      => $type,
			'data'      => $data,
			'timestamp' => $this->get_time_marker(),
		);

		// Store the update
		$this->storage->add_update( $room, $update_envelope );
	}

	/**
	 * Get the current time in milliseconds as a comparable time marker.
	 *
	 * @return int Current time in milliseconds.
	 */
	private function get_time_marker(): int {
		return floor( microtime( true ) * 1000 );
	}

	/**
	 * Get sync updates from a room after a given cursor.
	 *
	 * @param string $room         Room identifier.
	 * @param int    $client_id    Client identifier.
	 * @param int    $cursor       Return updates after this cursor.
	 * @param bool   $is_compactor True if this client is nominated to perform compaction.
	 * @return array
	 */
	private function get_updates_after( string $room, int $client_id, int $cursor, bool $is_compactor ): array {
		$end_cursor    = $this->get_time_marker() - 100; // Small buffer to ensure consistency
		$all_updates   = $this->storage->get_all_updates( $room );
		$total_updates = count( $all_updates );
		$updates       = array();

		foreach ( $all_updates as $update ) {
			// Skip updates from this client, unless they are compaction updates.
			if ( $client_id === $update['client_id'] && self::UPDATE_TYPE_COMPACTION !== $update['type'] ) {
				continue;
			}

			// Skip updates before our cursor.
			if ( $update['timestamp'] > $cursor ) {
				$updates[] = $update;
			}
		}

		// Sort by update timestamp to ensure order
		usort(
			$updates,
			function ( $a, $b ) {
				return ( $a['timestamp'] ?? 0 ) <=> ( $b['timestamp'] ?? 0 );
			}
		);

		// Convert to typed update format for response.
		$typed_updates = array();
		foreach ( $updates as $update ) {
			$typed_updates[] = array(
				'data' => $update['data'],
				'type' => $update['type'],
			);
		}

		// Determine if this client should perform compaction.
		$compaction_request = null;
		if ( $is_compactor && $total_updates > self::COMPACTION_THRESHOLD ) {
			$compaction_request = $all_updates;
		}

		return array(
			'compaction_request' => $compaction_request,
			'end_cursor'         => $end_cursor,
			'room'               => $room,
			'total_updates'      => $total_updates,
			'updates'            => $typed_updates,
		);
	}

	/**
	 * Remove updates from a room that are older than the given compaction marker.
	 *
	 * @param string $room   Room identifier.
	 * @param int    $cursor Remove updates with markers < this cursor.
	 * @return bool True if this compaction is the latest, false if a newer compaction update exists.
	 */
	private function remove_updates_before_cursor( string $room, int $cursor ): bool {
		$all_updates = $this->storage->get_all_updates( $room );
		$this->storage->remove_all_updates( $room );

		$is_latest_compaction = true;
		$updates_to_keep      = array();

		foreach ( $all_updates as $update ) {
			if ( $update['timestamp'] >= $cursor ) {
				$updates_to_keep[] = $update;

				if ( self::UPDATE_TYPE_COMPACTION === $update['type'] ) {
					// If there is already a newer compaction update, return false.
					$is_latest_compaction = false;
				}
			}
		}

		// Replace all updates with filtered list.
		foreach ( $updates_to_keep as $update ) {
			$this->storage->add_update( $room, $update );
		}

		return $is_latest_compaction;
	}
}
