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

	/**
	 * Skips tests that need Gutenberg's compatibility implementation.
	 */
	private function skip_if_sync_server_class_is_provided_by_wordpress_core(): void {
		$reflection = new ReflectionClass( 'WP_HTTP_Polling_Sync_Server' );
		if ( false === strpos( $reflection->getFileName(), '/wp-content/plugins/' ) ) {
			$this->markTestSkipped( 'The active WP_HTTP_Polling_Sync_Server class is provided by WordPress core, not Gutenberg.' );
		}
	}

	/**
	 * Creates a Yjs document with text content used by sync tests.
	 *
	 * @param string $text      Text content.
	 * @param int    $client_id Yjs client ID.
	 * @return Yjs\Doc Yjs document.
	 */
	private function create_yjs_doc_with_text( string $text = '', int $client_id = 1 ) {
		$doc = new Yjs\Doc();
		// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- External y-php API uses clientID.
		$doc->clientID = $client_id;

		if ( '' !== $text ) {
			$doc->getText( 'text' )->insert( 0, $text );
		}

		return $doc;
	}

	/**
	 * Creates a base64-encoded Yjs V2 update.
	 *
	 * @param string $text      Text content.
	 * @param int    $client_id Yjs client ID.
	 * @return string Base64-encoded update.
	 */
	private function create_yjs_update( string $text = 'test', int $client_id = 1 ): string {
		return Yjs\encodeStateAsUpdateV2( $this->create_yjs_doc_with_text( $text, $client_id ) )->toBase64();
	}

	/**
	 * Creates a base64-encoded y-protocols sync_step1 frame.
	 *
	 * @param Yjs\Doc|null $doc Yjs document.
	 * @return string Base64-encoded sync_step1 frame.
	 */
	private function create_yjs_sync_step1( $doc = null ): string {
		$encoder = Yjs\Lib0\Encoding::createEncoder();
		Yjs\Protocols\Sync::writeSyncStep1( $encoder, $doc ?? new Yjs\Doc() );
		return Yjs\Lib0\Encoding::toUint8Array( $encoder )->toBase64();
	}

	/**
	 * Creates a base64-encoded y-protocols sync_step2 frame.
	 *
	 * @param Yjs\Doc      $source_doc Source document.
	 * @param Yjs\Doc|null $target_doc Target document.
	 * @return string Base64-encoded sync_step2 frame.
	 */
	private function create_yjs_sync_step2( $source_doc, $target_doc = null ): string {
		$encoder      = Yjs\Lib0\Encoding::createEncoder();
		$state_vector = null === $target_doc ? null : Yjs\encodeStateVector( $target_doc );
		Yjs\Protocols\Sync::writeSyncStep2( $encoder, $source_doc, $state_vector );
		return Yjs\Lib0\Encoding::toUint8Array( $encoder )->toBase64();
	}

	/**
	 * Applies a base64-encoded sync_step2 frame to an empty Yjs document.
	 *
	 * @param string $base64 Base64-encoded sync_step2 frame.
	 * @return Yjs\Doc Hydrated Yjs document.
	 */
	private function apply_yjs_sync_step2( string $base64 ) {
		$doc           = new Yjs\Doc();
		$reply_encoder = Yjs\Lib0\Encoding::createEncoder();
		$message_type  = Yjs\Protocols\Sync::readSyncMessage(
			Yjs\Lib0\Decoding::createDecoder( Yjs\Lib0\Buffer::fromBase64( $base64 ) ),
			$reply_encoder,
			$doc,
			'test'
		);

		$this->assertSame( Yjs\Protocols\Sync::MESSAGE_YJS_SYNC_STEP2, $message_type );

		return $doc;
	}

	/**
	 * Applies a base64-encoded Yjs V2 update to an empty Yjs document.
	 *
	 * @param string $base64 Base64-encoded update.
	 * @return Yjs\Doc Hydrated Yjs document.
	 */
	private function apply_yjs_update( string $base64 ) {
		$doc = new Yjs\Doc();
		Yjs\applyUpdateV2( $doc, Yjs\Lib0\Buffer::fromBase64( $base64 ) );
		return $doc;
	}

	/**
	 * Returns the first update with a given type.
	 *
	 * @param array  $updates Response updates.
	 * @param string $type    Update type.
	 * @return array|null Matching update.
	 */
	private function get_first_update_of_type( array $updates, string $type ): ?array {
		foreach ( $updates as $update ) {
			if ( $type === $update['type'] ) {
				return $update;
			}
		}

		return null;
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

	/**
	 * @ticket 77243
	 */
	public function test_sync_permission_checked_per_room() {
		$this->skip_if_sync_server_class_is_provided_by_wordpress_core();

		wp_set_current_user( self::$editor_id );

		$forbidden_rooms = array(
			'unknown/entity',
			'postType/post:999999',
		);

		// First room is allowed, remaining rooms are forbidden.
		$response = $this->dispatch_sync(
			array(
				$this->build_room( $this->get_post_room() ),
				$this->build_room( $forbidden_rooms[0] ),
				$this->build_room( $forbidden_rooms[1] ),
			)
		);

		$this->assertErrorResponse( 'rest_cannot_edit', $response, 403 );
		$data = $response->get_data();
		$this->assertSame( $forbidden_rooms, $data['data']['rooms'] );
		$this->assertStringContainsString( $forbidden_rooms[0], $data['message'] );
		$this->assertStringContainsString( $forbidden_rooms[1], $data['message'] );
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
			'data' => $this->create_yjs_update( 'test data', 101 ),
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
			'data' => $this->create_yjs_update( 'own data', 102 ),
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

	public function test_sync_step1_returns_server_sync_step2_without_storing_step1() {
		$this->skip_if_sync_server_class_is_provided_by_wordpress_core();

		wp_set_current_user( self::$editor_id );

		$room   = $this->get_post_room();
		$update = array(
			'type' => 'sync_step1',
			'data' => $this->create_yjs_sync_step1(),
		);

		// Client 1 sends sync_step1 and receives a direct server response.
		$response = $this->dispatch_sync(
			array(
				$this->build_room( $room, 1, 0, array( 'user' => 'client1' ), array( $update ) ),
			)
		);

		$data         = $response->get_data();
		$room_updates = $data['rooms'][0]['updates'];

		$this->assertSame( 0, $data['rooms'][0]['total_updates'] );
		$this->assertCount( 1, $room_updates );
		$this->assertSame( 'sync_step2', $room_updates[0]['type'] );

		// Client 2 should not see the sync_step1 request.
		$response = $this->dispatch_sync(
			array(
				$this->build_room( $room, 2, 0 ),
			)
		);

		$data  = $response->get_data();
		$types = wp_list_pluck( $data['rooms'][0]['updates'], 'type' );
		$this->assertNotContains( 'sync_step1', $types );
	}

	public function test_legacy_sync_step2_is_stored_as_regular_update() {
		$this->skip_if_sync_server_class_is_provided_by_wordpress_core();

		wp_set_current_user( self::$editor_id );

		$room       = $this->get_post_room();
		$source_doc = $this->create_yjs_doc_with_text( 'legacy step2', 201 );
		$update     = array(
			'type' => 'sync_step2',
			'data' => $this->create_yjs_sync_step2( $source_doc, new Yjs\Doc() ),
		);

		// Client 1 sends legacy sync_step2.
		$this->dispatch_sync(
			array(
				$this->build_room( $room, 1, 0, array( 'user' => 'client1' ), array( $update ) ),
			)
		);

		// Client 2 should see a regular update, not the raw sync_step2 frame.
		$response = $this->dispatch_sync(
			array(
				$this->build_room( $room, 2, 0 ),
			)
		);

		$data  = $response->get_data();
		$types = wp_list_pluck( $data['rooms'][0]['updates'], 'type' );
		$this->assertContains( 'update', $types );
		$this->assertNotContains( 'sync_step2', $types );

		$normalized_update = $this->get_first_update_of_type( $data['rooms'][0]['updates'], 'update' );
		$hydrated_doc      = $this->apply_yjs_update( $normalized_update['data'] );
		$this->assertSame( 'legacy step2', $hydrated_doc->getText( 'text' )->toString() );
	}

	public function test_server_sync_step2_can_hydrate_client_from_stored_v2_updates() {
		$this->skip_if_sync_server_class_is_provided_by_wordpress_core();

		wp_set_current_user( self::$editor_id );

		$room   = $this->get_post_room();
		$update = array(
			'type' => 'update',
			'data' => $this->create_yjs_update( 'stored content', 202 ),
		);

		$seed_response = $this->dispatch_sync(
			array(
				$this->build_room( $room, 1, 0, array( 'user' => 'client1' ), array( $update ) ),
			)
		);
		$cursor        = $seed_response->get_data()['rooms'][0]['end_cursor'];

		$response = $this->dispatch_sync(
			array(
				$this->build_room(
					$room,
					2,
					$cursor,
					array( 'user' => 'client2' ),
					array(
						array(
							'type' => 'sync_step1',
							'data' => $this->create_yjs_sync_step1(),
						),
					)
				),
			)
		);

		$data       = $response->get_data();
		$sync_step2 = $this->get_first_update_of_type( $data['rooms'][0]['updates'], 'sync_step2' );

		$this->assertNotNull( $sync_step2 );
		$this->assertCount( 1, $data['rooms'][0]['updates'] );

		$hydrated_doc = $this->apply_yjs_sync_step2( $sync_step2['data'] );
		$this->assertSame( 'stored content', $hydrated_doc->getText( 'text' )->toString() );
	}

	public function test_historical_sync_step1_rows_are_filtered_from_responses() {
		$this->skip_if_sync_server_class_is_provided_by_wordpress_core();

		wp_set_current_user( self::$editor_id );

		$room    = $this->get_post_room();
		$storage = new WP_Sync_Post_Meta_Storage();

		$this->assertTrue(
			$storage->add_update(
				$room,
				array(
					'client_id' => 1,
					'type'      => 'sync_step1',
					'data'      => $this->create_yjs_sync_step1(),
				)
			)
		);

		$response = $this->dispatch_sync(
			array(
				$this->build_room( $room, 2, 0 ),
			)
		);

		$data  = $response->get_data();
		$types = wp_list_pluck( $data['rooms'][0]['updates'], 'type' );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 1, $data['rooms'][0]['total_updates'] );
		$this->assertNotContains( 'sync_step1', $types );
	}

	public function test_historical_sync_step2_rows_are_applied_during_reconstruction() {
		$this->skip_if_sync_server_class_is_provided_by_wordpress_core();

		wp_set_current_user( self::$editor_id );

		$room       = $this->get_post_room();
		$storage    = new WP_Sync_Post_Meta_Storage();
		$source_doc = $this->create_yjs_doc_with_text( 'historical step2', 203 );

		$this->assertTrue(
			$storage->add_update(
				$room,
				array(
					'client_id' => 1,
					'type'      => 'sync_step2',
					'data'      => $this->create_yjs_sync_step2( $source_doc, new Yjs\Doc() ),
				)
			)
		);

		$storage->get_updates_after_cursor( $room, 0 );
		$cursor = $storage->get_cursor( $room );

		$response = $this->dispatch_sync(
			array(
				$this->build_room(
					$room,
					2,
					$cursor,
					array( 'user' => 'client2' ),
					array(
						array(
							'type' => 'sync_step1',
							'data' => $this->create_yjs_sync_step1(),
						),
					)
				),
			)
		);

		$sync_step2 = $this->get_first_update_of_type( $response->get_data()['rooms'][0]['updates'], 'sync_step2' );

		$this->assertNotNull( $sync_step2 );

		$hydrated_doc = $this->apply_yjs_sync_step2( $sync_step2['data'] );
		$this->assertSame( 'historical step2', $hydrated_doc->getText( 'text' )->toString() );
	}

	public function test_sync_rejects_malformed_yjs_update_without_storing_payload() {
		$this->skip_if_sync_server_class_is_provided_by_wordpress_core();

		wp_set_current_user( self::$editor_id );

		$room     = $this->get_post_room();
		$response = $this->dispatch_sync(
			array(
				$this->build_room(
					$room,
					1,
					0,
					array( 'user' => 'client1' ),
					array(
						array(
							'type' => 'update',
							'data' => 'not-base64!',
						),
					)
				),
			)
		);

		$this->assertErrorResponse( 'rest_sync_malformed_update', $response, 400 );

		$response = $this->dispatch_sync(
			array(
				$this->build_room( $room, 2, 0 ),
			)
		);

		$data = $response->get_data();
		$this->assertSame( 0, $data['rooms'][0]['total_updates'] );
		$this->assertEmpty( $data['rooms'][0]['updates'] );
	}

	public function test_sync_multiple_updates_in_single_request() {
		$this->skip_if_sync_server_class_is_provided_by_wordpress_core();

		wp_set_current_user( self::$editor_id );

		$room    = $this->get_post_room();
		$updates = array(
			array(
				'type' => 'sync_step1',
				'data' => $this->create_yjs_sync_step1(),
			),
			array(
				'type' => 'update',
				'data' => $this->create_yjs_update( 'local update', 301 ),
			),
		);

		// Client 1 sends multiple updates.
		$response = $this->dispatch_sync(
			array(
				$this->build_room( $room, 1, 0, array( 'user' => 'client1' ), $updates ),
			)
		);

		$data                 = $response->get_data();
		$direct_sync_response = $this->get_first_update_of_type( $data['rooms'][0]['updates'], 'sync_step2' );
		$hydrated_doc         = $this->apply_yjs_sync_step2( $direct_sync_response['data'] );

		$this->assertSame( '', $hydrated_doc->getText( 'text' )->toString() );
		$this->assertSame( 1, $data['rooms'][0]['total_updates'] );

		// Client 2 should see only the stored content update.
		$response = $this->dispatch_sync(
			array(
				$this->build_room( $room, 2, 0 ),
			)
		);

		$data         = $response->get_data();
		$room_updates = $data['rooms'][0]['updates'];

		$this->assertCount( 1, $room_updates );
		$this->assertSame( 'update', $room_updates[0]['type'] );
		$this->assertSame( 1, $data['rooms'][0]['total_updates'] );
	}

	public function test_sync_update_data_preserved() {
		wp_set_current_user( self::$editor_id );

		$room   = $this->get_post_room();
		$update = array(
			'type' => 'update',
			'data' => $this->create_yjs_update( 'preserved data', 401 ),
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

		$this->assertSame( $update['data'], $room_updates[0]['data'] );
		$this->assertSame( 'update', $room_updates[0]['type'] );
	}

	public function test_sync_total_updates_increments() {
		wp_set_current_user( self::$editor_id );

		$room   = $this->get_post_room();
		$update = array(
			'type' => 'update',
			'data' => $this->create_yjs_update( 'test', 402 ),
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

	public function test_sync_response_omits_should_compact_field() {
		$this->skip_if_sync_server_class_is_provided_by_wordpress_core();

		wp_set_current_user( self::$editor_id );

		$room   = $this->get_post_room();
		$update = array(
			'type' => 'update',
			'data' => $this->create_yjs_update( 'compact seed', 501 ),
		);

		// Compaction is performed server-side, so clients are never asked to
		// compact and the response carries no should_compact field.
		$response = $this->dispatch_sync(
			array(
				$this->build_room( $room, 1, 0, array( 'user' => 'c1' ), array( $update ) ),
			)
		);

		$data = $response->get_data();
		$this->assertArrayNotHasKey( 'should_compact', $data['rooms'][0] );
	}

	public function test_sync_server_does_not_compact_at_or_below_threshold() {
		$this->skip_if_sync_server_class_is_provided_by_wordpress_core();

		wp_set_current_user( self::$editor_id );

		$room    = $this->get_post_room();
		$updates = array();
		for ( $i = 0; $i < 100; $i++ ) {
			$updates[] = array(
				'type' => 'update',
				'data' => $this->create_yjs_update( "update-$i", 600 + $i ),
			);
		}

		// Exactly at the threshold (100): the room is left untouched.
		$response = $this->dispatch_sync(
			array(
				$this->build_room( $room, 1, 0, array( 'user' => 'c1' ), $updates ),
			)
		);

		$data = $response->get_data();
		$this->assertSame( 100, $data['rooms'][0]['total_updates'] );
	}

	public function test_sync_server_compacts_above_threshold() {
		$this->skip_if_sync_server_class_is_provided_by_wordpress_core();

		wp_set_current_user( self::$editor_id );

		$room        = $this->get_post_room();
		$updates     = array();
		$raw_updates = array();
		for ( $i = 0; $i < 101; $i++ ) {
			$data          = $this->create_yjs_update( "update-$i ", 600 + $i );
			$raw_updates[] = $data;
			$updates[]     = array(
				'type' => 'update',
				'data' => $data,
			);
		}

		// Exceeding the threshold (101) triggers a server-side compaction that
		// collapses every stored update into a single compaction row.
		$response = $this->dispatch_sync(
			array(
				$this->build_room( $room, 1, 0, array( 'user' => 'c1' ), $updates ),
			)
		);

		$this->assertSame( 1, $response->get_data()['rooms'][0]['total_updates'] );

		// A fresh client polling from cursor 0 receives only the compaction.
		$observer  = $this->dispatch_sync(
			array(
				$this->build_room( $room, 999, 0, array( 'user' => 'observer' ) ),
			)
		);
		$delivered = $observer->get_data()['rooms'][0]['updates'];

		$this->assertCount( 1, $delivered );
		$this->assertSame( 'compaction', $delivered[0]['type'] );

		// The compaction preserves the full document state.
		$expected_doc = new Yjs\Doc();
		foreach ( $raw_updates as $raw ) {
			Yjs\applyUpdateV2( $expected_doc, Yjs\Lib0\Buffer::fromBase64( $raw ) );
		}

		$compacted_doc = $this->apply_yjs_update( $delivered[0]['data'] );

		$this->assertSame(
			$expected_doc->getText( 'text' )->toString(),
			$compacted_doc->getText( 'text' )->toString()
		);
	}

	public function test_sync_stale_compaction_is_stored_as_update_when_newer_compaction_exists() {
		$this->skip_if_sync_server_class_is_provided_by_wordpress_core();

		wp_set_current_user( self::$editor_id );

		$room   = $this->get_post_room();
		$update = array(
			'type' => 'update',
			'data' => $this->create_yjs_update( 'seed before compaction', 801 ),
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
			'data' => $this->create_yjs_update( 'compacted', 802 ),
		);

		$this->dispatch_sync(
			array(
				$this->build_room( $room, 2, $end_cursor, array( 'user' => 'c2' ), array( $compaction ) ),
			)
		);

		// Client 3 sends a stale compaction at cursor 0 (mirroring two offline
		// clients that reconnect from the same baseline cursor). The server
		// cannot run remove_updates_before_cursor because client 2 has already
		// advanced the frontier, but the bytes must still be stored as a
		// regular update so client 3's operations can propagate to other
		// clients via Yjs state-as-update merging.
		$stale_compaction = array(
			'type' => 'compaction',
			'data' => $this->create_yjs_update( 'stale', 803 ),
		);
		$response         = $this->dispatch_sync(
			array(
				$this->build_room( $room, 3, 0, array( 'user' => 'c3' ), array( $stale_compaction ) ),
			)
		);

		$this->assertSame( 200, $response->get_status() );

		// Verify the newer compaction is preserved AND the stale compaction's
		// bytes were persisted (now as type=update so subsequent compactions
		// don't trip the has_newer_compaction check).
		$response = $this->dispatch_sync(
			array(
				$this->build_room( $room, 4, 0, array( 'user' => 'c4' ) ),
			)
		);
		$updates  = $response->get_data()['rooms'][0]['updates'];

		$update_data = wp_list_pluck( $updates, 'data' );
		$this->assertContains( $compaction['data'], $update_data, 'The newer compaction should be preserved.' );
		$this->assertContains( $stale_compaction['data'], $update_data, 'The stale compaction bytes should be stored so client 3\'s operations propagate.' );

		$stale_entry = null;
		foreach ( $updates as $entry ) {
			if ( $stale_compaction['data'] === $entry['data'] ) {
				$stale_entry = $entry;
				break;
			}
		}
		$this->assertNotNull( $stale_entry, 'The stale compaction entry should be present in the room.' );
		$this->assertSame( 'update', $stale_entry['type'], 'The stale compaction should be stored as type=update, not type=compaction.' );
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
			'data' => $this->create_yjs_update( 'room1 only', 901 ),
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
