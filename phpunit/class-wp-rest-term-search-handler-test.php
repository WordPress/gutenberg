<?php
/**
 * WP_REST_Term_Search_Handler tests
 *
 * @package Gutenberg
 */

/**
 * Tests for WP_REST_Term_Search_Handler_Test.
 *
 * @group restapi
 */
class WP_REST_Term_Search_Handler_Test extends WP_Test_REST_Controller_Testcase {

	/**
	 * Categories.
	 *
	 * @var array
	 */
	private static $my_category = array();

	/**
	 * Tags.
	 *
	 * @var array
	 */
	private static $my_tag = array();

	/**
	 * Create fake data before our tests run.
	 *
	 * @param WP_UnitTest_Factory $factory Helper that lets us create fake data.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		self::$my_category = $factory->term->create(
			array(
				'taxonomy' => 'category',
				'name'     => 'Test Category',
			)
		);

		self::$my_tag = $factory->term->create(
			array(
				'taxonomy' => 'post_tag',
				'name'     => 'Test Tag',
			)
		);

	}

	/**
	 * Delete our fake data after our tests run.
	 */
	public static function wpTearDownAfterClass() {
		$term_ids = array(
			self::$my_category,
			self::$my_tag,
		);

		foreach ( $term_ids as $term_id ) {
			wp_delete_term( $term_id, true );
		}
	}


	/**
	 * Search through terms of any type.
	 */
	public function test_get_items_search_type_term() {
		$response = $this->do_request_with_params(
			array(
				'per_page' => 100,
				'type'     => 'term',
			)
		);
		$this->assertEquals( 200, $response->get_status() );
		$this->assertEqualSets(
			array(
				0 => 1, // That is the default category.
				self::$my_category,
				self::$my_tag,
			),
			wp_list_pluck( $response->get_data(), 'id' )
		);
	}

	/**
	 * Search through terms of subtype 'category'.
	 */
	public function test_get_items_search_type_term_subtype_category() {
		$response = $this->do_request_with_params(
			array(
				'per_page' => 100,
				'type'     => 'term',
				'subtype'  => 'category',
			)
		);

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEqualSets(
			array(
				0 => 1, // That is the default category.
				self::$my_category,
			),
			wp_list_pluck( $response->get_data(), 'id' )
		);
	}

	/**
	 * Search through posts of an invalid post type.
	 */
	public function test_get_items_search_term_subtype_invalid() {
		$response = $this->do_request_with_params(
			array(
				'per_page' => 100,
				'type'     => 'term',
				'subtype'  => 'invalid',
			)
		);

		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
	}

	/**
	 * Search through posts and pages.
	 */
	public function test_get_items_search_categories_and_tags() {
		$response = $this->do_request_with_params(
			array(
				'per_page' => 100,
				'type'     => 'term',
				'subtype'  => 'category,post_tag',
			)
		);
		$this->assertEquals( 200, $response->get_status() );
		$this->assertEqualSets(
			array(
				0 => 1, // This is the default category.
				self::$my_category,
				self::$my_tag,
			),
			wp_list_pluck( $response->get_data(), 'id' )
		);
	}

	/**
	 * Search through all that matches a 'Test Category' search.
	 */
	public function test_get_items_search_for_testcategory() {
		$response = $this->do_request_with_params(
			array(
				'per_page' => 100,
				'search'   => 'Test Category',
				'type'     => 'term',
			)
		);

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEqualSets(
			array(
				self::$my_category,
			),
			wp_list_pluck( $response->get_data(), 'id' )
		);
	}

	/**
	 * Search through all that matches a 'Test Tag' search.
	 */
	public function test_get_items_search_for_testtag() {
		$response = $this->do_request_with_params(
			array(
				'per_page' => 100,
				'search'   => 'Test Tag',
				'type'     => 'term',
			)
		);

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEqualSets(
			array(
				self::$my_tag,
			),
			wp_list_pluck( $response->get_data(), 'id' )
		);
	}

	/**
	 * Searching for a term that doesn't exist should return an empty result.
	 */
	public function test_get_items_search_for_missing_term() {
		$response = $this->do_request_with_params(
			array(
				'per_page' => 100,
				'search'   => 'Doesn\'t exist',
				'type'     => 'term',
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
