<?php

/**
 * @group comment
 * @covers ::get_page_of_comment
 */
class Tests_Comment_GetPageOfComment extends WP_UnitTestCase {

	public function test_last_comment() {
		$p = $this->factory->post->create();

		// page 4
		$comment_last = $this->factory->comment->create_post_comments( $p, 1, array( 'comment_date' => '2013-09-24 00:00:00' ) );
		$this->factory->comment->create_post_comments( $p, 1, array( 'comment_date' => '2013-09-23 00:00:00' ) );

		// page 3
		$this->factory->comment->create_post_comments( $p, 1, array( 'comment_date' => '2013-09-22 00:00:00' ) );
		$this->factory->comment->create_post_comments( $p, 1, array( 'comment_date' => '2013-09-21 00:00:00' ) );
		$this->factory->comment->create_post_comments( $p, 1, array( 'comment_date' => '2013-09-20 00:00:00' ) );

		// page 2
		$this->factory->comment->create_post_comments( $p, 1, array( 'comment_date' => '2013-09-19 00:00:00' ) );
		$this->factory->comment->create_post_comments( $p, 1, array( 'comment_date' => '2013-09-18 00:00:00' ) );
		$this->factory->comment->create_post_comments( $p, 1, array( 'comment_date' => '2013-09-17 00:00:00' ) );

		// page 1
		$this->factory->comment->create_post_comments( $p, 1, array( 'comment_date' => '2013-09-16 00:00:00' ) );
		$this->factory->comment->create_post_comments( $p, 1, array( 'comment_date' => '2013-09-15 00:00:00' ) );
		$comment_first = $this->factory->comment->create_post_comments( $p, 1, array( 'comment_date' => '2013-09-14 00:00:00' ) );

		$this->assertEquals( 4, get_page_of_comment( $comment_last[0],  array( 'per_page' =>  3 ) ) );
		$this->assertEquals( 2, get_page_of_comment( $comment_last[0],  array( 'per_page' => 10 ) ) );

		$this->assertEquals( 1, get_page_of_comment( $comment_first[0], array( 'per_page' =>  3 ) ) );
		$this->assertEquals( 1, get_page_of_comment( $comment_first[0], array( 'per_page' => 10 ) ) );
	}

	public function test_type_pings() {
		$p = $this->factory->post->create();
		$now = time();

		$trackbacks = array();
		for ( $i = 0; $i <= 3; $i++ ) {
			$trackbacks[ $i ] = $this->factory->comment->create( array( 'comment_post_ID' => $p, 'comment_type' => 'trackback', 'comment_date_gmt' => date( 'Y-m-d H:i:s', $now ) ) );
			$now -= 10 * $i;
		}

		$pingbacks = array();
		for ( $i = 0; $i <= 6; $i++ ) {
			$pingbacks[ $i ] = $this->factory->comment->create( array( 'comment_post_ID' => $p, 'comment_type' => 'pingback', 'comment_date_gmt' => date( 'Y-m-d H:i:s', $now ) ) );
			$now -= 10 * $i;
		}

		$this->assertEquals( 2, get_page_of_comment( $trackbacks[0], array( 'per_page' => 2, 'type' => 'trackback' ) ) );
		$this->assertEquals( 3, get_page_of_comment( $pingbacks[0], array( 'per_page' => 2, 'type' => 'pingback' ) ) );
		$this->assertEquals( 5, get_page_of_comment( $trackbacks[0], array( 'per_page' => 2, 'type' => 'pings' ) ) );
	}

	/**
	 * @ticket 11334
	 */
	public function test_subsequent_calls_should_hit_cache() {
		// `get_page_of_comment()` calls `get_option()`, which is not properly cached when WP_INSTALLING.
		if ( is_multisite() ) {
			$this->markTestSkipped( 'Not testable in MS: wpmu_create_blog() defines WP_INSTALLING, which causes cache misses.' );
		}

		global $wpdb;

		$p = $this->factory->post->create();
		$c = $this->factory->comment->create( array( 'comment_post_ID' => $p ) );

		// Prime cache.
		$page_1 = get_page_of_comment( $c, array( 'per_page' => 3 ) );

		$num_queries = $wpdb->num_queries;
		$page_2 = get_page_of_comment( $c, array( 'per_page' => 3 ) );

		$this->assertSame( $page_1, $page_2 );
		$this->assertSame( $num_queries, $wpdb->num_queries );
	}

