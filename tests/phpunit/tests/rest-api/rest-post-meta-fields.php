<?php
/**
 * Unit tests covering WP_REST_Posts meta functionality.
 *
 * @package WordPress
 * @subpackage REST API
 */

 /**
  * @group restapi
  */
class WP_Test_REST_Post_Meta_Fields extends WP_Test_REST_TestCase {
	public function setUp() {
		parent::setUp();

		register_meta( 'post', 'test_single', array(
			'show_in_rest' => true,
			'single' => true,
		));
		register_meta( 'post', 'test_multi', array(
			'show_in_rest' => true,
			'single' => false,
		));
		register_meta( 'post', 'test_bad_auth', array(
			'show_in_rest' => true,
			'single' => true,
			'auth_callback' => '__return_false',
		));
		register_meta( 'post', 'test_bad_auth_multi', array(
			'show_in_rest' => true,
			'single' => false,
			'auth_callback' => '__return_false',
		));
		register_meta( 'post', 'test_no_rest', array() );
		register_meta( 'post', 'test_rest_disabled', array(
			'show_in_rest' => false,
		));
		register_meta( 'post', 'test_custom_schema', array(
			'single' => true,
			'type' => 'integer',
			'show_in_rest' => array(
				'schema' => array(
					'type' => 'number',
				),
			),
		));
		register_meta( 'post', 'test_invalid_type', array(
			'single' => true,
			'type' => false,
			'show_in_rest' => true,
		));

		/** @var WP_REST_Server $wp_rest_server */
		global $wp_rest_server;
		$this->server = $wp_rest_server = new Spy_REST_Server;
		do_action( 'rest_api_init' );

		$this->post_id = $this->factory->post->create();
	}

	protected function grant_write_permission() {
		// Ensure we have write permission.
		$user = $this->factory->user->create( array(
			'role' => 'editor',
		));
		wp_set_current_user( $user );
	}

	public function test_get_value() {
		add_post_meta( $this->post_id, 'test_single', 'testvalue' );

		$request = new WP_REST_Request( 'GET', sprintf( '/wp/v2/posts/%d', $this->post_id ) );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertArrayHasKey( 'meta', $data );

		$meta = (array) $data['meta'];
		$this->assertArrayHasKey( 'test_single', $meta );
		$this->assertEquals( 'testvalue', $meta['test_single'] );
	}

	/**
	 * @depends test_get_value
	 */
	public function test_get_multi_value() {
		add_post_meta( $this->post_id, 'test_multi', 'value1' );
		$request = new WP_REST_Request( 'GET', sprintf( '/wp/v2/posts/%d', $this->post_id ) );

		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );

		$data = $response->get_data();
		$meta = (array) $data['meta'];
		$this->assertArrayHasKey( 'test_multi', $meta );
		$this->assertInternalType( 'array', $meta['test_multi'] );
		$this->assertContains( 'value1', $meta['test_multi'] );

