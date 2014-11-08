<?php

/**
 * Tests to make sure querying posts based on various date parameters works as expected.
 *
 * @group query
 * @group date
 */
class Tests_Query_Date extends WP_UnitTestCase {

	public $q;

	static $post_ids = array();

	public static function setUpBeforeClass() {
		// Be careful modifying this. Tests are coded to expect this exact sample data.
		$post_dates = array(
			'1972-05-24 14:53:45',
			'1984-07-28 19:28:56',
			'2003-05-27 22:45:07',
			'2004-01-03 08:54:10',
			'2004-05-22 12:34:12',
			'2005-02-17 00:00:15',
			'2005-12-31 23:59:20',
			'2007-01-22 03:49:21',
			'2007-05-16 17:32:22',
			'2007-09-24 07:17:23',
			'2008-03-29 09:04:25',
			'2008-07-15 11:32:26',
			'2008-12-10 13:06:27',
			'2009-06-11 21:30:28',
			'2009-12-18 10:42:29',
			'2010-06-17 17:09:30',
			'2011-02-23 12:12:31',
			'2011-07-04 01:56:32',
			'2011-12-12 16:39:33',
			'2012-06-13 14:03:34',
			'2025-04-20 10:13:00',
			'2025-04-20 10:13:01',
			'2025-05-20 10:13:01',
		);

		$factory = new WP_UnitTest_Factory;

		foreach ( $post_dates as $post_date ) {
			self::$post_ids[] = $factory->post->create( array( 'post_date' => $post_date ) );
		}

		self::commit_transaction();
	}

	public static function tearDownAfterClass() {
		foreach ( self::$post_ids as $post_id ) {
			wp_delete_post( $post_id, true );
		}

		self::commit_transaction();
	}

	public function setUp() {
		parent::setUp();
		unset( $this->q );
		$this->q = new WP_Query();
	}

	public function _get_query_result( $args = array() ) {
		$args = wp_parse_args( $args, array(
			'post_status'    => 'any', // For the future post
			'posts_per_page' => '-1',  // To make sure results are accurate
			'orderby'        => 'ID',  // Same order they were created
			'order'          => 'ASC',
		) );

		return $this->q->query( $args );
	}

	public function test_simple_year_expecting_results() {
		$posts = $this->_get_query_result( array(
			'year' => 2008,
		) );

		$expected_dates = array(
			'2008-03-29 09:04:25',
			'2008-07-15 11:32:26',
			'2008-12-10 13:06:27',
		);

		$this->assertEquals( $expected_dates, wp_list_pluck( $posts, 'post_date' ) );
	}

	public function test_simple_year_expecting_noresults() {
		$posts = $this->_get_query_result( array(
			'year' => 2000,
		) );

		$this->assertCount( 0, $posts );
	}

	public function test_simple_m_with_year_expecting_results() {
		$posts = $this->_get_query_result( array(
			'm' => '2007',
		) );

		$expected_dates = array(
			'2007-01-22 03:49:21',
			'2007-05-16 17:32:22',
			'2007-09-24 07:17:23',
		);

		$this->assertEquals( $expected_dates, wp_list_pluck( $posts, 'post_date' ) );
	}

	public function test_simple_m_with_year_expecting_noresults() {
		$posts = $this->_get_query_result( array(
			'm' => '1999',
		) );

		$this->assertCount( 0, $posts );
	}

	public function test_simple_m_with_yearmonth_expecting_results() {
		$posts = $this->_get_query_result( array(
			'm' => '202504',
		) );

		$expected_dates = array(
			'2025-04-20 10:13:00',
			'2025-04-20 10:13:01',
		);

		$this->assertEquals( $expected_dates, wp_list_pluck( $posts, 'post_date' ) );
	}

	public function test_simple_m_with_yearmonth_expecting_noresults() {
		$posts = $this->_get_query_result( array(
			'm' => '202502',
		) );

		$this->assertCount( 0, $posts );
	}

	public function test_simple_m_with_yearmonthday_expecting_results() {
		$posts = $this->_get_query_result( array(
			'm' => '20250420',
		) );

		$expected_dates = array(
			'2025-04-20 10:13:00',
			'2025-04-20 10:13:01',
		);

		$this->assertEquals( $expected_dates, wp_list_pluck( $posts, 'post_date' ) );
	}

	public function test_simple_m_with_yearmonthday_expecting_noresults() {
		$posts = $this->_get_query_result( array(
			'm' => '20250419',
		) );

		$this->assertCount( 0, $posts );
	}

	public function test_simple_m_with_yearmonthdayhour_expecting_results() {
		$posts = $this->_get_query_result( array(
			'm' => '2025042010',
		) );

		$expected_dates = array(
			'2025-04-20 10:13:00',
			'2025-04-20 10:13:01',
		);

		$this->assertEquals( $expected_dates, wp_list_pluck( $posts, 'post_date' ) );
	}

	public function test_simple_m_with_yearmonthdayhour_expecting_noresults() {
		$posts = $this->_get_query_result( array(
			'm' => '2025042009',
		) );

		$this->assertCount( 0, $posts );
	}

	/**
	 * @ticket 24884
	 */
	public function test_simple_m_with_yearmonthdayhourminute_expecting_results() {
		$posts = $this->_get_query_result( array(
			'm' => '202504201013',
		) );

		$expected_dates = array(
			'2025-04-20 10:13:00',
			'2025-04-20 10:13:01',
		);

		$this->assertEquals( $expected_dates, wp_list_pluck( $posts, 'post_date' ) );
	}

