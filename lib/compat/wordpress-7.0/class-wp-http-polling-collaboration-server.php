<?php
/**
 * WP_HTTP_Polling_Collaboration_Server class
 *
 * @package gutenberg
 */

if ( ! class_exists( 'WP_HTTP_Polling_Collaboration_Server' ) ) {

	/**
	 * Core class that contains an HTTP server used for collaborative editing.
	 *
	 * @since 7.0.0
	 * @access private
	 */
	class WP_HTTP_Polling_Collaboration_Server {
		/**
		 * REST API namespace.
		 *
		 * @since 7.0.0
		 * @var string
		 */
		const REST_NAMESPACE = 'wp-collaboration/v1';

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
		 * @var int
		 */
		const COMPACTION_THRESHOLD = 50;

		/**
		 * Maximum allowed request body size in bytes.
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
		 * Maximum allowed size for a single update's data field in bytes.
		 *
		 * @since 7.0.0
		 * @var int
		 */
		const MAX_UPDATE_DATA_SIZE = MB_IN_BYTES;

		/**
		 * Collaboration update type: compaction.
		 *
		 * @since 7.0.0
		 * @var string
		 */
		const UPDATE_TYPE_COMPACTION = 'compaction';

		/**
		 * Collaboration update type: sync step 1.
		 *
		 * @since 7.0.0
		 * @var string
		 */
		const UPDATE_TYPE_SYNC_STEP1 = 'sync_step1';

		/**
		 * Collaboration update type: sync step 2.
		 *
		 * @since 7.0.0
		 * @var string
		 */
		const UPDATE_TYPE_SYNC_STEP2 = 'sync_step2';

		/**
		 * Collaboration update type: regular update.
		 *
		 * @since 7.0.0
		 * @var string
		 */
		const UPDATE_TYPE_UPDATE = 'update';

		/**
		 * Storage backend for collaboration updates.
		 *
		 * @since 7.0.0
		 * @var WP_Collaboration_Storage
		 */
		private WP_Collaboration_Storage $storage;

		/**
		 * Constructor.
		 *
		 * @since 7.0.0
		 *
		 * @param WP_Collaboration_Storage $storage Storage backend for collaboration updates.
		 */
		public function __construct( WP_Collaboration_Storage $storage ) {
			$this->storage = $storage;
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
					'maximum'  => str_repeat( '9', 32 ), // Max 32-digit integer (avoids PHP_INT_MAX).
					'required' => true,
					'type'     => 'integer',
				),
				'room'      => array(
					'required'  => true,
					'type'      => 'string',
					/*
					 * Room names follow the pattern EntityKind/EntityName:ObjectID, where:
					 * - EntityKind is a broad category of the entity, e.g. 'postType'.
					 * - EntityName is the specific entity, e.g. 'post', 'page'.
					 * - ObjectID is an optional identifier for single entities, e.g. a specific post ID. It must be a positive integer.
					 */
					'pattern'   => '^[^/]+/[^/:]+(?::[1-9][0-9]*)?$',
					'maxLength' => 191, // Matches $max_index_length in wp-admin/includes/schema.php.
				),
				'updates'   => array(
					'items'    => $typed_update_args,
					'minItems' => 0,
					'required' => true,
					'type'     => 'array',
				),
			);

			$route_args = array(
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
			);

			register_rest_route(
				self::REST_NAMESPACE,
				'/updates',
				$route_args
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
					__( 'You do not have permission to perform this action' ),
					array( 'status' => rest_authorization_required_code() )
				);
			}

			$rooms      = $request['rooms'];
			$wp_user_id = get_current_user_id();

			foreach ( $rooms as $room_data ) {
				$client_id = $room_data['client_id'];
				$room      = $room_data['room'];

				$type_parts   = explode( '/', $room, 2 );
				$object_parts = explode( ':', $type_parts[1] ?? '', 2 );

				$entity_kind = $type_parts[0];
				$entity_name = $object_parts[0];
				$object_id   = $object_parts[1] ?? null;

				if ( ! $this->can_user_collaborate_on_entity_type( $entity_kind, $entity_name, $object_id ) ) {
					return new WP_Error(
						'rest_cannot_edit',
						sprintf(
							/* translators: %s: The room name encodes the current entity being synced. */
							__( 'You do not have permission to sync this entity: %s.' ),
							$room
						),
						array( 'status' => rest_authorization_required_code() )
					);
				}

				/*
				 * Writes to a collection room require the entity's mutation cap,
				 * not just the read cap above. Empty `updates: []` polls only need
				 * the read cap and are allowed for any user that passed it.
				 */
				if ( null === $object_id && ! empty( $room_data['updates'] ) ) {
					if ( ! $this->can_user_write_entity_type( $entity_kind, $entity_name ) ) {
						return new WP_Error(
							'rest_cannot_edit',
							sprintf(
								/* translators: %s: The room name encodes the current entity being synced. */
								__( 'You do not have permission to write to this entity: %s.' ),
								$room
							),
							array( 'status' => rest_authorization_required_code() )
						);
					}
				}

				/*
				 * Skip client_id collision checks on collection rooms — their
				 * awareness is stripped server-side, so client_id ownership is moot.
				 */
				if ( null !== $object_id ) {
					$existing_awareness = $this->storage->get_awareness_state( $room );
					foreach ( $existing_awareness as $entry ) {
						if ( $client_id === $entry['client_id'] && $wp_user_id !== $entry['wp_user_id'] ) {
							return new WP_Error(
								'rest_cannot_edit',
								__( 'Client ID is already in use by another user.' ),
								array( 'status' => rest_authorization_required_code() )
							);
						}
					}
				}
			}

			return true;
		}
		/**
		 * Validates the incoming REST request.
		 *
		 * Checks that the raw request body does not exceed the maximum allowed size.
		 *
		 * @since 7.0.0
		 *
		 * @param WP_REST_Request $request The REST request.
		 * @return true|WP_Error True if valid, WP_Error if body is too large.
		 */
		public function validate_request( WP_REST_Request $request ) {
			$body = $request->get_body();
			if ( is_string( $body ) && strlen( $body ) > self::MAX_BODY_SIZE ) {
				return new WP_Error(
					'rest_collaboration_body_too_large',
					__( 'Request body is too large.' ),
					array( 'status' => 413 )
				);
			}
			return true;
		}

		/**
		 * Handles request: stores updates and awareness data, and returns
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

				// Merge awareness state (also validates client_id ownership).
				$merged_awareness = $this->process_awareness_update( $room, $client_id, $awareness );

				if ( is_wp_error( $merged_awareness ) ) {
					return $merged_awareness;
				}

				// The lowest client ID is nominated to perform compaction when needed.
				$is_compactor = false;
				if ( count( $merged_awareness ) > 0 ) {
					$is_compactor = (string) min( array_keys( $merged_awareness ) ) === (string) $client_id;
				}

				// Process each update according to its type.
				foreach ( $room_request['updates'] as $update ) {
					$result = $this->process_collaboration_update( $room, $client_id, $cursor, $update );
					if ( is_wp_error( $result ) ) {
						return $result;
					}
				}

				// Get updates for this client.
				$room_response              = $this->get_updates( $room, $client_id, $cursor, $is_compactor );
				$room_response['awareness'] = $merged_awareness;

				$response['rooms'][] = $room_response;
			}

			return new WP_REST_Response( $response, 200 );
		}

		/**
		 * Checks if the current user can collaborate on a specific entity type.
		 *
		 * @since 7.0.0
		 *
		 * @param string      $entity_kind The entity kind, e.g. 'postType', 'taxonomy', 'root'.
		 * @param string      $entity_name The entity name, e.g. 'post', 'category', 'comment'.
		 * @param string|null $object_id   Numeric object ID / entity key for single entities, null for collections.
		 * @return bool True if user has read permission, otherwise false.
		 */
		private function can_user_collaborate_on_entity_type( string $entity_kind, string $entity_name, ?string $object_id ): bool {
			if ( is_string( $object_id ) ) {
				if ( ! ctype_digit( $object_id ) ) {
					return false;
				}
				$object_id = (int) $object_id;
			}
			if ( null !== $object_id && $object_id <= 0 ) {
				// Object ID must be a positive integer if provided.
				return false;
			}

			// Single-entity rooms: read cap == write cap.
			if ( is_int( $object_id ) ) {
				if ( 'postType' === $entity_kind ) {
					if ( get_post_type( $object_id ) !== $entity_name ) {
						return false;
					}
					return current_user_can( 'edit_post', $object_id );
				}
				if ( 'taxonomy' === $entity_kind ) {
					$term_exists = term_exists( $object_id, $entity_name );
					if ( ! is_array( $term_exists ) || ! isset( $term_exists['term_id'] ) ) {
						return false;
					}
					return current_user_can( 'edit_term', $object_id );
				}
				if ( 'root' === $entity_kind && 'comment' === $entity_name ) {
					return current_user_can( 'edit_comment', $object_id );
				}
				// Unknown single-entity kind — fall through to the filter below.
			} else {
				// Collection rooms: read cap (lower than write cap for taxonomies).
				if ( 'postType' === $entity_kind ) {
					$post_type_object = get_post_type_object( $entity_name );
					if ( ! isset( $post_type_object->cap->edit_posts ) ) {
						return false;
					}
					return current_user_can( $post_type_object->cap->edit_posts );
				}
				if ( 'taxonomy' === $entity_kind ) {
					$taxonomy = get_taxonomy( $entity_name );
					if ( ! $taxonomy ) {
						return false;
					}
					return current_user_can( $taxonomy->cap->assign_terms );
				}
				if ( 'root' === $entity_kind && 'comment' === $entity_name ) {
					return current_user_can( 'edit_posts' );
				}
				// Unknown collection kind — fall through to the filter below.
			}

			/**
			 * Filters whether the current user can read a sync entity type room.
			 *
			 * Built-in entity kinds (`postType/*`, `taxonomy/*`, `root/comment`)
			 * are checked above and bypass this filter. Plugins that register
			 * custom entity types should hook here and return true only when the
			 * current user has the appropriate read capability.
			 *
			 * @since 7.0.0
			 *
			 * @param bool        $allowed     Whether the current user can read the entity. Default false.
			 * @param string      $entity_kind The entity kind.
			 * @param string      $entity_name The entity name.
			 * @param int|null    $object_id   Object ID for single-entity rooms, null for collections.
			 */
			return (bool) apply_filters(
				'wp_collaborate_can_user_collaborate_on_entity_type',
				false,
				$entity_kind,
				$entity_name,
				$object_id
			);
		}

		/**
		 * Checks if the current user can write update payloads to a collection
		 * room of a specific entity type.
		 *
		 * Single-entity rooms reuse the read cap from
		 * ::can_user_collaborate_on_entity_type(); this method is only consulted for
		 * collection rooms (no object ID), where writes broadcast that the
		 * collection has changed and therefore need the entity's mutation cap.
		 *
		 * @since 7.0.0
		 *
		 * @param string $entity_kind The entity kind, e.g. 'postType', 'taxonomy', 'root'.
		 * @param string $entity_name The entity name.
		 * @return bool True if the user can write to the collection, otherwise false.
		 */
		private function can_user_write_entity_type( string $entity_kind, string $entity_name ): bool {
			if ( 'postType' === $entity_kind ) {
				/*
				 * Post collections: same cap as read. Posts have no entity-wide
				 * "manage" cap distinct from per-post checks; contributors
				 * legitimately create posts and need to broadcast it.
				 */
				$post_type_object = get_post_type_object( $entity_name );
				if ( ! isset( $post_type_object->cap->edit_posts ) ) {
					return false;
				}
				return current_user_can( $post_type_object->cap->edit_posts );
			}
			if ( 'taxonomy' === $entity_kind ) {
				/*
				 * Taxonomy collections: writing requires the mutation cap so
				 * contributors cannot inject collection-room update payloads.
				 */
				$taxonomy = get_taxonomy( $entity_name );
				if ( ! $taxonomy ) {
					return false;
				}
				return current_user_can( $taxonomy->cap->manage_terms );
			}
			if ( 'root' === $entity_kind && 'comment' === $entity_name ) {
				return current_user_can( 'edit_posts' );
			}

			/**
			 * Filters whether the current user can write to a sync collection
			 * room of a plugin-registered entity type.
			 *
			 * Built-in entity kinds bypass this filter. Plugins should hook
			 * here only when the current user has the appropriate mutation
			 * capability for the entity collection.
			 *
			 * @since 7.0.0
			 *
			 * @param bool   $allowed     Whether the current user can write to the collection. Default false.
			 * @param string $entity_kind The entity kind.
			 * @param string $entity_name The entity name.
			 */
			return (bool) apply_filters(
				'wp_collaborate_can_user_write_entity_type',
				false,
				$entity_kind,
				$entity_name
			);
		}

		/**
		 * Processes and stores an awareness update from a client.
		 *
		 * Also validates that the client_id is not already owned by another user.
		 * This check uses the same get_awareness_state() query that builds the
		 * response, eliminating a duplicate query that was previously performed
		 * in check_permissions().
		 *
		 * @since 7.0.0
		 *
		 * @param string                    $room             Room identifier.
		 * @param string                    $client_id        Client identifier.
		 * @param array<string, mixed>|null $awareness_update Awareness state sent by the client.
		 * @return array<string, array<string, mixed>>|WP_Error Map of client ID to awareness state, or WP_Error if client_id is owned by another user.
		 */
		private function process_awareness_update( string $room, string $client_id, ?array $awareness_update ) {
			/*
			 * Awareness is meaningless on collection rooms (no `:id` suffix).
			 * Discard inbound awareness and return empty state so awareness is
			 * never exchanged across consumers in shared collection rooms.
			 */
			if ( ! str_contains( $room, ':' ) ) {
				return array();
			}

			$wp_user_id = get_current_user_id();

			// Check ownership before upserting so a hijacked client_id is rejected.
			$entries = $this->storage->get_awareness_state( $room, self::AWARENESS_TIMEOUT );

			foreach ( $entries as $entry ) {
				if ( $client_id === $entry['client_id'] && $wp_user_id !== $entry['user_id'] ) {
					return new WP_Error(
						'rest_cannot_edit',
						__( 'Client ID is already in use by another user.' ),
						array( 'status' => rest_authorization_required_code() )
					);
				}
			}

			if ( null === $awareness_update ) {
				// Client signalled disconnect, remove the awareness entry.
				$this->storage->remove_awareness_state( $room, $client_id );
			} else {
				$this->storage->set_awareness_state( $room, $client_id, $awareness_update, $wp_user_id );
			}

			$response = array();
			foreach ( $entries as $entry ) {
				if ( $client_id === $entry['client_id'] ) {
					/*
					 * Skip the current client, it is added below from the
					 * request payload or removed on disconnect.
					 */
					continue;
				}

				$response[ $entry['client_id'] ] = $entry['state'];
			}

			/*
			 * Other clients' states were decoded from the DB. Run the current
			 * client's state through the same encode/decode path so the response
			 * is consistent — wp_json_encode may normalize values (e.g. strip
			 * invalid UTF-8) that would otherwise differ on the next poll.
			 */
			if ( null !== $awareness_update ) {
				$response[ $client_id ] = json_decode( wp_json_encode( $awareness_update ), true );
			}

			return $response;
		}

		/**
		 * Processes a collaboration update based on its type.
		 *
		 * @since 7.0.0
		 *
		 * @global wpdb $wpdb WordPress database abstraction object.
		 *
		 * @param string                            $room      Room identifier.
		 * @param string                            $client_id Client identifier.
		 * @param int                               $cursor    Client cursor (marker of last seen update).
		 * @param array{data: string, type: string} $update    Collaboration update.
		 * @return true|WP_Error True on success, WP_Error on storage failure.
		 */
		private function process_collaboration_update( string $room, string $client_id, int $cursor, array $update ) {
			$data = $update['data'];
			$type = $update['type'];

			switch ( $type ) {
				case self::UPDATE_TYPE_COMPACTION:
					/*
					 * Compaction replaces updates the client has already seen. Only remove
					 * updates with markers before the client's cursor to preserve updates
					 * that arrived since the client's last poll.
					 *
					 * Check for a newer compaction update first. If one exists, skip this
					 * compaction to avoid overwriting it.
					 */
					$updates_after_cursor = array_filter( $this->storage->get_updates_after_cursor( $room, $cursor ), 'is_array' );
					$has_newer_compaction = false;

					foreach ( $updates_after_cursor as $existing ) {
						if ( isset( $existing['type'] ) && self::UPDATE_TYPE_COMPACTION === $existing['type'] ) {
							$has_newer_compaction = true;
							break;
						}
					}

					if ( ! $has_newer_compaction ) {
						/*
						 * Insert the compaction row before deleting old rows.
						 * Reversing the order closes a race window where a
						 * client joining with cursor=0 between the DELETE and
						 * INSERT would see an empty room for one poll cycle.
						 * The compaction row always has a higher ID than the
						 * deleted rows, so cursor-based filtering is unaffected.
						 */
						$insert_result = $this->add_update( $room, $client_id, $type, $data );
						if ( is_wp_error( $insert_result ) ) {
							return $insert_result;
						}

						if ( ! $this->storage->remove_updates_through_cursor( $room, $cursor ) ) {
							global $wpdb;
							$error_data = array( 'status' => 500 );
							if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
								$error_data['db_error'] = $wpdb->last_error;
							}
							return new WP_Error(
								'rest_collaboration_storage_error',
								__( 'Failed to remove updates during compaction.' ),
								$error_data
							);
						}

						return true;
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
				__( 'Invalid collaboration update type.' ),
				array( 'status' => 400 )
			);
		}

		/**
		 * Adds an update to a room's update list via storage.
		 *
		 * @since 7.0.0
		 *
		 * @global wpdb $wpdb WordPress database abstraction object.
		 *
		 * @param string $room      Room identifier.
		 * @param string $client_id Client identifier.
		 * @param string $type      Update type (sync_step1, sync_step2, update, compaction).
		 * @param string $data      Base64-encoded update data.
		 * @return true|WP_Error True on success, WP_Error on storage failure.
		 */
		private function add_update( string $room, string $client_id, string $type, string $data ) {
			$update = array(
				'client_id' => $client_id,
				'data'      => $data,
				'type'      => $type,
			);

			if ( ! $this->storage->add_update( $room, $update ) ) {
				global $wpdb;
				$data = array( 'status' => 500 );
				if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
					$data['db_error'] = $wpdb->last_error;
				}
				return new WP_Error(
					'rest_collaboration_storage_error',
					__( 'Failed to store collaboration update.' ),
					$data
				);
			}

			return true;
		}

		/**
		 * Gets updates for a specific client from a room after a given cursor.
		 *
		 * Delegates cursor-based retrieval to the storage layer, then applies
		 * client-specific filtering and compaction logic.
		 *
		 * @since 7.0.0
		 *
		 * @param string $room         Room identifier.
		 * @param string $client_id    Client identifier.
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
		private function get_updates( string $room, string $client_id, int $cursor, bool $is_compactor ): array {
			$updates_after_cursor = array_filter(
				$this->storage->get_updates_after_cursor( $room, $cursor ),
				static function ( $update ): bool {
					return (
						is_array( $update )
						&&
						isset( $update['client_id'], $update['type'], $update['data'] )
						&&
						is_string( $update['type'] )
						&&
						is_string( $update['data'] )
					);
				}
			);
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
	}

}
