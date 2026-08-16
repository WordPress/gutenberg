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
		 * Whether a save is already running in this request.
		 *
		 * @since 7.1.0
		 * @var bool
		 */
		private static $save_in_progress = false;

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
							'room'         => array(
								'required' => true,
								'type'     => 'string',
							),
							'doc'          => array(
								'maxLength' => self::MAX_DOC_LENGTH,
								'required'  => true,
								'type'      => 'string',
							),
							'expected_doc' => array(
								'required' => true,
								'type'     => 'string',
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
							'expected_doc'     => array(
								'required' => true,
								'type'     => 'string',
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
		 * Atomically persists entity content and its CRDT snapshot.
		 *
		 * @since 7.1.0
		 *
		 * @param WP_REST_Request $request The REST request.
		 * @return array|WP_Error Empty response or a conflict/error.
		 */
		public function handle_entity_request( WP_REST_Request $request ) {
			global $wpdb;

			if ( self::$save_in_progress ) {
				return $this->get_save_conflict_error();
			}

			self::$save_in_progress = true;
			$transaction_open       = false;

			try {
				// A stale writer must not leave post content paired with another writer's CRDT snapshot.
				// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery -- The two-table conditional save requires one transaction.
				if ( false === $wpdb->query( 'START TRANSACTION' ) ) {
					return $this->get_transaction_error( 'start' );
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

				$doc_updated = $this->update_crdt_doc(
					$post_id,
					$request['doc'],
					$request['expected_doc']
				);
				if ( is_wp_error( $doc_updated ) ) {
					return $doc_updated;
				}

				// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery -- Completes the transaction started above.
				if ( false === $wpdb->query( 'COMMIT' ) ) {
					return $this->get_transaction_error( 'commit' );
				}
				$transaction_open = false;

				clean_post_cache( $post_id );
				return array();
			} finally {
				if ( $transaction_open ) {
					// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery -- Prevents either half of a failed conditional save from persisting.
					$wpdb->query( 'ROLLBACK' );
				}
				self::$save_in_progress = false;
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
			global $wpdb;

			if ( self::$save_in_progress ) {
				return $this->get_save_conflict_error();
			}

			self::$save_in_progress = true;
			$transaction_open       = false;
			$room                   = $request['room'];
			$parsed_room            = is_string( $room ) ? WP_Sync_Config::parse_room( $room ) : null;

			$post_id = WP_Sync_Config::get_crdt_doc_persistence_post_id(
				$parsed_room['entity_kind'],
				$parsed_room['entity_name'],
				$parsed_room['object_id']
			);

			try {
				// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery -- All CRDT writers lock the same post row before updating metadata.
				if ( false === $wpdb->query( 'START TRANSACTION' ) ) {
					return $this->get_transaction_error( 'start' );
				}
				$transaction_open = true;

				// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery -- Serializes CRDT writes even when the metadata row does not exist yet.
				$locked_post_id = $wpdb->get_var(
					$wpdb->prepare(
						"SELECT ID FROM $wpdb->posts WHERE ID = %d FOR UPDATE",
						$post_id
					)
				);
				if ( (int) $locked_post_id !== (int) $post_id ) {
					return new WP_Error(
						'rest_sync_post_not_found',
						__( 'The synchronized post could not be found.', 'gutenberg' ),
						array( 'status' => 404 )
					);
				}

				$updated = $this->update_crdt_doc(
					$post_id,
					$request['doc'],
					$request['expected_doc']
				);
				if ( is_wp_error( $updated ) ) {
					return $updated;
				}

				// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery -- Completes the transaction started above.
				if ( false === $wpdb->query( 'COMMIT' ) ) {
					return $this->get_transaction_error( 'commit' );
				}
				$transaction_open = false;

				return array();
			} finally {
				if ( $transaction_open ) {
					// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery -- Prevents a failed CRDT save from persisting.
					$wpdb->query( 'ROLLBACK' );
				}
				self::$save_in_progress = false;
			}
		}

		/**
		 * Updates a CRDT document only when its persisted base is unchanged.
		 *
		 * @param int    $post_id      Post ID.
		 * @param string $doc          Replacement CRDT document.
		 * @param string $expected_doc Expected persisted CRDT document.
		 * @return true|WP_Error True on success, otherwise an error.
		 */
		private function update_crdt_doc( int $post_id, string $doc, string $expected_doc ) {
			wp_cache_delete( $post_id, 'post_meta' );
			$current_doc = get_post_meta( $post_id, self::CRDT_DOC_META_KEY, true );
			if ( $current_doc !== $expected_doc ) {
				return new WP_Error(
					'rest_sync_document_conflict',
					__( 'The synchronized document changed before it could be saved.', 'gutenberg' ),
					array( 'status' => 409 )
				);
			}

			$updated = update_post_meta( $post_id, self::CRDT_DOC_META_KEY, $doc, $expected_doc );
			if ( false === $updated ) {
				wp_cache_delete( $post_id, 'post_meta' );
				$current_doc = get_post_meta( $post_id, self::CRDT_DOC_META_KEY, true );
				if ( $current_doc !== $expected_doc && $current_doc !== $doc ) {
					return new WP_Error(
						'rest_sync_document_conflict',
						__( 'The synchronized document changed before it could be saved.', 'gutenberg' ),
						array( 'status' => 409 )
					);
				}
			}
			if ( false === $updated && $current_doc !== $doc ) {
				return new WP_Error(
					'rest_crdt_save_failed',
					__( 'Failed to save CRDT document.', 'gutenberg' ),
					array( 'status' => 500 )
				);
			}

			return true;
		}

		/**
		 * Returns the shared conflict error for reentrant sync saves.
		 *
		 * @return WP_Error Conflict error.
		 */
		private function get_save_conflict_error(): WP_Error {
			return new WP_Error(
				'rest_sync_document_conflict',
				__( 'Another synchronized document save is already in progress.', 'gutenberg' ),
				array( 'status' => 409 )
			);
		}

		/**
		 * Returns a transaction error.
		 *
		 * @param string $operation Failed transaction operation.
		 * @return WP_Error Transaction error.
		 */
		private function get_transaction_error( string $operation ): WP_Error {
			$message = 'start' === $operation
				? __( 'Failed to start synchronized content transaction.', 'gutenberg' )
				: __( 'Failed to commit synchronized content transaction.', 'gutenberg' );
			return new WP_Error(
				'rest_sync_transaction_failed',
				$message,
				array( 'status' => 500 )
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
