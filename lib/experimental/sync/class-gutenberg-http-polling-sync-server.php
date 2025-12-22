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
	const REST_NAMESPACE = 'sync/v1';
	const REST_ROUTE     = '/messages';

	/**
	 * Storage backend for sync messages.
	 *
	 * @var Gutenberg_Sync_Storage
	 */
	private $storage;

	public function __construct( Gutenberg_Sync_Storage $storage ) {
		$this->storage = $storage;
	}

	public function init(): void {
		add_action( 'admin_init', array( $this, 'admin_init' ) );
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	public function admin_init(): void {
		$collaborative_editing_secret = get_site_option( 'collaborative_editing_secret' );
		if ( ! $collaborative_editing_secret ) {
			$collaborative_editing_secret = wp_generate_password( 64, false );
			add_site_option( 'collaborative_editing_secret', $collaborative_editing_secret );
		}

		$rest_nonce = wp_create_nonce( 'wp_rest' );
		$rest_url   = get_rest_url( null, self::REST_NAMESPACE . self::REST_ROUTE );

		wp_add_inline_script(
			'wp-block-editor',
			'window.__experimentalCollaborativeEditingApiUrl = "' . $rest_url . '";' .
			'window.__experimentalCollaborativeEditingNonce  = "' . $rest_nonce . '";' .
			'window.__experimentalCollaborativeEditingSecret = "' . $collaborative_editing_secret . '";',
			'after'
		);
	}

	/**
	 * Register REST API routes.
	 */
	public function register_routes(): void {
		$shared_args = array(
			'client_id'            => array(
				'minimum'  => 1,
				'required' => true,
				'type'     => 'integer',
			),
			'room'                 => array(
				'required'          => true,
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			),
			'last_seen_message_id' => array(
				'default'  => 0,
				'required' => false,
				'type'     => 'integer',
			),
		);

		register_rest_route(
			self::REST_NAMESPACE,
			self::REST_ROUTE,
			array(
				'methods'             => array( WP_REST_Server::READABLE ),
				'callback'            => array( $this, 'handle_poll_request' ),
				'permission_callback' => array( $this, 'check_permissions' ),
				'args'                => $shared_args,
			)
		);

		register_rest_route(
			self::REST_NAMESPACE,
			self::REST_ROUTE,
			array(
				'methods'             => array( WP_REST_Server::CREATABLE ),
				'callback'            => array( $this, 'handle_add_request' ),
				'permission_callback' => array( $this, 'check_permissions' ),
				'args'                => array_merge(
					$shared_args,
					array(
						'data'  => array(
							'required' => false,
						),
						'type'  => array(
							'required' => true,
							'type'     => 'enum',
							'enum'     => array( 'awareness', 'signaling', 'sync' ),
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
		[ $entity_kind ]             = $type_parts;
		[ $entity_name, $object_id ] = $object_parts;

		// WebRTC signaling messages are allowed for logged-in users.
		if ( 'webrtc' === $entity_kind && 'signaling' === $entity_name ) {
			return is_user_logged_in();
		}

		// Handle post type entities.
		if ( 'postType' === $entity_kind && is_numeric( $object_id ) ) {
			return current_user_can( 'edit_post', absint( $object_id ) );
		}

		// Implement other entity kinds as needed.
		return false;
	}

	/**
	 * Handle new message request.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return WP_REST_Response|WP_Error Response object or error.
	 */
	public function handle_add_request( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$message = array(
			'client_id' => $request->get_param( 'client_id' ),
			'data'      => $request->get_param( 'data' ),
			'room'      => $request->get_param( 'room' ),
			'type'      => $request->get_param( 'type' ),
		);

		$this->add_message_to_room( $message );

		return new \WP_REST_Response(
			array(
				'success' => true,
				'room'    => $message['room'],
			),
			200
		);
	}

	/**
	 * Handle polling request.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return WP_REST_Response|WP_Error Response object or error.
	 */
	public function handle_poll_request( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$client_id            = $request->get_param( 'client_id' );
		$room                 = $request->get_param( 'room' );
		$last_seen_message_id = $request->get_param( 'last_seen_message_id' );

		return $this->poll_for_messages( $room, $client_id, $last_seen_message_id );
	}

	/**
	 * Add a message to a room's message queue
	 *
	 * @param array $message Message.
	 */
	private function add_message_to_room( array $message ): void {
		$room = $message['room'];

		// Generate unique message ID
		$message['id']        = $this->get_next_message_id( $room );
		$message['timestamp'] = time();

		// Store the message
		$this->storage->add_message_to_room( $room, $message );

		$this->debug_log( 'Added message ' . $message['id'] . ' to room ' . $room );

		// Trigger cleanup after adding message
		$this->cleanup_old_messages( $room );
	}

	/**
	 * Cleanup old messages that all active clients have seen.
	 *
	 * @param string $room Room identifier.
	 */
	private function cleanup_old_messages( string $room ): void {
		// Define active as clients that polled in the last 5 minutes
		$active_threshold = time() - ( 5 * MINUTE_IN_SECONDS );
		$active_clients   = $this->storage->get_active_clients( $room, $active_threshold );

		if ( empty( $active_clients ) ) {
			// No active clients - clean up messages older than 30 minutes
			$all_messages     = $this->storage->get_messages_for_room( $room );
			$cutoff_timestamp = time() - ( 30 * MINUTE_IN_SECONDS );

			$min_message_id = PHP_INT_MAX;
			foreach ( $all_messages as $message ) {
				if ( isset( $message['timestamp'] ) && $message['timestamp'] < $cutoff_timestamp ) {
					// Keep finding the minimum message ID that's older than cutoff
					continue;
				}
				if ( isset( $message['id'] ) && $message['id'] < $min_message_id ) {
					$min_message_id = $message['id'];
				}
			}

			if ( $min_message_id < PHP_INT_MAX && $min_message_id > 1 ) {
				$this->storage->delete_messages_before( $room, $min_message_id );
				$this->debug_log( 'Cleaned up messages before ID ' . $min_message_id . ' (no active clients)' );
			}
			return;
		}

		// Find the minimum last_seen_message_id across all active clients
		$min_last_seen = PHP_INT_MAX;
		foreach ( $active_clients as $client ) {
			if ( $client['last_seen_message_id'] < $min_last_seen ) {
				$min_last_seen = $client['last_seen_message_id'];
			}
		}

		// Only delete messages that:
		// 1. All active clients have seen (ID < min_last_seen)
		// 2. Are older than 5 minutes (safety window)
		$all_messages     = $this->storage->get_messages_for_room( $room );
		$cutoff_timestamp = time() - ( 5 * MINUTE_IN_SECONDS );

		$safe_delete_before = PHP_INT_MAX;
		foreach ( $all_messages as $message ) {
			$message_id = $message['id'] ?? 0;
			$timestamp  = $message['timestamp'] ?? time();

			// Only consider messages that all clients have seen
			if ( $message_id >= $min_last_seen ) {
				continue;
			}

			// Only delete if older than safety window
			if ( $timestamp >= $cutoff_timestamp ) {
				// This message is too recent, stop here
				if ( $message_id < $safe_delete_before ) {
					$safe_delete_before = $message_id;
				}
				break;
			}
		}

		// Delete messages that are safe to delete
		if ( $safe_delete_before < PHP_INT_MAX && $safe_delete_before > 1 ) {
			$this->storage->delete_messages_before( $room, $safe_delete_before );
			$this->debug_log( 'Cleaned up messages before ID ' . $safe_delete_before . ' for room ' . $room );
		}
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
	 * @param string $room      Room identifier.
	 * @param int    $client_id Client identifier.
	 * @param int    $last_seen_message_id Last seen message ID.
	 * @return array Array of messages.
	 */
	private function get_new_messages( string $room, int $client_id, int $last_seen_message_id ): array {
		$all_messages = $this->storage->get_messages_for_room( $room );

		// Filter messages: only return messages this client hasn't seen
		// and that are not from this client
		$new_messages = array();
		foreach ( $all_messages as $message ) {
			$message_id        = isset( $message['id'] ) ? (int) $message['id'] : 0;
			$message_client_id = isset( $message['client_id'] ) ? (int) $message['client_id'] : 0;

			// Skip messages from this client (don't echo back)
			if ( $message_client_id === $client_id ) {
				continue;
			}

			// Only include messages after the last seen message ID
			if ( $message_id > $last_seen_message_id ) {
				$new_messages[] = $message;
			}
		}

		// Sort by message ID to ensure order
		usort(
			$new_messages,
			function ( $a, $b ) {
				return ( $a['id'] ?? 0 ) <=> ( $b['id'] ?? 0 );
			}
		);

		return $new_messages;
	}

	/**
	 * Get the next message ID for a room.
	 *
	 * @param string $room Room identifier.
	 * @return int Next message ID.
	 */
	private function get_next_message_id( string $room ): int {
		$messages = $this->storage->get_messages_for_room( $room );

		if ( empty( $messages ) ) {
			return 1;
		}

		// Find the highest existing message ID
		$max_id = 0;
		foreach ( $messages as $message ) {
			if ( isset( $message['id'] ) && $message['id'] > $max_id ) {
				$max_id = $message['id'];
			}
		}

		return $max_id + 1;
	}

	/**
	 * Poll for new messages for a client.
	 *
	 * @param string $room      Room identifier.
	 * @param int    $client_id Client identifier.
	 * @param int    $last_seen_message_id Last seen message ID.
	 * @return WP_REST_Response
	 */
	private function poll_for_messages( string $room, int $client_id, int $last_seen_message_id ): WP_REST_Response {
		header( 'Cache-Control: no-store' );

		$messages = $this->get_new_messages( $room, $client_id, $last_seen_message_id );
		$this->debug_log( 'Fetched ' . count( $messages ) . ' new messages for room ' . $room . ' since message ID ' . $last_seen_message_id );

		// Update client's last seen message ID if they received messages
		if ( ! empty( $messages ) ) {
			$last_message = end( $messages );
			if ( isset( $last_message['id'] ) ) {
				$this->storage->update_client_last_seen( $room, $client_id, $last_message['id'] );
			}
		} else {
			// Even if no new messages, update the client's activity timestamp
			$current_last_seen = $this->storage->get_client_last_seen( $room, $client_id );
			$this->storage->update_client_last_seen( $room, $client_id, max( $current_last_seen, $last_seen_message_id ) );
		}

		return new WP_REST_Response(
			array(
				'messages' => $messages,
			),
			200
		);
	}
}
