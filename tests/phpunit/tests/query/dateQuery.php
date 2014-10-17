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
		unset( $this->q );
		$this->q = new WP_Query();
	}

	public function _get_query_result( $args = array() ) {
		$args = wp_parse_args( $args, array(
			'post_status'            => 'any', // For the future post
			'posts_per_page'         => '-1',  // To make sure results are accurate
			'orderby'                => 'ID',  // Same order they were created
			'order'                  => 'ASC',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
		) );

		return $this->q->query( $args );
	}

	public function test_date_query_before_array() {
		$this->create_posts();

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
		$this->create_posts();

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
		$this->create_posts();

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
		$this->create_posts();

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
		$this->create_posts();

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
		$this->create_posts();

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
		$this->create_posts();

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

	/**
	 * @ticket 26653
	 */
	public function test_date_query_inclusive_between_dates() {
		$this->create_posts();

		$posts = $this->_get_query_result( array(
			'date_query' => array(
				'after' => array(
					'year' => 2007,
					'month' => 1
				),
				'before' => array(
					'year' => 2008,
					'month' => 12
				),
				'inclusive' => true
			),
		) );


		$expected_dates = array(
			'2007-01-22 03:49:21',
			'2007-05-16 17:32:22',
			'2007-09-24 07:17:23',
			'2008-03-29 09:04:25',
			'2008-07-15 11:32:26',
			'2008-12-10 13:06:27',
		);

		$this->assertEquals( $expected_dates, wp_list_pluck( $posts, 'post_date' ) );
	}

	/**
	 * @ticket 29908
	 */
	public function test_beforeafter_with_date_string_Y() {
		$p1 = $this->factory->post->create( array(
			'post_date' => '2008-05-06 13:00:00',
		) );
		$p2 = $this->factory->post->create( array(
			'post_date' => '2007-05-07 13:00:00',
		) );

		$before_posts = $this->_get_query_result( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'date_query' => array(
				'before' => '2008',
			),
		) );

		$after_posts = $this->_get_query_result( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'date_query' => array(
				'after' => '2007',
			),
		) );

		$this->assertEquals( array( $p2 ), $before_posts );
		$this->assertEquals( array( $p1 ), $after_posts );
	}

	/**
	 * @ticket 29908
	 */
	public function test_beforeafter_with_date_string_Y_inclusive() {
		$p1 = $this->factory->post->create( array(
			'post_date' => '2008-05-06 13:00:00',
		) );
		$p2 = $this->factory->post->create( array(
			'post_date' => '2007-05-07 13:00:00',
		) );

		$before_posts = $this->_get_query_result( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'date_query' => array(
				'before' => '2008',
				'inclusive' => true,
			),
		) );

		$after_posts = $this->_get_query_result( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'date_query' => array(
				'after' => '2007',
				'inclusive' => true,
			),
		) );

		$this->assertEqualSets( array( $p1, $p2 ), $before_posts );
		$this->assertEqualSets( array( $p1, $p2 ), $after_posts );
	}

	/**
	 * @ticket 29908
	 */
	public function test_beforeafter_with_date_string_Ym() {
		$p1 = $this->factory->post->create( array(
			'post_date' => '2008-05-06 13:00:00',
		) );
		$p2 = $this->factory->post->create( array(
			'post_date' => '2008-04-07 13:00:00',
		) );

		$before_posts = $this->_get_query_result( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'date_query' => array(
				'before' => '2008-05',
			),
		) );

		$after_posts = $this->_get_query_result( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'date_query' => array(
				'after' => '2008-04',
			),
		) );

		$this->assertEquals( array( $p2 ), $before_posts );
		$this->assertEquals( array( $p1 ), $after_posts );
	}

	/**
	 * @ticket 29908
	 */
	public function test_beforeafter_with_date_string_Ym_inclusive() {
		$p1 = $this->factory->post->create( array(
			'post_date' => '2008-05-06 13:00:00',
		) );
		$p2 = $this->factory->post->create( array(
			'post_date' => '2008-04-07 13:00:00',
		) );

		$before_posts = $this->_get_query_result( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'date_query' => array(
				'before' => '2008-05',
				'inclusive' => true,
			),
		) );

		$after_posts = $this->_get_query_result( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'date_query' => array(
				'after' => '2008-04',
				'inclusive' => true,
			),
		) );

		$this->assertEqualSets( array( $p1, $p2 ), $before_posts );
		$this->assertEqualSets( array( $p1, $p2 ), $after_posts );
	}

	/**
	 * @ticket 29908
	 */
	public function test_beforeafter_with_date_string_Ymd() {
		$p1 = $this->factory->post->create( array(
			'post_date' => '2008-05-06 13:00:00',
		) );
		$p2 = $this->factory->post->create( array(
			'post_date' => '2008-05-05 13:00:00',
		) );

		$before_posts = $this->_get_query_result( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'date_query' => array(
				'before' => '2008-05-06',
			),
		) );

		$after_posts = $this->_get_query_result( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'date_query' => array(
				'after' => '2008-05-05',
			),
		) );

		$this->assertEquals( array( $p2 ), $before_posts );
		$this->assertEquals( array( $p1 ), $after_posts );
	}

	/**
	 * @ticket 29908
	 */
	public function test_beforeafter_with_date_string_Ymd_inclusive() {
		$p1 = $this->factory->post->create( array(
			'post_date' => '2008-05-06 13:00:00',
		) );
		$p2 = $this->factory->post->create( array(
			'post_date' => '2008-05-05 13:00:00',
		) );

		$before_posts = $this->_get_query_result( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'date_query' => array(
				'before' => '2008-05-06',
				'inclusive' => true,
			),
		) );

		$after_posts = $this->_get_query_result( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'date_query' => array(
				'after' => '2008-05-05',
				'inclusive' => true,
			),
		) );

		$this->assertEqualSets( array( $p1, $p2 ), $before_posts );
		$this->assertEqualSets( array( $p1, $p2 ), $after_posts );
	}

	/**
	 * @ticket 29908
	 */
	public function test_beforeafter_with_date_string_YmdHi() {
		$p1 = $this->factory->post->create( array(
			'post_date' => '2008-05-06 14:05:00',
		) );
		$p2 = $this->factory->post->create( array(
			'post_date' => '2008-05-06 14:04:00',
		) );

		$before_posts = $this->_get_query_result( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'date_query' => array(
				'before' => '2008-05-06 14:05',
			),
		) );

		$after_posts = $this->_get_query_result( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'date_query' => array(
				'after' => '2008-05-06 14:04',
			),
		) );

		$this->assertEquals( array( $p2 ), $before_posts );
		$this->assertEquals( array( $p1 ), $after_posts );
	}

	/**
	 * @ticket 29908
	 */
	public function test_beforeafter_with_date_string_YmdHi_inclusive() {
		$p1 = $this->factory->post->create( array(
			'post_date' => '2008-05-06 14:05:00',
		) );
		$p2 = $this->factory->post->create( array(
			'post_date' => '2008-05-06 14:04:00',
		) );

		$before_posts = $this->_get_query_result( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'date_query' => array(
				'before' => '2008-05-06 14:05',
				'inclusive' => true,
			),
		) );

		$after_posts = $this->_get_query_result( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'date_query' => array(
				'after' => '2008-05-06 14:04',
				'inclusive' => true,
			),
		) );

		$this->assertEqualSets( array( $p1, $p2 ), $before_posts );
		$this->assertEqualSets( array( $p1, $p2 ), $after_posts );
	}

	/**
	 * @ticket 29908
	 */
	public function test_beforeafter_with_date_string_YmdHis() {
		$p1 = $this->factory->post->create( array(
			'post_date' => '2008-05-06 14:05:15',
		) );
		$p2 = $this->factory->post->create( array(
			'post_date' => '2008-05-06 14:05:14',
		) );

		$before_posts = $this->_get_query_result( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'date_query' => array(
				'before' => '2008-05-06 14:05:15',
			),
		) );

		$after_posts = $this->_get_query_result( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'date_query' => array(
				'after' => '2008-05-06 14:05:14',
			),
		) );

		$this->assertEquals( array( $p2 ), $before_posts );
		$this->assertEquals( array( $p1 ), $after_posts );
	}

	/**
	 * @ticket 29908
	 */
	public function test_beforeafter_with_date_string_YmdHis_inclusive() {
		$p1 = $this->factory->post->create( array(
			'post_date' => '2008-05-06 14:04:15',
		) );
		$p2 = $this->factory->post->create( array(
			'post_date' => '2008-05-06 14:04:14',
		) );

		$before_posts = $this->_get_query_result( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'date_query' => array(
				'before' => '2008-05-06 14:04:15',
				'inclusive' => true,
			),
		) );

		$after_posts = $this->_get_query_result( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'date_query' => array(
				'after' => '2008-05-06 14:04:14',
				'inclusive' => true,
			),
		) );

		$this->assertEqualSets( array( $p1, $p2 ), $before_posts );
		$this->assertEqualSets( array( $p1, $p2 ), $after_posts );
	}

	/**
	 * @ticket 29908
	 */
	public function test_beforeafter_with_date_string_non_parseable() {
		$p1 = $this->factory->post->create( array(
			'post_date' => '2008-05-06 14:05:15',
		) );
		$p2 = $this->factory->post->create( array(
			'post_date' => '2008-05-06 14:05:14',
		) );

		$before_posts = $this->_get_query_result( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'date_query' => array(
				'before' => 'June 12, 2008',
			),
		) );

		$after_posts = $this->_get_query_result( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'date_query' => array(
				'after' => 'June 12, 2007',
			),
		) );

		$this->assertEquals( array( $p1, $p2 ), $before_posts );
	}

	public function test_date_query_year_expecting_results() {
		$this->create_posts();

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
		$this->create_posts();

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
		$this->create_posts();

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
		$this->create_posts();

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
		$this->create_posts();

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
		$this->create_posts();

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
		$this->create_posts();

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
		$this->create_posts();

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
		$this->create_posts();

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
		$this->create_posts();

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
		$this->create_posts();

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
		$this->create_posts();

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
		$this->create_posts();

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
		$this->create_posts();

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
		$this->create_posts();

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
		$this->create_posts();

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
		$this->create_posts();

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
		$this->create_posts();

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
		global $wpdb;

		$this->create_posts();

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

		$this->assertContains( "MONTH( $wpdb->posts.post_date ) = 5", $this->q->request );
		$this->assertNotContains( "MONTH( $wpdb->posts.post_date ) = 9", $this->q->request );
	}

	public function test_date_params_week_w_duplicate() {
		global $wpdb;

		$this->create_posts();

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

		$this->assertContains( "WEEK( $wpdb->posts.post_date, 1 ) = 21", $this->q->request );
		$this->assertNotContains( "WEEK( $wpdb->posts.post_date, 1 ) = 22", $this->q->request );
	}

	/**
	 * @ticket 25775
	 */
	public function test_date_query_with_taxonomy_join() {
		$p1 = $this->factory->post->create( array(
			'post_date' => '2013-04-27 01:01:01',
		) );
		$p2 = $this->factory->post->create( array(
			'post_date' => '2013-03-21 01:01:01',
		) );

		register_taxonomy( 'foo', 'post' );
		wp_set_object_terms( $p1, 'bar', 'foo' );

		$posts = $this->_get_query_result( array(
			'date_query' => array(
				'year' => 2013,
			),
			'tax_query' => array(
				array(
					'taxonomy' => 'foo',
					'terms' => array( 'bar' ),
					'field' => 'name',
				),
			),
		) );

		_unregister_taxonomy( 'foo' );

		$this->assertEquals( array( $p1 ), wp_list_pluck( $posts, 'ID' ) );
	}

	/**
	 * @ticket 29822
	 */
	public function test_date_query_one_nested_query() {
		$this->create_posts();

		$posts = $this->_get_query_result( array(
			'date_query' => array(
				'relation' => 'OR',
				array(
					'relation' => 'AND',
					array(
						'year' => 2004,
					),
					array(
						'month' => 1,
					),
				),
				array(
					'year' => 1984,
				),
			),
		) );

		$expected_dates = array(
			'1984-07-28 19:28:56',
			'2004-01-03 08:54:10',
		);

		$this->assertEquals( $expected_dates, wp_list_pluck( $posts, 'post_date' ) );
	}

	/**
	 * @ticket 29822
	 */
	public function test_date_query_one_nested_query_multiple_columns_relation_and() {
		$p1 = $this->factory->post->create( array(
			'post_date' => '2012-03-05 15:30:55',
		) );
		$this->update_post_modified( $p1, '2014-11-03 14:43:00' );

		$p2 = $this->factory->post->create( array(
			'post_date' => '2012-05-05 15:30:55',
		) );
		$this->update_post_modified( $p2, '2014-10-03 14:43:00' );

		$p3 = $this->factory->post->create( array(
			'post_date' => '2013-05-05 15:30:55',
		) );
		$this->update_post_modified( $p3, '2014-10-03 14:43:00' );

		$p4 = $this->factory->post->create( array(
			'post_date' => '2012-02-05 15:30:55',
		) );
		$this->update_post_modified( $p4, '2012-12-03 14:43:00' );

		$q = new WP_Query( array(
			'date_query' => array(
				'relation' => 'AND',
				array(
					'column' => 'post_date',
					array(
						'year' => 2012,
					),
				),
				array(
					'column' => 'post_modified',
					array(
						'year' => 2014,
					),
				),
			),
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'post_status' => 'publish',
		) );

		$expected = array( $p1, $p2, );

		$this->assertEqualSets( $expected, $q->posts );
	}

	/**
	 * @ticket 29822
	 */
	public function test_date_query_nested_query_multiple_columns_mixed_relations() {
		$p1 = $this->factory->post->create( array(
			'post_date' => '2012-03-05 15:30:55',
		) );
		$this->update_post_modified( $p1, '2014-11-03 14:43:00' );

		$p2 = $this->factory->post->create( array(
			'post_date' => '2012-05-05 15:30:55',
		) );
		$this->update_post_modified( $p2, '2014-10-03 14:43:00' );

		$p3 = $this->factory->post->create( array(
			'post_date' => '2013-05-05 15:30:55',
		) );
		$this->update_post_modified( $p3, '2014-10-03 14:43:00' );

		$p4 = $this->factory->post->create( array(
			'post_date' => '2012-02-05 15:30:55',
		) );
		$this->update_post_modified( $p4, '2012-12-03 14:43:00' );

		$p5 = $this->factory->post->create( array(
			'post_date' => '2014-02-05 15:30:55',
		) );
		$this->update_post_modified( $p5, '2013-12-03 14:43:00' );

		$q = new WP_Query( array(
			'date_query' => array(
				'relation' => 'OR',
				array(
					'relation' => 'AND',
					array(
						'column' => 'post_date',
						array(
							'day' => 05,
						),
					),
					array(
						'column' => 'post_date',
						array(
							'before' => array(
								'year' => 2012,
								'month' => 4,
							),
						),
					),
				),
				array(
					'column' => 'post_modified',
					array(
						'month' => 12,
					),
				),
			),
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'post_status' => 'publish',
		) );

		$expected = array( $p1, $p4, $p5, );
		$this->assertEqualSets( $expected, $q->posts );
	}

	/** Helpers **********************************************************/

	protected function create_posts() {
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
	}

	/**
	 * There's no way to change post_modified through the API.
	 */
	protected function update_post_modified( $post_id, $date ) {
		global $wpdb;
		return $wpdb->update(
			$wpdb->posts,
			array(
				'post_modified' => $date,
				'post_modified_gmt' => $date,
			),
			array(
				'ID' => $post_id,
			),
			array(
				'%s',
				'%s',
			),
			array(
				'%d',
			)
		);
	}
}
