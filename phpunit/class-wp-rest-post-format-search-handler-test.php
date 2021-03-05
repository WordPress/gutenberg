<?php
/**
 * WP_REST_Post_Format_Search_Handler tests
 *
 * @package Gutenberg
 */

/**
 * Tests for WP_REST_Post_Format_Search_Handler_Test.
 *
 * @group restapi
 */
class WP_REST_Post_Format_Search_Handler_Test extends WP_Test_REST_Controller_Testcase {

	/**
	 * Test post ID that we'll give a format to.
	 *
	 * @var int
	 */
	private static $my_post_id = array();

	/**
	 * Create fake data before our tests run.
	 *
	 * @param WP_UnitTest_Factory $factory Helper that lets us create fake data.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		add_theme_support( 'post-formats' );

		self::$my_post_id = $factory->post->create(
			array(
				'post_title' => 'Test post',
			)
		);

		set_post_format( self::$my_post_id, 'aside' );
	}

	/**
	 * Delete our fake data after our tests run.
	 */
	public static function wpTearDownAfterClass() {
		wp_delete_post( self::$my_post_id );

		remove_theme_support( 'post-formats' );
	}

	/**
	 * Search through terms of any type.
	 */
	public function test_get_items_search_type_post_format() {
		$response = $this->do_request_with_params(
			array(
				'per_page' => 100,
				'type'     => 'post-format',
			)
		);
		$this->assertEquals( 200, $response->get_status() );
		$this->assertContains(
			'Aside',
			wp_list_pluck( $response->get_data(), 'title' )
		);
	}

	/**
	 * Search through all that matches a 'Aside' search.
	 */
	public function test_get_items_search_for_test_post_format() {
		$response = $this->do_request_with_params(
			array(
				'per_page' => 100,
				'search'   => 'Aside',
				'type'     => 'post-format',
			)
		);

		$this->assertEquals( 200, $response->get_status() );
		$this->assertContains(
			'Aside',
			wp_list_pluck( $response->get_data(), 'title' )
		);
	}

	/**
	 * Searching for a post format that doesn't exist should return an empty
	 * result.
	 */
	public function test_get_items_search_for_missing_post_format() {
		$response = $this->do_request_with_params(
			array(
				'per_page' => 100,
				'search'   => 'Doesn\'t exist',
				'type'     => 'post-format',
			)
		);

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEmpty( $response->get_data() );
	}

	public function test_register_routes() {
		$this->markTestSkipped( 'Covered by Search controller tests.' );
	}

	public function test_context_param() {
		$this->markTestSkipped( 'Covered by Search controller tests.' );
	}

	public function test_get_items() {
		$this->markTestSkipped( 'Covered by Search controller tests.' );
	}

	public function test_get_item() {
		$this->markTestSkipped( 'Covered by Search controller tests.' );
	}

	public function test_create_item() {
		$this->markTestSkipped( 'Covered by Search controller tests.' );
	}

	public function test_update_item() {
		$this->markTestSkipped( 'Covered by Search controller tests.' );
	}

	public function test_delete_item() {
		$this->markTestSkipped( 'Covered by Search controller tests.' );
	}

	public function test_prepare_item() {
		$this->markTestSkipped( 'Covered by Search controller tests.' );
	}

	public function test_get_item_schema() {
		$this->markTestSkipped( 'Covered by Search controller tests.' );
	}

	/**
	 * Perform a REST request to our search endpoint with given parameters.
	 */
	private function do_request_with_params( $params = array(), $method = 'GET' ) {
		$request = $this->get_request( $params, $method );

		return rest_get_server()->dispatch( $request );
	}

	/**
	 * Get a REST request object for given parameters.
	 */
	private function get_request( $params = array(), $method = 'GET' ) {
		$request = new WP_REST_Request( $method, '/wp/v2/search' );

		foreach ( $params as $param => $value ) {
			$request->set_param( $param, $value );
		}

		return $request;
	}
}
