<?php
/**
 * Tests for the WP_HTTP_Polling_Sync_Server REST endpoint.
 *
 * @package gutenberg
 * @subpackage Collaboration
 *
 * @group collaboration
 * @group restapi
 */
class Tests_Collaboration_WpHttpPollingSyncServer extends WP_Test_REST_Controller_Testcase {

	protected static int $editor_id;
	protected static int $subscriber_id;
	protected static int $post_id;
	protected static int $category_id;
	protected static int $tag_id;
	protected static int $comment_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$editor_id     = $factory->user->create( array( 'role' => 'editor' ) );
		self::$subscriber_id = $factory->user->create( array( 'role' => 'subscriber' ) );
		self::$post_id       = $factory->post->create( array( 'post_author' => self::$editor_id ) );
		self::$category_id   = $factory->category->create();
		self::$tag_id        = $factory->tag->create();
		self::$comment_id    = $factory->comment->create( array( 'comment_post_ID' => self::$post_id ) );

		// Enable option in setUpBeforeClass to ensure REST routes are registered.
		update_option( 'wp_collaboration_enabled', 1 );
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$editor_id );
		self::delete_user( self::$subscriber_id );
		delete_option( 'wp_collaboration_enabled' );
		wp_delete_post( self::$post_id, true );
		wp_delete_term( self::$category_id, 'category' );
		wp_delete_term( self::$tag_id, 'post_tag' );
		wp_delete_comment( self::$comment_id, true );
	}

	public function set_up() {
		parent::set_up();

		// Enable option for tests.
		update_option( 'wp_collaboration_enabled', 1 );

		// Reset storage post ID cache to ensure clean state after transaction rollback.
		$reflection = new ReflectionProperty( 'WP_Sync_Post_Meta_Storage', 'storage_post_ids' );
		if ( PHP_VERSION_ID < 80100 ) {
			$reflection->setAccessible( true );
		}
		$reflection->setValue( null, array() );
	}

	/**
	 * Builds a room request array for the sync endpoint.
	 *
	 * @param string $room      Room identifier.
	 * @param int    $client_id Client ID.
	 * @param int    $cursor    Cursor value for the 'after' parameter.
	 * @param array  $awareness Awareness state.
	 * @param array  $updates   Array of updates.
	 * @return array Room request data.
	 */
	private function build_room( $room, $client_id = 1, $cursor = 0, $awareness = array(), $updates = array() ) {
		if ( empty( $awareness ) ) {
			$awareness = array( 'user' => 'test' );
		}

		return array(
			'after'     => $cursor,
			'awareness' => $awareness,
			'client_id' => $client_id,
			'room'      => $room,
			'updates'   => $updates,
		);
	}

	/**
	 * Dispatches a sync request with the given rooms.
	 *
	 * @param array $rooms Array of room request data.
	 * @return WP_REST_Response Response object.
	 */
	private function dispatch_sync( $rooms ) {
		$request = new WP_REST_Request( 'POST', '/wp-sync/v1/updates' );
		$request->set_body_params( array( 'rooms' => $rooms ) );
		return rest_get_server()->dispatch( $request );
	}

	/**
	 * Returns the default room identifier for the test post.
	 *
	 * @return string Room identifier.
	 */
	private function get_post_room() {
		return 'postType/post:' . self::$post_id;
	}

	/*
	 * Required abstract method implementations.
	 *
	 * The sync endpoint is a single POST endpoint, not a standard CRUD controller.
	 * Methods that don't apply are stubbed with @doesNotPerformAssertions.
	 */

	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( '/wp-sync/v1/updates', $routes );
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_context_param() {
		// Not applicable for sync endpoint.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_get_items() {
		// Not applicable for sync endpoint.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_get_item() {
		// Not applicable for sync endpoint.
	}

	public function test_create_item() {
		wp_set_current_user( self::$editor_id );

		$response = $this->dispatch_sync( array( $this->build_room( $this->get_post_room() ) ) );

		$this->assertSame( 200, $response->get_status() );
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_update_item() {
		// Not applicable for sync endpoint.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_delete_item() {
		// Not applicable for sync endpoint.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_prepare_item() {
		// Not applicable for sync endpoint.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_get_item_schema() {
		// Not applicable for sync endpoint.
	}

	/*
	 * Permission tests.
	 */

	public function test_sync_requires_authentication() {
		wp_set_current_user( 0 );

		$response = $this->dispatch_sync( array( $this->build_room( $this->get_post_room() ) ) );

		$this->assertErrorResponse( 'rest_cannot_edit', $response, 401 );
	}

	public function test_sync_post_requires_edit_capability() {
		wp_set_current_user( self::$subscriber_id );

		$response = $this->dispatch_sync( array( $this->build_room( $this->get_post_room() ) ) );

		$this->assertErrorResponse( 'rest_cannot_edit', $response, 403 );
	}

	public function test_sync_post_allowed_with_edit_capability() {
		wp_set_current_user( self::$editor_id );

		$response = $this->dispatch_sync( array( $this->build_room( $this->get_post_room() ) ) );

		$this->assertSame( 200, $response->get_status() );
	}

	public function test_sync_post_type_collection_requires_edit_posts_capability() {
		wp_set_current_user( self::$subscriber_id );

		$response = $this->dispatch_sync( array( $this->build_room( 'postType/post' ) ) );

		$this->assertErrorResponse( 'rest_cannot_edit', $response, 403 );
	}

	public function test_sync_post_type_collection_allowed_with_edit_posts_capability() {
		wp_set_current_user( self::$editor_id );

		$response = $this->dispatch_sync( array( $this->build_room( 'postType/post' ) ) );

		$this->assertSame( 200, $response->get_status() );
	}

	public function test_sync_root_collection_allowed() {
		wp_set_current_user( self::$editor_id );

		$response = $this->dispatch_sync( array( $this->build_room( 'root/site' ) ) );

		$this->assertSame( 200, $response->get_status() );
	}

	public function test_sync_taxonomy_collection_allowed() {
		wp_set_current_user( self::$editor_id );

		$response = $this->dispatch_sync( array( $this->build_room( 'taxonomy/category' ) ) );

		$this->assertSame( 200, $response->get_status() );
	}

	public function test_sync_unknown_collection_kind_rejected() {
		wp_set_current_user( self::$editor_id );

		$response = $this->dispatch_sync( array( $this->build_room( 'unknown/entity' ) ) );

		$this->assertErrorResponse( 'rest_cannot_edit', $response, 403 );
	}

	public function test_sync_non_posttype_entity_with_object_id_rejected() {
		wp_set_current_user( self::$editor_id );

		$response = $this->dispatch_sync( array( $this->build_room( 'root/site:123' ) ) );

		$this->assertErrorResponse( 'rest_cannot_edit', $response, 403 );
	}

	public function test_sync_nonexistent_post_rejected() {
		wp_set_current_user( self::$editor_id );

		$response = $this->dispatch_sync( array( $this->build_room( 'postType/post:999999' ) ) );

		$this->assertErrorResponse( 'rest_cannot_edit', $response, 403 );
	}

	public function test_sync_permission_checked_per_room() {
		wp_set_current_user( self::$editor_id );

		// First room is allowed, second room is forbidden.
		$response = $this->dispatch_sync(
			array(
				$this->build_room( $this->get_post_room() ),
				$this->build_room( 'unknown/entity' ),
			)
		);

		$this->assertErrorResponse( 'rest_cannot_edit', $response, 403 );
	}

	/**
	 * @ticket 64890
	 */
	public function test_sync_malformed_object_id_rejected() {
		wp_set_current_user( self::$editor_id );

		$response = $this->dispatch_sync( array( $this->build_room( 'postType/post:1abc' ) ) );

		$this->assertErrorResponse( 'rest_cannot_edit', $response, 403 );
	}

	/**
	 * @ticket 64890
	 */
	public function test_sync_zero_object_id_rejected(): void {
		wp_set_current_user( self::$editor_id );

		$response = $this->dispatch_sync( array( $this->build_room( 'postType/post:0' ) ) );

		$this->assertErrorResponse( 'rest_cannot_edit', $response, 403 );
	}

	/**
	 * @ticket 64890
	 */
	public function test_sync_post_type_mismatch_rejected(): void {
		wp_set_current_user( self::$editor_id );

		// The test post is of type 'post', not 'page'.
		$response = $this->dispatch_sync( array( $this->build_room( 'postType/page:' . self::$post_id ) ) );

		$this->assertErrorResponse( 'rest_cannot_edit', $response, 403 );
	}

	/**
	 * @ticket 64890
	 */
	public function test_sync_taxonomy_term_allowed(): void {
		wp_set_current_user( self::$editor_id );

		$response = $this->dispatch_sync( array( $this->build_room( 'taxonomy/category:' . self::$category_id ) ) );

		$this->assertSame( 200, $response->get_status() );
	}

	/**
	 * @ticket 64890
	 */
	public function test_sync_nonexistent_taxonomy_term_rejected(): void {
		wp_set_current_user( self::$editor_id );

		$response = $this->dispatch_sync( array( $this->build_room( 'taxonomy/category:999999' ) ) );

		$this->assertErrorResponse( 'rest_cannot_edit', $response, 403 );
	}

	/**
	 * @ticket 64890
	 */
	public function test_sync_taxonomy_term_wrong_taxonomy_rejected(): void {
		wp_set_current_user( self::$editor_id );

		// The tag term exists in 'post_tag', not 'category'.
		$response = $this->dispatch_sync( array( $this->build_room( 'taxonomy/category:' . self::$tag_id ) ) );

		$this->assertErrorResponse( 'rest_cannot_edit', $response, 403 );
	}

	/**
	 * @ticket 64890
	 */
	public function test_sync_comment_allowed(): void {
		wp_set_current_user( self::$editor_id );

		$response = $this->dispatch_sync( array( $this->build_room( 'root/comment:' . self::$comment_id ) ) );

		$this->assertSame( 200, $response->get_status() );
	}

	/**
	 * @ticket 64890
	 */
	public function test_sync_nonexistent_comment_rejected(): void {
		wp_set_current_user( self::$editor_id );

		$response = $this->dispatch_sync( array( $this->build_room( 'root/comment:999999' ) ) );

		$this->assertErrorResponse( 'rest_cannot_edit', $response, 403 );
	}

	/**
	 * @ticket 64890
	 */
	public function test_sync_nonexistent_post_type_collection_rejected(): void {
		wp_set_current_user( self::$editor_id );

		$response = $this->dispatch_sync( array( $this->build_room( 'postType/nonexistent_type' ) ) );

		$this->assertErrorResponse( 'rest_cannot_edit', $response, 403 );
	}

	/*
	 * Validation tests.
	 */

	public function test_sync_invalid_room_format_rejected() {
		wp_set_current_user( self::$editor_id );

		$response = $this->dispatch_sync(
			array(
				$this->build_room( 'invalid-room-format' ),
			)
		);

		$this->assertSame( 400, $response->get_status() );
	}

	/**
	 * Verifies that schema type validation rejects a non-string value for the
	 * update 'data' field, confirming that per-arg schema validation still runs
	 * with a route-level validate_callback registered.
	 *
	 * @ticket 64890
	 */
	public function test_sync_rejects_non_string_update_data(): void {
		wp_set_current_user( self::$editor_id );

		$request = new WP_REST_Request( 'POST', '/wp-sync/v1/updates' );
		$request->set_body_params(
			array(
				'rooms' => array(
					array(
						'after'     => 0,
						'awareness' => array( 'user' => 'test' ),
						'client_id' => 1,
						'room'      => $this->get_post_room(),
						'updates'   => array(
							array(
								'data' => 12345,
								'type' => 'update',
							),
						),
					),
				),
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
	}

	/**
	 * Verifies that schema enum validation rejects an invalid update type,
	 * confirming that per-arg schema validation still runs with a route-level
	 * validate_callback registered.
	 *
	 * @ticket 64890
	 */
	public function test_sync_rejects_invalid_update_type_enum(): void {
		wp_set_current_user( self::$editor_id );

		$request = new WP_REST_Request( 'POST', '/wp-sync/v1/updates' );
		$request->set_body_params(
			array(
				'rooms' => array(
					array(
						'after'     => 0,
						'awareness' => array( 'user' => 'test' ),
						'client_id' => 1,
						'room'      => $this->get_post_room(),
						'updates'   => array(
							array(
								'data' => 'dGVzdA==',
								'type' => 'invalid_type',
							),
						),
					),
				),
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
	}

	/**
	 * Verifies that schema required-field validation rejects a room missing
	 * the 'client_id' field, confirming that per-arg schema validation still
	 * runs with a route-level validate_callback registered.
	 *
	 * @ticket 64890
	 */
	public function test_sync_rejects_missing_required_room_field(): void {
		wp_set_current_user( self::$editor_id );

		$request = new WP_REST_Request( 'POST', '/wp-sync/v1/updates' );
		$request->set_body_params(
			array(
				'rooms' => array(
					array(
						'after'     => 0,
						'awareness' => array( 'user' => 'test' ),
						// 'client_id' deliberately omitted.
						'room'      => $this->get_post_room(),
						'updates'   => array(),
					),
				),
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
	}

	/**
	 * Verifies that the maxItems constraint rejects a request with more rooms
	 * than MAX_ROOMS_PER_REQUEST.
	 *
	 * @ticket 64890
	 */
	public function test_sync_rejects_rooms_exceeding_max_items(): void {
		wp_set_current_user( self::$editor_id );

		$rooms = array();
		for ( $i = 0; $i < WP_HTTP_Polling_Sync_Server::MAX_ROOMS_PER_REQUEST + 1; $i++ ) {
			$rooms[] = $this->build_room( 'root/site', $i + 1 );
		}

		$response = $this->dispatch_sync( $rooms );
		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
	}

	/**
	 * Verifies that the maxLength constraint rejects update data exceeding
	 * MAX_UPDATE_DATA_SIZE.
	 *
	 * @ticket 64890
	 */
	public function test_sync_rejects_update_data_exceeding_max_length(): void {
		wp_set_current_user( self::$editor_id );

		$oversized_data = str_repeat( 'a', WP_HTTP_Polling_Sync_Server::MAX_UPDATE_DATA_SIZE + 1 );

		$request = new WP_REST_Request( 'POST', '/wp-sync/v1/updates' );
		$request->set_body_params(
			array(
				'rooms' => array(
					array(
						'after'     => 0,
						'awareness' => array( 'user' => 'test' ),
						'client_id' => 1,
						'room'      => $this->get_post_room(),
						'updates'   => array(
							array(
								'data' => $oversized_data,
								'type' => 'update',
							),
						),
					),
				),
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
	}

	/**
	 * Verifies that the route-level validate_callback rejects a request body
	 * exceeding MAX_BODY_SIZE.
	 *
	 * @ticket 64890
	 */
	public function test_sync_rejects_oversized_request_body(): void {
		wp_set_current_user( self::$editor_id );

		$request = new WP_REST_Request( 'POST', '/wp-sync/v1/updates' );

		// Set valid parsed params so per-arg schema validation passes first.
		$request->set_body_params(
			array(
				'rooms' => array(
					$this->build_room( $this->get_post_room() ),
				),
			)
		);

		// Set an oversized raw body to trigger the route-level validate_callback.
		$request->set_body( str_repeat( 'x', WP_HTTP_Polling_Sync_Server::MAX_BODY_SIZE + 1 ) );

		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_sync_body_too_large', $response, 413 );
	}

	/*
	 * Response format tests.
	 */

	public function test_sync_response_structure() {
		wp_set_current_user( self::$editor_id );

		$response = $this->dispatch_sync( array( $this->build_room( $this->get_post_room() ) ) );

		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertArrayHasKey( 'rooms', $data );
		$this->assertCount( 1, $data['rooms'] );

		$room_data = $data['rooms'][0];
		$this->assertArrayHasKey( 'room', $room_data );
		$this->assertArrayHasKey( 'awareness', $room_data );
		$this->assertArrayHasKey( 'updates', $room_data );
		$this->assertArrayHasKey( 'end_cursor', $room_data );
		$this->assertArrayHasKey( 'total_updates', $room_data );
		$this->assertArrayHasKey( 'should_compact', $room_data );
	}

	public function test_sync_response_room_matches_request() {
		wp_set_current_user( self::$editor_id );

		$room     = $this->get_post_room();
		$response = $this->dispatch_sync( array( $this->build_room( $room ) ) );

		$data = $response->get_data();
		$this->assertSame( $room, $data['rooms'][0]['room'] );
	}

	public function test_sync_end_cursor_is_positive_integer() {
		wp_set_current_user( self::$editor_id );

		$response = $this->dispatch_sync( array( $this->build_room( $this->get_post_room() ) ) );

		$data = $response->get_data();
		$this->assertIsInt( $data['rooms'][0]['end_cursor'] );
		$this->assertGreaterThanOrEqual( 0, $data['rooms'][0]['end_cursor'] );
	}

	public function test_sync_empty_updates_returns_zero_total() {
		wp_set_current_user( self::$editor_id );

		$response = $this->dispatch_sync( array( $this->build_room( $this->get_post_room() ) ) );

		$data = $response->get_data();
		$this->assertSame( 0, $data['rooms'][0]['total_updates'] );
		$this->assertEmpty( $data['rooms'][0]['updates'] );
	}

	/*
	 * Update tests.
	 */

	public function test_sync_update_delivered_to_other_client() {
		wp_set_current_user( self::$editor_id );

		$room   = $this->get_post_room();
		$update = array(
			'type' => 'update',
			'data' => 'dGVzdCBkYXRh',
		);

		// Client 1 sends an update.
		$this->dispatch_sync(
			array(
				$this->build_room( $room, 1, 0, array( 'user' => 'client1' ), array( $update ) ),
			)
		);

		// Client 2 requests updates from the beginning.
		$response = $this->dispatch_sync(
			array(
				$this->build_room( $room, 2, 0 ),
			)
		);

		$data    = $response->get_data();
		$updates = $data['rooms'][0]['updates'];

		$this->assertNotEmpty( $updates );

		$types = wp_list_pluck( $updates, 'type' );
		$this->assertContains( 'update', $types );
	}

	public function test_sync_own_updates_not_returned() {
		wp_set_current_user( self::$editor_id );

		$room   = $this->get_post_room();
		$update = array(
			'type' => 'update',
			'data' => 'b3duIGRhdGE=',
		);

		// Client 1 sends an update.
		$response = $this->dispatch_sync(
			array(
				$this->build_room( $room, 1, 0, array( 'user' => 'client1' ), array( $update ) ),
			)
		);

		$data    = $response->get_data();
		$updates = $data['rooms'][0]['updates'];

		// Client 1 should not see its own non-compaction update.
		$this->assertEmpty( $updates );
	}

	public function test_sync_step1_update_stored_and_returned() {
		wp_set_current_user( self::$editor_id );

		$room   = $this->get_post_room();
		$update = array(
			'type' => 'sync_step1',
			'data' => 'c3RlcDE=',
		);

		// Client 1 sends sync_step1.
		$this->dispatch_sync(
			array(
				$this->build_room( $room, 1, 0, array( 'user' => 'client1' ), array( $update ) ),
			)
		);

		// Client 2 should see the sync_step1 update.
		$response = $this->dispatch_sync(
			array(
				$this->build_room( $room, 2, 0 ),
			)
		);

		$data  = $response->get_data();
		$types = wp_list_pluck( $data['rooms'][0]['updates'], 'type' );
		$this->assertContains( 'sync_step1', $types );
	}

	public function test_sync_step2_update_stored_and_returned() {
		wp_set_current_user( self::$editor_id );

		$room   = $this->get_post_room();
		$update = array(
			'type' => 'sync_step2',
			'data' => 'c3RlcDI=',
		);

		// Client 1 sends sync_step2.
		$this->dispatch_sync(
			array(
				$this->build_room( $room, 1, 0, array( 'user' => 'client1' ), array( $update ) ),
			)
		);

		// Client 2 should see the sync_step2 update.
		$response = $this->dispatch_sync(
			array(
				$this->build_room( $room, 2, 0 ),
			)
		);

		$data  = $response->get_data();
		$types = wp_list_pluck( $data['rooms'][0]['updates'], 'type' );
		$this->assertContains( 'sync_step2', $types );
	}

	public function test_sync_multiple_updates_in_single_request() {
		wp_set_current_user( self::$editor_id );

		$room    = $this->get_post_room();
		$updates = array(
			array(
				'type' => 'sync_step1',
				'data' => 'c3RlcDE=',
			),
			array(
				'type' => 'update',
				'data' => 'dXBkYXRl',
			),
		);

		// Client 1 sends multiple updates.
		$this->dispatch_sync(
			array(
				$this->build_room( $room, 1, 0, array( 'user' => 'client1' ), $updates ),
			)
		);

		// Client 2 should see both updates.
		$response = $this->dispatch_sync(
			array(
				$this->build_room( $room, 2, 0 ),
			)
		);

		$data         = $response->get_data();
		$room_updates = $data['rooms'][0]['updates'];

		$this->assertCount( 2, $room_updates );
		$this->assertSame( 2, $data['rooms'][0]['total_updates'] );
	}

	public function test_sync_update_data_preserved() {
		wp_set_current_user( self::$editor_id );

		$room   = $this->get_post_room();
		$update = array(
			'type' => 'update',
			'data' => 'cHJlc2VydmVkIGRhdGE=',
		);

		// Client 1 sends an update.
		$this->dispatch_sync(
			array(
				$this->build_room( $room, 1, 0, array( 'user' => 'client1' ), array( $update ) ),
			)
		);

		// Client 2 should receive the exact same data.
		$response = $this->dispatch_sync(
			array(
				$this->build_room( $room, 2, 0 ),
			)
		);

		$data         = $response->get_data();
		$room_updates = $data['rooms'][0]['updates'];

		$this->assertSame( 'cHJlc2VydmVkIGRhdGE=', $room_updates[0]['data'] );
		$this->assertSame( 'update', $room_updates[0]['type'] );
	}

	public function test_sync_total_updates_increments() {
		wp_set_current_user( self::$editor_id );

		$room   = $this->get_post_room();
		$update = array(
			'type' => 'update',
			'data' => 'dGVzdA==',
		);

		// Send three updates from different clients.
		$this->dispatch_sync(
			array(
				$this->build_room( $room, 1, 0, array( 'user' => 'c1' ), array( $update ) ),
			)
		);
		$this->dispatch_sync(
			array(
				$this->build_room( $room, 2, 0, array( 'user' => 'c2' ), array( $update ) ),
			)
		);
		$this->dispatch_sync(
			array(
				$this->build_room( $room, 3, 0, array( 'user' => 'c3' ), array( $update ) ),
			)
		);

		// Any client should see total_updates = 3.
		$response = $this->dispatch_sync(
			array(
				$this->build_room( $room, 4, 0 ),
			)
		);

		$data = $response->get_data();
		$this->assertSame( 3, $data['rooms'][0]['total_updates'] );
	}

	/*
	 * Compaction tests.
	 */

	public function test_sync_should_compact_is_false_below_threshold() {
		wp_set_current_user( self::$editor_id );

		$room   = $this->get_post_room();
		$update = array(
			'type' => 'update',
			'data' => 'dGVzdA==',
		);

		// Client 1 sends a single update.
		$response = $this->dispatch_sync(
			array(
				$this->build_room( $room, 1, 0, array( 'user' => 'c1' ), array( $update ) ),
			)
		);

		$data = $response->get_data();
		$this->assertFalse( $data['rooms'][0]['should_compact'] );
	}

	public function test_sync_should_compact_is_true_above_threshold_for_compactor() {
		wp_set_current_user( self::$editor_id );

		$room    = $this->get_post_room();
		$updates = array();
		for ( $i = 0; $i < 51; $i++ ) {
			$updates[] = array(
				'type' => 'update',
				'data' => base64_encode( "update-$i" ),
			);
		}

		// Client 1 sends enough updates to exceed the compaction threshold.
		$this->dispatch_sync(
			array(
				$this->build_room( $room, 1, 0, array( 'user' => 'c1' ), $updates ),
			)
		);

		// Client 1 polls again. It is the lowest (only) client, so it is the compactor.
		$response = $this->dispatch_sync(
			array(
				$this->build_room( $room, 1, 0, array( 'user' => 'c1' ) ),
			)
		);

		$data = $response->get_data();
		$this->assertTrue( $data['rooms'][0]['should_compact'] );
	}

	public function test_sync_should_compact_is_false_for_non_compactor() {
		wp_set_current_user( self::$editor_id );

		$room    = $this->get_post_room();
		$updates = array();
		for ( $i = 0; $i < 51; $i++ ) {
			$updates[] = array(
				'type' => 'update',
				'data' => base64_encode( "update-$i" ),
			);
		}

		// Client 1 sends enough updates to exceed the compaction threshold.
		$this->dispatch_sync(
			array(
				$this->build_room( $room, 1, 0, array( 'user' => 'c1' ), $updates ),
			)
		);

		// Client 2 (higher ID than client 1) should not be the compactor.
		$response = $this->dispatch_sync(
			array(
				$this->build_room( $room, 2, 0, array( 'user' => 'c2' ) ),
			)
		);

		$data = $response->get_data();
		$this->assertFalse( $data['rooms'][0]['should_compact'] );
	}

	public function test_sync_stale_compaction_succeeds_when_newer_compaction_exists() {
		wp_set_current_user( self::$editor_id );

		$room   = $this->get_post_room();
		$update = array(
			'type' => 'update',
			'data' => 'dGVzdA==',
		);

		// Client 1 sends an update to seed the room.
		$response = $this->dispatch_sync(
			array(
				$this->build_room( $room, 1, 0, array( 'user' => 'c1' ), array( $update ) ),
			)
		);

		$end_cursor = $response->get_data()['rooms'][0]['end_cursor'];

		// Client 2 sends a compaction at the current cursor.
		$compaction = array(
			'type' => 'compaction',
			'data' => 'Y29tcGFjdGVk',
		);

		$this->dispatch_sync(
			array(
				$this->build_room( $room, 2, $end_cursor, array( 'user' => 'c2' ), array( $compaction ) ),
			)
		);

		// Client 3 sends a stale compaction at cursor 0. The server should find
		// client 2's compaction in the updates after cursor 0 and silently discard
		// this one.
		$stale_compaction = array(
			'type' => 'compaction',
			'data' => 'c3RhbGU=',
		);
		$response         = $this->dispatch_sync(
			array(
				$this->build_room( $room, 3, 0, array( 'user' => 'c3' ), array( $stale_compaction ) ),
			)
		);

		$this->assertSame( 200, $response->get_status() );

		// Verify the newer compaction is preserved and the stale one was not stored.
		$response    = $this->dispatch_sync(
			array(
				$this->build_room( $room, 4, 0, array( 'user' => 'c4' ) ),
			)
		);
		$update_data = wp_list_pluck( $response->get_data()['rooms'][0]['updates'], 'data' );

		$this->assertContains( 'Y29tcGFjdGVk', $update_data, 'The newer compaction should be preserved.' );
		$this->assertNotContains( 'c3RhbGU=', $update_data, 'The stale compaction should not be stored.' );
	}

	/*
	 * Awareness tests.
	 */

	public function test_sync_awareness_returned() {
		wp_set_current_user( self::$editor_id );

		$awareness = array( 'name' => 'Editor' );
		$response  = $this->dispatch_sync(
			array(
				$this->build_room( $this->get_post_room(), 1, 0, $awareness ),
			)
		);

		$data = $response->get_data();
		$this->assertArrayHasKey( 1, $data['rooms'][0]['awareness'] );
		$this->assertSame( $awareness, $data['rooms'][0]['awareness'][1] );
	}

	public function test_sync_awareness_shows_multiple_clients() {
		wp_set_current_user( self::$editor_id );

		$room = $this->get_post_room();

		// Client 1 connects.
		$this->dispatch_sync(
			array(
				$this->build_room( $room, 1, 0, array( 'name' => 'Client 1' ) ),
			)
		);

		// Client 2 connects.
		$response = $this->dispatch_sync(
			array(
				$this->build_room( $room, 2, 0, array( 'name' => 'Client 2' ) ),
			)
		);

		$data      = $response->get_data();
		$awareness = $data['rooms'][0]['awareness'];

		$this->assertArrayHasKey( 1, $awareness );
		$this->assertArrayHasKey( 2, $awareness );
		$this->assertSame( array( 'name' => 'Client 1' ), $awareness[1] );
		$this->assertSame( array( 'name' => 'Client 2' ), $awareness[2] );
	}

	public function test_sync_awareness_updates_existing_client() {
		wp_set_current_user( self::$editor_id );

		$room = $this->get_post_room();

		// Client 1 connects with initial awareness.
		$this->dispatch_sync(
			array(
				$this->build_room( $room, 1, 0, array( 'cursor' => 'start' ) ),
			)
		);

		// Client 1 updates its awareness.
		$response = $this->dispatch_sync(
			array(
				$this->build_room( $room, 1, 0, array( 'cursor' => 'updated' ) ),
			)
		);

		$data      = $response->get_data();
		$awareness = $data['rooms'][0]['awareness'];

		// Should have exactly one entry for client 1 with updated state.
		$this->assertCount( 1, $awareness );
		$this->assertSame( array( 'cursor' => 'updated' ), $awareness[1] );
	}

	public function test_sync_awareness_client_id_cannot_be_used_by_another_user() {
		wp_set_current_user( self::$editor_id );

		$room = $this->get_post_room();

		// Editor establishes awareness with client_id 1.
		$this->dispatch_sync(
			array(
				$this->build_room( $room, 1, 0, array( 'name' => 'Editor' ) ),
			)
		);

		// A different user tries to use the same client_id.
		$editor_id_2 = self::factory()->user->create( array( 'role' => 'editor' ) );
		wp_set_current_user( $editor_id_2 );

		$response = $this->dispatch_sync(
			array(
				$this->build_room( $room, 1, 0, array( 'name' => 'Impostor' ) ),
			)
		);

		$this->assertErrorResponse( 'rest_cannot_edit', $response, 403 );
	}

	/*
	 * Multiple rooms tests.
	 */

	public function test_sync_multiple_rooms_in_single_request() {
		wp_set_current_user( self::$editor_id );

		$room1 = $this->get_post_room();
		$room2 = 'taxonomy/category';

		$response = $this->dispatch_sync(
			array(
				$this->build_room( $room1 ),
				$this->build_room( $room2 ),
			)
		);

		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertCount( 2, $data['rooms'] );
		$this->assertSame( $room1, $data['rooms'][0]['room'] );
		$this->assertSame( $room2, $data['rooms'][1]['room'] );
	}

	public function test_sync_rooms_are_isolated() {
		wp_set_current_user( self::$editor_id );

		$post_id_2 = self::factory()->post->create( array( 'post_author' => self::$editor_id ) );
		$room1     = $this->get_post_room();
		$room2     = 'postType/post:' . $post_id_2;

		$update = array(
			'type' => 'update',
			'data' => 'cm9vbTEgb25seQ==',
		);

		// Client 1 sends an update to room 1 only.
		$this->dispatch_sync(
			array(
				$this->build_room( $room1, 1, 0, array( 'user' => 'client1' ), array( $update ) ),
			)
		);

		// Client 2 queries both rooms.
		$response = $this->dispatch_sync(
			array(
				$this->build_room( $room1, 2, 0 ),
				$this->build_room( $room2, 2, 0 ),
			)
		);

		$data = $response->get_data();

		// Room 1 should have the update.
		$this->assertNotEmpty( $data['rooms'][0]['updates'] );

		// Room 2 should have no updates.
		$this->assertEmpty( $data['rooms'][1]['updates'] );
	}
}
