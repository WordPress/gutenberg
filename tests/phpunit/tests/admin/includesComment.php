<?php

/**
 * @group admin
 * @group comment
 */
class Tests_Admin_IncludesComment extends WP_UnitTestCase {
	public function test_must_match_date_and_author() {
		$p1 = self::factory()->post->create();
		$c1 = self::factory()->comment->create( array(
			'comment_author' => 1,
			'comment_date' => '2014-05-06 12:00:00',
			'comment_post_ID' => $p1,
		) );

		$p2 = self::factory()->post->create();
		$c2 = self::factory()->comment->create( array(
			'comment_author' => 2,
			'comment_date' => '2004-01-02 12:00:00',
			'comment_post_ID' => $p2,
		) );

		$this->assertNull( comment_exists( 1, '2004-01-02 12:00:00' ) );
		$this->assertEquals( $p1, comment_exists( 1, '2014-05-06 12:00:00' ) );
	}

	/**
	 * @ticket 33871
	 */
	public function test_default_value_of_timezone_should_be_blog() {
		$p = self::factory()->post->create();
		$c = self::factory()->comment->create( array(
			'comment_author' => 1,
			'comment_post_ID' => $p,
			'comment_date' => '2014-05-06 12:00:00',
			'comment_date_gmt' => '2014-05-06 07:00:00',
		) );

		$this->assertEquals( $p, comment_exists( 1, '2014-05-06 12:00:00' ) );
	}

	/**
	 * @ticket 33871
	 */
	public function test_should_respect_timezone_blog() {
		$p = self::factory()->post->create();
		$c = self::factory()->comment->create( array(
			'comment_author' => 1,
			'comment_post_ID' => $p,
			'comment_date' => '2014-05-06 12:00:00',
			'comment_date_gmt' => '2014-05-06 07:00:00',
		) );

		$this->assertEquals( $p, comment_exists( 1, '2014-05-06 12:00:00', 'blog' ) );
	}

	/**
	 * @ticket 33871
	 */
	public function test_should_respect_timezone_gmt() {
		$p = self::factory()->post->create();
		$c = self::factory()->comment->create( array(
			'comment_author' => 1,
			'comment_post_ID' => $p,
			'comment_date' => '2014-05-06 12:00:00',
			'comment_date_gmt' => '2014-05-06 07:00:00',
		) );

		$this->assertEquals( $p, comment_exists( 1, '2014-05-06 07:00:00', 'gmt' ) );
	}

	/**
	 * @ticket 33871
	 */
	public function test_invalid_timezone_should_fall_back_on_blog() {
		$p = self::factory()->post->create();
		$c = self::factory()->comment->create( array(
			'comment_author' => 1,
			'comment_post_ID' => $p,
			'comment_date' => '2014-05-06 12:00:00',
			'comment_date_gmt' => '2014-05-06 07:00:00',
		) );

		$this->assertEquals( $p, comment_exists( 1, '2014-05-06 12:00:00', 'not_a_valid_value' ) );
	}
}
