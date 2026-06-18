<?php
/**
 * WP_HTTP_Polling_Sync_Server_Gutenberg class
 *
 * Gutenberg's override of the core WP_HTTP_Polling_Sync_Server class. Named
 * distinctly so the plugin's real-time collaboration server fully replaces
 * core's, and its route registration (see collaboration.php) overrides core's.
 * At merge time the `_Gutenberg` suffix is dropped.
 *
 * @package gutenberg
 */

if ( ! class_exists( 'WP_Sync_Config' ) ) {
	require_once __DIR__ . '/class-wp-sync-config.php';
}

if ( ! class_exists( 'WP_Sync_CRDT_Document' ) ) {
	require_once __DIR__ . '/class-wp-sync-crdt-document.php';
}

if ( ! class_exists( 'WP_HTTP_Polling_Sync_Server_Gutenberg' ) ) {

	/**
	 * Core class that contains an HTTP server used for collaborative editing.
	 *
	 * @since 7.0.0
	 * @access private
	 */
	class WP_HTTP_Polling_Sync_Server_Gutenberg {
		/**
		 * REST API namespace.
		 *
		 * @since 7.0.0
		 * @var string
		 */
		const REST_NAMESPACE = 'wp-sync/v1';

		/**
		 * Awareness timeout in seconds. Clients that haven't updated
		 * their awareness state within this time are considered disconnected.
		 *
		 * @since 7.0.0
		 * @var int
		 */
		const AWARENESS_TIMEOUT = 30;

		/**
		 * Number of stored updates above which the server compacts a room into a
		 * single full-state update.
		 *
		 * @since 7.1.0
		 * @var int
		 */
		const SERVER_COMPACTION_THRESHOLD = 100;

		/**
		 * Client ID attributed to server-generated updates such as compactions.
		 *
		 * Real clients always use an ID of 1 or greater, so 0 is reserved for the
		 * server and never collides with a peer.
		 *
		 * @since 7.1.0
		 * @var int
		 */
		const SERVER_CLIENT_ID = 0;

		/**
		 * Maximum total size (in bytes) of the request body.
		 *
		 * @since 7.0.0
		 * @var int
		 */
		const MAX_BODY_SIZE = 16 * MB_IN_BYTES;

		/**
		 * Maximum number of rooms allowed per request.
		 *
		 * @since 7.0.0
		 * @var int
		 */
		const MAX_ROOMS_PER_REQUEST = 50;

		/**
		 * Maximum length of a single update data string.
		 *
		 * @since 7.0.0
		 * @var int
		 */
		const MAX_UPDATE_DATA_SIZE = MB_IN_BYTES;

		/**
		 * Sync update type: compaction.
		 *
		 * @since 7.0.0
		 * @var string
		 */
		const UPDATE_TYPE_COMPACTION = 'compaction';

		/**
		 * Sync update type: sync step 1.
		 *
		 * @since 7.0.0
		 * @var string
		 */
		const UPDATE_TYPE_SYNC_STEP1 = 'sync_step1';

		/**
		 * Sync update type: sync step 2.
		 *
		 * @since 7.0.0
		 * @var string
		 */
		const UPDATE_TYPE_SYNC_STEP2 = 'sync_step2';

		/**
		 * Sync update type: regular update.
		 *
		 * @since 7.0.0
		 * @var string
		 */
		const UPDATE_TYPE_UPDATE = 'update';

		/**
		 * Storage backend for sync updates.
		 *
		 * @since 7.0.0
		 */
		private WP_Sync_Storage_Gutenberg $storage;

		/**
		 * Factory used to reconstruct a CRDT document from stored updates.
		 *
		 * @since 7.1.0
		 * @var callable
		 */
		private $crdt_document_factory;

		/**
		 * Constructor.
		 *
		 * @since 7.0.0
		 *
		 * @param WP_Sync_Storage_Gutenberg $storage               Storage backend for sync updates.
		 * @param callable|null             $crdt_document_factory Optional CRDT document factory for tests.
		 */
		public function __construct( WP_Sync_Storage_Gutenberg $storage, ?callable $crdt_document_factory = null ) {
			$this->storage               = $storage;
			$this->crdt_document_factory = $crdt_document_factory ?? array( 'WP_Sync_CRDT_Document', 'from_update_snapshot' );
		}

		/**
		 * Registers REST API routes.
		 *
		 * @since 7.0.0
		 */
		public function register_routes(): void {
			$typed_update_args = array(
				'properties' => array(
					'data' => array(
						'type'      => 'string',
						'required'  => true,
						'maxLength' => self::MAX_UPDATE_DATA_SIZE,
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
					'type'     => array( 'object', 'null' ),
				),
				'client_id' => array(
					'minimum'  => 1,
					'required' => true,
					'type'     => 'integer',
				),
				'room'      => array(
					'required' => true,
					'type'     => 'string',
					'pattern'  => '^[^/]+/[^/:]+(?::\\S+)?$',
				),
				'updates'   => array(
					'items'    => $typed_update_args,
					'minItems' => 0,
					'required' => true,
					'type'     => 'array',
				),
			);

			register_rest_route(
				self::REST_NAMESPACE,
				'/updates',
				array(
					'methods'             => array( WP_REST_Server::CREATABLE ),
					'callback'            => array( $this, 'handle_request' ),
					'permission_callback' => array( $this, 'check_permissions' ),
					'validate_callback'   => array( $this, 'validate_request' ),
					'args'                => array(
						'rooms' => array(
							'items'    => array(
								'properties' => $room_args,
								'type'       => 'object',
							),
							'maxItems' => self::MAX_ROOMS_PER_REQUEST,
							'required' => true,
							'type'     => 'array',
						),
					),
				),
				// Override core's registration of this route so the plugin's
				// real-time collaboration server handles requests, not core's.
				true
			);
		}

		/**
		 * Checks if the current user has permission to access a room.
		 *
		 * @since 7.0.0
		 *
		 * @param WP_REST_Request $request The REST request.
		 * @return bool|WP_Error True if user has permission, otherwise WP_Error with details.
		 */
		public function check_permissions( WP_REST_Request $request ) {
			// Minimum cap check. Is user logged in with a contributor role or higher?
			if ( ! current_user_can( 'edit_posts' ) ) {
				return new WP_Error(
					'rest_cannot_edit',
					__( 'You do not have permission to perform this action', 'gutenberg' ),
					array( 'status' => rest_authorization_required_code() )
				);
			}

			$rooms           = $request['rooms'];
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
		 * Validates that the request body does not exceed the maximum allowed size.
		 *
		 * Runs as the route-level validate_callback, after per-arg schema
		 * validation has already passed.
		 *
		 * @since 7.0.0
		 *
		 * @param WP_REST_Request $request The REST request.
		 * @return true|WP_Error True if valid, WP_Error if the body is too large.
		 */
		public function validate_request( WP_REST_Request $request ) {
			$body = $request->get_body();
			if ( is_string( $body ) && strlen( $body ) > self::MAX_BODY_SIZE ) {
				return new WP_Error(
					'rest_sync_body_too_large',
					__( 'Request body is too large.', 'gutenberg' ),
					array( 'status' => 413 )
				);
			}

			return true;
		}

		/**
		 * Handles request: stores sync updates and awareness data, and returns
		 * updates the client is missing.
		 *
		 * @since 7.0.0
		 *
		 * @param WP_REST_Request $request The REST request.
		 * @return WP_REST_Response|WP_Error Response object or error.
		 */
		public function handle_request( WP_REST_Request $request ) {
			$rooms    = $request['rooms'];
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

				$document = $this->create_crdt_document( $room );
				if ( is_wp_error( $document ) ) {
					return $document;
				}

				$direct_response_updates = array();

				// Process each update according to its type.
				foreach ( $room_request['updates'] as $update ) {
					$result = $this->process_sync_update( $room, $client_id, $cursor, $update, $document );
					if ( is_wp_error( $result ) ) {
						return $result;
					}
					$direct_response_updates = array_merge( $direct_response_updates, $result );
				}

				// Compact the room server-side once it has accumulated enough updates.
				$compaction_result = $this->maybe_compact_room( $room );
				if ( is_wp_error( $compaction_result ) ) {
					return $compaction_result;
				}

				// Get stored updates for this client, then append request-local responses.
				$room_response              = $this->get_updates( $room, $client_id, $cursor );
				$room_response['updates']   = array_merge( $room_response['updates'], $direct_response_updates );
				$room_response['awareness'] = $merged_awareness;

				$response['rooms'][] = $room_response;
			}

			return new WP_REST_Response( $response, 200 );
		}

		/**
		 * Reconstructs the authoritative CRDT document for a room.
		 *
		 * @since 7.1.0
		 *
		 * @param string $room Room identifier.
		 * @return object|WP_Error CRDT document helper or error.
		 */
		private function create_crdt_document( string $room ) {
			$snapshot = $this->storage->get_update_snapshot( $room );
			$factory  = $this->crdt_document_factory;

			try {
				return $factory( $snapshot['updates'] );
			} catch ( Throwable $error ) {
				return $this->crdt_error_response( $error );
			}
		}

		/**
		 * Converts CRDT decoding exceptions to REST errors.
		 *
		 * @since 7.1.0
		 *
		 * @param Throwable $error CRDT decoding error.
		 * @return WP_Error REST error.
		 */
		private function crdt_error_response( Throwable $error ): WP_Error {
			if ( $error instanceof RuntimeException && false !== strpos( $error->getMessage(), 'yjs/y-php' ) ) {
				return new WP_Error(
					'rest_sync_yjs_unavailable',
					__( 'The Yjs PHP runtime is not available.', 'gutenberg' ),
					array( 'status' => 500 )
				);
			}

			return new WP_Error(
				'rest_sync_malformed_update',
				__( 'Malformed Yjs sync update.', 'gutenberg' ),
				array( 'status' => 400 )
			);
		}

		/**
		 * Processes and stores an awareness update from a client.
		 *
		 * @since 7.0.0
		 *
		 * @param string                    $room             Room identifier.
		 * @param int                       $client_id        Client identifier.
		 * @param array<string, mixed>|null $awareness_update Awareness state sent by the client.
		 * @return array<int, array<string, mixed>> Map of client ID to awareness state.
		 */
		private function process_awareness_update( string $room, int $client_id, ?array $awareness_update ): array {
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
		 * @since 7.0.0
		 *
		 * @param string                            $room      Room identifier.
		 * @param int                               $client_id Client identifier.
		 * @param int                               $cursor    Client cursor (marker of last seen update).
		 * @param array{data: string, type: string} $update    Sync update.
		 * @param object                            $document  CRDT document helper.
		 * @return array<int, array{data: string, type: string}>|WP_Error Direct response updates on success, WP_Error on failure.
		 */
		private function process_sync_update( string $room, int $client_id, int $cursor, array $update, $document ) {
			$data = $update['data'];
			$type = $update['type'];

			try {
				switch ( $type ) {
					case self::UPDATE_TYPE_SYNC_STEP1:
						return array(
							array(
								'data' => $document->create_sync_step2_response( $data ),
								'type' => self::UPDATE_TYPE_SYNC_STEP2,
							),
						);

					case self::UPDATE_TYPE_SYNC_STEP2:
						$state_vector_before = $document->state_vector();
						$document->apply_polling_update( $data, $type );
						$normalized_update = $document->encode_diff( $state_vector_before );

						if ( ! $document->is_empty_update( $normalized_update ) ) {
							$result = $this->add_update( $room, $client_id, self::UPDATE_TYPE_UPDATE, $normalized_update );
							if ( is_wp_error( $result ) ) {
								return $result;
							}
						}

						return array();

					case self::UPDATE_TYPE_COMPACTION:
						$document->apply_polling_update( $data, $type );

						/*
						 * Compaction replaces updates the client has already seen. Only remove
						 * updates with markers before the client's cursor to preserve updates
						 * that arrived since the client's last sync.
						 *
						 * Check for a newer compaction update first. If one exists, skip this
						 * compaction to avoid overwriting it.
						 */
						$updates_after_cursor = $this->storage->get_updates_after_cursor( $room, $cursor );
						$has_newer_compaction = false;

						foreach ( $updates_after_cursor as $existing ) {
							if ( self::UPDATE_TYPE_COMPACTION === $existing['type'] ) {
								$has_newer_compaction = true;
								break;
							}
						}

						if ( ! $has_newer_compaction ) {
							if ( ! $this->storage->remove_updates_before_cursor( $room, $cursor ) ) {
								return new WP_Error(
									'rest_sync_storage_error',
									__( 'Failed to remove updates during compaction.', 'gutenberg' ),
									array( 'status' => 500 )
								);
							}

							$result = $this->add_update( $room, $client_id, $type, $data );
							if ( is_wp_error( $result ) ) {
								return $result;
							}

							return array();
						}

						/*
						 * A newer compaction already advanced the cursor, but we
						 * can not safely drop an update. The incoming bytes still encode
						 * operations other clients may not have seen, so store them as a
						 * regular update. Y.applyUpdateV2 merges state-as-update blobs
						 * idempotently, so overlap with the existing compaction is safe.
						 */
						$result = $this->add_update( $room, $client_id, self::UPDATE_TYPE_UPDATE, $data );
						if ( is_wp_error( $result ) ) {
							return $result;
						}

						return array();

					case self::UPDATE_TYPE_UPDATE:
						$document->apply_polling_update( $data, $type );

						$result = $this->add_update( $room, $client_id, $type, $data );
						if ( is_wp_error( $result ) ) {
							return $result;
						}

						return array();
				}
			} catch ( Throwable $error ) {
				return $this->crdt_error_response( $error );
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
		 * @since 7.0.0
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

		/**
		 * Gets sync updates for a specific client from a room after a given cursor.
		 *
		 * Delegates cursor-based retrieval to the storage layer, then applies
		 * client-specific filtering and compaction logic.
		 *
		 * @since 7.0.0
		 *
		 * @param string $room         Room identifier.
		 * @param int    $client_id    Client identifier.
		 * @param int    $cursor       Return updates after this cursor.
		 * @return array{
		 *   end_cursor: int,
		 *   room: string,
		 *   total_updates: int,
		 *   updates: array<int, array{data: string, type: string}>,
		 * } Response data for this room.
		 */
		private function get_updates( string $room, int $client_id, int $cursor ): array {
			$updates_after_cursor = $this->storage->get_updates_after_cursor( $room, $cursor );
			$total_updates        = $this->storage->get_update_count( $room );

			// Filter out this client's updates, except compaction updates.
			$typed_updates = array();
			foreach ( $updates_after_cursor as $update ) {
				if ( self::UPDATE_TYPE_SYNC_STEP1 === $update['type'] ) {
					continue;
				}

				if ( $client_id === $update['client_id'] && self::UPDATE_TYPE_COMPACTION !== $update['type'] ) {
					continue;
				}

				$typed_updates[] = array(
					'data' => $update['data'],
					'type' => $update['type'],
				);
			}

			return array(
				'end_cursor'    => $this->storage->get_cursor( $room ),
				'room'          => $room,
				'total_updates' => $total_updates,
				'updates'       => $typed_updates,
			);
		}

		/**
		 * Compacts a room's stored updates into a single full-state update once
		 * the number of stored updates exceeds the server compaction threshold.
		 *
		 * The server reconstructs the authoritative document from a fresh
		 * snapshot, encodes it as a single full-state update, stores that update,
		 * and then removes every update covered by the snapshot. This mirrors a
		 * peer-initiated compaction and is lock-free: the snapshot cursor bounds
		 * the deletion, so updates that arrive concurrently (with a marker greater
		 * than the cursor) are never removed, while the stored compaction fully
		 * represents everything at or below the cursor.
		 *
		 * @since 7.1.0
		 *
		 * @param string $room Room identifier.
		 * @return true|WP_Error True on success or when no compaction is needed, WP_Error on failure.
		 */
		private function maybe_compact_room( string $room ) {
			$snapshot = $this->storage->get_update_snapshot( $room );

			if ( $snapshot['total_updates'] <= self::SERVER_COMPACTION_THRESHOLD ) {
				return true;
			}

			$cursor  = $snapshot['cursor'];
			$factory = $this->crdt_document_factory;

			try {
				$document        = $factory( $snapshot['updates'] );
				$compaction_data = $document->encode_state_as_compaction();
			} catch ( Throwable $error ) {
				return $this->crdt_error_response( $error );
			}

			/*
			 * Store the full-state compaction before removing anything so no data
			 * is dropped if the deletion fails. Its marker is greater than the
			 * snapshot cursor, so the deletion below never removes it.
			 */
			$result = $this->add_update( $room, self::SERVER_CLIENT_ID, self::UPDATE_TYPE_COMPACTION, $compaction_data );
			if ( is_wp_error( $result ) ) {
				return $result;
			}

			/*
			 * Remove every update covered by the snapshot (marker <= cursor).
			 * Updates that arrived concurrently keep a marker greater than the
			 * cursor and are preserved alongside the new compaction.
			 */
			if ( ! $this->storage->remove_updates_before_cursor( $room, $cursor + 1 ) ) {
				return new WP_Error(
					'rest_sync_storage_error',
					__( 'Failed to remove updates during compaction.', 'gutenberg' ),
					array( 'status' => 500 )
				);
			}

			return true;
		}
	}
}
