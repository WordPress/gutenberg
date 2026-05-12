<?php
/**
 * Tests for the on_this_day REST parameter that extends the posts collection.
 *
 * @package gutenberg
 */
class On_This_Day_Test extends WP_UnitTestCase {

	/**
	 * REST route under test.
	 */
	const ROUTE = '/wp/v2/posts';

	/**
	 * Subscriber id with `read` capability.
	 *
	 * @var int
	 */
	protected static $subscriber_id;

	/**
	 * Fixture post ids keyed by intent.
	 *
	 * @var array<string, int>
	 */
	protected static $post_ids = array();

	public static function wpSetUpBeforeClass( $factory ) {
		self::$subscriber_id = $factory->user->create( array( 'role' => 'subscriber' ) );

		self::$post_ids['oldest_may_11'] = $factory->post->create(
			array(
				'post_status' => 'publish',
				'post_date'   => '2018-05-11 10:00:00',
				'post_title'  => 'Oldest May 11',
			)
		);
		self::$post_ids['newer_may_11']  = $factory->post->create(
			array(
				'post_status' => 'publish',
				'post_date'   => '2020-05-11 10:00:00',
				'post_title'  => 'Newer May 11',
			)
		);
		self::$post_ids['other_day']     = $factory->post->create(
			array(
				'post_status' => 'publish',
				'post_date'   => '2019-07-04 10:00:00',
				'post_title'  => 'Independence Day',
			)
		);
	}

	public function set_up() {
		parent::set_up();
		wp_set_current_user( self::$subscriber_id );
	}

	public function tear_down() {
		wp_set_current_user( 0 );
		parent::tear_down();
	}

	public function test_collection_param_is_advertised_in_schema() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( self::ROUTE, $routes );

		$get_route_args = null;
		foreach ( $routes[ self::ROUTE ] as $route_handler ) {
			if ( in_array( 'GET', (array) $route_handler['methods'], true ) || ! empty( $route_handler['methods']['GET'] ) ) {
				$get_route_args = $route_handler['args'];
				break;
			}
		}

		$this->assertNotNull( $get_route_args );
		$this->assertArrayHasKey( 'on_this_day', $get_route_args );
		$this->assertSame( 'string', $get_route_args['on_this_day']['type'] );
		$this->assertSame( GUTENBERG_ON_THIS_DAY_PATTERN, $get_route_args['on_this_day']['pattern'] );
	}

	public function test_filter_returns_only_posts_matching_month_day() {
		$request = new WP_REST_Request( 'GET', self::ROUTE );
		$request->set_param( 'on_this_day', '05-11' );
		$request->set_param( 'orderby', 'date' );
		$request->set_param( 'order', 'asc' );

		$response = rest_do_request( $request );

		$this->assertSame( 200, $response->get_status() );

		$ids = array_column( $response->get_data(), 'id' );
		sort( $ids );

		$expected = array( self::$post_ids['oldest_may_11'], self::$post_ids['newer_may_11'] );
		sort( $expected );

		$this->assertSame( $expected, $ids );
	}

	public function test_orderby_ascending_returns_oldest_match_first() {
		$request = new WP_REST_Request( 'GET', self::ROUTE );
		$request->set_param( 'on_this_day', '05-11' );
		$request->set_param( 'orderby', 'date' );
		$request->set_param( 'order', 'asc' );
		$request->set_param( 'per_page', 1 );

		$response = rest_do_request( $request );

		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertCount( 1, $data );
		$this->assertSame( self::$post_ids['oldest_may_11'], $data[0]['id'] );
	}

	public function test_no_match_returns_empty_collection() {
		$request = new WP_REST_Request( 'GET', self::ROUTE );
		$request->set_param( 'on_this_day', '02-29' );

		$response = rest_do_request( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array(), $response->get_data() );
	}

	public function test_missing_param_returns_all_published_posts() {
		$request = new WP_REST_Request( 'GET', self::ROUTE );

		$response = rest_do_request( $request );

		$this->assertSame( 200, $response->get_status() );

		$ids = array_column( $response->get_data(), 'id' );
		$this->assertContains( self::$post_ids['oldest_may_11'], $ids );
		$this->assertContains( self::$post_ids['newer_may_11'], $ids );
		$this->assertContains( self::$post_ids['other_day'], $ids );
	}

	public function test_invalid_format_is_rejected_with_400() {
		$request = new WP_REST_Request( 'GET', self::ROUTE );
		$request->set_param( 'on_this_day', '2026-05-11' );

		$response = rest_do_request( $request );

		$this->assertSame( 400, $response->get_status() );
	}

	public function test_query_filter_ignores_invalid_value_when_called_directly() {
		$args    = array( 'post_type' => 'post' );
		$request = new WP_REST_Request( 'GET', self::ROUTE );
		$request->set_param( 'on_this_day', 'not-a-date' );

		$filtered = gutenberg_on_this_day_apply_query( $args, $request );

		$this->assertSame( $args, $filtered );
	}
}
