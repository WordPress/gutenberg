<?php
/**
 * WP_HTTP_Polling_Sync_Server class
 *
 * @package gutenberg
 */

if ( ! class_exists( 'WP_Sync_Config' ) ) {
	require_once __DIR__ . '/class-wp-sync-config.php';
}

if ( ! class_exists( 'WP_HTTP_Polling_Sync_Server' ) ) {

	/**
	 * HTTP short-polling transport for collaborative editing.
	 *
	 * The transport owns movement: routes, authentication, room permission
	 * checks, cursors, awareness, and request/response shape. The MEANING of
	 * update payloads is owned by the room's engine (WP_Sync_Engine, resolved
	 * through WP_Sync_Engine_Registry) — this class never interprets update
	 * data, so engines are swappable without transport changes.
	 *
	 * Engine mismatch protection: a client may stamp the engine it is
	 * speaking (`engine` / `engine_protocol` per room). If the stamp does not
	 * match the room's engine, or the room's storage lineage was written by a
	 * different engine, the request fails with 409 `rest_sync_engine_mismatch`
	 * and the client is expected to leave the session (falling back to a
	 * post lock). A room's lineage is fixed by its first write.
	 *
	 * @since 7.0.0
	 * @access private
	 */
	class WP_HTTP_Polling_Sync_Server implements WP_Sync_Transport {
		/**
		 * Transport slug (matches the client transport registration).
		 *
		 * @since 7.2.0
		 * @var string
		 */
		const TRANSPORT_SLUG = 'http-polling';

		/**
		 * Transport protocol version.
		 *
		 * @since 7.2.0
		 * @var int
		 */
		const TRANSPORT_PROTOCOL = 1;

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
		 * Threshold used to signal clients to send a compaction update.
		 *
		 * @since 7.0.0
		 * @deprecated 7.2.0 Compaction policy is engine-owned. Use
		 *             WP_Yjs_Relay_Engine::COMPACTION_THRESHOLD.
		 * @var int
		 */
		const COMPACTION_THRESHOLD = 50;

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
		 * @deprecated 7.2.0 Update types are engine-owned. Use
		 *             WP_Yjs_Relay_Engine::UPDATE_TYPE_COMPACTION.
		 * @var string
		 */
		const UPDATE_TYPE_COMPACTION = 'compaction';

		/**
		 * Sync update type: sync step 1.
		 *
		 * @since 7.0.0
		 * @deprecated 7.2.0 Update types are engine-owned. Use
		 *             WP_Yjs_Relay_Engine::UPDATE_TYPE_SYNC_STEP1.
		 * @var string
		 */
		const UPDATE_TYPE_SYNC_STEP1 = 'sync_step1';

		/**
		 * Sync update type: sync step 2.
		 *
		 * @since 7.0.0
		 * @deprecated 7.2.0 Update types are engine-owned. Use
		 *             WP_Yjs_Relay_Engine::UPDATE_TYPE_SYNC_STEP2.
		 * @var string
		 */
		const UPDATE_TYPE_SYNC_STEP2 = 'sync_step2';

		/**
		 * Sync update type: regular update.
		 *
		 * @since 7.0.0
		 * @deprecated 7.2.0 Update types are engine-owned. Use
		 *             WP_Yjs_Relay_Engine::UPDATE_TYPE_UPDATE.
		 * @var string
		 */
		const UPDATE_TYPE_UPDATE = 'update';

		/**
		 * Storage backend for sync updates.
		 *
		 * @since 7.0.0
		 */
		protected WP_Sync_Storage $storage;

		/**
		 * Engine registry used to resolve the engine for each room.
		 *
		 * @since 7.2.0
		 */
		protected WP_Sync_Engine_Registry $engines;

		/**
		 * Constructor.
		 *
		 * @since 7.0.0
		 *
		 * @param WP_Sync_Storage              $storage Storage backend for sync updates.
		 * @param WP_Sync_Engine_Registry|null $engines Engine registry. Defaults to a
		 *                                              registry over the given storage.
		 */
		public function __construct( WP_Sync_Storage $storage, ?WP_Sync_Engine_Registry $engines = null ) {
			$this->storage = $storage;
			$this->engines = $engines ?? new WP_Sync_Engine_Registry( $storage );
		}

		/**
		 * The transport slug.
		 *
		 * @since 7.2.0
		 *
		 * @return string Slug.
		 */
		public function get_slug(): string {
			return self::TRANSPORT_SLUG;
		}

		/**
		 * The transport protocol version.
		 *
		 * @since 7.2.0
		 *
		 * @return int Protocol version.
		 */
		public function get_protocol_version(): int {
			return self::TRANSPORT_PROTOCOL;
		}

		/**
		 * Registers REST API routes.
		 *
		 * @since 7.0.0
		 */
		public function register_routes(): void {
			register_rest_route(
				self::REST_NAMESPACE,
				'/updates',
				array(
					'methods'             => array( WP_REST_Server::CREATABLE ),
					'callback'            => array( $this, 'handle_request' ),
					'permission_callback' => array( $this, 'check_permissions' ),
					'validate_callback'   => array( $this, 'validate_request' ),
					'args'                => $this->get_route_args(),
				)
			);
		}

		/**
		 * The shared route argument schema (the `rooms[]` payload). Extracted
		 * so transport variants — e.g. the long-poll route — validate an
		 * identical request shape.
		 *
		 * @since 7.2.0
		 *
		 * @return array Route args.
		 */
		protected function get_route_args(): array {
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
						'enum'     => $this->engines->get_all_update_types(),
					),
				),
				'required'   => true,
				'type'       => 'object',
			);

			$room_args = array(
				'after'           => array(
					'minimum'  => 0,
					'required' => true,
					'type'     => 'integer',
				),
				'awareness'       => array(
					'required' => true,
					'type'     => array( 'object', 'null' ),
				),
				'client_id'       => array(
					'minimum'  => 1,
					'required' => true,
					'type'     => 'integer',
				),
				// Optional engine handshake stamp: when present, the request
				// fails with 409 unless it matches the room's engine.
				'engine'          => array(
					'required' => false,
					'type'     => 'string',
				),
				// Debug envelope opt-in (see the sync inspector).
				'debug'           => array(
					'required' => false,
					'type'     => 'boolean',
				),
				'engine_protocol' => array(
					'minimum'  => 1,
					'required' => false,
					'type'     => 'integer',
				),
				'room'            => array(
					'required' => true,
					'type'     => 'string',
					'pattern'  => '^[^/]+/[^/:]+(?::\\S+)?$',
				),
				'updates'         => array(
					'items'    => $typed_update_args,
					'minItems' => 0,
					'required' => true,
					'type'     => 'array',
				),
			);

			return array(
				'rooms' => array(
					'items'    => array(
						'properties' => $room_args,
						'type'       => 'object',
					),
					'maxItems' => self::MAX_ROOMS_PER_REQUEST,
					'required' => true,
					'type'     => 'array',
				),
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
				$room_response = $this->process_room_request( $room_request );
				if ( is_wp_error( $room_response ) ) {
					return $room_response;
				}
				$response['rooms'][] = $room_response;
			}

			return new WP_REST_Response( $response, 200 );
		}

		/**
		 * Processes ONE room request through its engine and returns the room
		 * response array (updates + awareness + optional dispositions). This
		 * is the transport-agnostic core of a sync exchange: it decodes
		 * nothing, delegating meaning to the engine. Both the REST transports
		 * and the out-of-band WebSocket daemon drive rooms through here, so
		 * every transport applies the same engine mismatch fencing, awareness
		 * merge, ingest, and catch-up.
		 *
		 * @since 7.2.0
		 *
		 * @param array $room_request One room's request payload (after, awareness,
		 *                            client_id, room, updates, and optional
		 *                            engine/engine_protocol/debug).
		 * @return array|WP_Error Room response, or WP_Error (engine mismatch / ingest error).
		 */
		public function process_room_request( array $room_request ) {
			$awareness = $room_request['awareness'] ?? null;
			$client_id = (int) $room_request['client_id'];
			$cursor    = (int) $room_request['after'];
			$room      = (string) $room_request['room'];
			$updates   = $room_request['updates'] ?? array();

			$engine = $this->engines->get_engine_for_room( $room );

			$mismatch = $this->check_engine_mismatch( $engine, $room, $room_request, $updates );
			if ( is_wp_error( $mismatch ) ) {
				do_action( 'qm/debug', "wp-sync: engine mismatch for {$room} (client speaks another engine)" );
				return $mismatch;
			}

			// Merge awareness state.
			$merged_awareness = $this->process_awareness_update( $room, $client_id, $awareness );

			$context = array(
				'awareness' => $merged_awareness,
				/*
				 * Debug envelope opt-in: the client's inspector sets `debug`
				 * per room; honored only when the site allows it (room
				 * permission was already enforced by the transport). Engines
				 * that support it attach `_debug` to their room response.
				 */
				'debug'     => ! empty( $room_request['debug'] ) && self::is_debug_allowed(),
			);

			// Engine ingests this client's updates.
			$ingest = $engine->handle_updates( $room, $client_id, $cursor, $updates, $context );
			if ( is_wp_error( $ingest ) ) {
				return $ingest;
			}

			// Engine produces the catch-up payload for this client.
			$room_response              = $engine->get_updates_since( $room, $client_id, $cursor, $context );
			$room_response['awareness'] = $merged_awareness;

			// Engines that produce per-update dispositions (an intent log's
			// applied/escalated/voided outcomes) surface them; relay-style
			// engines omit the key entirely.
			if ( isset( $ingest['dispositions'] ) && null !== $ingest['dispositions'] ) {
				$room_response['dispositions'] = $ingest['dispositions'];
			}

			return $room_response;
		}

		/**
		 * The engine registry this transport drives rooms through (shared by
		 * out-of-band transports such as the WebSocket daemon).
		 *
		 * @since 7.2.0
		 *
		 * @return WP_Sync_Engine_Registry Engine registry.
		 */
		public function get_engine_registry(): WP_Sync_Engine_Registry {
			return $this->engines;
		}

		/**
		 * The storage backend (shared by out-of-band transports).
		 *
		 * @since 7.2.0
		 *
		 * @return WP_Sync_Storage Storage backend.
		 */
		public function get_storage(): WP_Sync_Storage {
			return $this->storage;
		}

		/**
		 * Per-room permission check for an array-shaped request (the REST
		 * permission callback's engine-agnostic core), so out-of-band
		 * transports enforce the same access rules.
		 *
		 * @since 7.2.0
		 *
		 * @param string $room Room identifier.
		 * @return bool Whether the current user may sync the room.
		 */
		public function can_user_sync_room( string $room ): bool {
			$parsed = WP_Sync_Config::parse_room( $room );
			return null !== $parsed && WP_Sync_Config::can_user_sync_entity_type(
				$parsed['entity_kind'],
				$parsed['entity_name'],
				$parsed['object_id']
			);
		}

		/**
		 * Merges (or, with a null update, removes) a client's awareness in a
		 * room and returns the current awareness map. Exposed so out-of-band
		 * transports can refresh presence and drop it on disconnect.
		 *
		 * @since 7.2.0
		 *
		 * @param string     $room             Room identifier.
		 * @param int        $client_id        Client identifier.
		 * @param array|null $awareness_update Awareness state, or null to remove.
		 * @return array Current awareness map.
		 */
		public function update_awareness( string $room, int $client_id, ?array $awareness_update ): array {
			return $this->process_awareness_update( $room, $client_id, $awareness_update );
		}

		/**
		 * Whether debug envelopes may be attached to room responses.
		 *
		 * @since 7.2.0
		 *
		 * @return bool Allowed state.
		 */
		private static function is_debug_allowed(): bool {
			$default = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG;

			/**
			 * Filters whether sync debug envelopes are allowed. The room
			 * permission check has already run; this gates only the extra
			 * diagnostic detail.
			 *
			 * @since 7.2.0
			 *
			 * @param bool $allowed Defaults to SCRIPT_DEBUG.
			 */
			return (bool) apply_filters( 'wp_sync_debug_enabled', $default );
		}

		/**
		 * Enforces engine consistency for a room.
		 *
		 * Two checks, both failing with 409 `rest_sync_engine_mismatch`:
		 *
		 * 1. Client stamp: when the request carries `engine` /
		 *    `engine_protocol` for the room, they must match the engine the
		 *    server resolved. A stale tab speaking yesterday's engine is
		 *    fenced here, before any of its updates are stored.
		 * 2. Storage lineage: a room's first write stamps the engine slug;
		 *    later writes through a different engine are rejected even if the
		 *    site configuration changed mid-session. Mixed-engine payloads in
		 *    one room would be mutual garbage — the lineage check makes the
		 *    swap scenario degrade to a post lock instead of corruption.
		 *
		 * @since 7.2.0
		 *
		 * @param WP_Sync_Engine       $engine       Engine resolved for the room.
		 * @param string               $room         Room identifier.
		 * @param array<string, mixed> $room_request The room's request payload.
		 * @param array<int, mixed>    $updates      Updates the client wants to store.
		 * @return true|WP_Error True when consistent, WP_Error on mismatch.
		 */
		private function check_engine_mismatch( WP_Sync_Engine $engine, string $room, array $room_request, array $updates ) {
			$mismatch = null;

			if ( isset( $room_request['engine'] ) && $room_request['engine'] !== $engine->get_slug() ) {
				$mismatch = $room_request['engine'];
			} elseif ( isset( $room_request['engine_protocol'] ) && $room_request['engine_protocol'] !== $engine->get_protocol_version() ) {
				$mismatch = $engine->get_slug() . ' protocol ' . $room_request['engine_protocol'];
			} else {
				$lineage = $this->storage->get_room_engine( $room );
				if ( null !== $lineage && $lineage !== $engine->get_slug() ) {
					$mismatch = $lineage;
				} elseif ( null === $lineage && count( $updates ) > 0 ) {
					// First write fixes the room's engine lineage. Failure to
					// stamp is not fatal: the next write retries.
					$this->storage->set_room_engine( $room, $engine->get_slug() );
				}
			}

			if ( null === $mismatch ) {
				return true;
			}

			return new WP_Error(
				'rest_sync_engine_mismatch',
				sprintf(
					/* translators: 1: Room identifier. 2: Sync engine identifier. */
					__( 'Sync engine mismatch for room %1$s: the room requires engine %2$s.', 'gutenberg' ),
					$room,
					$engine->get_slug() . ' v' . $engine->get_protocol_version()
				),
				array(
					'status'          => 409,
					'room'            => $room,
					'engine'          => $engine->get_slug(),
					'engine_protocol' => $engine->get_protocol_version(),
				)
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
	}
}
