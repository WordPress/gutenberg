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
	 * Post type for sync storage
	 */
	const POST_TYPE = 'sync_messages';

	/**
	 * Singleton post ID for storing sync data
	 *
	 * @var int|null
	 */
	private static $storage_post_id = null;

	/**
	 * Register the custom post type for sync storage.
	 */
	public function register_post_type(): void {
		register_post_type(
			self::POST_TYPE,
			array(
				'public'             => false,
				'publicly_queryable' => false,
				'show_ui'            => false,
				'show_in_menu'       => false,
				'show_in_rest'       => false,
				'capability_type'    => 'post',
				'map_meta_cap'       => true,
				'supports'           => array( 'custom-fields' ),
				'label'              => 'Gutenberg Sync Storage',
			)
		);
	}

	/**
	 * Get or create the singleton post for storing sync data.
	 *
	 * @return int Post ID.
	 */
	private function get_storage_post_id(): int {
		if ( is_int( self::$storage_post_id ) ) {
			return self::$storage_post_id;
		}

		// Try to find existing post
		$posts = get_posts(
			array(
				'post_type'      => self::POST_TYPE,
				'posts_per_page' => 1,
				'post_status'    => 'publish',
				'orderby'        => 'ID',
				'order'          => 'ASC',
			)
		);

		if ( ! empty( $posts ) ) {
			self::$storage_post_id = $posts[0]->ID;
			return self::$storage_post_id;
		}

		// Create new post if none exists
		$post_id = wp_insert_post(
			array(
				'post_type'   => self::POST_TYPE,
				'post_status' => 'publish',
				'post_title'  => 'Gutenberg Sync Storage',
			)
		);

		if ( ! is_wp_error( $post_id ) ) {
			self::$storage_post_id = $post_id;
		}

		return self::$storage_post_id;
	}

	/**
	 * Register REST API routes.
	 */
	public function register_routes(): void {
		register_rest_route(
			'sync/v1',
			'/messages',
			array(
				'methods'             => array( WP_REST_Server::READABLE, WP_REST_Server::CREATABLE ),
				'callback'            => array( $this, 'handle_request' ),
				'permission_callback' => array( $this, 'check_permissions' ),
				'args'                => array(
					'client_id'       => array(
						'minimum'  => 1,
						'required' => true,
						'type'     => 'integer',
					),
					'room'            => array(
						'required'          => true,
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
					),
					'last_message_id' => array(
						'default'  => 0,
						'minimum'  => 0,
						'required' => false,
						'type'     => 'integer',
					),
					'message'         => array(
						'required'          => false,
						'type'              => 'string',
						'validate_callback' => function ( mixed $message_json, WP_REST_Request $request ): bool|WP_Error {
							if ( WP_REST_Server::CREATABLE !== $request->get_method() ) {
								return new WP_Error(
									'invalid_method',
									'Message parameter is only allowed for POST requests',
									array( 'status' => 400 )
								);
							}

							if ( ! is_string( $message_json ) || empty( trim( $message_json ) ) ) {
								return new WP_Error(
									'invalid_message',
									'Message must be a non-empty JSON string',
									array( 'status' => 400 )
								);
							}

							$message = json_decode( $message_json, true );

							if ( json_last_error() !== JSON_ERROR_NONE ) {
								return new WP_Error( 'invalid_message', 'Invalid JSON message', array( 'status' => 400 ) );
							}

							if ( ! is_array( $message ) || ! isset( $message['data'], $message['from'], $message['is_full_state'], $message['last_message_id'] ) ) {
								return new WP_Error(
									'invalid_message',
									'Message must contain "data", "from", "is_full_state", and "last_message_id" fields',
									array( 'status' => 400 )
								);
							}

							if ( ! is_array( $message['data'] ) ) {
								return new WP_Error(
									'invalid_message',
									'Message "data" field must be an array of integers',
									array( 'status' => 400 )
								);
							}

							if ( ! is_int( $message['from'] ) || $message['from'] < 1 ) {
								return new WP_Error(
									'invalid_message',
									'Message "from" field must be a positive integer',
									array( 'status' => 400 )
								);
							}

							if ( ! is_bool( $message['is_full_state'] ) ) {
								return new WP_Error(
									'invalid_message',
									'Message "is_full_state" field must be a boolean',
									array( 'status' => 400 )
								);
							}

							if ( ! is_int( $message['last_message_id'] ) || $message['last_message_id'] < 0 ) {
								return new WP_Error(
									'invalid_message',
									'Message "from" field must be a non-negative integer',
									array( 'status' => 400 )
								);
							}

							return true;
						},
					),
				),
			)
		);
	}

	/**
	 * Check if the current user has permission to access a room.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return bool True if user has permission
	 */
	public function check_permissions( WP_REST_Request $request ): bool|WP_Error {
		$room = $request->get_param( 'room' );

		// Parse sync object type (format: kind/name)
		$type_parts   = explode( '/', $room, 2 );
		$object_parts = explode( ':', $type_parts[1] ?? '', 2 );

		if ( 2 !== count( $type_parts ) || 2 !== count( $object_parts ) ) {
			return new WP_Error(
				'invalid_room_format',
				'Invalid room format. Expected: entity_kind/entity_name:id',
				array( 'status' => 400 )
			);
		}

		// Extract Gutenberg entity kind and name from sync object type
		[ $entity_kind ] = $type_parts;
		[ , $object_id ] = $object_parts;

		// Handle post type entities.
		if ( 'postType' === $entity_kind && is_numeric( $object_id ) ) {
			return current_user_can( 'edit_post', absint( $object_id ) );
		}

		// Implement other entity kinds as needed.
		return false;
	}

	/**
	 * Handle all requests (both polling connections and message posting).
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return WP_REST_Response|WP_Error Response object or error.
	 */
	public function handle_request( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$room            = $request->get_param( 'room' );
		$client_id       = $request->get_param( 'client_id' );
		$last_message_id = $request->get_param( 'last_message_id' );

		if ( WP_REST_Server::CREATABLE === $request->get_method() ) {
			$raw_message = $request->get_param( 'message' );
			$message     = json_decode( $raw_message, true );

			$this->add_message_to_room( $room, $message );

			return new \WP_REST_Response(
				array(
					'success' => true,
					'room'    => $room,
				),
				200
			);
		}

		return $this->poll_for_messages( $room, $client_id, $last_message_id );
	}

	/**
	 * Get the meta key for a room's messages.
	 *
	 * @param string $room Room identifier.
	 * @return string Meta key.
	 */
	private function get_room_meta_key( string $room ): string {
		return 'sync_message_' . $room;
	}

	/**
	 * Add a message to a room's message queue
	 *
	 * @param string $room    Room identifier.
	 * @param array  $message Message data.
	 */
	private function add_message_to_room( string $room, array $message ): void {
		$post_id  = $this->get_storage_post_id();
		$meta_key = $this->get_room_meta_key( $room );

		// Get existing messages.
		$messages = get_post_meta( $post_id, $meta_key, false );

		// Get the last message to determine next ID.
		$last_message    = end( $messages );
		$last_message_id = isset( $last_message['id'] ) ? $last_message['id'] : 0;

		// If this is a full state, confirm that it reflects all of our existing
		// messages. If so, delete them.
		if ( $message['is_full_state'] && $message['last_message_id'] >= $last_message_id ) {
			$this->debug_log( 'Full state received for room ' . $room . ', deleting existing messages' );
			delete_post_meta( $post_id, $meta_key );
			$last_message_id = 0;
		}

		$message['id'] = $last_message_id + 1;

		// Add the new message (single=false means it's added as a new value)
		add_post_meta( $post_id, $meta_key, $message, false );

		$this->debug_log( 'Added message ID ' . $message['id'] . ' to room ' . $room . '; count=' . $last_message_id );
	}

	/**
	 * Log debug messages if WP_DEBUG is enabled.
	 *
	 * @param string $message Message to log.
	 */
	private function debug_log( string $message ): void {
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			error_log( '[Gutenberg Sync] ' . $message );
		}
	}

	/**
	 * Get new messages from a room since a given message ID.
	 *
	 * @param string $room           Room identifier.
	 * @param int    $client_id      Client identifier.
	 * @param int    $last_message_id Last message ID received.
	 * @return array Array of messages.
	 */
	private function get_new_messages( string $room, int $client_id, int $last_message_id = 0 ): array {
		$post_id  = $this->get_storage_post_id();
		$meta_key = $this->get_room_meta_key( $room );

		// Get all messages for this room (single=false returns array of all values)
		$messages = get_post_meta( $post_id, $meta_key, false );

		if ( ! $messages || ! is_array( $messages ) ) {
			return array();
		}

		// Filter messages newer than last_message_id and not from this client
		$new_messages = array_filter(
			$messages,
			function ( $message ) use ( $client_id, $last_message_id ) {
				return isset( $message['from'], $message['id'] ) &&
					$client_id !== $message['from'] &&
					$message['id'] > $last_message_id;
			}
		);

		return array_values( $new_messages );
	}

	/**
	 * Poll for new messages for a client, keeping the connection alive.
	 *
	 * @param string $room      Room identifier.
	 * @param int    $client_id Client identifier.
	 * @param int    $last_message_id Last message ID received.
	 * @return WP_REST_Response
	 */
	private function poll_for_messages( string $room, int $client_id, int $last_message_id = 0 ): WP_REST_Response {
		header( 'Cache-Control: no-store' );

		$messages = $this->get_new_messages( $room, $client_id, $last_message_id );
		$this->debug_log( 'Fetched ' . count( $messages ) . ' new messages for room ' . $room . '; last_id=' . $last_message_id );

		return new WP_REST_Response(
			array(
				'messages' => $messages,
			),
			200
		);
	}
}
