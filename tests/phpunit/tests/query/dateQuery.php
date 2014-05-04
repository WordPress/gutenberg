<?php

/**
 * Tests to make sure querying posts based on various date parameters using "date_query" works as expected.
 *
 * @ticket 18694
 *
 * @group query
 * @group date
 * @group datequery
 */
class Tests_Query_DateQuery extends WP_UnitTestCase {

	public $q;

	public function setUp() {
		parent::setUp();

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

		foreach ( $post_dates as $post_date ) {
			$this->factory->post->create( array( 'post_date' => $post_date ) );
		}

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

	public function test_date_query_before_array() {
		$posts = $this->_get_query_result( array(
			'date_query' => array(
				array(
					'before' => array(
						'year' => 2008,
						'month' => 6,
					),
				),
			),
		) );

		$expected_dates = array(
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
		);

		$this->assertEquals( $expected_dates, wp_list_pluck( $posts, 'post_date' ) );
	}

	/**
	 * Specifically tests to make sure values are defaulting to
	 * their minimum values when being used with "before".
	 */
	public function test_date_query_before_array_test_defaulting() {
		$posts = $this->_get_query_result( array(
			'date_query' => array(
				array(
					'before' => array(
						'year' => 2008,
					),
				),
			),
		) );

		$expected_dates = array(
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
		);

		$this->assertEquals( $expected_dates, wp_list_pluck( $posts, 'post_date' ) );
	}

	public function test_date_query_before_string() {
		$posts = $this->_get_query_result( array(
			'date_query' => array(
				array(
					'before' => 'May 4th, 2008',
				),
			),
		) );

		$expected_dates = array(
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
		);

		$this->assertEquals( $expected_dates, wp_list_pluck( $posts, 'post_date' ) );
	}

	public function test_date_query_after_array() {
		$posts = $this->_get_query_result( array(
			'date_query' => array(
				array(
					'after' => array(
						'year'  => 2009,
						'month' => 12,
						'day'   => 31,
					),
				),
			),
		) );

		$expected_dates = array(
			'2010-06-17 17:09:30',
			'2011-02-23 12:12:31',
			'2011-07-04 01:56:32',
			'2011-12-12 16:39:33',
			'2012-06-13 14:03:34',
			'2025-04-20 10:13:00',
			'2025-04-20 10:13:01',
			'2025-05-20 10:13:01',
		);

		$this->assertEquals( $expected_dates, wp_list_pluck( $posts, 'post_date' ) );
	}

	/**
	 * Specifically tests to make sure values are defaulting to
	 * their maximum values when being used with "after".
	 */
	public function test_date_query_after_array_test_defaulting() {
		$posts = $this->_get_query_result( array(
			'date_query' => array(
				array(
					'after' => array(
						'year' => 2008,
					),
				),
			),
		) );

		$expected_dates = array(
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

		$this->assertEquals( $expected_dates, wp_list_pluck( $posts, 'post_date' ) );
	}

	public function test_date_query_after_string() {
		$posts = $this->_get_query_result( array(
			'date_query' => array(
				array(
					'after' => '2009-12-18 10:42:29',
				),
			),
		) );

		$expected_dates = array(
			'2010-06-17 17:09:30',
			'2011-02-23 12:12:31',
			'2011-07-04 01:56:32',
			'2011-12-12 16:39:33',
			'2012-06-13 14:03:34',
			'2025-04-20 10:13:00',
			'2025-04-20 10:13:01',
			'2025-05-20 10:13:01',
		);

		$this->assertEquals( $expected_dates, wp_list_pluck( $posts, 'post_date' ) );
	}

	public function test_date_query_after_string_inclusive() {
		$posts = $this->_get_query_result( array(
			'date_query' => array(
				array(
					'after'     => '2009-12-18 10:42:29',
					'inclusive' => true,
				),
			),
		) );

		$expected_dates = array(
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

		$this->assertEquals( $expected_dates, wp_list_pluck( $posts, 'post_date' ) );
	}

	public function test_date_query_year_expecting_results() {
		$posts = $this->_get_query_result( array(
			'date_query' => array(
				array(
					'year' => 2009,
				),
			),
		) );

		$expected_dates = array(
			'2009-06-11 21:30:28',
			'2009-12-18 10:42:29',
		);

		$this->assertEquals( $expected_dates, wp_list_pluck( $posts, 'post_date' ) );
	}

	public function test_date_query_year_expecting_noresults() {
		$posts = $this->_get_query_result( array(
			'date_query' => array(
				array(
					'year' => 2001,
				),
			),
		) );

		$this->assertCount( 0, $posts );
	}

	public function test_date_query_month_expecting_results() {
		$posts = $this->_get_query_result( array(
			'date_query' => array(
				array(
					'month' => 12,
				),
			),
		) );

		$expected_dates = array(
			'2005-12-31 23:59:20',
			'2008-12-10 13:06:27',
			'2009-12-18 10:42:29',
			'2011-12-12 16:39:33',
		);

		$this->assertEquals( $expected_dates, wp_list_pluck( $posts, 'post_date' ) );
	}

	public function test_date_query_month_expecting_noresults() {
		$posts = $this->_get_query_result( array(
			'date_query' => array(
				array(
					'month' => 8,
				),
			),
		) );

		$this->assertCount( 0, $posts );
	}

	public function test_date_query_week_expecting_results() {
		$posts = $this->_get_query_result( array(
			'date_query' => array(
				array(
					'week' => 1,
				),
			),
		) );

		$expected_dates = array(
			'2004-01-03 08:54:10',
		);

		$this->assertEquals( $expected_dates, wp_list_pluck( $posts, 'post_date' ) );
	}

	public function test_date_query_week_expecting_noresults() {
		$posts = $this->_get_query_result( array(
			'date_query' => array(
				array(
					'week' => 10,
				),
			),
		) );

		$this->assertCount( 0, $posts );
	}

	public function test_date_query_day_expecting_results() {
		$posts = $this->_get_query_result( array(
			'date_query' => array(
				array(
					'day' => 17,
				),
			),
		) );

		$expected_dates = array(
			'2005-02-17 00:00:15',
			'2010-06-17 17:09:30',
		);

		$this->assertEquals( $expected_dates, wp_list_pluck( $posts, 'post_date' ) );
	}

	public function test_date_query_day_expecting_noresults() {
		$posts = $this->_get_query_result( array(
			'date_query' => array(
				array(
					'day' => 19,
				),
			),
		) );

		$this->assertCount( 0, $posts );
	}

	public function test_date_query_dayofweek_expecting_results() {
		$posts = $this->_get_query_result( array(
			'date_query' => array(
				array(
					'dayofweek' => 7,
				),
			),
		) );

		$expected_dates = array(
			'1984-07-28 19:28:56',
			'2004-01-03 08:54:10',
			'2004-05-22 12:34:12',
			'2005-12-31 23:59:20',
			'2008-03-29 09:04:25',
		);

		$this->assertEquals( $expected_dates, wp_list_pluck( $posts, 'post_date' ) );
	}

	public function test_date_query_hour_expecting_results() {
		$posts = $this->_get_query_result( array(
			'date_query' => array(
				array(
					'hour' => 13,
				),
			),
		) );

		$expected_dates = array(
			'2008-12-10 13:06:27',
		);

		$this->assertEquals( $expected_dates, wp_list_pluck( $posts, 'post_date' ) );
	}

	public function test_date_query_hour_expecting_noresults() {
		$posts = $this->_get_query_result( array(
			'date_query' => array(
				array(
					'hour' => 2,
				),
			),
		) );

		$this->assertCount( 0, $posts );
	}

	public function test_date_query_minute_expecting_results() {
		$posts = $this->_get_query_result( array(
			'date_query' => array(
				array(
					'minute' => 56,
				),
			),
		) );

		$expected_dates = array(
			'2011-07-04 01:56:32',
		);

		$this->assertEquals( $expected_dates, wp_list_pluck( $posts, 'post_date' ) );
	}

	public function test_date_query_minute_expecting_noresults() {
		$posts = $this->_get_query_result( array(
			'date_query' => array(
				array(
					'minute' => 2,
				),
			),
		) );

		$this->assertCount( 0, $posts );
	}

	public function test_date_query_second_expecting_results() {
		$posts = $this->_get_query_result( array(
			'date_query' => array(
				array(
					'second' => 21,
				),
			),
		) );

		$expected_dates = array(
			'2007-01-22 03:49:21',
		);

		$this->assertEquals( $expected_dates, wp_list_pluck( $posts, 'post_date' ) );
	}

	public function test_date_query_second_expecting_noresults() {
		$posts = $this->_get_query_result( array(
			'date_query' => array(
				array(
					'second' => 2,
				),
			),
		) );

		$this->assertCount( 0, $posts );
	}

	public function test_date_query_between_two_times() {
		$posts = $this->_get_query_result( array(
			'date_query' => array(
				array(
					'hour'    => 9,
					'minute'  => 0,
					'compare' => '>=',
				),
				array(
					'hour'    => '17',
					'minute'  => '0',
					'compare' => '<=',
				),
			),
		) );

		$expected_dates = array(
			'1972-05-24 14:53:45',
			'2004-05-22 12:34:12',
			'2008-03-29 09:04:25',
			'2008-07-15 11:32:26',
			'2008-12-10 13:06:27',
			'2009-12-18 10:42:29',
			'2011-02-23 12:12:31',
			'2011-12-12 16:39:33',
			'2012-06-13 14:03:34',
			'2025-04-20 10:13:00',
			'2025-04-20 10:13:01',
			'2025-05-20 10:13:01',
		);

		$this->assertEquals( $expected_dates, wp_list_pluck( $posts, 'post_date' ) );
	}

	public function test_date_query_relation_or() {
		$posts = $this->_get_query_result( array(
			'date_query' => array(
				array(
					'hour' => 14,
				),
				array(
					'minute' => 34,
				),
				'relation' => 'OR',
			),
		) );

		$expected_dates = array(
			'1972-05-24 14:53:45',
			'2004-05-22 12:34:12',
			'2012-06-13 14:03:34',
		);

		$this->assertEquals( $expected_dates, wp_list_pluck( $posts, 'post_date' ) );
	}

	public function test_date_query_compare_greater_than_or_equal_to() {
		$posts = $this->_get_query_result( array(
			'date_query' => array(
				array(
					'hour' => 14,
					'minute' => 34,
				),
				'compare' => '>=',
			),
		) );

		$expected_dates = array(
			'1972-05-24 14:53:45',
			'1984-07-28 19:28:56',
			'2003-05-27 22:45:07',
			'2005-12-31 23:59:20',
			'2007-05-16 17:32:22',
			'2009-06-11 21:30:28',
			'2010-06-17 17:09:30',
			'2011-12-12 16:39:33',
		);

		$this->assertEquals( $expected_dates, wp_list_pluck( $posts, 'post_date' ) );
	}

	public function test_date_params_monthnum_m_duplicate() {
		$posts = $this->_get_query_result( array(
			'date_query' => array(
				'month' => 5,
				'monthnum' => 9
			),
		) );

		$expected_dates = array(
			'1972-05-24 14:53:45',
			'2003-05-27 22:45:07',
			'2004-05-22 12:34:12',
			'2007-05-16 17:32:22',
			'2025-05-20 10:13:01',
		);

		$this->assertEquals( $expected_dates, wp_list_pluck( $posts, 'post_date' ) );

		$this->assertContains( "AND ( ( MONTH( post_date ) = 5 ) ) AND", $this->q->request );

		$this->assertNotContains( "AND ( ( MONTH( post_date ) = 5 AND MONTH( post_date ) = 9 ) ) AND", $this->q->request );
	}

	public function test_date_params_week_w_duplicate() {
		$posts = $this->_get_query_result( array(
			'date_query' => array(
				'week' => 21,
				'w' => 22
			),
		) );

		$expected_dates = array(
			'1972-05-24 14:53:45',
			'2004-05-22 12:34:12',
			'2025-05-20 10:13:01',
		);


		$this->assertEquals( $expected_dates, wp_list_pluck( $posts, 'post_date' ) );

		$this->assertContains( "AND ( ( WEEK( post_date, 1 ) = 21 ) ) AND", $this->q->request );

		$this->assertNotContains( "AND ( ( WEEK( post_date, 1 ) = 21 AND WEEK( post_date, 1 ) = 22 ) ) AND", $this->q->request );
	}
}