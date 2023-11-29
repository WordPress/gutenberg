<?php
/**
 * Unit tests covering WP_REST_Posts_Types_Controller functionality extensions.
 *
 * @package WordPress
 * @subpackage REST API
 */
class Gutenberg_Test_REST_Post_Types_Controller extends WP_Test_REST_Controller_Testcase {
	public function set_up() {
		register_post_type(
			'gutenberg_types_cpt',
			array(
				'show_in_rest' => true,
				'rest_base'    => 'gutenberg_types_cpt',
			)
		);
	}

	public static function wpTearDownAfterClass() {
		unregister_post_type( 'gutenberg_types_cpt' );
	}

	public function test_get_items_revisions_support_in_view_context() {
		$request  = new WP_REST_Request( 'GET', '/wp/v2/types' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		// Only returns one support.
		$this->assertCount( 1, $data['page']['supports'], 'Only one support item should be returned in view context.' );

		$page_supports = get_all_post_type_supports( 'page' );
		$this->assertSame( $page_supports['revisions'], $data['page']['supports']['revisions'], 'Revisions support should be returned for `page` post types.' );

		$this->assertCount( 1, $data['post']['supports'], 'Only one support item should be returned in view context.' );
		$post_supports = get_all_post_type_supports( 'post' );
		$this->assertSame( $post_supports['revisions'], $data['post']['supports']['revisions'], 'Revisions support should be returned for `post` post types.' );

		// Where revisions are not supported.
		$this->assertSame( 'gutenberg_types_cpt', $data['gutenberg_types_cpt']['slug'], 'Custom post should be correctly registered.' );
		$this->assertFalse( isset( $data['gutenberg_types_cpt']['supports'] ), 'Custom post should not return supports array in view context.' );
	}

	public function test_get_item_post_revisions_support_in_view_context() {
		$request  = new WP_REST_Request( 'GET', '/wp/v2/types/post' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();

		// Only returns one support.
		$this->assertCount( 1, $data['supports'], 'Only one support item should be returned in view context.' );

		$supports_revisions = post_type_supports( 'post', 'revisions' );
		$this->assertSame( $supports_revisions, $data['supports']['revisions'], 'Revisions support should be returned for single `post` post types.' );

		// Where revisions are not supported.
		$request  = new WP_REST_Request( 'GET', '/wp/v2/types/gutenberg_types_cpt' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 'gutenberg_types_cpt', $data['slug'], 'Custom post should be correctly registered.' );
		$this->assertFalse( isset( $data['supports'] ), 'Custom post should not return supports array in view context.' );
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_get_items() {
		// Controller does not implement this method.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_context_param() {
		// Controller does not implement this method.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_get_item() {
		// Controller does not implement this method.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_create_item() {
		// Controller does not implement this method.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_update_item() {
		// Controller does not implement this method.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_delete_item() {
		// Controller does not implement this method.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_prepare_item() {
		// Controller does not implement this method.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_get_item_schema() {
		// Controller does not implement this method.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_register_routes() {
		// Controller does not implement this method.
	}
}