	/**
	 * @ticket 11334
	 */
	public function test_cache_hits_should_be_sensitive_to_comment_type() {
		global $wpdb;

		$p = $this->factory->post->create();
		$comment = $this->factory->comment->create( array( 'comment_post_ID' => $p, 'comment_type' => 'comment' ) );

		$now = time();
		$trackbacks = array();
		for ( $i = 0; $i <= 5; $i++ ) {
			$trackbacks[ $i ] = $this->factory->comment->create( array( 'comment_post_ID' => $p, 'comment_type' => 'trackback', 'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - ( 10 * $i ) ) ) );
		}

		// Prime cache for trackbacks.
		$page_trackbacks = get_page_of_comment( $trackbacks[1], array( 'per_page' => 3, 'type' => 'trackback' ) );
		$this->assertEquals( 2, $page_trackbacks );

		$num_queries = $wpdb->num_queries;
		$page_comments = get_page_of_comment( $comment, array( 'per_page' => 3, 'type' => 'comment' ) );
		$this->assertEquals( 1, $page_comments );

		$this->assertNotEquals( $num_queries, $wpdb->num_queries );
	}

	/**
	 * @ticket 11334
	 */
	public function test_cache_should_be_invalidated_when_comment_is_approved() {
		$p = $this->factory->post->create();
		$c = $this->factory->comment->create( array( 'comment_post_ID' => $p, 'comment_approved' => 0 ) );

		// Prime cache.
		$page_1 = get_page_of_comment( $c, array( 'per_page' => 3 ) );

		// Approve comment.
		wp_set_comment_status( $c, 'approve' );

		$this->assertFalse( wp_cache_get( $c, 'comment_pages' ) );
	}

	/**
	 * @ticket 11334
	 */
	public function test_cache_should_be_invalidated_when_comment_is_deleted() {
		$p = $this->factory->post->create();
		$c = $this->factory->comment->create( array( 'comment_post_ID' => $p ) );

		// Prime cache.
		$page_1 = get_page_of_comment( $c, array( 'per_page' => 3 ) );

		// Trash comment.
		wp_trash_comment( $c );

		$this->assertFalse( wp_cache_get( $c, 'comment_pages' ) );
	}

	/**
	 * @ticket 11334
	 */
	public function test_cache_should_be_invalidated_when_comment_is_spammed() {
		$p = $this->factory->post->create();
		$c = $this->factory->comment->create( array( 'comment_post_ID' => $p ) );

		// Prime cache.
		$page_1 = get_page_of_comment( $c, array( 'per_page' => 3 ) );

		// Spam comment.
		wp_spam_comment( $c );

		$this->assertFalse( wp_cache_get( $c, 'comment_pages' ) );
	}

	/**
	 * @ticket 11334
	 */
	public function test_cache_should_be_invalidated_when_older_comment_is_published() {
		$now = time();

		$p = $this->factory->post->create();
		$c1 = $this->factory->comment->create( array( 'comment_post_ID' => $p, 'comment_date_gmt' => date( 'Y-m-d H:i:s', $now ) ) );
		$c2 = $this->factory->comment->create( array( 'comment_post_ID' => $p, 'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 20 ) ) );
		$c3 = $this->factory->comment->create( array( 'comment_post_ID' => $p, 'comment_approved' => 0, 'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 30 ) ) );

		$this->assertEquals( 1, get_page_of_comment( $c1, array( 'per_page' => 2 ) ) );

		wp_set_comment_status( $c3, '1' );

		$this->assertEquals( 2, get_page_of_comment( $c1, array( 'per_page' => 2 ) ) );
	}

	/**
	 * @ticket 34057
	 */
	public function test_query_should_be_limited_to_comments_on_the_proper_post() {
		$posts = $this->factory->post->create_many( 2 );

		$now = time();
		$comments_0 = $comments_1 = array();
		for ( $i = 0; $i < 5; $i++ ) {
			$comments_0[] = $this->factory->comment->create( array( 'comment_post_ID' => $posts[0], 'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - ( $i * 60 ) ) ) );
			$comments_1[] = $this->factory->comment->create( array( 'comment_post_ID' => $posts[1], 'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - ( $i * 60 ) ) ) );
		}

		$found_0 = get_page_of_comment( $comments_0[0], array( 'per_page' => 2 ) );
		$this->assertEquals( 3, $found_0 );

		$found_1 = get_page_of_comment( $comments_1[1], array( 'per_page' => 2 ) );
		$this->assertEquals( 2, $found_1 );
	}
}
