<?php

/**
 * @group comment
 *
 * Testing items that are only testable by grabbing the markup of `comments_template()` from the output buffer.
 */
class Tests_Comment_CommentsTemplate extends WP_UnitTestCase {

	/**
	 * @ticket 8071
	 */
	public function test_should_respect_comment_order_asc_when_default_comments_page_is_newest() {
		$now = time();
		$p = self::factory()->post->create();
		$comment_1 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '1',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 100 ),
		) );
		$comment_2 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '2',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 200 ),
		) );

		update_option( 'comment_order', 'asc' );
		update_option( 'default_comments_page', 'newest' );

		$this->go_to( get_permalink( $p ) );
		$found = get_echo( 'comments_template' );

		// Life in the fast lane.
		$comments = preg_match_all( '/id="comment-([0-9]+)"/', $found, $matches );

		$found_cids = array_map( 'intval', $matches[1] );
		$this->assertSame( array( $comment_2, $comment_1 ), $found_cids );
	}

	/**
	 * @ticket 8071
	 */
	public function test_should_respect_comment_order_desc_when_default_comments_page_is_newest() {
		$now = time();
		$p = self::factory()->post->create();
		$comment_1 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '1',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 100 ),
		) );
		$comment_2 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '2',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 200 ),
		) );

		update_option( 'comment_order', 'desc' );
		update_option( 'default_comments_page', 'newest' );

		$this->go_to( get_permalink( $p ) );
		$found = get_echo( 'comments_template' );

		// Life in the fast lane.
		$comments = preg_match_all( '/id="comment-([0-9]+)"/', $found, $matches );

		$found_cids = array_map( 'intval', $matches[1] );
		$this->assertSame( array( $comment_1, $comment_2 ), $found_cids );
	}

	/**
	 * @ticket 8071
	 */
	public function test_should_respect_comment_order_asc_when_default_comments_page_is_oldest() {
		$now = time();
		$p = self::factory()->post->create();
		$comment_1 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '1',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 100 ),
		) );
		$comment_2 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '2',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 200 ),
		) );

		update_option( 'comment_order', 'asc' );
		update_option( 'default_comments_page', 'oldest' );

		$this->go_to( get_permalink( $p ) );
		$found = get_echo( 'comments_template' );

		// Life in the fast lane.
		$comments = preg_match_all( '/id="comment-([0-9]+)"/', $found, $matches );

		$found_cids = array_map( 'intval', $matches[1] );
		$this->assertSame( array( $comment_2, $comment_1 ), $found_cids );
	}

	/**
	 * @ticket 8071
	 */
	public function test_should_respect_comment_order_desc_when_default_comments_page_is_oldest() {
		$now = time();
		$p = self::factory()->post->create();
		$comment_1 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '1',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 100 ),
		) );
		$comment_2 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '2',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 200 ),
		) );

		update_option( 'comment_order', 'desc' );
		update_option( 'default_comments_page', 'oldest' );

		$this->go_to( get_permalink( $p ) );
		$found = get_echo( 'comments_template' );

		// Life in the fast lane.
		$comments = preg_match_all( '/id="comment-([0-9]+)"/', $found, $matches );

		$found_cids = array_map( 'intval', $matches[1] );
		$this->assertSame( array( $comment_1, $comment_2 ), $found_cids );
	}

	/**
	 * @ticket 8071
	 */
	public function test_should_respect_comment_order_asc_when_default_comments_page_is_newest_on_subsequent_pages() {
		$now = time();
		$p = self::factory()->post->create();
		$comment_1 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '1',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 100 ),
		) );
		$comment_2 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '2',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 200 ),
		) );
		$comment_3 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '3',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 300 ),
		) );
		$comment_4 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '4',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 400 ),
		) );
		$comment_5 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '3',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 500 ),
		) );
		$comment_6 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '4',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 600 ),
		) );

		update_option( 'comment_order', 'asc' );
		update_option( 'default_comments_page', 'newest' );
		update_option( 'page_comments', '1' );

		$link = add_query_arg( array(
			'cpage' => 2,
			'comments_per_page' => 2,
		), get_permalink( $p ) );

		$this->go_to( $link );
		$found = get_echo( 'comments_template' );

		// Life in the fast lane.
		$comments = preg_match_all( '/id="comment-([0-9]+)"/', $found, $matches );

		$found_cids = array_map( 'intval', $matches[1] );
		$this->assertSame( array( $comment_4, $comment_3 ), $found_cids );
	}

	/**
	 * @ticket 8071
	 */
	public function test_should_respect_comment_order_desc_when_default_comments_page_is_newest_on_subsequent_pages() {
		$now = time();
		$p = self::factory()->post->create();
		$comment_1 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '1',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 100 ),
		) );
		$comment_2 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '2',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 200 ),
		) );
		$comment_3 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '3',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 300 ),
		) );
		$comment_4 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '4',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 400 ),
		) );
		$comment_5 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '3',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 500 ),
		) );
		$comment_6 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '4',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 600 ),
		) );

		update_option( 'comment_order', 'desc' );
		update_option( 'default_comments_page', 'newest' );
		update_option( 'page_comments', '1' );

		$link = add_query_arg( array(
			'cpage' => 2,
			'comments_per_page' => 2,
		), get_permalink( $p ) );

		$this->go_to( $link );
		$found = get_echo( 'comments_template' );

		// Life in the fast lane.
		$comments = preg_match_all( '/id="comment-([0-9]+)"/', $found, $matches );

		$found_cids = array_map( 'intval', $matches[1] );
		$this->assertSame( array( $comment_3, $comment_4 ), $found_cids );
	}

	/**
	 * @ticket 8071
	 */
	public function test_should_respect_comment_order_asc_when_default_comments_page_is_oldest_on_subsequent_pages() {
		$now = time();
		$p = self::factory()->post->create();
		$comment_1 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '1',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 100 ),
		) );
		$comment_2 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '2',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 200 ),
		) );
		$comment_3 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '3',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 300 ),
		) );
		$comment_4 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '4',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 400 ),
		) );

		update_option( 'comment_order', 'asc' );
		update_option( 'default_comments_page', 'oldest' );
		update_option( 'page_comments', '1' );

		$link = add_query_arg( array(
			'cpage' => 2,
			'comments_per_page' => 2,
		), get_permalink( $p ) );

		$this->go_to( $link );
		$found = get_echo( 'comments_template' );

		// Life in the fast lane.
		$comments = preg_match_all( '/id="comment-([0-9]+)"/', $found, $matches );

		$found_cids = array_map( 'intval', $matches[1] );
		$this->assertSame( array( $comment_2, $comment_1 ), $found_cids );
	}

	/**
	 * @ticket 8071
	 */
	public function test_should_respect_comment_order_desc_when_default_comments_page_is_oldest_on_subsequent_pages() {
		$now = time();
		$p = self::factory()->post->create();
		$comment_1 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '1',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 100 ),
		) );
		$comment_2 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '2',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 200 ),
		) );
		$comment_3 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '3',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 300 ),
		) );
		$comment_4 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '4',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 400 ),
		) );

		update_option( 'comment_order', 'desc' );
		update_option( 'default_comments_page', 'oldest' );
		update_option( 'page_comments', '1' );

		$link = add_query_arg( array(
			'cpage' => 2,
			'comments_per_page' => 2,
		), get_permalink( $p ) );

		$this->go_to( $link );
		$found = get_echo( 'comments_template' );

		// Life in the fast lane.
		$comments = preg_match_all( '/id="comment-([0-9]+)"/', $found, $matches );

		$found_cids = array_map( 'intval', $matches[1] );
		$this->assertSame( array( $comment_1, $comment_2 ), $found_cids );
	}

	/**
	 * @ticket 8071
	 * @ticket 34073
	 * @ticket 29462
	 */
	public function test_last_page_of_comments_should_be_full_when_default_comment_page_is_newest() {
		$now = time();
		$p = self::factory()->post->create();
		$comment_1 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '1',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 100 ),
		) );
		$comment_2 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '2',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 200 ),
		) );
		$comment_3 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '3',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 300 ),
		) );

		update_option( 'default_comments_page', 'newest' );
		update_option( 'comment_order', 'desc' );
		update_option( 'page_comments', '1' );

		$link = add_query_arg( array(
			'cpage' => 1,
			'comments_per_page' => 2,
		), get_permalink( $p ) );

		$this->go_to( $link );
		$found = get_echo( 'comments_template' );

		$comments = preg_match_all( '/id="comment-([0-9]+)"/', $found, $matches );

		$found_cids = array_map( 'intval', $matches[1] );

		$this->assertSame( array( $comment_2, $comment_3 ), $found_cids );
	}

	/**
	 * @ticket 8071
	 * @ticket 34073
	 * @ticket 29462
	 */
	public function test_first_page_of_comments_should_have_remainder_when_default_comments_page_is_newest() {
		$now = time();
		$p = self::factory()->post->create();
		$comment_1 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '1',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 100 ),
		) );
		$comment_2 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '2',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 200 ),
		) );
		$comment_3 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '3',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 300 ),
		) );

		update_option( 'default_comments_page', 'newest' );
		update_option( 'comment_order', 'desc' );
		update_option( 'page_comments', '1' );

		$link = add_query_arg( array(
			'cpage' => 2,
			'comments_per_page' => 2,
		), get_permalink( $p ) );

		$this->go_to( $link );
		$found = get_echo( 'comments_template' );

		$comments = preg_match_all( '/id="comment-([0-9]+)"/', $found, $matches );

		$found_cids = array_map( 'intval', $matches[1] );

		$this->assertSame( array( $comment_1 ), $found_cids );
	}

	/**
	 * @ticket 34073
	 */
	public function test_comment_permalinks_should_be_correct_when_using_default_display_callback_with_default_comment_page_oldest() {
		$now = time();
		$p = self::factory()->post->create();
		$comment_1 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '1',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 100 ),
		) );
		$comment_2 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '2',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 200 ),
		) );
		$comment_3 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '3',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 300 ),
		) );
		$comment_4 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '4',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 400 ),
		) );

		update_option( 'comment_order', 'desc' );
		update_option( 'default_comments_page', 'oldest' );
		update_option( 'page_comments', '1' );

		$link_p1 = add_query_arg( array(
			'comments_per_page' => 2,
		), get_permalink( $p ) );

		$this->go_to( $link_p1 );

		$found_p1 = get_echo( 'comments_template' );

		// Find the comment permalinks.
		preg_match_all( '|href="(.*?#comment-([0-9]+))|', $found_p1, $matches );

		// This is the main post page, so we don't expect any cpage param.
		foreach ( $matches[1] as $m ) {
			$this->assertNotContains( 'cpage', $m );
		}

		$link_p2 = add_query_arg( array(
			'cpage' => 2,
			'comments_per_page' => 2,
		), get_permalink( $p ) );

		$this->go_to( $link_p2 );

		$found_p2 = get_echo( 'comments_template' );

		// Find the comment permalinks.
		preg_match_all( '|href="(.*?#comment-([0-9]+))|', $found_p2, $matches );

		// They should all be on page 2.
		foreach ( $matches[1] as $m ) {
			$this->assertContains( 'cpage=2', $m );
		}
	}

	/**
	 * @ticket 34073
	 */
	public function test_comment_permalinks_should_be_correct_when_using_default_display_callback_with_default_comment_page_newest() {
		$now = time();
		$p = self::factory()->post->create();
		$comment_1 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '1',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 100 ),
		) );
		$comment_2 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '2',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 200 ),
		) );
		$comment_3 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '3',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 300 ),
		) );
		$comment_4 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '4',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 400 ),
		) );
		$comment_5 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '4',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 500 ),
		) );
		$comment_6 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '4',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 600 ),
		) );

		update_option( 'comment_order', 'desc' );
		update_option( 'default_comments_page', 'newest' );
		update_option( 'page_comments', '1' );

		$link_p0 = add_query_arg( array(
			'comments_per_page' => 2,
		), get_permalink( $p ) );

		$this->go_to( $link_p0 );

		$found_p0 = get_echo( 'comments_template' );

		// Find the comment permalinks.
		preg_match_all( '|href="(.*?#comment-([0-9]+))|', $found_p0, $matches );

		foreach ( $matches[1] as $m ) {
			$this->assertContains( 'cpage=3', $m );
		}

		$link_p2 = add_query_arg( array(
			'cpage' => 2,
			'comments_per_page' => 2,
		), get_permalink( $p ) );

		$this->go_to( $link_p2 );

		$found_p2 = get_echo( 'comments_template' );

		// Find the comment permalinks.
		preg_match_all( '|href="(.*?#comment-([0-9]+))|', $found_p2, $matches );

		// They should all be on page 2.
		foreach ( $matches[1] as $m ) {
			$this->assertContains( 'cpage=2', $m );
		}

		// p1 is the last page (neat!).
		$link_p1 = add_query_arg( array(
			'cpage' => 1,
			'comments_per_page' => 2,
		), get_permalink( $p ) );

		$this->go_to( $link_p1 );

		$found_p1 = get_echo( 'comments_template' );

		// Find the comment permalinks.
		preg_match_all( '|href="(.*?#comment-([0-9]+))|', $found_p1, $matches );

		// They should all be on page 2.
		foreach ( $matches[1] as $m ) {
			$this->assertContains( 'cpage=1', $m );
		}
	}

	/**
	 * @ticket 35068
	 */
	public function test_query_offset_should_not_include_unapproved_comments() {
		$now = time();
		$p = self::factory()->post->create();
		$comment_1 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '1',
			'comment_approved' => '0',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 100 ),
		) );
		$comment_2 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '2',
			'comment_approved' => '0',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 200 ),
		) );
		$comment_3 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '3',
			'comment_approved' => '0',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 300 ),
		) );
		$comment_4 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '4',
			'comment_approved' => '1',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 400 ),
		) );

		update_option( 'comment_order', 'asc' );
		update_option( 'default_comments_page', 'newest' );
		update_option( 'page_comments', 1 );
		update_option( 'comments_per_page', 2 );

		$this->go_to( get_permalink( $p ) );
		$found = get_echo( 'comments_template' );

		// Find the found comments in the markup.
		preg_match_all( '|id="comment-([0-9]+)|', $found, $matches );

		$found_cids = array_map( 'intval', $matches[1] );
		$this->assertSame( array( $comment_4 ), $found_cids );
	}

	/**
	 * @ticket 35068
	 */
	public function test_query_offset_should_include_unapproved_comments() {
		$comment_author_email = 'foo@example.com';

		$now = time();
		$p = self::factory()->post->create();
		$comment_1 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '1',
			'comment_approved' => '0',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 100 ),
		) );
		$comment_2 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '2',
			'comment_approved' => '0',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 200 ),
		) );
		$comment_3 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '3',
			'comment_approved' => '0',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 100 ),
			'comment_author_email' => $comment_author_email,
		) );
		$comment_4 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '4',
			'comment_approved' => '0',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 200 ),
			'comment_author_email' => $comment_author_email,
		) );
		$comment_5 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '5',
			'comment_approved' => '0',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 300 ),
			'comment_author_email' => $comment_author_email,
		) );
		$comment_6 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '6',
			'comment_approved' => '1',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 400 ),
		) );

		update_option( 'comment_order', 'asc' );
		update_option( 'default_comments_page', 'newest' );
		update_option( 'page_comments', 1 );
		update_option( 'comments_per_page', 2 );

		add_filter( 'wp_get_current_commenter', array( $this, 'fake_current_commenter' ) );
		$this->go_to( get_permalink( $p ) );
		$found = get_echo( 'comments_template' );
		remove_filter( 'wp_get_current_commenter', array( $this, 'fake_current_commenter' ) );

		// Find the found comments in the markup.
		preg_match_all( '|id="comment-([0-9]+)|', $found, $matches );

		$found_cids = array_map( 'intval', $matches[1] );
		$this->assertSame( array( $comment_4, $comment_3 ), $found_cids );
	}

	public function fake_current_commenter( $commenter ) {
		$commenter['comment_author_email'] = 'foo@example.com';
		return $commenter;
	}

	/**
	 * @ticket 35378
	 */
	public function test_hierarchy_should_be_ignored_when_threading_is_disabled() {
		$now = time();
		$p = self::factory()->post->create();
		$comment_1 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '1',
			'comment_approved' => '1',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 100 ),
		) );
		$comment_2 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '2',
			'comment_approved' => '1',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 300 ),
		) );
		$comment_3 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '3',
			'comment_approved' => '1',
			'comment_parent' => $comment_1,
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 200 ),
		) );

		update_option( 'comment_order', 'asc' );
		update_option( 'thread_comments', 0 );

		$this->go_to( get_permalink( $p ) );
		$found = get_echo( 'comments_template' );

		// Find the found comments in the markup.
		preg_match_all( '|id="comment-([0-9]+)|', $found, $matches );

		$found_cids = array_map( 'intval', $matches[1] );
		$this->assertSame( array( $comment_2, $comment_3, $comment_1 ), $found_cids );
	}

	/**
	 * @ticket 35419
	 */
	public function test_pagination_calculation_should_ignore_comment_hierarchy_when_threading_is_disabled() {
		$now = time();
		$p = self::factory()->post->create();
		$comment_1 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '1',
			'comment_approved' => '1',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 300 ),
		) );
		$comment_2 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '2',
			'comment_approved' => '1',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 200 ),
		) );
		$comment_3 = self::factory()->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '3',
			'comment_approved' => '1',
			'comment_parent' => $comment_1,
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 100 ),
		) );

		update_option( 'thread_comments', 0 );

		update_option( 'comment_order', 'asc' );
		update_option( 'comments_per_page', 2 );
		update_option( 'page_comments', 1 );
		update_option( 'default_comments_page', 'newest' );

		$this->go_to( get_permalink( $p ) );
		$found = get_echo( 'comments_template' );

		// Find the found comments in the markup.
		preg_match_all( '|id="comment-([0-9]+)|', $found, $matches );

		$found_cids = array_map( 'intval', $matches[1] );
		$this->assertSame( array( $comment_3 ), $found_cids );
	}
}
