<?php
/**
 * Tests for the WP_HTTP_Long_Polling_Sync_Server REST endpoint.
 *
 * @package gutenberg
 * @subpackage Collaboration
 *
 * @group collaboration
 * @group restapi
 */
class Tests_Collaboration_WpHttpLongPollingSyncServer extends WP_Test_REST_TestCase {

	protected static int $editor_id;
	protected static int $subscriber_id;
	protected static int $post_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$editor_id     = $factory->user->create( array( 'role' => 'editor' ) );
		self::$subscriber_id = $factory->user->create( array( 'role' => 'subscriber' ) );
		self::$post_id       = $factory->post->create( array( 'post_author' => self::$editor_id ) );

		// Enable option in setUpBeforeClass to ensure REST routes are registered.
		update_option( 'wp_collaboration_enabled', 1 );
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$editor_id );
		self::delete_user( self::$subscriber_id );
		delete_option( 'wp_collaboration_enabled' );
		wp_delete_post( self::$post_id, true );
	}

	public function set_up() {
		parent::set_up();

		update_option( 'wp_collaboration_enabled', 1 );

		// Shrink the wait budget so tests that exhaust it stay fast. The
		// server sleeps in 500ms increments, so 600ms yields one re-check.
		add_filter( 'wp_sync_long_poll_max_wait_ms', array( $this, 'filter_short_wait' ) );

		// Reset storage post ID cache to ensure clean state after transaction rollback.
		$reflection = new ReflectionProperty( 'WP_Sync_Post_Meta_Storage', 'storage_post_ids' );
		if ( PHP_VERSION_ID < 80100 ) {
			$reflection->setAccessible( true );
		}
		$reflection->setValue( null, array() );
	}

	public function tear_down() {
		remove_filter( 'wp_sync_long_poll_max_wait_ms', array( $this, 'filter_short_wait' ) );
		parent::tear_down();
	}

	/**
	 * Returns a short wait budget for tests.
	 *
	 * @return int Wait budget in milliseconds.
	 */
	public function filter_short_wait() {
		return 600;
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
	 * Dispatches a long-poll sync request with the given rooms.
	 *
	 * @param array $rooms Array of room request data.
	 * @return WP_REST_Response Response object.
	 */
	private function dispatch_long_poll( $rooms ) {
		$request = new WP_REST_Request( 'POST', '/wp-sync/v1/long-poll' );
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
	 * Route registration.
	 */

	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( '/wp-sync/v1/long-poll', $routes );
	}

	/*
	 * Permission tests: the long-poll route enforces the same permissions
	 * as the /updates route.
	 */

	public function test_long_poll_requires_authentication() {
		wp_set_current_user( 0 );

		$response = $this->dispatch_long_poll( array( $this->build_room( $this->get_post_room() ) ) );

		$this->assertErrorResponse( 'rest_cannot_edit', $response, 401 );
	}

	public function test_long_poll_requires_edit_capability() {
		wp_set_current_user( self::$subscriber_id );

		$response = $this->dispatch_long_poll( array( $this->build_room( $this->get_post_room() ) ) );

		$this->assertErrorResponse( 'rest_cannot_edit', $response, 403 );
	}

	public function test_long_poll_rejects_unknown_entity() {
		wp_set_current_user( self::$editor_id );

		$response = $this->dispatch_long_poll( array( $this->build_room( 'unknown/entity' ) ) );

		$this->assertErrorResponse( 'rest_cannot_edit', $response, 403 );
	}

	public function test_long_poll_client_id_cannot_be_used_by_another_user() {
		wp_set_current_user( self::$editor_id );

		$room = $this->get_post_room();

		// Editor establishes awareness with client_id 1.
		$this->dispatch_long_poll(
			array(
				$this->build_room(
					$room,
					1,
					0,
					array( 'name' => 'Editor' ),
					array(
						array(
							'type' => 'update',
							'data' => 'ZWRpdG9y',
						),
					)
				),
			)
		);

		// A different user tries to use the same client_id.
		$editor_id_2 = self::factory()->user->create( array( 'role' => 'editor' ) );
		wp_set_current_user( $editor_id_2 );

		$response = $this->dispatch_long_poll(
			array(
				$this->build_room(
					$room,
					1,
					0,
					array( 'name' => 'Impostor' ),
					array(
						array(
							'type' => 'update',
							'data' => 'aW1wb3N0b3I=',
						),
					)
				),
			)
		);

		$this->assertErrorResponse( 'rest_cannot_edit', $response, 403 );
	}

	/*
	 * Wait behavior tests.
	 */

	public function test_long_poll_returns_immediately_when_request_carries_updates() {
		wp_set_current_user( self::$editor_id );

		$room   = $this->get_post_room();
		$update = array(
			'type' => 'update',
			'data' => 'dGVzdCBkYXRh',
		);

		$start    = microtime( true );
		$response = $this->dispatch_long_poll(
			array(
				$this->build_room( $room, 1, 0, array( 'user' => 'sender' ), array( $update ) ),
			)
		);
		$elapsed  = microtime( true ) - $start;

		$this->assertSame( 200, $response->get_status() );

		// Senders must never be delayed: the 500ms wait increment must not
		// have been entered.
		$this->assertLessThan( 0.4, $elapsed, 'Requests carrying updates must not wait.' );
	}

	public function test_long_poll_returns_immediately_when_updates_are_pending() {
		wp_set_current_user( self::$editor_id );

		$room   = $this->get_post_room();
		$update = array(
			'type' => 'update',
			'data' => 'cGVuZGluZw==',
		);

		// Client 1 stores an update.
		$this->dispatch_long_poll(
			array(
				$this->build_room( $room, 1, 0, array( 'user' => 'c1' ), array( $update ) ),
			)
		);

		// Client 2 polls from cursor 0: the pending update must be returned
		// without waiting.
		$start    = microtime( true );
		$response = $this->dispatch_long_poll(
			array(
				$this->build_room( $room, 2, 0, array( 'user' => 'c2' ) ),
			)
		);
		$elapsed  = microtime( true ) - $start;

		$this->assertSame( 200, $response->get_status() );
		$this->assertLessThan( 0.4, $elapsed, 'Pending updates must be delivered without waiting.' );

		$data = $response->get_data();
		$this->assertNotEmpty( $data['rooms'][0]['updates'] );
		$this->assertSame( 'cGVuZGluZw==', $data['rooms'][0]['updates'][0]['data'] );
	}

	public function test_long_poll_waits_and_returns_update_inserted_mid_wait() {
		wp_set_current_user( self::$editor_id );

		$room = $this->get_post_room();

		// Give this test a bigger budget so the mid-wait break (rather than
		// budget exhaustion) is what ends the wait.
		remove_filter( 'wp_sync_long_poll_max_wait_ms', array( $this, 'filter_short_wait' ) );
		$long_wait = static function () {
			return 5000;
		};
		add_filter( 'wp_sync_long_poll_max_wait_ms', $long_wait );

		/*
		 * The wait budget filter runs after incoming updates are processed
		 * and the caught-up check has passed, but before the wait loop. Use
		 * it to insert another client's update "mid-wait": the first 500ms
		 * re-check must see it and end the wait early.
		 */
		$insert_update = static function ( $max_wait_ms ) use ( $room ) {
			$storage = new WP_Sync_Post_Meta_Storage();
			$storage->add_update(
				$room,
				array(
					'client_id' => 99,
					'data'      => 'bWlkLXdhaXQ=',
					'type'      => 'update',
				)
			);
			return $max_wait_ms;
		};
		add_filter( 'wp_sync_long_poll_max_wait_ms', $insert_update, 20 );

		$start    = microtime( true );
		$response = $this->dispatch_long_poll(
			array(
				$this->build_room( $room, 1, 0, array( 'user' => 'waiter' ) ),
			)
		);
		$elapsed  = microtime( true ) - $start;

		remove_filter( 'wp_sync_long_poll_max_wait_ms', $insert_update, 20 );
		remove_filter( 'wp_sync_long_poll_max_wait_ms', $long_wait );

		$this->assertSame( 200, $response->get_status() );

		// The wait ended on the first 500ms re-check, well before the 5s budget.
		$this->assertGreaterThanOrEqual( 0.5, $elapsed, 'The request should have entered the wait loop.' );
		$this->assertLessThan( 3.0, $elapsed, 'The wait should end as soon as the update appears.' );

		$data = $response->get_data();
		$this->assertNotEmpty( $data['rooms'][0]['updates'] );
		$this->assertSame( 'bWlkLXdhaXQ=', $data['rooms'][0]['updates'][0]['data'] );
	}

	public function test_long_poll_waits_out_budget_when_no_updates_arrive() {
		wp_set_current_user( self::$editor_id );

		$start    = microtime( true );
		$response = $this->dispatch_long_poll(
			array(
				$this->build_room( $this->get_post_room(), 1, 0, array( 'user' => 'solo' ) ),
			)
		);
		$elapsed  = microtime( true ) - $start;

		$this->assertSame( 200, $response->get_status() );

		// The 600ms test budget forces at least one 500ms sleep.
		$this->assertGreaterThanOrEqual( 0.5, $elapsed, 'The request should wait out the budget.' );
		$this->assertLessThan( 5.0, $elapsed, 'The request must respect the shortened budget.' );

		$data = $response->get_data();
		$this->assertEmpty( $data['rooms'][0]['updates'] );
	}

	public function test_long_poll_does_not_wait_for_own_updates() {
		wp_set_current_user( self::$editor_id );

		$room   = $this->get_post_room();
		$update = array(
			'type' => 'update',
			'data' => 'b3duIGRhdGE=',
		);

		// Client 1 stores an update, learning the resulting cursor.
		$response   = $this->dispatch_long_poll(
			array(
				$this->build_room( $room, 1, 0, array( 'user' => 'c1' ), array( $update ) ),
			)
		);
		$end_cursor = $response->get_data()['rooms'][0]['end_cursor'];

		// Client 1 polls again from cursor 0. Its own non-compaction update
		// is not deliverable to it, so the server waits out the budget
		// instead of returning immediately.
		$start    = microtime( true );
		$response = $this->dispatch_long_poll(
			array(
				$this->build_room( $room, 1, 0, array( 'user' => 'c1' ) ),
			)
		);
		$elapsed  = microtime( true ) - $start;

		$this->assertSame( 200, $response->get_status() );
		$this->assertGreaterThanOrEqual( 0.5, $elapsed );
		$this->assertEmpty( $response->get_data()['rooms'][0]['updates'] );
		$this->assertSame( $end_cursor, $response->get_data()['rooms'][0]['end_cursor'] );
	}

	/*
	 * Response shape: identical to the /updates route so the client can
	 * share processing code.
	 */

	public function test_long_poll_response_structure_matches_updates_route() {
		wp_set_current_user( self::$editor_id );

		$update = array(
			'type' => 'update',
			'data' => 'c2hhcGU=',
		);

		$response = $this->dispatch_long_poll(
			array(
				$this->build_room( $this->get_post_room(), 1, 0, array(), array( $update ) ),
			)
		);

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

	public function test_long_poll_invalid_room_format_rejected() {
		wp_set_current_user( self::$editor_id );

		$response = $this->dispatch_long_poll(
			array(
				$this->build_room( 'invalid-room-format' ),
			)
		);

		$this->assertSame( 400, $response->get_status() );
	}
}