		// Check after an update.
		add_post_meta( $this->post_id, 'test_multi', 'value2' );

		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$meta = (array) $data['meta'];
		$this->assertContains( 'value1', $meta['test_multi'] );
		$this->assertContains( 'value2', $meta['test_multi'] );
	}

	/**
	 * @depends test_get_value
	 */
	public function test_get_unregistered() {
		add_post_meta( $this->post_id, 'test_unregistered', 'value1' );
		$request = new WP_REST_Request( 'GET', sprintf( '/wp/v2/posts/%d', $this->post_id ) );

		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );

		$data = $response->get_data();
		$meta = (array) $data['meta'];
		$this->assertArrayNotHasKey( 'test_unregistered', $meta );
	}

	/**
	 * @depends test_get_value
	 */
	public function test_get_registered_no_api_access() {
		add_post_meta( $this->post_id, 'test_no_rest', 'for_the_wicked' );
		$request = new WP_REST_Request( 'GET', sprintf( '/wp/v2/posts/%d', $this->post_id ) );

		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );

		$data = $response->get_data();
		$meta = (array) $data['meta'];
		$this->assertArrayNotHasKey( 'test_no_rest', $meta );
	}

	/**
	 * @depends test_get_value
	 */
	public function test_get_registered_api_disabled() {
		add_post_meta( $this->post_id, 'test_rest_disabled', 'sleepless_nights' );
		$request = new WP_REST_Request( 'GET', sprintf( '/wp/v2/posts/%d', $this->post_id ) );

		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );

		$data = $response->get_data();
		$meta = (array) $data['meta'];
		$this->assertArrayNotHasKey( 'test_rest_disabled', $meta );
	}

	public function test_get_value_types() {
		register_meta( 'post', 'test_string', array(
			'show_in_rest' => true,
			'single' => true,
			'type' => 'string',
		));
		register_meta( 'post', 'test_number', array(
			'show_in_rest' => true,
			'single' => true,
			'type' => 'number',
		));
		register_meta( 'post', 'test_bool', array(
			'show_in_rest' => true,
			'single' => true,
			'type' => 'boolean',
		));

		/** @var WP_REST_Server $wp_rest_server */
		global $wp_rest_server;
		$this->server = $wp_rest_server = new Spy_REST_Server;
		do_action( 'rest_api_init' );

		add_post_meta( $this->post_id, 'test_string', 42 );
		add_post_meta( $this->post_id, 'test_number', '42' );
		add_post_meta( $this->post_id, 'test_bool', 1 );

		$request = new WP_REST_Request( 'GET', sprintf( '/wp/v2/posts/%d', $this->post_id ) );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );

		$data = $response->get_data();
		$meta = (array) $data['meta'];

		$this->assertArrayHasKey( 'test_string', $meta );
		$this->assertInternalType( 'string', $meta['test_string'] );
		$this->assertSame( '42', $meta['test_string'] );

		$this->assertArrayHasKey( 'test_number', $meta );
		$this->assertInternalType( 'float', $meta['test_number'] );
		$this->assertSame( 42.0, $meta['test_number'] );

		$this->assertArrayHasKey( 'test_bool', $meta );
		$this->assertInternalType( 'boolean', $meta['test_bool'] );
		$this->assertSame( true, $meta['test_bool'] );
	}

	/**
	 * @depends test_get_value
	 */
	public function test_set_value() {
		// Ensure no data exists currently.
		$values = get_post_meta( $this->post_id, 'test_single', false );
		$this->assertEmpty( $values );

		$this->grant_write_permission();

		$data = array(
			'meta' => array(
				'test_single' => 'test_value',
			),
		);
		$request = new WP_REST_Request( 'POST', sprintf( '/wp/v2/posts/%d', $this->post_id ) );
		$request->set_body_params( $data );

		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );

		$meta = get_post_meta( $this->post_id, 'test_single', false );
		$this->assertNotEmpty( $meta );
		$this->assertCount( 1, $meta );
		$this->assertEquals( 'test_value', $meta[0] );

		$data = $response->get_data();
		$meta = (array) $data['meta'];
		$this->assertArrayHasKey( 'test_single', $meta );
		$this->assertEquals( 'test_value', $meta['test_single'] );
	}

	/**
	 * @depends test_get_value
	 */
	public function test_set_duplicate_single_value() {
		// Start with an existing metakey and value.
		$values = update_post_meta( $this->post_id, 'test_single', 'test_value' );
		$this->assertEquals( 'test_value', get_post_meta( $this->post_id, 'test_single', true ) );

		$this->grant_write_permission();

		$data = array(
			'meta' => array(
				'test_single' => 'test_value',
			),
		);
		$request = new WP_REST_Request( 'POST', sprintf( '/wp/v2/posts/%d', $this->post_id ) );
		$request->set_body_params( $data );

		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );

		$meta = get_post_meta( $this->post_id, 'test_single', true );
		$this->assertNotEmpty( $meta );
		$this->assertEquals( 'test_value', $meta );

		$data = $response->get_data();
		$meta = (array) $data['meta'];
		$this->assertArrayHasKey( 'test_single', $meta );
		$this->assertEquals( 'test_value', $meta['test_single'] );
	}

	/**
	 * @depends test_set_value
	 */
	public function test_set_value_unauthenticated() {
		$data = array(
			'meta' => array(
				'test_single' => 'test_value',
			),
		);

		wp_set_current_user( 0 );

		$request = new WP_REST_Request( 'POST', sprintf( '/wp/v2/posts/%d', $this->post_id ) );
		$request->set_body_params( $data );

		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_edit', $response, 401 );

		// Check that the value wasn't actually updated.
		$this->assertEmpty( get_post_meta( $this->post_id, 'test_single', false ) );
	}

	/**
	 * @depends test_set_value
	 */
	public function test_set_value_blocked() {
		$data = array(
			'meta' => array(
				'test_bad_auth' => 'test_value',
			),
		);

		$this->grant_write_permission();

		$request = new WP_REST_Request( 'POST', sprintf( '/wp/v2/posts/%d', $this->post_id ) );
		$request->set_body_params( $data );

		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_update', $response, 403 );
		$this->assertEmpty( get_post_meta( $this->post_id, 'test_bad_auth', false ) );
	}

	/**
	 * @depends test_set_value
	 */
	public function test_set_value_db_error() {
		$data = array(
			'meta' => array(
				'test_single' => 'test_value',
			),
		);

		$this->grant_write_permission();

		$request = new WP_REST_Request( 'POST', sprintf( '/wp/v2/posts/%d', $this->post_id ) );
		$request->set_body_params( $data );

		/**
		 * Disable showing error as the below is going to intentionally
		 * trigger a DB error.
		 */
		global $wpdb;
		$wpdb->suppress_errors = true;
		add_filter( 'query', array( $this, 'error_insert_query' ) );

		$response = $this->server->dispatch( $request );
		remove_filter( 'query', array( $this, 'error_insert_query' ) );
		$wpdb->show_errors = true;
	}

	public function test_set_value_multiple() {
		// Ensure no data exists currently.
		$values = get_post_meta( $this->post_id, 'test_multi', false );
		$this->assertEmpty( $values );

		$this->grant_write_permission();

		$data = array(
			'meta' => array(
				'test_multi' => array( 'val1' ),
			),
		);
		$request = new WP_REST_Request( 'POST', sprintf( '/wp/v2/posts/%d', $this->post_id ) );
		$request->set_body_params( $data );

		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );

		$meta = get_post_meta( $this->post_id, 'test_multi', false );
		$this->assertNotEmpty( $meta );
		$this->assertCount( 1, $meta );
		$this->assertEquals( 'val1', $meta[0] );

		// Add another value.
		$data = array(
			'meta' => array(
				'test_multi' => array( 'val1', 'val2' ),
			),
		);
		$request->set_body_params( $data );

		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );

		$meta = get_post_meta( $this->post_id, 'test_multi', false );
		$this->assertNotEmpty( $meta );
		$this->assertCount( 2, $meta );
		$this->assertContains( 'val1', $meta );
		$this->assertContains( 'val2', $meta );
	}

	/**
	 * Test removing only one item with duplicate items.
	 */
	public function test_set_value_remove_one() {
		add_post_meta( $this->post_id, 'test_multi', 'c' );
		add_post_meta( $this->post_id, 'test_multi', 'n' );
		add_post_meta( $this->post_id, 'test_multi', 'n' );

		$this->grant_write_permission();

		$data = array(
			'meta' => array(
				'test_multi' => array( 'c', 'n' ),
			),
		);
		$request = new WP_REST_Request( 'POST', sprintf( '/wp/v2/posts/%d', $this->post_id ) );
		$request->set_body_params( $data );

		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );

		$meta = get_post_meta( $this->post_id, 'test_multi', false );
		$this->assertNotEmpty( $meta );
		$this->assertCount( 2, $meta );
		$this->assertContains( 'c', $meta );
		$this->assertContains( 'n', $meta );
	}

	/**
	 * @depends test_set_value_multiple
	 */
	public function test_set_value_multiple_unauthenticated() {
		// Ensure no data exists currently.
		$values = get_post_meta( $this->post_id, 'test_multi', false );
		$this->assertEmpty( $values );

		wp_set_current_user( 0 );

		$data = array(
			'meta' => array(
				'test_multi' => array( 'val1' ),
			),
		);
		$request = new WP_REST_Request( 'POST', sprintf( '/wp/v2/posts/%d', $this->post_id ) );
		$request->set_body_params( $data );

		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_edit', $response, 401 );

		$meta = get_post_meta( $this->post_id, 'test_multi', false );
		$this->assertEmpty( $meta );
	}

	/**
	 * @depends test_set_value_multiple
	 */
	public function test_set_value_multiple_blocked() {
		$data = array(
			'meta' => array(
				'test_bad_auth_multi' => array( 'test_value' ),
			),
		);

		$this->grant_write_permission();

		$request = new WP_REST_Request( 'POST', sprintf( '/wp/v2/posts/%d', $this->post_id ) );
		$request->set_body_params( $data );

		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_update', $response, 403 );
		$this->assertEmpty( get_post_meta( $this->post_id, 'test_bad_auth_multi', false ) );
	}

	public function test_add_multi_value_db_error() {
		// Ensure no data exists currently.
		$values = get_post_meta( $this->post_id, 'test_multi', false );
		$this->assertEmpty( $values );

		$this->grant_write_permission();

		$data = array(
			'meta' => array(
				'test_multi' => array( 'val1' ),
			),
		);
		$request = new WP_REST_Request( 'POST', sprintf( '/wp/v2/posts/%d', $this->post_id ) );
		$request->set_body_params( $data );

		/**
		 * Disable showing error as the below is going to intentionally
		 * trigger a DB error.
		 */
		global $wpdb;
		$wpdb->suppress_errors = true;
		add_filter( 'query', array( $this, 'error_insert_query' ) );

		$response = $this->server->dispatch( $request );
		remove_filter( 'query', array( $this, 'error_insert_query' ) );
		$wpdb->show_errors = true;

		$this->assertErrorResponse( 'rest_meta_database_error', $response, 500 );
	}

	public function test_remove_multi_value_db_error() {
		add_post_meta( $this->post_id, 'test_multi', 'val1' );
		$values = get_post_meta( $this->post_id, 'test_multi', false );
		$this->assertEquals( array( 'val1' ), $values );

		$this->grant_write_permission();

		$data = array(
			'meta' => array(
				'test_multi' => array(),
			),
		);
		$request = new WP_REST_Request( 'POST', sprintf( '/wp/v2/posts/%d', $this->post_id ) );
		$request->set_body_params( $data );

		/**
		 * Disable showing error as the below is going to intentionally
		 * trigger a DB error.
		 */
		global $wpdb;
		$wpdb->suppress_errors = true;
		add_filter( 'query', array( $this, 'error_delete_query' ) );

		$response = $this->server->dispatch( $request );
		remove_filter( 'query', array( $this, 'error_delete_query' ) );
		$wpdb->show_errors = true;

		$this->assertErrorResponse( 'rest_meta_database_error', $response, 500 );
	}

	public function test_delete_value() {
		add_post_meta( $this->post_id, 'test_single', 'val1' );
		$current = get_post_meta( $this->post_id, 'test_single', true );
		$this->assertEquals( 'val1', $current );

		$this->grant_write_permission();

		$data = array(
			'meta' => array(
				'test_single' => null,
			),
		);
		$request = new WP_REST_Request( 'POST', sprintf( '/wp/v2/posts/%d', $this->post_id ) );
		$request->set_body_params( $data );

		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );

		$meta = get_post_meta( $this->post_id, 'test_single', false );
		$this->assertEmpty( $meta );
	}

	/**
	 * @depends test_delete_value
	 */
	public function test_delete_value_blocked() {
		add_post_meta( $this->post_id, 'test_bad_auth', 'val1' );
		$current = get_post_meta( $this->post_id, 'test_bad_auth', true );
		$this->assertEquals( 'val1', $current );

		$this->grant_write_permission();

		$data = array(
			'meta' => array(
				'test_bad_auth' => null,
			),
		);
		$request = new WP_REST_Request( 'POST', sprintf( '/wp/v2/posts/%d', $this->post_id ) );
		$request->set_body_params( $data );

		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_delete', $response, 403 );

		$meta = get_post_meta( $this->post_id, 'test_bad_auth', true );
		$this->assertEquals( 'val1', $meta );
	}

	/**
	 * @depends test_delete_value
	 */
	public function test_delete_value_db_error() {
		add_post_meta( $this->post_id, 'test_single', 'val1' );
		$current = get_post_meta( $this->post_id, 'test_single', true );
		$this->assertEquals( 'val1', $current );

		$this->grant_write_permission();

		$data = array(
			'meta' => array(
				'test_single' => null,
			),
		);
		$request = new WP_REST_Request( 'POST', sprintf( '/wp/v2/posts/%d', $this->post_id ) );
		$request->set_body_params( $data );
		/**
		 * Disable showing error as the below is going to intentionally
		 * trigger a DB error.
		 */
		global $wpdb;
		$wpdb->suppress_errors = true;
		add_filter( 'query', array( $this, 'error_delete_query' ) );

		$response = $this->server->dispatch( $request );
		remove_filter( 'query', array( $this, 'error_delete_query' ) );
		$wpdb->show_errors = true;

		$this->assertErrorResponse( 'rest_meta_database_error', $response, 500 );
	}

	public function test_get_schema() {
		$request = new WP_REST_Request( 'OPTIONS', sprintf( '/wp/v2/posts/%d', $this->post_id ) );
		$response = $this->server->dispatch( $request );

		$data = $response->get_data();
		$schema = $data['schema'];

		$this->assertArrayHasKey( 'meta', $schema['properties'] );
		$meta_schema = $schema['properties']['meta']['properties'];

		$this->assertArrayHasKey( 'test_single', $meta_schema );
		$this->assertEquals( 'string', $meta_schema['test_single']['type'] );

		$this->assertArrayHasKey( 'test_multi', $meta_schema );
		$this->assertEquals( 'array', $meta_schema['test_multi']['type'] );
		$this->assertArrayHasKey( 'items', $meta_schema['test_multi'] );
		$this->assertEquals( 'string', $meta_schema['test_multi']['items']['type'] );

		$this->assertArrayHasKey( 'test_custom_schema', $meta_schema );
		$this->assertEquals( 'number', $meta_schema['test_custom_schema']['type'] );

		$this->assertArrayNotHasKey( 'test_no_rest', $meta_schema );
		$this->assertArrayNotHasKey( 'test_rest_disabled', $meta_schema );
		$this->assertArrayNotHasKey( 'test_invalid_type', $meta_schema );
	}

	/**
	 * Internal function used to disable an insert query which
	 * will trigger a wpdb error for testing purposes.
	 */
	public function error_insert_query( $query ) {
		if ( strpos( $query, 'INSERT' ) === 0 ) {
			$query = '],';
		}
		return $query;
	}

	/**
	 * Internal function used to disable an insert query which
	 * will trigger a wpdb error for testing purposes.
	 */
	public function error_delete_query( $query ) {
		if ( strpos( $query, 'DELETE' ) === 0 ) {
			$query = '],';
		}
		return $query;
	}
}
