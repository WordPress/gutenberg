<?php
/**
 * Unit tests covering WP_REST_Revisions_Controller functionality.
 *
 * @package WordPress
 * @subpackage REST API
 */

 /**
  * @group restapi
  */
class WP_Test_REST_Revisions_Controller extends WP_Test_REST_Controller_Testcase {
	protected static $post_id;
	protected static $page_id;

	protected static $editor_id;
	protected static $contributor_id;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$post_id = $factory->post->create();
		self::$page_id = $factory->post->create( array( 'post_type' => 'page' ) );

		self::$editor_id = $factory->user->create( array(
			'role' => 'editor',
		) );
		self::$contributor_id = $factory->user->create( array(
			'role' => 'contributor',
		) );

		wp_update_post( array( 'post_content' => 'This content is better.', 'ID' => self::$post_id ) );
		wp_update_post( array( 'post_content' => 'This content is marvelous.', 'ID' => self::$post_id ) );
	}

	public static function wpTearDownAfterClass() {
		// Also deletes revisions.
		wp_delete_post( self::$post_id, true );
		wp_delete_post( self::$page_id, true );

		self::delete_user( self::$editor_id );
		self::delete_user( self::$contributor_id );
	}

	public function setUp() {
		parent::setUp();

		$revisions = wp_get_post_revisions( self::$post_id );
		$this->revision_1 = array_pop( $revisions );
		$this->revision_id1 = $this->revision_1->ID;
		$this->revision_2 = array_pop( $revisions );
		$this->revision_id2 = $this->revision_2->ID;
	}

	public function test_register_routes() {
		$routes = $this->server->get_routes();
		$this->assertArrayHasKey( '/wp/v2/posts/(?P<parent>[\d]+)/revisions', $routes );
		$this->assertArrayHasKey( '/wp/v2/posts/(?P<parent>[\d]+)/revisions/(?P<id>[\d]+)', $routes );
		$this->assertArrayHasKey( '/wp/v2/pages/(?P<parent>[\d]+)/revisions', $routes );
		$this->assertArrayHasKey( '/wp/v2/pages/(?P<parent>[\d]+)/revisions/(?P<id>[\d]+)', $routes );
	}

	public function test_context_param() {
		// Collection
		$request = new WP_REST_Request( 'OPTIONS', '/wp/v2/posts/' . self::$post_id . '/revisions' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( 'view', $data['endpoints'][0]['args']['context']['default'] );
		$this->assertEqualSets( array( 'view', 'edit', 'embed' ), $data['endpoints'][0]['args']['context']['enum'] );
		// Single
		$request = new WP_REST_Request( 'OPTIONS', '/wp/v2/posts/' . self::$post_id . '/revisions/' . $this->revision_1->ID );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( 'view', $data['endpoints'][0]['args']['context']['default'] );
		$this->assertEqualSets( array( 'view', 'edit', 'embed' ), $data['endpoints'][0]['args']['context']['enum'] );
	}

	public function test_get_items() {
		wp_set_current_user( self::$editor_id );
		$request = new WP_REST_Request( 'GET', '/wp/v2/posts/' . self::$post_id . '/revisions' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( 200, $response->get_status() );
		$this->assertCount( 2, $data );

		// Reverse chron
		$this->assertEquals( $this->revision_id2, $data[0]['id'] );
		$this->check_get_revision_response( $data[0], $this->revision_2 );

		$this->assertEquals( $this->revision_id1, $data[1]['id'] );
		$this->check_get_revision_response( $data[1], $this->revision_1 );
	}

	public function test_get_items_no_permission() {
		wp_set_current_user( 0 );
		$request = new WP_REST_Request( 'GET', '/wp/v2/posts/' . self::$post_id . '/revisions' );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_cannot_read', $response, 401 );
		wp_set_current_user( self::$contributor_id );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_read', $response, 403 );
	}

	public function test_get_items_missing_parent() {
		wp_set_current_user( self::$editor_id );
		$request = new WP_REST_Request( 'GET', '/wp/v2/posts/' . REST_TESTS_IMPOSSIBLY_HIGH_NUMBER . '/revisions' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_post_invalid_parent', $response, 404 );
	}

	public function test_get_items_invalid_parent_post_type() {
		wp_set_current_user( self::$editor_id );
		$request = new WP_REST_Request( 'GET', '/wp/v2/posts/' . self::$page_id . '/revisions' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_post_invalid_parent', $response, 404 );
	}

	public function test_get_item() {
		wp_set_current_user( self::$editor_id );
		$request = new WP_REST_Request( 'GET', '/wp/v2/posts/' . self::$post_id . '/revisions/' . $this->revision_id1 );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$this->check_get_revision_response( $response, $this->revision_1 );
		$fields = array(
			'author',
			'date',
			'date_gmt',
			'modified',
			'modified_gmt',
			'guid',
			'id',
			'parent',
			'slug',
			'title',
			'excerpt',
			'content',
		);
		$data = $response->get_data();
		$this->assertEqualSets( $fields, array_keys( $data ) );
	}

	public function test_get_item_embed_context() {
		wp_set_current_user( self::$editor_id );
		$request = new WP_REST_Request( 'GET', '/wp/v2/posts/' . self::$post_id . '/revisions/' . $this->revision_id1 );
		$request->set_param( 'context', 'embed' );
		$response = $this->server->dispatch( $request );
		$fields = array(
			'author',
			'date',
			'id',
			'parent',
			'slug',
			'title',
			'excerpt',
		);
		$data = $response->get_data();
		$this->assertEqualSets( $fields, array_keys( $data ) );
	}

	public function test_get_item_no_permission() {
		wp_set_current_user( 0 );
		$request = new WP_REST_Request( 'GET', '/wp/v2/posts/' . self::$post_id . '/revisions/' . $this->revision_id1 );

		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_read', $response, 401 );
		wp_set_current_user( self::$contributor_id );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_read', $response, 403 );
	}

	public function test_get_item_missing_parent() {
		wp_set_current_user( self::$editor_id );
		$request = new WP_REST_Request( 'GET', '/wp/v2/posts/' . REST_TESTS_IMPOSSIBLY_HIGH_NUMBER . '/revisions/' . $this->revision_id1 );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_post_invalid_parent', $response, 404 );
	}

	public function test_get_item_invalid_parent_post_type() {
		wp_set_current_user( self::$editor_id );
		$request = new WP_REST_Request( 'GET', '/wp/v2/posts/' . self::$page_id . '/revisions/' . $this->revision_id1 );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_post_invalid_parent', $response, 404 );
	}

	public function test_delete_item() {
		wp_set_current_user( self::$editor_id );
		$request = new WP_REST_Request( 'DELETE', '/wp/v2/posts/' . self::$post_id . '/revisions/' . $this->revision_id1 );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$this->assertNull( get_post( $this->revision_id1 ) );
	}

	public function test_delete_item_no_permission() {
		wp_set_current_user( self::$contributor_id );
		$request = new WP_REST_Request( 'DELETE', '/wp/v2/posts/' . self::$post_id . '/revisions/' . $this->revision_id1 );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_read', $response, 403 );
	}

	public function test_prepare_item() {
		wp_set_current_user( self::$editor_id );
		$request = new WP_REST_Request( 'GET', '/wp/v2/posts/' . self::$post_id . '/revisions/' . $this->revision_id1 );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$this->check_get_revision_response( $response, $this->revision_1 );
	}

	public function test_get_item_schema() {
		$request = new WP_REST_Request( 'OPTIONS', '/wp/v2/posts/' . self::$post_id . '/revisions' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$properties = $data['schema']['properties'];
		$this->assertEquals( 12, count( $properties ) );
		$this->assertArrayHasKey( 'author', $properties );
		$this->assertArrayHasKey( 'content', $properties );
		$this->assertArrayHasKey( 'date', $properties );
		$this->assertArrayHasKey( 'date_gmt', $properties );
		$this->assertArrayHasKey( 'excerpt', $properties );
		$this->assertArrayHasKey( 'guid', $properties );
		$this->assertArrayHasKey( 'id', $properties );
		$this->assertArrayHasKey( 'modified', $properties );
		$this->assertArrayHasKey( 'modified_gmt', $properties );
		$this->assertArrayHasKey( 'parent', $properties );
		$this->assertArrayHasKey( 'slug', $properties );
		$this->assertArrayHasKey( 'title', $properties );
	}

	public function test_create_item() {
		$request = new WP_REST_Request( 'POST', '/wp/v2/posts/' . self::$post_id . '/revisions' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_no_route', $response, 404 );
	}

	public function test_update_item() {
		$request = new WP_REST_Request( 'POST', '/wp/v2/posts/' . self::$post_id . '/revisions/' . $this->revision_id1 );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_no_route', $response, 404 );
	}

	public function test_get_additional_field_registration() {

		$schema = array(
			'type'        => 'integer',
			'description' => 'Some integer of mine',
			'enum'        => array( 1, 2, 3, 4 ),
			'context'     => array( 'view', 'edit' ),
		);

		register_rest_field( 'post-revision', 'my_custom_int', array(
			'schema'          => $schema,
			'get_callback'    => array( $this, 'additional_field_get_callback' ),
			'update_callback' => array( $this, 'additional_field_update_callback' ),
		) );

		$request = new WP_REST_Request( 'OPTIONS', '/wp/v2/posts/' . self::$post_id . '/revisions' );

		$response = $this->server->dispatch( $request );
		$data = $response->get_data();

		$this->assertArrayHasKey( 'my_custom_int', $data['schema']['properties'] );
		$this->assertEquals( $schema, $data['schema']['properties']['my_custom_int'] );

		wp_set_current_user( 1 );

		$request = new WP_REST_Request( 'GET', '/wp/v2/posts/' . self::$post_id . '/revisions/' . $this->revision_id1 );

		$response = $this->server->dispatch( $request );
		$this->assertArrayHasKey( 'my_custom_int', $response->data );

		global $wp_rest_additional_fields;
		$wp_rest_additional_fields = array();
	}

	public function additional_field_get_callback( $object ) {
		return get_post_meta( $object['id'], 'my_custom_int', true );
	}

	public function additional_field_update_callback( $value, $post ) {
		update_post_meta( $post->ID, 'my_custom_int', $value );
	}

	protected function check_get_revision_response( $response, $revision ) {
		if ( $response instanceof WP_REST_Response ) {
			$links = $response->get_links();
			$response = $response->get_data();
		} else {
			$this->assertArrayHasKey( '_links', $response );
			$links = $response['_links'];
		}

		$this->assertEquals( $revision->post_author, $response['author'] );

		$rendered_content = apply_filters( 'the_content', $revision->post_content );
		$this->assertEquals( $rendered_content, $response['content']['rendered'] );

		$this->assertEquals( mysql_to_rfc3339( $revision->post_date ), $response['date'] );
		$this->assertEquals( mysql_to_rfc3339( $revision->post_date_gmt ), $response['date_gmt'] );

		$rendered_excerpt = apply_filters( 'the_excerpt', apply_filters( 'get_the_excerpt', $revision->post_excerpt, $revision ) );
		$this->assertEquals( $rendered_excerpt, $response['excerpt']['rendered'] );

		$rendered_guid = apply_filters( 'get_the_guid', $revision->guid );
		$this->assertEquals( $rendered_guid, $response['guid']['rendered'] );

		$this->assertEquals( $revision->ID, $response['id'] );
		$this->assertEquals( mysql_to_rfc3339( $revision->post_modified ), $response['modified'] );
		$this->assertEquals( mysql_to_rfc3339( $revision->post_modified_gmt ), $response['modified_gmt'] );
		$this->assertEquals( $revision->post_name, $response['slug'] );

		$rendered_title = get_the_title( $revision->ID );
		$this->assertEquals( $rendered_title, $response['title']['rendered'] );

		$parent = get_post( $revision->post_parent );
		$parent_controller = new WP_REST_Posts_Controller( $parent->post_type );
		$parent_object = get_post_type_object( $parent->post_type );
		$parent_base = ! empty( $parent_object->rest_base ) ? $parent_object->rest_base : $parent_object->name;
		$this->assertEquals( rest_url( '/wp/v2/' . $parent_base . '/' . $revision->post_parent ), $links['parent'][0]['href'] );
	}

}
