<?php
/**
 * Plugin Name: Gutenberg Test Plugin, Sync Storage Cursor Backfill
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-sync-storage-cursor-backfill
 */

/**
 * Gets the REST namespace for the sync storage cursor backfill test helpers.
 *
 * @return string REST namespace.
 */
function gutenberg_test_sync_storage_cursor_backfill_rest_namespace() {
	return 'gutenberg-test/v1';
}

/**
 * Gets the REST route base for the sync storage cursor backfill test helpers.
 *
 * @return string REST route base.
 */
function gutenberg_test_sync_storage_cursor_backfill_route_base() {
	return '/sync-storage-cursor-backfill';
}

/**
 * Checks whether the current user may use the test-only sync storage helpers.
 *
 * @return bool Whether the current user has permission.
 */
function gutenberg_test_sync_storage_cursor_backfill_permissions() {
	return current_user_can( 'manage_options' );
}

/**
 * Registers test-only routes for manipulating sync storage rows.
 */
function gutenberg_test_sync_storage_cursor_backfill_register_rest_routes() {
	$namespace = gutenberg_test_sync_storage_cursor_backfill_rest_namespace();
	$base      = gutenberg_test_sync_storage_cursor_backfill_route_base();

	register_rest_route(
		$namespace,
		$base . '/cursor-gaps',
		array(
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => 'gutenberg_test_sync_storage_cursor_backfill_reserve_cursor_gaps',
			'permission_callback' => 'gutenberg_test_sync_storage_cursor_backfill_permissions',
			'args'                => array(
				'count' => array(
					'default' => 1,
					'maximum' => 200,
					'minimum' => 1,
					'type'    => 'integer',
				),
			),
		)
	);

	register_rest_route(
		$namespace,
		$base . '/duplicate',
		array(
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => 'gutenberg_test_sync_storage_cursor_backfill_seed_duplicate',
			'permission_callback' => 'gutenberg_test_sync_storage_cursor_backfill_permissions',
			'args'                => array(
				'room'    => array(
					'required' => true,
					'type'     => 'string',
				),
				'updates' => array(
					'required' => true,
					'type'     => 'array',
				),
			),
		)
	);

	register_rest_route(
		$namespace,
		$base . '/diagnose',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => 'gutenberg_test_sync_storage_cursor_backfill_diagnose',
			'permission_callback' => 'gutenberg_test_sync_storage_cursor_backfill_permissions',
			'args'                => array(
				'room' => array(
					'required' => true,
					'type'     => 'string',
				),
			),
		)
	);
}
add_action( 'rest_api_init', 'gutenberg_test_sync_storage_cursor_backfill_register_rest_routes' );

/**
 * Verifies the sync storage class is available.
 *
 * @return true|WP_Error True when available, otherwise a REST error.
 */
function gutenberg_test_sync_storage_cursor_backfill_require_storage_class() {
	if ( class_exists( 'WP_Sync_Post_Meta_Storage' ) ) {
		return true;
	}

	return new WP_Error(
		'gutenberg_test_sync_storage_unavailable',
		'WP_Sync_Post_Meta_Storage is not available.',
		array( 'status' => 500 )
	);
}

/**
 * Reserves deleted postmeta IDs that can later be backfilled below an active sync cursor.
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error Response object or error.
 */
function gutenberg_test_sync_storage_cursor_backfill_reserve_cursor_gaps( WP_REST_Request $request ) {
	global $wpdb;

	$count    = (int) $request['count'];
	$meta_ids = array();

	for ( $i = 0; $i < $count; $i++ ) {
		$result = $wpdb->insert(
			$wpdb->postmeta,
			array(
				'post_id'    => 0,
				'meta_key'   => 'gutenberg_test_sync_storage_cursor_gap',
				'meta_value' => wp_generate_uuid4(),
			),
			array( '%d', '%s', '%s' )
		);

		if ( ! $result ) {
			return new WP_Error(
				'gutenberg_test_sync_storage_gap_error',
				'Failed to reserve a cursor gap.',
				array( 'status' => 500 )
			);
		}

		$meta_id    = (int) $wpdb->insert_id;
		$meta_ids[] = $meta_id;

		$wpdb->delete(
			$wpdb->postmeta,
			array( 'meta_id' => $meta_id ),
			array( '%d' )
		);
	}

	return new WP_REST_Response(
		array(
			'meta_ids' => $meta_ids,
		),
		200
	);
}

/**
 * Seeds a duplicate storage lineage with explicit low-meta-id sync updates.
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error Response object or error.
 */
