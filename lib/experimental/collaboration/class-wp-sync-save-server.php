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
		 * Maximum length of the persisted CRDT document string.
		 *
		 * @since 7.1.0
		 * @var int
		 */
		const MAX_DOC_LENGTH = 16 * MB_IN_BYTES;

		/**
		 * Whether an entity save is already running in this request.
		 *
		 * @since 7.1.0
		 * @var bool
		 */
		private static $entity_save_in_progress = false;

		/**
		 * Registers REST API routes.
		 *
		 * @since 7.1.0
		 */
		public function register_routes(): void {
			$routes = rest_get_server()->get_routes();
			if ( ! isset( $routes[ '/' . self::REST_NAMESPACE . '/save' ] ) ) {
				register_rest_route(
					self::REST_NAMESPACE,
					'/save',
					array(
						'methods'             => array( WP_REST_Server::CREATABLE ),
						'callback'            => array( $this, 'handle_request' ),
						'permission_callback' => array( $this, 'check_permissions' ),
						'args'                => array(
							'room' => array(
								'required' => true,
								'type'     => 'string',
							),
							'doc'  => array(
								'maxLength' => self::MAX_DOC_LENGTH,
								'required'  => true,
								'type'      => 'string',
							),
						),
					)
				);
			}

			if ( ! isset( $routes[ '/' . self::REST_NAMESPACE . '/save-entity' ] ) ) {
				register_rest_route(
					self::REST_NAMESPACE,
					'/save-entity',
					array(
						'methods'             => array( WP_REST_Server::CREATABLE ),
						'callback'            => array( $this, 'handle_entity_request' ),
						'permission_callback' => array( $this, 'check_permissions' ),
						'args'                => array(
							'room'             => array(
								'required' => true,
								'type'     => 'string',
							),
							'doc'              => array(
								'maxLength' => self::MAX_DOC_LENGTH,
								'required'  => true,
								'type'      => 'string',
							),
							'expected_content' => array(
								'required' => true,
								'type'     => 'string',
							),
							'content'          => array(
								'required' => true,
								'type'     => 'string',
							),
						),
					)
				);
			}
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

			$post_id = WP_Sync_Config::get_crdt_doc_persistence_post_id(
				$parsed_room['entity_kind'],
				$parsed_room['entity_name'],
				$parsed_room['object_id']
			);

			$doc = $request['doc'];

			$updated = update_post_meta( $post_id, self::CRDT_DOC_META_KEY, $doc );
			if ( false === $updated && get_post_meta( $post_id, self::CRDT_DOC_META_KEY, true ) !== $doc ) {
				return new WP_Error(
					'rest_crdt_save_failed',
					__( 'Failed to save CRDT document.', 'gutenberg' ),
					array( 'status' => 500 )
				);
			}

			return array();
		}

		/**
		 * Atomically persists entity content and its CRDT snapshot.
		 *
		 * @since 7.1.0
		 *
		 * @param WP_REST_Request $request The REST request.
		 * @return array|WP_Error Empty response or a conflict/error.
		 */
		public function handle_entity_request( WP_REST_Request $request ) {
			global $wpdb;

			if ( self::$entity_save_in_progress ) {
				return new WP_Error(
					'rest_sync_content_conflict',
					__( 'Another synchronized content save is already in progress.', 'gutenberg' ),
					array( 'status' => 409 )
				);
			}

			self::$entity_save_in_progress = true;
			$transaction_open              = false;

			try {
				// A stale writer must not leave post content paired with another writer's CRDT snapshot.
				// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery -- The two-table conditional save requires one transaction.
				if ( false === $wpdb->query( 'START TRANSACTION' ) ) {
					return new WP_Error(
						'rest_sync_transaction_failed',
						__( 'Failed to start synchronized content transaction.', 'gutenberg' ),
						array( 'status' => 500 )
					);
				}
				$transaction_open = true;

				$parsed_room = WP_Sync_Config::parse_room( $request['room'] );
				$post_id     = WP_Sync_Config::get_crdt_doc_persistence_post_id(
					$parsed_room['entity_kind'],
					$parsed_room['entity_name'],
					$parsed_room['object_id']
				);
				$content     = $request['content'];
				$expected    = $request['expected_content'];

				$updated = $wpdb->query(
					$wpdb->prepare(
						"UPDATE $wpdb->posts SET post_content = %s WHERE ID = %d AND post_content = %s",
						$content,
						$post_id,
						$expected
					)
				);

				if ( false === $updated ) {
					return new WP_Error(
						'rest_sync_content_save_failed',
						__( 'Failed to save synchronized content.', 'gutenberg' ),
						array( 'status' => 500 )
					);
				}

				if ( 0 === $updated ) {
					$current = $wpdb->get_var(
						$wpdb->prepare(
							"SELECT post_content FROM $wpdb->posts WHERE ID = %d",
							$post_id
						)
					);
					if ( $current !== $expected ) {
						return new WP_Error(
							'rest_sync_content_conflict',
							__( 'The synchronized content changed before it could be saved.', 'gutenberg' ),
							array( 'status' => 409 )
						);
					}
				}

				$doc_updated = update_post_meta( $post_id, self::CRDT_DOC_META_KEY, $request['doc'] );
				if ( false === $doc_updated && get_post_meta( $post_id, self::CRDT_DOC_META_KEY, true ) !== $request['doc'] ) {
					return new WP_Error(
						'rest_crdt_save_failed',
						__( 'Failed to save CRDT document.', 'gutenberg' ),
						array( 'status' => 500 )
					);
				}

				// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery -- Completes the transaction started above.
				if ( false === $wpdb->query( 'COMMIT' ) ) {
					return new WP_Error(
						'rest_sync_transaction_failed',
						__( 'Failed to commit synchronized content transaction.', 'gutenberg' ),
						array( 'status' => 500 )
					);
				}
				$transaction_open = false;

				clean_post_cache( $post_id );
				return array();
			} finally {
				if ( $transaction_open ) {
					// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery -- Prevents either half of a failed conditional save from persisting.
					$wpdb->query( 'ROLLBACK' );
				}
				self::$entity_save_in_progress = false;
			}
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
