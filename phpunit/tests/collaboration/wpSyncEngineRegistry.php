<?php
/**
 * Tests for the sync engine registry and the engine mismatch protection in
 * the polling transport.
 *
 * @package Gutenberg
 */

/**
 * @group collaboration
 */
class Tests_Collaboration_WpSyncEngineRegistry extends WP_Test_REST_TestCase {
	/**
	 * Editor user ID.
	 *
	 * @var int
	 */
	protected static $editor_id;

	/**
	 * Post ID used for room targets.
	 *
	 * @var int
	 */
	protected static $post_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$editor_id = $factory->user->create( array( 'role' => 'editor' ) );
		self::$post_id   = $factory->post->create( array( 'post_author' => self::$editor_id ) );
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$editor_id );
		wp_delete_post( self::$post_id, true );
	}

	public function set_up() {
		parent::set_up();
		wp_set_current_user( self::$editor_id );

		global $wp_rest_server;
		$wp_rest_server = new Spy_REST_Server();
		do_action( 'rest_api_init', $wp_rest_server );
	}

	public function tear_down() {
		global $wp_rest_server;
		$wp_rest_server = null;
		parent::tear_down();
	}

	/**
	 * Builds a minimal /wp-sync/v1/updates request for a single room.
	 *
	 * @param array $room_overrides Fields to override in the room payload.
	 * @return WP_REST_Request Request object.
	 */
	private function build_request( array $room_overrides = array() ): WP_REST_Request {
		$room    = array_merge(
			array(
				'after'     => 0,
				'awareness' => array( 'user' => 'test' ),
				'client_id' => 123,
				'room'      => 'postType/post:' . self::$post_id,
				'updates'   => array(
					array(
						'data' => base64_encode( 'update-bytes' ),
						'type' => WP_Yjs_Relay_Engine::UPDATE_TYPE_UPDATE,
					),
				),
			),
			$room_overrides
		);
		$request = new WP_REST_Request( 'POST', '/wp-sync/v1/updates' );
		$request->set_body_params( array( 'rooms' => array( $room ) ) );

		return $request;
	}

	public function test_registry_registers_yjs_relay_by_default() {
		$registry = new WP_Sync_Engine_Registry( new WP_Sync_Post_Meta_Storage() );

		$engine = $registry->get_engine( WP_Yjs_Relay_Engine::SLUG );
		$this->assertInstanceOf( 'WP_Yjs_Relay_Engine', $engine );
		$this->assertSame( WP_Yjs_Relay_Engine::SLUG, $registry->get_engine_slug_for_room( 'postType/post:1' ) );
	}

	public function test_registry_falls_back_to_default_for_unknown_configured_engine() {
		update_option( 'wp_sync_engine', 'engine-that-does-not-exist' );
		$registry = new WP_Sync_Engine_Registry( new WP_Sync_Post_Meta_Storage() );

		$this->assertSame( WP_Yjs_Relay_Engine::SLUG, $registry->get_engine_slug_for_room( 'postType/post:1' ) );
		delete_option( 'wp_sync_engine' );
	}

	public function test_registry_accepts_engines_from_filter_and_room_override() {
		$stub = $this->createStub( 'WP_Sync_Engine' );
		$stub->method( 'get_slug' )->willReturn( 'stub-engine' );
		$stub->method( 'get_protocol_version' )->willReturn( 7 );
		$stub->method( 'get_update_types' )->willReturn( array( 'stub_update' ) );

		$register = static function ( $engines ) use ( $stub ) {
			$engines[] = $stub;
			return $engines;
		};
		add_filter( 'wp_sync_engines', $register );
		$select = static function ( $slug, $room ) {
			return 'stub/room' === $room ? 'stub-engine' : $slug;
		};
		add_filter( 'wp_sync_engine_for_room', $select, 10, 2 );

		$registry = new WP_Sync_Engine_Registry( new WP_Sync_Post_Meta_Storage() );

		$this->assertSame( 'stub-engine', $registry->get_engine_slug_for_room( 'stub/room' ) );
		$this->assertSame( WP_Yjs_Relay_Engine::SLUG, $registry->get_engine_slug_for_room( 'postType/post:1' ) );
		$this->assertContains( 'stub_update', $registry->get_all_update_types() );
		$this->assertContains( WP_Yjs_Relay_Engine::UPDATE_TYPE_UPDATE, $registry->get_all_update_types() );

		remove_filter( 'wp_sync_engines', $register );
		remove_filter( 'wp_sync_engine_for_room', $select );
	}

	public function test_matching_engine_stamp_is_accepted() {
		$request  = $this->build_request(
			array(
				'engine'          => WP_Yjs_Relay_Engine::SLUG,
				'engine_protocol' => WP_Yjs_Relay_Engine::PROTOCOL_VERSION,
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertArrayHasKey( 'rooms', $data );
		// The relay engine produces no dispositions; the key must be absent.
		$this->assertArrayNotHasKey( 'dispositions', $data['rooms'][0] );
	}

	public function test_wrong_engine_stamp_is_rejected_with_409() {
		$request  = $this->build_request( array( 'engine' => 'intent-log' ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_sync_engine_mismatch', $response, 409 );
	}

	public function test_wrong_engine_protocol_is_rejected_with_409() {
		$request  = $this->build_request(
			array(
				'engine'          => WP_Yjs_Relay_Engine::SLUG,
				'engine_protocol' => WP_Yjs_Relay_Engine::PROTOCOL_VERSION + 1,
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_sync_engine_mismatch', $response, 409 );
	}

	public function test_first_write_stamps_room_lineage() {
		$room    = 'postType/post:' . self::$post_id;
		$storage = new WP_Sync_Post_Meta_Storage();
		$this->assertNull( $storage->get_room_engine( $room ) );

		$response = rest_get_server()->dispatch( $this->build_request() );
		$this->assertSame( 200, $response->get_status() );

		$this->assertSame( WP_Yjs_Relay_Engine::SLUG, $storage->get_room_engine( $room ) );
	}

	public function test_read_only_request_does_not_stamp_lineage() {
		$response = rest_get_server()->dispatch(
			$this->build_request( array( 'updates' => array() ) )
		);
		$this->assertSame( 200, $response->get_status() );

		$storage = new WP_Sync_Post_Meta_Storage();
		$this->assertNull( $storage->get_room_engine( 'postType/post:' . self::$post_id ) );
	}

	public function test_lineage_from_another_engine_is_rejected_with_409() {
		$room    = 'postType/post:' . self::$post_id;
		$storage = new WP_Sync_Post_Meta_Storage();
		$storage->set_room_engine( $room, 'intent-log' );

		$response = rest_get_server()->dispatch( $this->build_request() );

		$this->assertErrorResponse( 'rest_sync_engine_mismatch', $response, 409 );
	}

	public function test_lineage_stamp_does_not_overwrite() {
		$room    = 'postType/post:' . self::$post_id . ':lineage';
		$storage = new WP_Sync_Post_Meta_Storage();

		$this->assertTrue( $storage->set_room_engine( $room, 'first-engine' ) );
		$this->assertTrue( $storage->set_room_engine( $room, 'second-engine' ) );
		$this->assertSame( 'first-engine', $storage->get_room_engine( $room ) );
	}

	public function test_mismatch_error_carries_expected_engine_details() {
		$response = rest_get_server()->dispatch(
			$this->build_request( array( 'engine' => 'intent-log' ) )
		);
		$this->assertWPError( $response->as_error() );
		$data = $response->as_error()->get_error_data();

		$this->assertSame( WP_Yjs_Relay_Engine::SLUG, $data['engine'] );
		$this->assertSame( WP_Yjs_Relay_Engine::PROTOCOL_VERSION, $data['engine_protocol'] );
		$this->assertSame( 'postType/post:' . self::$post_id, $data['room'] );
	}
}
