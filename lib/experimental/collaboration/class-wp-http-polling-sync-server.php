<?php
/**
 * WP_HTTP_Polling_Sync_Server class
 *
 * @package gutenberg
 */

if ( ! class_exists( 'WP_Sync_Config' ) ) {
	require_once __DIR__ . '/class-wp-sync-config.php';
}

if ( ! class_exists( 'WP_Sync_Server_Core' ) ) {
	require_once __DIR__ . '/class-wp-sync-server-core.php';
}

if ( ! class_exists( 'WP_HTTP_Polling_Sync_Server' ) ) {

	/**
	 * Core class that contains an HTTP server used for collaborative editing.
	 *
	 * @since 7.0.0
	 * @access private
	 */
	class WP_HTTP_Polling_Sync_Server {
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
		const AWARENESS_TIMEOUT = WP_Sync_Server_Core::AWARENESS_TIMEOUT;

		/**
		 * Threshold used to signal clients to send a compaction update.
		 *
		 * @since 7.0.0
		 * @var int
		 */
		const COMPACTION_THRESHOLD = WP_Sync_Server_Core::COMPACTION_THRESHOLD;

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
		const UPDATE_TYPE_COMPACTION = WP_Sync_Server_Core::UPDATE_TYPE_COMPACTION;

		/**
		 * Sync update type: sync step 1.
		 *
		 * @since 7.0.0
		 * @var string
		 */
		const UPDATE_TYPE_SYNC_STEP1 = WP_Sync_Server_Core::UPDATE_TYPE_SYNC_STEP1;

		/**
		 * Sync update type: sync step 2.
		 *
		 * @since 7.0.0
		 * @var string
		 */
		const UPDATE_TYPE_SYNC_STEP2 = WP_Sync_Server_Core::UPDATE_TYPE_SYNC_STEP2;

		/**
		 * Sync update type: regular update.
		 *
		 * @since 7.0.0
		 * @var string
		 */
		const UPDATE_TYPE_UPDATE = WP_Sync_Server_Core::UPDATE_TYPE_UPDATE;

		/**
		 * Transport-agnostic sync server core.
		 *
		 * @since 7.4.0
		 */
		protected WP_Sync_Server_Core $core;

		/**
		 * Constructor.
		 *
		 * @since 7.0.0
		 *
		 * @param WP_Sync_Storage $storage Storage backend for sync updates.
		 */
		public function __construct( WP_Sync_Storage $storage ) {
			$this->core = new WP_Sync_Server_Core( $storage );
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
		 * Gets the argument schema shared by the sync routes.
		 *
		 * @since 7.4.0
		 *
		 * @return array Route argument schema.
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

			return $this->core->check_rooms_permissions( $request['rooms'] );
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
				$room_response = $this->core->process_room_request( $room_request );
				if ( is_wp_error( $room_response ) ) {
					return $room_response;
				}

				$response['rooms'][] = $room_response;
			}

			return new WP_REST_Response( $response, 200 );
		}
	}
}