function gutenberg_test_sync_storage_cursor_backfill_seed_duplicate( WP_REST_Request $request ) {
	global $wpdb;

	$storage_available = gutenberg_test_sync_storage_cursor_backfill_require_storage_class();
	if ( is_wp_error( $storage_available ) ) {
		return $storage_available;
	}

	$room      = (string) $request['room'];
	$room_hash = md5( $room );
	$updates   = $request['updates'];

	if ( ! is_array( $updates ) || empty( $updates ) ) {
		return new WP_Error(
			'gutenberg_test_sync_storage_invalid_updates',
			'At least one update is required.',
			array( 'status' => 400 )
		);
	}

	$duplicate_post_id = wp_insert_post(
		array(
			'post_name'   => $room_hash . '-cursor-backfill-' . wp_generate_uuid4(),
			'post_status' => 'publish',
			'post_title'  => 'Sync Storage Cursor Backfill Duplicate',
			'post_type'   => WP_Sync_Post_Meta_Storage::POST_TYPE,
		),
		true
	);

	if ( is_wp_error( $duplicate_post_id ) ) {
		return $duplicate_post_id;
	}

	$inserted_meta_ids = array();
	$valid_types       = array( 'compaction', 'sync_step1', 'sync_step2', 'update' );

	foreach ( $updates as $update ) {
		if ( ! is_array( $update ) ) {
			return new WP_Error(
				'gutenberg_test_sync_storage_invalid_update',
				'Each update must be an object.',
				array( 'status' => 400 )
			);
		}

		$meta_id   = isset( $update['meta_id'] ) ? (int) $update['meta_id'] : 0;
		$client_id = isset( $update['client_id'] ) ? (int) $update['client_id'] : 0;
		$type      = isset( $update['type'] ) ? (string) $update['type'] : '';
		$data      = isset( $update['data'] ) ? (string) $update['data'] : '';

		if ( $meta_id <= 0 || $client_id <= 0 || ! in_array( $type, $valid_types, true ) || '' === $data ) {
			return new WP_Error(
				'gutenberg_test_sync_storage_invalid_update',
				'Each update requires meta_id, client_id, type, and data.',
				array( 'status' => 400 )
			);
		}

		$result = $wpdb->insert(
			$wpdb->postmeta,
			array(
				'meta_id'    => $meta_id,
				'post_id'    => $duplicate_post_id,
				'meta_key'   => WP_Sync_Post_Meta_Storage::SYNC_UPDATE_META_KEY,
				'meta_value' => wp_json_encode(
					array(
						'client_id' => $client_id,
						'data'      => $data,
						'type'      => $type,
					)
				),
			),
			array( '%d', '%d', '%s', '%s' )
		);

		if ( ! $result ) {
			return new WP_Error(
				'gutenberg_test_sync_storage_duplicate_insert_error',
				'Failed to insert a duplicate storage update.',
				array(
					'meta_id' => $meta_id,
					'status'  => 409,
				)
			);
		}

		$inserted_meta_ids[] = $meta_id;
	}

	return new WP_REST_Response(
		array(
			'duplicate_post_id' => (int) $duplicate_post_id,
			'inserted_meta_ids' => $inserted_meta_ids,
			'room_hash'         => $room_hash,
		),
		200
	);
}

/**
 * Returns diagnostic information for a sync room's storage lineages.
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error Response object or error.
 */
function gutenberg_test_sync_storage_cursor_backfill_diagnose( WP_REST_Request $request ) {
	global $wpdb;

	$storage_available = gutenberg_test_sync_storage_cursor_backfill_require_storage_class();
	if ( is_wp_error( $storage_available ) ) {
		return $storage_available;
	}

	$room      = (string) $request['room'];
	$room_hash = md5( $room );
	$post_ids  = $wpdb->get_results(
		$wpdb->prepare(
			"SELECT ID, post_name FROM {$wpdb->posts}
			WHERE post_type = %s
				AND post_status = 'publish'
				AND ( post_name = %s OR post_name LIKE %s )
			ORDER BY ID ASC",
			WP_Sync_Post_Meta_Storage::POST_TYPE,
			$room_hash,
			$wpdb->esc_like( $room_hash . '-' ) . '%'
		)
	);

	$lineages = array();
	$cursor   = 0;

	foreach ( $post_ids as $post ) {
		$rows    = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT meta_id, meta_value FROM {$wpdb->postmeta}
				WHERE post_id = %d AND meta_key = %s
				ORDER BY meta_id ASC",
				$post->ID,
				WP_Sync_Post_Meta_Storage::SYNC_UPDATE_META_KEY
			)
		);
		$updates = array();

		foreach ( $rows as $row ) {
			$decoded = json_decode( $row->meta_value, true );
			if ( ! is_array( $decoded ) ) {
				continue;
			}

			$meta_id = (int) $row->meta_id;
			$cursor  = max( $cursor, $meta_id );

			$updates[] = array(
				'client_id' => $decoded['client_id'] ?? null,
				'data'      => $decoded['data'] ?? null,
				'meta_id'   => $meta_id,
				'type'      => $decoded['type'] ?? null,
			);
		}

		$lineages[] = array(
			'post_id'   => (int) $post->ID,
			'post_name' => $post->post_name,
			'updates'   => $updates,
		);
	}

	return new WP_REST_Response(
		array(
			'cursor'    => $cursor,
			'lineages'  => $lineages,
			'room_hash' => $room_hash,
		),
		200
	);
}
