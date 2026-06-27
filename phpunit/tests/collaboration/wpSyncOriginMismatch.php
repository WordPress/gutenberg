<?php
/**
 * Tests for the WP_HTTP_Polling_Sync_Server REST endpoint specifically
 * regarding the origin URL mismatch (database migration) purge logic.
 *
 * @package gutenberg
 * @subpackage Collaboration
 *
 * @group collaboration
 * @group restapi
 */
class Tests_Collaboration_WpSyncOriginMismatch extends WP_Test_REST_Controller_Testcase {

	protected static int $editor_id;
	protected static int $post_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$editor_id = $factory->user->create( array( 'role' => 'editor' ) );
		self::$post_id   = $factory->post->create( array( 'post_author' => self::$editor_id ) );

		// Enable option in setUpBeforeClass to ensure REST routes are registered.
		update_option( 'wp_collaboration_enabled', 1 );
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$editor_id );
		delete_option( 'wp_collaboration_enabled' );
		wp_delete_post( self::$post_id, true );
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

		// Set current user.
		wp_set_current_user( self::$editor_id );
	}

	private function get_post_room() {
		return 'postType/post:' . self::$post_id;
	}

	private function dispatch_sync( $rooms ) {
		$request = new WP_REST_Request( 'POST', '/wp-sync/v1/updates' );
		$request->set_body_params( array( 'rooms' => $rooms ) );
		return rest_get_server()->dispatch( $request );
	}

	private function get_storage_post( $room ) {
		$room_hash = md5( $room );
		$posts     = get_posts(
			array(
				'post_type'      => WP_Sync_Post_Meta_Storage::POST_TYPE,
				'posts_per_page' => 1,
				'post_status'    => 'publish',
				'name'           => $room_hash,
			)
		);
		return empty( $posts ) ? null : $posts[0];
	}

	public function test_origin_url_stored_on_first_update() {
		$room = $this->get_post_room();

		$rooms = array(
			array(
				'after'     => 0,
				'awareness' => array( 'user' => 'test' ),
				'client_id' => 1,
				'room'      => $room,
				'updates'   => array(
					array(
						'type' => WP_HTTP_Polling_Sync_Server::UPDATE_TYPE_UPDATE,
						'data' => base64_encode( 'test_data' ),
					),
				),
			),
		);

		$response = $this->dispatch_sync( $rooms );
		$this->assertEquals( 200, $response->get_status() );

		$storage_post = $this->get_storage_post( $room );
		$this->assertNotNull( $storage_post );

		$origin_url = get_post_meta( $storage_post->ID, WP_Sync_Post_Meta_Storage::ORIGIN_URL_META_KEY, true );
		$this->assertEquals( site_url(), $origin_url );
	}

	public function test_updates_purged_on_origin_mismatch() {
		$room = $this->get_post_room();

		// Add an update normally.
		$this->dispatch_sync(
			array(
				array(
					'after'     => 0,
					'awareness' => array( 'user' => 'test' ),
					'client_id' => 1,
					'room'      => $room,
					'updates'   => array(
						array(
							'type' => WP_HTTP_Polling_Sync_Server::UPDATE_TYPE_UPDATE,
							'data' => base64_encode( 'test_data' ),
						),
					),
				),
			)
		);

		// Verify it was stored.
		$storage_post = $this->get_storage_post( $room );
		$this->assertNotNull( $storage_post );
		$this->assertEquals( 1, count( get_post_meta( $storage_post->ID, WP_Sync_Post_Meta_Storage::SYNC_UPDATE_META_KEY ) ) );

		// Simulate site migration by modifying the stored origin URL.
		update_post_meta( $storage_post->ID, WP_Sync_Post_Meta_Storage::ORIGIN_URL_META_KEY, 'https://old-site.example.com' );

		// Fetch updates again (simulating the client polling on the new site).
		$response = $this->dispatch_sync(
			array(
				array(
					'after'     => 0,
					'awareness' => array( 'user' => 'test2' ),
					'client_id' => 2,
					'room'      => $room,
					'updates'   => array(),
				),
			)
		);

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$room_data = $data['rooms'][0];

		// The updates should be empty.
		$this->assertEmpty( $room_data['updates'] );
		$this->assertEquals( 0, $room_data['total_updates'] );
		$this->assertEquals( 0, $room_data['end_cursor'] );

		// The storage post itself should have been deleted.
		$this->assertNull( $this->get_storage_post( $room ) );
	}

	public function test_legacy_data_without_origin_is_purged() {
		$room = $this->get_post_room();

		// Add an update normally.
		$this->dispatch_sync(
			array(
				array(
					'after'     => 0,
					'awareness' => array( 'user' => 'test' ),
					'client_id' => 1,
					'room'      => $room,
					'updates'   => array(
						array(
							'type' => WP_HTTP_Polling_Sync_Server::UPDATE_TYPE_UPDATE,
							'data' => base64_encode( 'test_data' ),
						),
					),
				),
			)
		);

		$storage_post = $this->get_storage_post( $room );

		// Simulate legacy data by deleting the origin URL.
		delete_post_meta( $storage_post->ID, WP_Sync_Post_Meta_Storage::ORIGIN_URL_META_KEY );

		// Fetch updates.
		$response = $this->dispatch_sync(
			array(
				array(
					'after'     => 0,
					'awareness' => array( 'user' => 'test2' ),
					'client_id' => 2,
					'room'      => $room,
					'updates'   => array(),
				),
			)
		);

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$room_data = $data['rooms'][0];

		// Should be purged.
		$this->assertEmpty( $room_data['updates'] );
		$this->assertNull( $this->get_storage_post( $room ) );
	}

	public function test_crdt_document_purged_on_origin_mismatch() {
		// Mock a CRDT document save on the post.
		update_post_meta( self::$post_id, '_crdt_document', 'mock_doc_data' );
		update_post_meta( self::$post_id, '_crdt_document_origin_url', 'https://old-site.example.com' );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/posts/' . self::$post_id );
		$response = rest_get_server()->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertArrayHasKey( 'meta', $data );
		$this->assertEmpty( $data['meta']['_crdt_document'] );

		// Verify it was deleted from DB.
		$this->assertEmpty( get_post_meta( self::$post_id, '_crdt_document', true ) );
		$this->assertEmpty( get_post_meta( self::$post_id, '_crdt_document_origin_url', true ) );
	}

}
