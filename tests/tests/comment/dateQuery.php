<?php

/**
 * Tests to make sure querying posts based on various date parameters
 * using "date_query" works as expected.
 *
 * No need to do a full repeat of all of the post tests again since
 * the query SQL is the same for both just with a different column.
 *
 * @ticket 18694
 *
 * @group comment
 * @group date
 * @group datequery
 */
class Tests_Comment_DateQuery extends WP_UnitTestCase {

	public $posts = array();

	public function setUp() {
		parent::setUp();

		// Just some dummy posts to use as parents for comments
		for ( $i = 1; $i <= 2; $i++ ) {
			$this->posts[$i] = $this->factory->post->create();
		}

		// Be careful modifying this. Tests are coded to expect this exact sample data.
		// Format is 'datetime' => 'post number (not ID)'
		$comment_dates = array(
			'2007-01-22 03:49:21' => 1,
			'2007-05-16 17:32:22' => 1,
			'2007-09-24 07:17:23' => 1,
			'2008-03-29 09:04:25' => 1,
			'2008-07-15 11:32:26' => 2, // This one should never be in the results
			'2008-12-10 13:06:27' => 1,
			'2009-06-11 21:30:28' => 1,
			'2009-12-18 10:42:29' => 1,
		);

		foreach ( $comment_dates as $comment_date => $comment_parent ) {
			$result = $this->factory->comment->create( array(
				'comment_date'    => $comment_date,
				'comment_post_ID' => $this->posts[ $comment_parent ],
			) );
		}
	}

	public function _get_query_result( $args = array() ) {
		$args = wp_parse_args( $args, array(
			'post_id' => $this->posts[1],
			'orderby' => 'comment_ID',  // Same order they were created
			'order'   => 'ASC',
		) );

		return get_comments( $args );
	}

	public function test_year() {
		$comments = $this->_get_query_result( array(
			'date_query' => array(
				array(
					'year' => 2008,
				),
			),
		) );

		$expected_dates = array(
			'2008-03-29 09:04:25',
			'2008-12-10 13:06:27',
		);

		$this->assertEquals( $expected_dates, wp_list_pluck( $comments, 'comment_date' ) );
	}
}