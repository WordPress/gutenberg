<?php
/**
 * Gutenberg_HTTP_SSE_Sync_Server class
 *
 * @package Gutenberg
 */

/**
 * Gutenberg class that contains an HTTP-based SSE server used for collaborative
 * editing.
 *
 * @access private
 * @internal
 */
class Gutenberg_HTTP_SSE_Sync_Server {
	/**
	 * Cache expiration time in seconds
	 */
	const CACHE_EXPIRATION_IN_S = 300;

	/**
	 * Cache key prefix
	 */
	const CACHE_PREFIX = 'gutenberg_sse_sync_';

	/**
	 * Maximum client connection time in seconds
	 */
	const MAX_CONNECTION_TIME_IN_S = 60;

	/**
	 * Register REST API routes.
	 */
	public function register_routes(): void {
		register_rest_route(
			'sync/v1',
			'/messages',
			array(
				'methods'             => array( WP_Rest_Server::READABLE, WP_REST_Server::CREATABLE ),
				'callback'            => array( $this, 'handle_request' ),
				'permission_callback' => array( $this, 'check_permissions' ),
				'args'                => array(
					'client_id' => array(
						'minimum'  => 1,
						'required' => true,
						'type'     => 'integer',
					),
					'room'      => array(
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
					'message'   => array(
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
		[ $entity_kind ]                   = $type_parts;
		[ , $object_id ] = $object_parts;

		// Handle post type entities.
		if ( 'postType' === $entity_kind && is_numeric( $object_id ) ) {
			return current_user_can( 'edit_post', absint( $object_id ) );
		}

		// Implement other entity kinds as needed.
		return false;
	}

	/**
	 * Handle all requests (both SSE connections and message posting).
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
	 * Get a value from the store.
	 *
	 * @param string $cache_key     Cache key.
	 * @param bool   $force_refresh Whether to force refresh from store.
	 * @return mixed Cached value.
	 */
	private function get_value( string $cache_key, bool $force_refresh = true ): mixed {
		if ( $force_refresh ) {
			// Delete from object cache to force fresh read from database.
			wp_cache_delete( '_transient_' . $cache_key, 'options' );
		}

		return get_transient( $cache_key );
	}

	/**
	 * Set a value in the store.
	 *
	 * @param string $cache_key Cache key.
	 * @param mixed  $value     Value to cache.
	 */
	private function set_value( string $cache_key, mixed $value ): void {
		set_transient( $cache_key, $value, self::CACHE_EXPIRATION_IN_S );
	}

	/**
	 * Add a message to a room's message queue
	 *
	 * @param string $room    Room identifier.
	 * @param array  $message Message data.
	 */
	private function add_message_to_room( string $room, array $message ): void {
		$cache_key = $this->get_messages_cache_key( $room );
		$messages  = $this->get_value( $cache_key );

		if ( ! $messages || ! is_array( $messages ) ) {
			$messages = array();
		}

		// Add message with incremented ID
		$last_message  = end( $messages );
		$message['id'] = isset( $last_message['id'] ) ? $last_message['id'] + 1 : 1;
		$messages[]    = $message;

		$prev_count = count( $messages );

		if ( $message['is_full_state'] && $message['last_message_id'] > 0 ) {
			$messages = $this->cleanup_old_messages( $messages );
		}

		$count = count( $messages );
		if ( $count < $prev_count ) {
			$this->debug_log( 'Cleaned up ' . ( $prev_count - $count ) . ' old messages in room ' . $room );
		}

		$this->debug_log( 'Added message ID ' . $message['id'] . ' to room ' . $room . '; count=' . $count );
		$this->set_value( $cache_key, $messages );
	}

	/**
	 * Clean up old messages based on the latest full-state snapshot.
	 *
	 * @param array  $messages Current messages array.
	 * @return array Cleaned messages array.
	 */
	private function cleanup_old_messages( array $messages ): array {
		$previous_last_message_id = 0;

		foreach ( $messages as $message ) {
			if ( $message['is_full_state'] ?? false ) {
				if ( $message['last_message_id'] > $previous_last_message_id ) {
					$previous_last_message_id = $message['last_message_id'];
				}
			}
		}

		return array_filter(
			$messages,
			function ( $message ) use ( $previous_last_message_id ) {
				return $message['id'] > $previous_last_message_id;
			}
		);
	}

	/**
	 * Log debug messages if WP_DEBUG is enabled.
	 *
	 * @param string $message Message to log.
	 */
	private function debug_log( string $message ): void {
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			error_log( '[Gutenberg SSE Sync] ' . $message );
		}
	}

	/**
	 * Get the cache key for a room's messages
	 *
	 * @param string $room Room identifier.
	 * @return string Cache key.
	 */
	private function get_messages_cache_key( string $room ): string {
		return self::CACHE_PREFIX . "messages_{$room}";
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
		$cache_key = $this->get_messages_cache_key( $room );
		$messages = $this->get_value( $cache_key );

		if ( ! $messages || ! is_array( $messages ) ) {
			return array();
		}

		// Filter messages newer than last_message_id
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
	 * @return WP_REST_Response Response with SSE stream.
	 */
	private function poll_for_messages( string $room, int $client_id, int $last_message_id = 0 ) {
		header( 'Cache-Control: no-store' );
		header( 'Connection: keep-alive' );
		header( 'Content-Type: text/event-stream' );
		header( 'X-Accel-Buffering: no' ); // Disable Nginx buffering

		// Disable output buffering and compression.
		ini_set( 'output_buffering', 'off' );
		ini_set( 'zlib.output_compression', false );

		// Check if there are other active clients, if this is the only client,
		// implement lazy connection. The client will reconnect after a timeout.
		if ( 0 === count( self::get_new_messages( $room, $client_id, $last_message_id ) ) ) {
			echo "data: " . wp_json_encode( array() ) . "\n\n";
			flush();
			exit;
		}

		$start_time = time();

		// Send initial connection message
		echo "data: " . wp_json_encode( array( 'messages' => array() ) ) . "\n\n";
		flush();

		// Keep connection alive and send messages
		while ( true ) {
			// Check if client is still connected (basic check)
			if ( connection_aborted() || ( time() - $start_time ) > self::MAX_CONNECTION_TIME_IN_S ) {
				break;
			}

			$messages = $this->get_new_messages( $room, $client_id, $last_message_id );

			if ( count( $messages ) > 0 ) {
				$this->debug_log( 'Fetched ' . count( $messages ) . ' new messages for room ' . $room . '; last_id=' . $last_message_id );

				// Send messages.
				echo "data: " . wp_json_encode( array( 'messages' => $messages ) ) . "\n\n";
				flush();

				// Update last message ID
				$last_message = end( $messages );
				$last_message_id = $last_message['id'] ?? $last_message_id;
			} else {
				// Send heartbeat to keep connection alive. We do not expect a response.
				echo "heartbeat: ping\n\n";
				flush();
			}

			// Sleep briefly before checking again
			usleep( 100000 ); // 100ms
		}

		exit;
	}
}
