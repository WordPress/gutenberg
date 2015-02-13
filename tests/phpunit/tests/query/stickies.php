<?php

/**
 * Tests related to sticky functionality in WP_Query.
 *
 * @group query
 */
class Tests_Query_Stickies extends WP_UnitTestCase {
	static $posts = array();

	public static function setUpBeforeClass() {
		$f = new WP_UnitTest_Factory();

		// Set post times to get a reliable order.
		$now = time();
		for ( $i = 0; $i <= 22; $i++ ) {
			$post_date = date( 'Y-m-d H:i:s', $now - ( 10 * $i ) );
			self::$posts[ $i ] = $f->post->create( array(
				'post_date' => $post_date,
			) );
		}

		stick_post( self::$posts[2] );
		stick_post( self::$posts[14] );
		stick_post( self::$posts[8] );

		self::commit_transaction();
	}

	public static function tearDownAfterClass() {
		foreach ( self::$posts as $p ) {
			wp_delete_post( $p, true );
		}

		self::commit_transaction();
	}

	public function test_stickies_should_be_ignored_when_is_home_is_false() {
		$q = new WP_Query( array(
			'year' => date( 'Y' ),
			'fields' => 'ids',
			'posts_per_page' => 3,
		) );

		$expected = array(
			self::$posts[0],
			self::$posts[1],
			self::$posts[2],
		);

		$this->assertEquals( $expected, $q->posts );
	}

	public function test_stickies_should_be_included_when_is_home_is_true() {
		$this->go_to( '/' );

		$q = $GLOBALS['wp_query'];

		$this->assertEquals( self::$posts[2], $q->posts[0]->ID );
		$this->assertEquals( self::$posts[8], $q->posts[1]->ID );
		$this->assertEquals( self::$posts[14], $q->posts[2]->ID );
	}

	public function test_stickies_should_not_be_included_on_pages_other_than_1() {
		$this->go_to( '/?paged=2' );

		$q = $GLOBALS['wp_query'];

		$found = wp_list_pluck( $q->posts, 'ID' );
		$this->assertNotContains( self::$posts[2], $found );
	}

	public function test_stickies_should_not_be_included_when_ignore_sticky_posts_is_true() {
		add_action( 'parse_query', array( $this, 'set_ignore_sticky_posts' ) );
		$this->go_to( '/' );
		remove_action( 'parse_query', array( $this, 'set_ignore_sticky_posts' ) );

		$q = $GLOBALS['wp_query'];

		$expected = array(
			self::$posts[0],
			self::$posts[1],
			self::$posts[2],
			self::$posts[3],
			self::$posts[4],
			self::$posts[5],
			self::$posts[6],
			self::$posts[7],
			self::$posts[8],
			self::$posts[9],
		);

		$this->assertEquals( $expected, wp_list_pluck( $q->posts, 'ID' ) );
	}

	public function test_stickies_should_obey_post__not_in() {
		add_action( 'parse_query', array( $this, 'set_post__not_in' ) );
		$this->go_to( '/' );
		remove_action( 'parse_query', array( $this, 'set_post__not_in' ) );

		$q = $GLOBALS['wp_query'];

		$this->assertEquals( self::$posts[2], $q->posts[0]->ID );
		$this->assertEquals( self::$posts[14], $q->posts[1]->ID );
		$this->assertNotContains( self::$posts[8], wp_list_pluck( $q->posts, 'ID' ) );
	}

	public function set_ignore_sticky_posts( $q ) {
		$q->set( 'ignore_sticky_posts', true );
	}

	public function set_post__not_in( $q ) {
		$q->set( 'post__not_in', array( self::$posts[8] ) );
	}
}
