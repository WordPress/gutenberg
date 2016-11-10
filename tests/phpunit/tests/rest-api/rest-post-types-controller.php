<?php
/**
 * Unit tests covering WP_REST_Posts_Types_Controller functionality.
 *
 * @package WordPress
 * @subpackage REST API
 */

 /**
  * @group restapi
  */
class WP_Test_REST_Post_Types_Controller extends WP_Test_REST_Controller_Testcase {

	public function test_register_routes() {
		$routes = $this->server->get_routes();
		$this->assertArrayHasKey( '/wp/v2/types', $routes );
		$this->assertArrayHasKey( '/wp/v2/types/(?P<type>[\w-]+)', $routes );
	}

	public function test_context_param() {
		// Collection
		$request = new WP_REST_Request( 'OPTIONS', '/wp/v2/types' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( 'view', $data['endpoints'][0]['args']['context']['default'] );
		$this->assertEqualSets( array( 'view', 'edit', 'embed' ), $data['endpoints'][0]['args']['context']['enum'] );
		// Single
		$request = new WP_REST_Request( 'OPTIONS', '/wp/v2/types/post' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( 'view', $data['endpoints'][0]['args']['context']['default'] );
		$this->assertEqualSets( array( 'view', 'edit', 'embed' ), $data['endpoints'][0]['args']['context']['enum'] );
	}

	public function test_get_items() {
		$request = new WP_REST_Request( 'GET', '/wp/v2/types' );
		$response = $this->server->dispatch( $request );

		$data = $response->get_data();
		$post_types = get_post_types( array( 'show_in_rest' => true ), 'objects' );
		$this->assertEquals( count( $post_types ), count( $data ) );
		$this->assertEquals( $post_types['post']->name, $data['post']['slug'] );
		$this->check_post_type_obj( 'view', $post_types['post'], $data['post'], $data['post']['_links'] );
		$this->assertEquals( $post_types['page']->name, $data['page']['slug'] );
		$this->check_post_type_obj( 'view', $post_types['page'], $data['page'], $data['page']['_links'] );
		$this->assertFalse( isset( $data['revision'] ) );
	}

	public function test_get_items_invalid_permission_for_context() {
		wp_set_current_user( 0 );
		$request = new WP_REST_Request( 'GET', '/wp/v2/types' );
		$request->set_param( 'context', 'edit' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_view', $response, 401 );
	}

	public function test_get_item() {
		$request = new WP_REST_Request( 'GET', '/wp/v2/types/post' );
		$response = $this->server->dispatch( $request );
		$this->check_post_type_object_response( 'view', $response );
		$data = $response->get_data();
		$this->assertEquals( array( 'category', 'post_tag' ), $data['taxonomies'] );
	}

	public function test_get_item_page() {
		$request = new WP_REST_Request( 'GET', '/wp/v2/types/page' );
		$response = $this->server->dispatch( $request );
		$this->check_post_type_object_response( 'view', $response, 'page' );
		$data = $response->get_data();
		$this->assertEquals( array(), $data['taxonomies'] );
	}

	public function test_get_item_invalid_type() {
		$request = new WP_REST_Request( 'GET', '/wp/v2/types/invalid' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_type_invalid', $response, 404 );
	}

	public function test_get_item_edit_context() {
		$editor_id = $this->factory->user->create( array( 'role' => 'editor' ) );
		wp_set_current_user( $editor_id );
		$request = new WP_REST_Request( 'GET', '/wp/v2/types/post' );
		$request->set_param( 'context', 'edit' );
		$response = $this->server->dispatch( $request );
		$this->check_post_type_object_response( 'edit', $response );
	}

	public function test_get_item_invalid_permission_for_context() {
		wp_set_current_user( 0 );
		$request = new WP_REST_Request( 'GET', '/wp/v2/types/post' );
		$request->set_param( 'context', 'edit' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_forbidden_context', $response, 401 );
	}

	public function test_create_item() {
		/** Post types can't be created **/
	}

	public function test_update_item() {
		/** Post types can't be updated **/
	}

	public function test_delete_item() {
		/** Post types can't be deleted **/
	}

	public function test_prepare_item() {
		$obj = get_post_type_object( 'post' );
		$endpoint = new WP_REST_Post_Types_Controller;
		$request = new WP_REST_Request;
		$request->set_param( 'context', 'edit' );
		$response = $endpoint->prepare_item_for_response( $obj, $request );
		$this->check_post_type_obj( 'edit', $obj, $response->get_data(), $response->get_links() );
	}

	public function test_get_item_schema() {
		$request = new WP_REST_Request( 'OPTIONS', '/wp/v2/types' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$properties = $data['schema']['properties'];
		$this->assertEquals( 8, count( $properties ) );
		$this->assertArrayHasKey( 'capabilities', $properties );
		$this->assertArrayHasKey( 'description', $properties );
		$this->assertArrayHasKey( 'hierarchical', $properties );
		$this->assertArrayHasKey( 'labels', $properties );
		$this->assertArrayHasKey( 'name', $properties );
		$this->assertArrayHasKey( 'slug', $properties );
		$this->assertArrayHasKey( 'taxonomies', $properties );
		$this->assertArrayHasKey( 'rest_base', $properties );
	}

	public function test_get_additional_field_registration() {

		$schema = array(
			'type'        => 'integer',
			'description' => 'Some integer of mine',
			'enum'        => array( 1, 2, 3, 4 ),
			'context'     => array( 'view', 'edit' ),
		);

		register_rest_field( 'type', 'my_custom_int', array(
			'schema'          => $schema,
			'get_callback'    => array( $this, 'additional_field_get_callback' ),
			'update_callback' => array( $this, 'additional_field_update_callback' ),
		) );

		$request = new WP_REST_Request( 'OPTIONS', '/wp/v2/types/schema' );

		$response = $this->server->dispatch( $request );
		$data = $response->get_data();

		$this->assertArrayHasKey( 'my_custom_int', $data['schema']['properties'] );
		$this->assertEquals( $schema, $data['schema']['properties']['my_custom_int'] );

		$request = new WP_REST_Request( 'GET', '/wp/v2/types/post' );

		$response = $this->server->dispatch( $request );
		$this->assertArrayHasKey( 'my_custom_int', $response->data );

		global $wp_rest_additional_fields;
		$wp_rest_additional_fields = array();
	}

	public function additional_field_get_callback( $object ) {
		return 123;
	}

	protected function check_post_type_obj( $context, $post_type_obj, $data, $links ) {
		$this->assertEquals( $post_type_obj->label, $data['name'] );
		$this->assertEquals( $post_type_obj->name, $data['slug'] );
		$this->assertEquals( $post_type_obj->description, $data['description'] );
		$this->assertEquals( $post_type_obj->hierarchical, $data['hierarchical'] );
		$this->assertEquals( $post_type_obj->rest_base, $data['rest_base'] );

		$links = test_rest_expand_compact_links( $links );
		$this->assertEquals( rest_url( 'wp/v2/types' ), $links['collection'][0]['href'] );
		$this->assertArrayHasKey( 'https://api.w.org/items', $links );
		if ( 'edit' === $context ) {
			$this->assertEquals( $post_type_obj->cap, $data['capabilities'] );
			$this->assertEquals( $post_type_obj->labels, $data['labels'] );
		} else {
			$this->assertFalse( isset( $data['capabilities'] ) );
			$this->assertFalse( isset( $data['labels'] ) );
		}
	}

	protected function check_post_type_object_response( $context, $response, $post_type = 'post' ) {
		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$obj = get_post_type_object( $post_type );
		$this->check_post_type_obj( $context, $obj, $data, $response->get_links() );
	}

}
