<?php
/**
 * WP_Sync_Save_Server class
 *
 * @package gutenberg
 */

if ( ! class_exists( 'WP_Sync_Config' ) ) {
	require_once __DIR__ . '/class-wp-sync-config.php';
}

if ( ! class_exists( 'WP_Sync_Save_Server' ) ) {

	/**
	 * Core class that contains a REST server used for sync save requests.
	 *
	 * @since 7.1.0
	 * @access private
	 */
	class WP_Sync_Save_Server {
		/**
		 * REST API namespace.
		 *
		 * @since 7.1.0
		 * @var string
		 */
		const REST_NAMESPACE = 'wp-sync/v1';

		/**
		 * Meta key used to persist CRDT document snapshots.
		 *
		 * @since 7.1.0
		 * @var string
		 */
		const CRDT_DOC_META_KEY = '_crdt_document';

		/**
		 * Maximum total size (in bytes) of the request body.
		 *
		 * @since 7.1.0
		 * @var int
		 */
		const MAX_BODY_SIZE = 16 * MB_IN_BYTES;

		/**
		 * Registers REST API routes.
		 *
		 * @since 7.1.0
		 */
		public function register_routes(): void {
			if ( isset( rest_get_server()->get_routes()[ '/' . self::REST_NAMESPACE . '/save' ] ) ) {
				return;
			}

			register_rest_route(
				self::REST_NAMESPACE,
				'/save',
				array(
					'methods'             => array( WP_REST_Server::CREATABLE ),
					'callback'            => array( $this, 'handle_request' ),
					'permission_callback' => array( $this, 'check_permissions' ),
					'validate_callback'   => array( $this, 'validate_request' ),
					'args'                => array(
						'room' => array(
							'required' => true,
							'type'     => 'string',
						),
						'doc'  => array(
							'maxLength' => self::MAX_BODY_SIZE,
							'required'  => true,
							'type'      => 'string',
						),
					),
				)
			);
		}

		/**
		 * Checks if the current user has permission to persist a CRDT document.
		 *
		 * @since 7.1.0
		 *
		 * @param WP_REST_Request $request The REST request.
		 * @return bool|WP_Error True if user has permission, otherwise WP_Error with details.
		 */
		public function check_permissions( WP_REST_Request $request ) {
			if ( ! current_user_can( 'edit_posts' ) ) {
				return new WP_Error(
					'rest_cannot_edit',
					__( 'You do not have permission to perform this action', 'gutenberg' ),
					array( 'status' => rest_authorization_required_code() )
				);
			}

			$room        = $request['room'];
			$parsed_room = is_string( $room ) ? WP_Sync_Config::parse_room( $room ) : null;

			if ( null === $parsed_room || ! $this->can_user_persist_crdt_doc( $parsed_room['entity_kind'], $parsed_room['entity_name'], $parsed_room['object_id'] ) ) {
				return new WP_Error(
					'rest_cannot_edit',
					__( 'You do not have permission to persist this document.', 'gutenberg' ),
					array( 'status' => rest_authorization_required_code() )
				);
			}

			return true;
		}

		/**
		 * Validates that the request body does not exceed the maximum allowed size.
		 *
		 * @since 7.1.0
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
		 * Persists a CRDT document snapshot for a supported room.
		 *
		 * @since 7.1.0
		 *
		 * @param WP_REST_Request $request The REST request.
		 * @return WP_REST_Response|WP_Error Response object or error.
		 */
		public function handle_request( WP_REST_Request $request ) {
			$room        = $request['room'];
			$parsed_room = is_string( $room ) ? WP_Sync_Config::parse_room( $room ) : null;

			$post_id = null;
			if ( null !== $parsed_room ) {
				$post_id = WP_Sync_Config::get_crdt_doc_persistence_post_id(
					$parsed_room['entity_kind'],
					$parsed_room['entity_name'],
					$parsed_room['object_id']
				);
			}

			if ( null === $post_id || ! current_user_can( 'edit_post', $post_id ) ) {
				return new WP_Error(
					'rest_cannot_edit',
					__( 'You do not have permission to persist this document.', 'gutenberg' ),
					array( 'status' => rest_authorization_required_code() )
				);
			}

			$doc = $request['doc'];

			if ( get_post_meta( $post_id, self::CRDT_DOC_META_KEY, true ) !== $doc ) {
				$updated = update_post_meta( $post_id, self::CRDT_DOC_META_KEY, $doc );
				if ( false === $updated ) {
					return new WP_Error(
						'rest_crdt_save_failed',
						__( 'Failed to save CRDT document.', 'gutenberg' ),
						array( 'status' => 500 )
					);
				}
			}

			return new WP_REST_Response(
				array(
					'room' => $room,
				),
				200
			);
		}

		/**
		 * Checks if the current user can persist a CRDT document for an entity.
		 *
		 * @since 7.1.0
		 *
		 * @param string      $entity_kind The entity kind.
		 * @param string      $entity_name The entity name.
		 * @param string|null $object_id   The entity ID.
		 * @return bool True if the user can persist the CRDT document, otherwise false.
		 */
		private function can_user_persist_crdt_doc( string $entity_kind, string $entity_name, ?string $object_id ): bool {
			$post_id = WP_Sync_Config::get_crdt_doc_persistence_post_id( $entity_kind, $entity_name, $object_id );
			return null !== $post_id && current_user_can( 'edit_post', $post_id );
		}
	}
}
