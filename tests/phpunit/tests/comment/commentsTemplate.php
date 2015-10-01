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
		$p = $this->factory->post->create();
		$comment_1 = $this->factory->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '1',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 100 ),
		) );
		$comment_2 = $this->factory->comment->create( array(
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
		$p = $this->factory->post->create();
		$comment_1 = $this->factory->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '1',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 100 ),
		) );
		$comment_2 = $this->factory->comment->create( array(
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
		$p = $this->factory->post->create();
		$comment_1 = $this->factory->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '1',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 100 ),
		) );
		$comment_2 = $this->factory->comment->create( array(
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
		$p = $this->factory->post->create();
		$comment_1 = $this->factory->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '1',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 100 ),
		) );
		$comment_2 = $this->factory->comment->create( array(
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
		$p = $this->factory->post->create();
		$comment_1 = $this->factory->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '1',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 100 ),
		) );
		$comment_2 = $this->factory->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '2',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 200 ),
		) );
		$comment_3 = $this->factory->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '3',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 300 ),
		) );
		$comment_4 = $this->factory->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '4',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 400 ),
		) );
		$comment_5 = $this->factory->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '3',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 500 ),
		) );
		$comment_6 = $this->factory->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '4',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 600 ),
		) );

		update_option( 'comment_order', 'asc' );
		update_option( 'default_comments_page', 'newest' );

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
		$p = $this->factory->post->create();
		$comment_1 = $this->factory->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '1',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 100 ),
		) );
		$comment_2 = $this->factory->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '2',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 200 ),
		) );
		$comment_3 = $this->factory->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '3',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 300 ),
		) );
		$comment_4 = $this->factory->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '4',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 400 ),
		) );
		$comment_5 = $this->factory->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '3',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 500 ),
		) );
		$comment_6 = $this->factory->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '4',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 600 ),
		) );

		update_option( 'comment_order', 'desc' );
		update_option( 'default_comments_page', 'newest' );

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
		$p = $this->factory->post->create();
		$comment_1 = $this->factory->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '1',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 100 ),
		) );
		$comment_2 = $this->factory->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '2',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 200 ),
		) );
		$comment_3 = $this->factory->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '3',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 300 ),
		) );
		$comment_4 = $this->factory->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '4',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 400 ),
		) );

		update_option( 'comment_order', 'asc' );
		update_option( 'default_comments_page', 'oldest' );

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
		$p = $this->factory->post->create();
		$comment_1 = $this->factory->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '1',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 100 ),
		) );
		$comment_2 = $this->factory->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '2',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 200 ),
		) );
		$comment_3 = $this->factory->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '3',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 300 ),
		) );
		$comment_4 = $this->factory->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '4',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 400 ),
		) );

		update_option( 'comment_order', 'desc' );
		update_option( 'default_comments_page', 'oldest' );

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
		$p = $this->factory->post->create();
		$comment_1 = $this->factory->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '1',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 100 ),
		) );
		$comment_2 = $this->factory->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '2',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 200 ),
		) );
		$comment_3 = $this->factory->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '3',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 300 ),
		) );

		update_option( 'default_comments_page', 'newest' );
		update_option( 'comment_order', 'desc' );

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
		$p = $this->factory->post->create();
		$comment_1 = $this->factory->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '1',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 100 ),
		) );
		$comment_2 = $this->factory->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '2',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 200 ),
		) );
		$comment_3 = $this->factory->comment->create( array(
			'comment_post_ID' => $p,
			'comment_content' => '3',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 300 ),
		) );

		update_option( 'default_comments_page', 'newest' );
		update_option( 'comment_order', 'desc' );

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
}
