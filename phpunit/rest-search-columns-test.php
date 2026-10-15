<?php
/**
 * Tests for the `search_columns` parameter on the search endpoint.
 *
 * @package gutenberg
 */

/**
 * @group restapi
 */
class Gutenberg_REST_Search_Columns_Test extends WP_Test_REST_TestCase {

	/**
	 * ID of a post with the search term in its title.
	 *
	 * @var int
	 */
	protected static $title_match_id;

	/**
	 * ID of a post with the search term only in its content.
	 *
	 * @var int
	 */
	protected static $content_match_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$title_match_id   = $factory->post->create(
			array(
				'post_title'   => 'Coffee Roasting Guide',
				'post_content' => 'How to roast beans at home.',
			)
		);
		self::$content_match_id = $factory->post->create(
			array(
				'post_title'   => 'Morning Ritual',
				'post_content' => 'I grind the beans and brew a cup of coffee.',
			)
		);
	}

	/**
	 * Performs a search request.
	 *
	 * @param array $params Query parameters.
	 * @return WP_REST_Response The response.
	 */
	private function search( $params ) {
		$request = new WP_REST_Request( 'GET', '/wp/v2/search' );
		$request->set_query_params( $params );

		return rest_get_server()->dispatch( $request );
	}

	/**
	 * Returns the IDs of the results in a response.
	 *
	 * @param WP_REST_Response $response The response.
	 * @return int[] Result IDs.
	 */
	private function get_ids( $response ) {
		return wp_list_pluck( $response->get_data(), 'id' );
	}

	public function test_search_without_search_columns_matches_all_columns() {
		$response = $this->search( array( 'search' => 'coffee' ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertEqualSets(
			array( self::$title_match_id, self::$content_match_id ),
			$this->get_ids( $response )
		);
	}

	public function test_search_columns_limits_post_search_to_titles() {
		$response = $this->search(
			array(
				'search'         => 'coffee',
				'type'           => 'post',
				'search_columns' => array( 'post_title' ),
			)
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array( self::$title_match_id ), $this->get_ids( $response ) );
	}

	public function test_search_columns_rejects_invalid_columns() {
		$response = $this->search(
			array(
				'search'         => 'coffee',
				'search_columns' => array( 'post_name' ),
			)
		);

		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
	}

	public function test_search_columns_is_registered_as_an_endpoint_arg() {
		$routes = rest_get_server()->get_routes();
		$args   = $routes['/wp/v2/search'][0]['args'];

		$this->assertArrayHasKey( 'search_columns', $args );
		$this->assertSame(
			array( 'post_title', 'post_content', 'post_excerpt' ),
			$args['search_columns']['items']['enum']
		);
	}
}
