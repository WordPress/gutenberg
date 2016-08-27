<?php

/**
 * @group comment
 */
class Tests_Comment_GetCommentLink extends WP_UnitTestCase {
	protected static $p;
	protected static $comments = array();

	public static function wpSetUpBeforeClass( $factory ) {
		$now = time();
		self::$p = self::factory()->post->create();

		self::$comments[] = self::factory()->comment->create( array(
			'comment_post_ID' => self::$p,
			'comment_content' => '1',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 100 ),
		) );
		self::$comments[] = self::factory()->comment->create( array(
			'comment_post_ID' => self::$p,
			'comment_content' => '2',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 200 ),
		) );
		self::$comments[] = self::factory()->comment->create( array(
			'comment_post_ID' => self::$p,
			'comment_content' => '3',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 300 ),
		) );
		self::$comments[] = self::factory()->comment->create( array(
			'comment_post_ID' => self::$p,
			'comment_content' => '4',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 400 ),
		) );
		self::$comments[] = self::factory()->comment->create( array(
			'comment_post_ID' => self::$p,
			'comment_content' => '4',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 500 ),
		) );
		self::$comments[] = self::factory()->comment->create( array(
			'comment_post_ID' => self::$p,
			'comment_content' => '4',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 600 ),
		) );

	}

	/**
	 * @ticket 34068
	 */
	public function test_default_comments_page_newest_default_page_should_have_cpage() {
		update_option( 'page_comments', 1 );
		update_option( 'default_comments_page', 'newest' );
		update_option( 'comments_per_page', 2 );

		$found = get_comment_link( self::$comments[1] );

		$this->assertContains( 'cpage=3', $found );
	}

	/**
	 * @ticket 34068
	 */
	public function test_default_comments_page_newest_middle_page_should_have_cpage() {
		update_option( 'page_comments', 1 );
		update_option( 'default_comments_page', 'newest' );
		update_option( 'comments_per_page', 2 );

		$found = get_comment_link( self::$comments[3] );

		$this->assertContains( 'cpage=2', $found );
	}

	/**
	 * @ticket 34068
	 */
	public function test_default_comments_page_newest_last_page_should_have_cpage() {
		update_option( 'page_comments', 1 );
		update_option( 'default_comments_page', 'newest' );
		update_option( 'comments_per_page', 2 );

		$found = get_comment_link( self::$comments[5] );

		$this->assertContains( 'cpage=1', $found );
	}

	/**
	 * @ticket 34068
	 */
	public function test_default_comments_page_oldest_default_page_should_not_have_cpage() {
		update_option( 'default_comments_page', 'oldest' );
		update_option( 'comments_per_page', 2 );

		$found = get_comment_link( self::$comments[5] );

		$this->assertNotContains( 'cpage', $found );
	}

	/**
	 * @ticket 34068
	 */
	public function test_default_comments_page_oldest_middle_page_should_have_cpage() {
		update_option( 'page_comments', 1 );
		update_option( 'default_comments_page', 'oldest' );
		update_option( 'comments_per_page', 2 );

		$found = get_comment_link( self::$comments[3] );

		$this->assertContains( 'cpage=2', $found );
	}

	/**
	 * @ticket 34068
	 */
	public function test_default_comments_page_oldest_last_page_should_have_cpage() {
		update_option( 'page_comments', 1 );
		update_option( 'default_comments_page', 'oldest' );
		update_option( 'comments_per_page', 2 );

		$found = get_comment_link( self::$comments[1] );

		$this->assertContains( 'cpage=3', $found );
	}

	/**
	 * @ticket 34946
	 */
	public function test_should_not_contain_comment_page_1_when_pagination_is_disabled() {
		$this->set_permalink_structure( '/%postname%/' );
		update_option( 'page_comments', 0 );

		$found = get_comment_link( self::$comments[1] );

		$this->assertNotContains( 'comment-page-1', $found );
	}
}
