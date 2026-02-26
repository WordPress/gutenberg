<?php
/**
 * Tests for the Content Guidelines REST API Controller.
 *
 * @package gutenberg
 */
class Gutenberg_Content_Guidelines_REST_Controller_Test extends WP_Test_REST_Post_Type_Controller_Testcase {

	/**
	 * @var int Administrator user ID.
	 */
	protected static $admin_id;

	/**
	 * @var int Editor user ID (no manage_options capability).
	 */
	protected static $editor_id;

	/**
	 * REST API route base.
	 *
	 * @var string
	 */
	const REST_BASE = '/wp/v2/content-guidelines';

	/**
	 * Set up class fixtures.
	 *
	 * @param WP_UnitTest_Factory $factory Factory instance.
	 */
	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id  = $factory->user->create(
			array( 'role' => 'administrator' )
		);
		self::$editor_id = $factory->user->create(
			array( 'role' => 'editor' )
		);
	}

	/**
	 * Clean up class fixtures.
	 */
	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
		self::delete_user( self::$editor_id );
	}

	/**
	 * Clean up after each test.
	 */
	public function tear_down() {
		$posts = get_posts(
			array(
				'post_type'      => Gutenberg_Content_Guidelines_Post_Type::POST_TYPE,
				'post_status'    => array( 'publish', 'draft' ),
				'posts_per_page' => -1,
			)
		);
		foreach ( $posts as $post ) {
			wp_delete_post( $post->ID, true );
		}

		parent::tear_down();
	}

	/**
	 * Helper: create a guidelines post via the REST API.
	 *
	 * @param array $args Optional request params to merge.
	 * @return WP_REST_Response
	 */
	private function create_guidelines( $args = array() ) {
		wp_set_current_user( self::$admin_id );

		$defaults = array(
			'status'               => 'draft',
			'guideline_categories' => array(
				'copy' => array(
					'label'      => 'Copy Guidelines',
					'guidelines' => 'Write clearly.',
				),
			),
		);

		$params  = array_merge( $defaults, $args );
		$request = new WP_REST_Request( 'POST', self::REST_BASE );
		foreach ( $params as $key => $value ) {
			$request->set_param( $key, $value );
		}

		return rest_get_server()->dispatch( $request );
	}

	/**
	 * Test that content-guidelines routes are registered.
	 *
	 * @covers ::register_routes
	 */
	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey( self::REST_BASE, $routes, 'Collection route not registered.' );
		$this->assertArrayHasKey( self::REST_BASE . '/(?P<id>[\d]+)', $routes, 'Single item route not registered.' );
	}

	/**
	 * Test that an admin can create a guidelines post.
	 *
	 * @covers ::create_item
	 */
	public function test_create_item() {
		$response = $this->create_guidelines();

		$this->assertSame( 201, $response->get_status() );

		$data = $response->get_data();
		$this->assertArrayHasKey( 'id', $data );
		$this->assertSame( 'draft', $data['status'] );
		$this->assertArrayHasKey( 'guideline_categories', $data );
		$this->assertSame( 'Write clearly.', $data['guideline_categories']['copy']['guidelines'] );
	}

	/**
	 * Test that guidelines can be created with publish status.
	 *
	 * @covers ::create_item
	 */
	public function test_create_item_with_publish_status() {
		$response = $this->create_guidelines( array( 'status' => 'publish' ) );

		$this->assertSame( 201, $response->get_status() );
		$this->assertSame( 'publish', $response->get_data()['status'] );
	}

	/**
	 * Test that only one guidelines post can exist (singleton enforcement).
	 *
	 * @covers ::create_item
	 */
	public function test_create_item_singleton_enforcement() {
		$this->create_guidelines();
		$response = $this->create_guidelines();

		$this->assertErrorResponse( 'rest_guidelines_exists', $response, 400 );
	}

	/**
	 * Test that editors cannot create guidelines (requires manage_options).
	 *
	 * @covers ::create_item_permissions_check
	 */
	public function test_create_item_no_permission_editor() {
		wp_set_current_user( self::$editor_id );

		$request = new WP_REST_Request( 'POST', self::REST_BASE );
		$request->set_param( 'status', 'draft' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_cannot_create', $response, 403 );
	}

	/**
	 * Test that GET returns the singleton guidelines with categories.
	 *
	 * @covers ::get_guidelines
	 */
	public function test_get_items() {
		wp_set_current_user( self::$admin_id );
		$this->create_guidelines(
			array(
				'status'               => 'publish',
				'guideline_categories' => array(
					'copy'   => array( 'guidelines' => 'Be concise.' ),
					'images' => array( 'guidelines' => 'Use alt text.' ),
				),
			)
		);

		$request  = new WP_REST_Request( 'GET', self::REST_BASE );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertSame( 'publish', $data['status'] );
		$this->assertSame( 'Be concise.', $data['guideline_categories']['copy']['guidelines'] );
		$this->assertSame( 'Use alt text.', $data['guideline_categories']['images']['guidelines'] );
	}

	/**
	 * Test that GET returns an empty placeholder when no guidelines exist.
	 *
	 * @covers ::get_guidelines
	 */
	public function test_get_items_empty() {
		wp_set_current_user( self::$admin_id );

		$request  = new WP_REST_Request( 'GET', self::REST_BASE );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertSame( 0, $data['id'] );
		$this->assertSame( 'draft', $data['status'] );
	}

	/**
	 * Test that the status query parameter filters guidelines correctly.
	 *
	 * @covers ::get_guidelines
	 */
	public function test_get_items_status_filter() {
		wp_set_current_user( self::$admin_id );
		$this->create_guidelines( array( 'status' => 'draft' ) );

		// Filter by publish should return empty since post is draft.
		$request = new WP_REST_Request( 'GET', self::REST_BASE );
		$request->set_param( 'status', 'publish' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 0, $response->get_data()['id'] );

		// Filter by draft should return the post.
		$request = new WP_REST_Request( 'GET', self::REST_BASE );
		$request->set_param( 'status', 'draft' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertNotSame( 0, $response->get_data()['id'] );
	}

	/**
	 * Test that the category query parameter returns only the requested category.
	 *
	 * @covers ::get_guidelines
	 */
	public function test_get_items_category_filter() {
		wp_set_current_user( self::$admin_id );
		$this->create_guidelines(
			array(
				'guideline_categories' => array(
					'copy'   => array( 'guidelines' => 'Copy text.' ),
					'images' => array( 'guidelines' => 'Images text.' ),
				),
			)
		);

		$request = new WP_REST_Request( 'GET', self::REST_BASE );
		$request->set_param( 'category', 'copy' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertArrayHasKey( 'copy', $data['guideline_categories'] );
		$this->assertArrayNotHasKey( 'images', $data['guideline_categories'] );
	}

	/**
	 * Test that the block query parameter returns only the matching block entry.
	 *
	 * @covers ::get_guidelines
	 */
	public function test_get_items_block_filter() {
		wp_set_current_user( self::$admin_id );
		$this->create_guidelines(
			array(
				'guideline_categories' => array(
					'copy'   => array( 'guidelines' => 'Copy text.' ),
					'blocks' => array(
						'core/paragraph' => array( 'guidelines' => 'Paragraph guidelines.' ),
						'core/heading'   => array( 'guidelines' => 'Heading guidelines.' ),
					),
				),
			)
		);

		$request = new WP_REST_Request( 'GET', self::REST_BASE );
		$request->set_param( 'block', 'core/paragraph' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertArrayHasKey( 'blocks', $data['guideline_categories'] );
		$this->assertArrayHasKey( 'core/paragraph', $data['guideline_categories']['blocks'] );
		$this->assertArrayNotHasKey( 'core/heading', $data['guideline_categories']['blocks'] );
		// Standard categories should not appear when filtering by block.
		$this->assertArrayNotHasKey( 'copy', $data['guideline_categories'] );
	}

	/**
	 * Test that filtering by a non-existent block returns empty categories.
	 *
	 * @covers ::get_guidelines
	 */
	public function test_get_items_block_filter_nonexistent() {
		wp_set_current_user( self::$admin_id );
		$this->create_guidelines();

		$request = new WP_REST_Request( 'GET', self::REST_BASE );
		$request->set_param( 'block', 'core/nonexistent' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertEmpty( (array) $data['guideline_categories'] );
	}

	/**
	 * Test that unauthenticated users cannot read guidelines.
	 *
	 * @covers ::get_guidelines_permissions_check
	 */
	public function test_get_items_unauthenticated() {
		wp_set_current_user( 0 );

		$request  = new WP_REST_Request( 'GET', self::REST_BASE );
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_forbidden', $response, 401 );
	}

	/**
	 * Test that editors can read guidelines (edit_posts capability).
	 *
	 * @covers ::get_guidelines_permissions_check
	 */
	public function test_get_items_editor_can_read() {
		wp_set_current_user( self::$admin_id );
		$this->create_guidelines( array( 'status' => 'publish' ) );

		wp_set_current_user( self::$editor_id );

		$request  = new WP_REST_Request( 'GET', self::REST_BASE );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
	}

	/**
	 * Test that GET with a valid ID returns the guidelines post.
	 *
	 * @covers ::get_item
	 */
	public function test_get_item() {
		wp_set_current_user( self::$admin_id );
		$create_response = $this->create_guidelines();
		$post_id         = $create_response->get_data()['id'];

		$request  = new WP_REST_Request( 'GET', self::REST_BASE . '/' . $post_id );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( $post_id, $response->get_data()['id'] );
	}

	/**
	 * Test that GET with an invalid ID returns 404.
	 *
	 * @covers ::get_item
	 */
	public function test_get_item_invalid_id() {
		wp_set_current_user( self::$admin_id );

		$request  = new WP_REST_Request( 'GET', self::REST_BASE . '/99999' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_post_invalid_id', $response, 404 );
	}

	/**
	 * Test that an admin can update guidelines and change status.
	 *
	 * @covers ::update_item
	 */
	public function test_update_item() {
		wp_set_current_user( self::$admin_id );
		$create_response = $this->create_guidelines();
		$post_id         = $create_response->get_data()['id'];

		$request = new WP_REST_Request( 'PATCH', self::REST_BASE . '/' . $post_id );
		$request->set_param(
			'guideline_categories',
			array(
				'copy' => array( 'guidelines' => 'Updated copy.' ),
			)
		);
		$request->set_param( 'status', 'publish' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertSame( 'publish', $data['status'] );
		$this->assertSame( 'Updated copy.', $data['guideline_categories']['copy']['guidelines'] );
	}

	/**
	 * Test that editors cannot update guidelines.
	 *
	 * @covers ::update_item_permissions_check
	 */
	public function test_update_item_no_permission_editor() {
		wp_set_current_user( self::$admin_id );
		$create_response = $this->create_guidelines();
		$post_id         = $create_response->get_data()['id'];

		wp_set_current_user( self::$editor_id );

		$request = new WP_REST_Request( 'PATCH', self::REST_BASE . '/' . $post_id );
		$request->set_param( 'status', 'publish' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_cannot_edit', $response, 403 );
	}

	/**
	 * Test that an admin can force-delete a guidelines post.
	 *
	 * @covers ::delete_item
	 */
	public function test_delete_item() {
		wp_set_current_user( self::$admin_id );
		$create_response = $this->create_guidelines();
		$post_id         = $create_response->get_data()['id'];

		$request = new WP_REST_Request( 'DELETE', self::REST_BASE . '/' . $post_id );
		$request->set_param( 'force', true );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );

		// Confirm it's gone.
		$request  = new WP_REST_Request( 'GET', self::REST_BASE );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 0, $response->get_data()['id'] );
	}

	/**
	 * Test that editors cannot delete guidelines.
	 *
	 * @covers ::delete_item_permissions_check
	 */
	public function test_delete_item_no_permission_editor() {
		wp_set_current_user( self::$admin_id );
		$create_response = $this->create_guidelines();
		$post_id         = $create_response->get_data()['id'];

		wp_set_current_user( self::$editor_id );

		$request = new WP_REST_Request( 'DELETE', self::REST_BASE . '/' . $post_id );
		$request->set_param( 'force', true );
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_cannot_delete', $response, 403 );
	}

	/**
	 * Test that response includes self, about, and version-history links.
	 *
	 * @covers ::prepare_item_for_response
	 */
	public function test_response_includes_links() {
		wp_set_current_user( self::$admin_id );
		$create_response = $this->create_guidelines();
		$post_id         = $create_response->get_data()['id'];

		$request  = new WP_REST_Request( 'GET', self::REST_BASE . '/' . $post_id );
		$response = rest_get_server()->dispatch( $request );
		$links    = $response->get_links();

		$this->assertArrayHasKey( 'self', $links, 'Response missing self link.' );
		$this->assertArrayHasKey( 'about', $links, 'Response missing about link.' );
		$this->assertArrayHasKey( 'version-history', $links, 'Response missing version-history link.' );
	}

	/**
	 * Test that _fields parameter filters response to requested fields only.
	 *
	 * @covers ::prepare_item_for_response
	 */
	public function test_fields_parameter_filtering() {
		wp_set_current_user( self::$admin_id );
		$create_response = $this->create_guidelines();
		$post_id         = $create_response->get_data()['id'];

		$request = new WP_REST_Request( 'GET', self::REST_BASE . '/' . $post_id );
		$request->set_param( '_fields', 'id,status' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertArrayHasKey( 'id', $data );
		$this->assertArrayHasKey( 'status', $data );
		$this->assertArrayNotHasKey( 'guideline_categories', $data, '_fields should exclude unrequested fields.' );
	}

	/**
	 * Test that valid block names (namespace/block-name) are accepted.
	 *
	 * @covers ::prepare_item_for_database
	 */
	public function test_block_name_validation_valid() {
		wp_set_current_user( self::$admin_id );
		$response = $this->create_guidelines(
			array(
				'guideline_categories' => array(
					'blocks' => array(
						'core/paragraph'     => array( 'guidelines' => 'Valid.' ),
						'my-plugin/my-block' => array( 'guidelines' => 'Also valid.' ),
						'0-test/1-block'     => array( 'guidelines' => 'Starts with digit.' ),
					),
				),
			)
		);

		$data   = $response->get_data();
		$blocks = $data['guideline_categories']['blocks'];
		$this->assertArrayHasKey( 'core/paragraph', $blocks );
		$this->assertArrayHasKey( 'my-plugin/my-block', $blocks );
		$this->assertArrayHasKey( '0-test/1-block', $blocks );
	}

	/**
	 * Test that invalid block names are stripped from the response.
	 *
	 * @covers ::prepare_item_for_database
	 */
	public function test_block_name_validation_invalid() {
		wp_set_current_user( self::$admin_id );
		$response = $this->create_guidelines(
			array(
				'guideline_categories' => array(
					'blocks' => array(
						'no-namespace'     => array( 'guidelines' => 'Bad.' ),
						'UPPER/case'       => array( 'guidelines' => 'Bad.' ),
						'has spaces/block' => array( 'guidelines' => 'Bad.' ),
						'core/paragraph'   => array( 'guidelines' => 'Good.' ),
					),
				),
			)
		);

		$data   = $response->get_data();
		$blocks = $data['guideline_categories']['blocks'];
		$this->assertArrayHasKey( 'core/paragraph', $blocks );
		$this->assertArrayNotHasKey( 'no-namespace', $blocks );
		$this->assertArrayNotHasKey( 'UPPER/case', $blocks );
		$this->assertArrayNotHasKey( 'has spaces/block', $blocks );
	}

	/**
	 * Tests that updating guidelines creates revisions.
	 *
	 * @covers ::update_item
	 */
	public function test_revisions_created_on_update() {
		wp_set_current_user( self::$admin_id );
		$create_response = $this->create_guidelines();
		$post_id         = $create_response->get_data()['id'];

		$request = new WP_REST_Request( 'PATCH', self::REST_BASE . '/' . $post_id );
		$request->set_param(
			'guideline_categories',
			array( 'copy' => array( 'guidelines' => 'Revised copy.' ) )
		);
		rest_get_server()->dispatch( $request );

		$request  = new WP_REST_Request( 'GET', self::REST_BASE . '/' . $post_id . '/revisions' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertNotEmpty( $response->get_data() );
	}

	/**
	 * Tests that revision responses include guideline_categories.
	 *
	 * @covers ::prepare_item_for_response
	 */
	public function test_revision_includes_guideline_categories() {
		wp_set_current_user( self::$admin_id );
		$create_response = $this->create_guidelines(
			array(
				'guideline_categories' => array(
					'copy' => array( 'guidelines' => 'Original.' ),
				),
			)
		);
		$post_id         = $create_response->get_data()['id'];

		$request = new WP_REST_Request( 'PATCH', self::REST_BASE . '/' . $post_id );
		$request->set_param(
			'guideline_categories',
			array( 'copy' => array( 'guidelines' => 'Updated.' ) )
		);
		rest_get_server()->dispatch( $request );

		$request   = new WP_REST_Request( 'GET', self::REST_BASE . '/' . $post_id . '/revisions' );
		$response  = rest_get_server()->dispatch( $request );
		$revisions = $response->get_data();

		$this->assertArrayHasKey( 'guideline_categories', $revisions[0] );
	}

	/**
	 * Tests that restoring a revision works and returns parent post response.
	 *
	 * @covers Gutenberg_Content_Guidelines_Revisions_Controller::restore_revision
	 */
	public function test_restore_revision() {
		wp_set_current_user( self::$admin_id );
		$create_response = $this->create_guidelines(
			array(
				'guideline_categories' => array(
					'copy' => array( 'guidelines' => 'Version 1.' ),
				),
			)
		);
		$post_id         = $create_response->get_data()['id'];

		$request = new WP_REST_Request( 'PATCH', self::REST_BASE . '/' . $post_id );
		$request->set_param(
			'guideline_categories',
			array( 'copy' => array( 'guidelines' => 'Version 2.' ) )
		);
		rest_get_server()->dispatch( $request );

		$request   = new WP_REST_Request( 'GET', self::REST_BASE . '/' . $post_id . '/revisions' );
		$response  = rest_get_server()->dispatch( $request );
		$revisions = $response->get_data();

		$this->assertNotEmpty( $revisions );

		// Restore the oldest revision.
		$oldest_revision = end( $revisions );
		$request         = new WP_REST_Request(
			'POST',
			self::REST_BASE . '/' . $post_id . '/revisions/' . $oldest_revision['id'] . '/restore'
		);
		$response        = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertSame( $post_id, $data['id'] );
		$this->assertArrayHasKey( 'guideline_categories', $data );
	}

	/**
	 * Tests that restore response includes _links (via prepare_item_for_response).
	 *
	 * @covers Gutenberg_Content_Guidelines_Revisions_Controller::restore_revision
	 */
	public function test_restore_revision_response_includes_links() {
		wp_set_current_user( self::$admin_id );
		$create_response = $this->create_guidelines();
		$post_id         = $create_response->get_data()['id'];

		$request = new WP_REST_Request( 'PATCH', self::REST_BASE . '/' . $post_id );
		$request->set_param(
			'guideline_categories',
			array( 'copy' => array( 'guidelines' => 'Updated.' ) )
		);
		rest_get_server()->dispatch( $request );

		$request   = new WP_REST_Request( 'GET', self::REST_BASE . '/' . $post_id . '/revisions' );
		$revisions = rest_get_server()->dispatch( $request )->get_data();

		$request  = new WP_REST_Request(
			'POST',
			self::REST_BASE . '/' . $post_id . '/revisions/' . $revisions[0]['id'] . '/restore'
		);
		$response = rest_get_server()->dispatch( $request );
		$links    = $response->get_links();

		$this->assertArrayHasKey( 'self', $links );
		$this->assertArrayHasKey( 'version-history', $links );
	}

	/**
	 * Tests that restoring requires admin permissions.
	 *
	 * @covers Gutenberg_Content_Guidelines_Revisions_Controller::restore_revision_permissions_check
	 */
	public function test_restore_revision_no_permission() {
		wp_set_current_user( self::$admin_id );
		$create_response = $this->create_guidelines();
		$post_id         = $create_response->get_data()['id'];

		$request = new WP_REST_Request( 'PATCH', self::REST_BASE . '/' . $post_id );
		$request->set_param(
			'guideline_categories',
			array( 'copy' => array( 'guidelines' => 'Updated.' ) )
		);
		rest_get_server()->dispatch( $request );

		$request   = new WP_REST_Request( 'GET', self::REST_BASE . '/' . $post_id . '/revisions' );
		$response  = rest_get_server()->dispatch( $request );
		$revisions = $response->get_data();

		wp_set_current_user( self::$editor_id );

		$request  = new WP_REST_Request(
			'POST',
			self::REST_BASE . '/' . $post_id . '/revisions/' . $revisions[0]['id'] . '/restore'
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_cannot_restore', $response, 403 );
	}

	/**
	 * Test that the schema contains expected properties and status enum.
	 *
	 * @covers ::get_item_schema
	 */
	public function test_get_item_schema() {
		$request  = new WP_REST_Request( 'OPTIONS', self::REST_BASE );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$schema   = $data['schema'];

		$this->assertSame( 'content-guidelines', $schema['title'] );
		$this->assertArrayHasKey( 'id', $schema['properties'] );
		$this->assertArrayHasKey( 'status', $schema['properties'] );
		$this->assertArrayHasKey( 'guideline_categories', $schema['properties'] );
		$this->assertContains( 'draft', $schema['properties']['status']['enum'] );
		$this->assertContains( 'publish', $schema['properties']['status']['enum'] );
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_context_param() {
		// Singleton endpoint does not use context param.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_prepare_item() {
		// Covered by create and update tests.
	}
}
