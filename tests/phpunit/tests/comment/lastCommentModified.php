<?php

/**
 * @group comment
 * @group 38027
 */
class Tests_Comment_Last_Modified extends WP_UnitTestCase {
	public function test_no_comments() {
		$this->assertFalse( get_lastcommentmodified() );
	}

	public function test_default_timezone() {
		self::factory()->comment->create_and_get( array(
			'comment_status'   => 1,
			'comment_date'     => '2000-01-01 11:00:00',
			'comment_date_gmt' => '2000-01-01 10:00:00',
		) );

		$this->assertSame( strtotime( '2000-01-01 10:00:00' ), strtotime( get_lastcommentmodified() ) );
	}

	public function test_server_timezone() {
		self::factory()->comment->create_and_get( array(
			'comment_status'   => 1,
			'comment_date'     => '2000-01-01 11:00:00',
			'comment_date_gmt' => '2000-01-01 10:00:00',
		) );

		$this->assertSame( strtotime( '2000-01-01 10:00:00' ), strtotime( get_lastcommentmodified() ) );
	}

	public function test_blog_timezone() {
		self::factory()->comment->create_and_get( array(
			'comment_status'   => 1,
			'comment_date'     => '2000-01-01 11:00:00',
			'comment_date_gmt' => '2000-01-01 10:00:00',
		) );

		$this->assertSame( '2000-01-01 11:00:00', get_lastcommentmodified( 'blog' ) );
	}

	public function test_gmt_timezone() {
		self::factory()->comment->create_and_get( array(
			'comment_status'   => 1,
			'comment_date'     => '2000-01-01 11:00:00',
			'comment_date_gmt' => '2000-01-01 10:00:00',
		) );

		$this->assertSame( strtotime( '2000-01-01 10:00:00' ), strtotime( get_lastcommentmodified( 'GMT' ) ) );
	}

	public function test_unknown_timezone() {
		self::factory()->comment->create_and_get( array(
			'comment_status'   => 1,
			'comment_date'     => '2000-01-01 11:00:00',
			'comment_date_gmt' => '2000-01-01 10:00:00',
		) );

		$this->assertFalse( get_lastcommentmodified( 'foo' ) );
	}

	public function test_data_is_cached() {
		self::factory()->comment->create_and_get( array(
			'comment_status'   => 1,
			'comment_date'     => '2015-04-01 11:00:00',
			'comment_date_gmt' => '2015-04-01 10:00:00',
		) );

		get_lastcommentmodified();
		$this->assertSame( strtotime( '2015-04-01 10:00:00' ), strtotime( wp_cache_get( 'lastcommentmodified:server', 'timeinfo' ) ) );
	}

	public function test_cache_is_cleared() {
		self::factory()->comment->create_and_get( array(
			'comment_status'   => 1,
			'comment_date'     => '2000-01-01 11:00:00',
			'comment_date_gmt' => '2000-01-01 10:00:00',
		) );

		get_lastcommentmodified();

		$this->assertSame( strtotime( '2000-01-01 10:00:00' ), strtotime( wp_cache_get( 'lastcommentmodified:server', 'timeinfo' ) ) );

		self::factory()->comment->create_and_get( array(
			'comment_status'   => 1,
			'comment_date'     => '2000-01-02 11:00:00',
			'comment_date_gmt' => '2000-01-02 10:00:00',
		) );

		$this->assertFalse( wp_cache_get( 'lastcommentmodified:server', 'timeinfo' ) );
		$this->assertSame( strtotime( '2000-01-02 10:00:00' ), strtotime( get_lastcommentmodified() ) );
		 $this->assertSame( strtotime( '2000-01-02 10:00:00' ), strtotime( wp_cache_get( 'lastcommentmodified:server', 'timeinfo' ) ) );
	}

	public function test_cache_is_cleared_when_comment_is_trashed() {
		$comment_1 = self::factory()->comment->create_and_get( array(
			'comment_status'   => 1,
			'comment_date'     => '1998-01-01 11:00:00',
			'comment_date_gmt' => '1998-01-01 10:00:00',
		) );

		$comment_2 = self::factory()->comment->create_and_get( array(
			'comment_status'   => 1,
			'comment_date'     => '2000-01-02 11:00:00',
			'comment_date_gmt' => '2000-01-02 10:00:00',
		) );

		get_lastcommentmodified();

		$this->assertSame( strtotime( '2000-01-02 10:00:00' ), strtotime( wp_cache_get( 'lastcommentmodified:server', 'timeinfo' ) ) );

		wp_trash_comment( $comment_2->comment_ID );

		$this->assertFalse( wp_cache_get( 'lastcommentmodified:server', 'timeinfo' ) );
		$this->assertSame( strtotime( '1998-01-01 10:00:00' ), strtotime( get_lastcommentmodified() ) );
		$this->assertSame( strtotime( '1998-01-01 10:00:00' ), strtotime( wp_cache_get( 'lastcommentmodified:server', 'timeinfo' ) ) );
	}
}