	/**
	 * @ticket 24884
	 */
	public function test_simple_m_with_yearmonthdayhourminute_expecting_noresults() {
		$posts = $this->_get_query_result( array(
			'm' => '202504201012',
		) );

		$this->assertCount( 0, $posts );
	}

	/**
	 * @ticket 24884
	 */
	public function test_simple_m_with_yearmonthdayhourminutesecond_expecting_results() {
		$posts = $this->_get_query_result( array(
			'm' => '20250420101301',
		) );

		$expected_dates = array(
			'2025-04-20 10:13:01',
		);

		$this->assertEquals( $expected_dates, wp_list_pluck( $posts, 'post_date' ) );
	}

	/**
	 * @ticket 24884
	 */
	public function test_simple_m_with_yearmonthdayhourminutesecond_expecting_noresults() {
		$posts = $this->_get_query_result( array(
			'm' => '20250420101302',
		) );

		$this->assertCount( 0, $posts );
	}

	/**
	 * @ticket 24884
	 */
	public function test_simple_m_with_yearmonthdayhourminutesecond_and_dashes_expecting_results() {
		$posts = $this->_get_query_result( array(
			'm' => '2025-04-20 10:13:00',
		) );

		$expected_dates = array(
			'2025-04-20 10:13:00',
		);

		$this->assertEquals( $expected_dates, wp_list_pluck( $posts, 'post_date' ) );
	}

	/**
	 * @ticket 24884
	 */
	public function test_simple_m_with_yearmonthdayhourminutesecond_and_dashesletters_expecting_results() {
		$posts = $this->_get_query_result( array(
			'm' => 'alpha2025-04-20 10:13:00',
		) );

		$expected_dates = array(
			'2025-04-20 10:13:00',
		);

		$this->assertEquals( $expected_dates, wp_list_pluck( $posts, 'post_date' ) );
	}

	public function test_simple_monthnum_expecting_results() {
		$posts = $this->_get_query_result( array(
			'monthnum' => 5,
		) );

		$expected_dates = array(
			'1972-05-24 14:53:45',
			'2003-05-27 22:45:07',
			'2004-05-22 12:34:12',
			'2007-05-16 17:32:22',
			'2025-05-20 10:13:01',
		);

		$this->assertEquals( $expected_dates, wp_list_pluck( $posts, 'post_date' ) );
	}

	public function test_simple_monthnum_expecting_noresults() {
		$posts = $this->_get_query_result( array(
			'monthnum' => 8,
		) );

		$this->assertCount( 0, $posts );
	}

	public function test_simple_w_as_in_week_expecting_results() {
		$posts = $this->_get_query_result( array(
			'w' => 24,
		) );

		$expected_dates = array(
			'2009-06-11 21:30:28',
			'2010-06-17 17:09:30',
			'2012-06-13 14:03:34',
		);

		$this->assertEquals( $expected_dates, wp_list_pluck( $posts, 'post_date' ) );
	}

	public function test_simple_w_as_in_week_expecting_noresults() {
		$posts = $this->_get_query_result( array(
			'w' => 2,
		) );

		$this->assertCount( 0, $posts );
	}

	public function test_simple_day_expecting_results() {
		$posts = $this->_get_query_result( array(
			'day' => 22,
		) );

		$expected_dates = array(
			'2004-05-22 12:34:12',
			'2007-01-22 03:49:21',
		);

		$this->assertEquals( $expected_dates, wp_list_pluck( $posts, 'post_date' ) );
	}

	public function test_simple_day_expecting_noresults() {
		$posts = $this->_get_query_result( array(
			'day' => 30,
		) );

		$this->assertCount( 0, $posts );
	}

	public function test_simple_hour_expecting_results() {
		$posts = $this->_get_query_result( array(
			'hour' => 21,
		) );

		$expected_dates = array(
			'2009-06-11 21:30:28',
		);

		$this->assertEquals( $expected_dates, wp_list_pluck( $posts, 'post_date' ) );
	}

	public function test_simple_hour_expecting_noresults() {
		$posts = $this->_get_query_result( array(
			'hour' => 2,
		) );

		$this->assertCount( 0, $posts );
	}

	public function test_simple_minute_expecting_results() {
		$posts = $this->_get_query_result( array(
			'minute' => 32,
		) );

		$expected_dates = array(
			'2007-05-16 17:32:22',
			'2008-07-15 11:32:26',
		);

		$this->assertEquals( $expected_dates, wp_list_pluck( $posts, 'post_date' ) );
	}

	public function test_simple_minute_expecting_noresults() {
		$posts = $this->_get_query_result( array(
			'minute' => 1,
		) );

		$this->assertCount( 0, $posts );
	}

	public function test_simple_second_expecting_results() {
		$posts = $this->_get_query_result( array(
			'second' => 30,
		) );

		$expected_dates = array(
			'2010-06-17 17:09:30',
		);

		$this->assertEquals( $expected_dates, wp_list_pluck( $posts, 'post_date' ) );
	}

	public function test_simple_second_expecting_noresults() {
		$posts = $this->_get_query_result( array(
			'second' => 50,
		) );

		$this->assertCount( 0, $posts );
	}
}