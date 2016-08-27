<?php

/**
 * @group admin
 * @group comment
 */
class Tests_Admin_IncludesComment extends WP_UnitTestCase {
	/**
	 * Post ID to add comments to.
	 *
	 * @var int
	 */
	public static $post_id;

	/**
	 * Comment IDs.
	 *
	 * @var array
	 */
	public static $comment_ids = array();

	/**
	 * Create the post and comments for the tests.
	 *
	 * @param WP_UnitTest_Factory $factory
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		self::$post_id = $factory->post->create();

		self::$comment_ids[] = $factory->comment->create( array(
			'comment_author'   => 1,
			'comment_date'     => '2014-05-06 12:00:00',
			'comment_date_gmt' => '2014-05-06 07:00:00',
			'comment_post_ID'  => self::$post_id,
		) );

		self::$comment_ids[] = $factory->comment->create( array(
			'comment_author'  => 2,
			'comment_date'    => '2004-01-02 12:00:00',
			'comment_post_ID' => self::$post_id,
		) );
	}

	/**
	 * Verify that both the comment date and author must match for a comment to exist.
	 */
	public function test_must_match_date_and_author() {
		$this->assertNull( comment_exists( 1, '2004-01-02 12:00:00' ) );
		$this->assertEquals( self::$post_id, comment_exists( 1, '2014-05-06 12:00:00' ) );
	}

	/**
	 * @ticket 33871
	 */
	public function test_default_value_of_timezone_should_be_blog() {
		$this->assertEquals( self::$post_id, comment_exists( 1, '2014-05-06 12:00:00' ) );
	}

	/**
	 * @ticket 33871
	 */
	public function test_should_respect_timezone_blog() {
		$this->assertEquals( self::$post_id, comment_exists( 1, '2014-05-06 12:00:00', 'blog' ) );
	}

	/**
	 * @ticket 33871
	 */
	public function test_should_respect_timezone_gmt() {
		$this->assertEquals( self::$post_id, comment_exists( 1, '2014-05-06 07:00:00', 'gmt' ) );
	}

	/**
	 * @ticket 33871
	 */
	public function test_invalid_timezone_should_fall_back_on_blog() {
		$this->assertEquals( self::$post_id, comment_exists( 1, '2014-05-06 12:00:00', 'not_a_valid_value' ) );
	}
}
