<?php
/**
 * Tests for the sync save REST endpoint.
 *
 * @package gutenberg
 * @subpackage Collaboration
 *
 * @group collaboration
 * @group restapi
 */
class Tests_Collaboration_WpSyncSaveServer extends WP_Test_REST_Controller_Testcase {

	protected static int $editor_id;
	protected static int $subscriber_id;
	protected static int $post_id;
	protected static int $category_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$editor_id     = $factory->user->create( array( 'role' => 'editor' ) );
		self::$subscriber_id = $factory->user->create( array( 'role' => 'subscriber' ) );
		self::$post_id       = $factory->post->create( array( 'post_author' => self::$editor_id ) );
		self::$category_id   = $factory->category->create();

		// Enable option in setUpBeforeClass to ensure REST routes are registered.
		update_option( 'wp_collaboration_enabled', 1 );
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$editor_id );
		self::delete_user( self::$subscriber_id );
		delete_option( 'wp_collaboration_enabled' );
		wp_delete_post( self::$post_id, true );
		wp_delete_term( self::$category_id, 'category' );
	}

	public function set_up() {
		parent::set_up();

		// Enable option for tests.
		update_option( 'wp_collaboration_enabled', 1 );
	}

	/**
	 * Dispatches a CRDT document save request.
	 *
	 * @param string $room Room identifier.
	 * @param string $doc  Serialized CRDT document.
	 * @return WP_REST_Response Response object.
	 */
	private function dispatch_save( $room, $doc = 'serialized-crdt-doc' ) {
		$request = new WP_REST_Request( 'POST', '/wp-sync/v1/save' );
		$request->set_body_params(
			array(
				'room' => $room,
				'doc'  => $doc,
			)
		);
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

	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( '/wp-sync/v1/save', $routes );
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_context_param() {
		// Not applicable for the CRDT document save endpoint.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_get_items() {
		// Not applicable for the CRDT document save endpoint.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_get_item() {
		// Not applicable for the CRDT document save endpoint.
	}

	public function test_create_item() {
		wp_set_current_user( self::$editor_id );

		$response = $this->dispatch_save( $this->get_post_room() );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array(), $response->get_data() );
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_update_item() {
		// Not applicable for the CRDT document save endpoint.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_delete_item() {
		// Not applicable for the CRDT document save endpoint.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_prepare_item() {
		// Not applicable for the CRDT document save endpoint.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_get_item_schema() {
		// Not applicable for the CRDT document save endpoint.
	}

	public function test_save_requires_authentication() {
		wp_set_current_user( 0 );

		$response = $this->dispatch_save( $this->get_post_room() );

		$this->assertErrorResponse( 'rest_cannot_edit', $response, 401 );
	}

	public function test_save_post_requires_edit_capability() {
		wp_set_current_user( self::$subscriber_id );

		$response = $this->dispatch_save( $this->get_post_room() );

		$this->assertErrorResponse( 'rest_cannot_edit', $response, 403 );
	}

	public function test_save_post_allowed_with_edit_capability() {
		wp_set_current_user( self::$editor_id );

		$response = $this->dispatch_save( $this->get_post_room() );

		$this->assertSame( 200, $response->get_status() );
	}

	public function test_save_rejects_crdt_doc_exceeding_max_length() {
		wp_set_current_user( self::$editor_id );

		$response = $this->dispatch_save(
			$this->get_post_room(),
			str_repeat( 'a', WP_Sync_Save_Server::MAX_DOC_LENGTH + 1 )
		);

		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
	}

	public function test_save_updates_crdt_doc_meta_without_touching_modified_date() {
		wp_set_current_user( self::$editor_id );

		$modified = get_post_field( 'post_modified', self::$post_id );
		$response = $this->dispatch_save( $this->get_post_room(), 'updated-crdt-doc' );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'updated-crdt-doc', get_post_meta( self::$post_id, WP_Sync_Save_Server::CRDT_DOC_META_KEY, true ) );
		$this->assertSame( $modified, get_post_field( 'post_modified', self::$post_id ) );
	}

	public function test_save_allows_unchanged_crdt_doc_meta() {
		wp_set_current_user( self::$editor_id );
		update_post_meta( self::$post_id, WP_Sync_Save_Server::CRDT_DOC_META_KEY, 'serialized-crdt-doc' );

		$response = $this->dispatch_save( $this->get_post_room(), 'serialized-crdt-doc' );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'serialized-crdt-doc', get_post_meta( self::$post_id, WP_Sync_Save_Server::CRDT_DOC_META_KEY, true ) );
	}

	public function test_save_rejects_taxonomy_entity() {
		wp_set_current_user( self::$editor_id );

		$response = $this->dispatch_save( 'taxonomy/category:' . self::$category_id );

		$this->assertErrorResponse( 'rest_cannot_edit', $response, 403 );
	}
}
