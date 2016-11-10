<?php

/**
 * Test functions in wp-includes/author-template.php
 *
 * @group author
 * @group user
 */
class Tests_User_Author_Template extends WP_UnitTestCase {
	protected static $author_id = 0;
	protected static $post_id = 0;

	private $permalink_structure;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$author_id = $factory->user->create( array(
			'role' => 'author',
			'user_login' => 'test_author',
			'description' => 'test_author',
		) );

		self::$post_id = $factory->post->create( array(
			'post_author' => self::$author_id,
			'post_status' => 'publish',
			'post_content' => rand_str(),
			'post_title' => rand_str(),
			'post_type' => 'post'
		) );
	}

	function setUp() {
		parent::setUp();

		setup_postdata( get_post( self::$post_id ) );
	}

	function tearDown() {
		wp_reset_postdata();
		parent::tearDown();
	}

	function test_get_the_author() {
		$author_name = get_the_author();
		$user = new WP_User( self::$author_id );

		$this->assertEquals( $user->display_name, $author_name );
		$this->assertEquals( 'test_author', $author_name );
	}

	function test_get_the_author_meta() {
		$this->assertEquals( 'test_author', get_the_author_meta( 'login' ) );
		$this->assertEquals( 'test_author', get_the_author_meta( 'user_login' ) );
		$this->assertEquals( 'test_author', get_the_author_meta( 'display_name' ) );

		$this->assertEquals( 'test_author', get_the_author_meta( 'description' ) );
		$this->assertEquals( 'test_author', get_the_author_meta( 'user_description' ) );
		add_user_meta( self::$author_id, 'user_description', 'user description' );
		$this->assertEquals( 'user description', get_user_meta( self::$author_id, 'user_description', true ) );
		// user_description in meta is ignored. The content of description is returned instead.
		// See #20285
		$this->assertEquals( 'test_author', get_the_author_meta( 'user_description' ) );
		$this->assertEquals( 'test_author', get_the_author_meta( 'description' ) );
		update_user_meta( self::$author_id, 'user_description', '' );
		$this->assertEquals( '', get_user_meta( self::$author_id, 'user_description', true ) );
		$this->assertEquals( 'test_author', get_the_author_meta( 'user_description' ) );
		$this->assertEquals( 'test_author', get_the_author_meta( 'description' ) );

		$this->assertEquals( '', get_the_author_meta( 'does_not_exist' ) );
	}

	function test_get_the_author_meta_no_authordata() {
		unset( $GLOBALS['authordata'] );
		$this->assertEquals( '', get_the_author_meta( 'id' ) );
		$this->assertEquals( '', get_the_author_meta( 'user_login' ) );
		$this->assertEquals( '', get_the_author_meta( 'does_not_exist' ) );
	}

	function test_get_the_author_posts() {
		// Test with no global post, result should be 0 because no author is found
		$this->assertEquals( 0, get_the_author_posts() );
		$GLOBALS['post'] = self::$post_id;
		$this->assertEquals( 1, get_the_author_posts() );
	}

	/**
	 * @ticket 30904
	 */
	function test_get_the_author_posts_with_custom_post_type() {
		register_post_type( 'wptests_pt' );

		$cpt_ids = self::factory()->post->create_many( 2, array(
			'post_author' => self::$author_id,
			'post_type'   => 'wptests_pt',
		) );
		$GLOBALS['post'] = $cpt_ids[0];

		$this->assertEquals( 2, get_the_author_posts() );

		_unregister_post_type( 'wptests_pt' );
	}

	/**
	 * @ticket 30355
	 */
	public function test_get_the_author_posts_link_no_permalinks() {
		$author = self::factory()->user->create_and_get( array(
			'display_name'  => 'Foo',
			'user_nicename' => 'bar'
		) );

		$GLOBALS['authordata'] = $author->data;

		$link = get_the_author_posts_link();

		$url = sprintf( 'http://%1$s/?author=%2$s', WP_TESTS_DOMAIN, $author->ID );

		$this->assertContains( $url, $link );
		$this->assertContains( 'Posts by Foo', $link );
		$this->assertContains( '>Foo</a>', $link );

		unset( $GLOBALS['authordata'] );
	}

	/**
	 * @ticket 30355
	 */
	public function test_get_the_author_posts_link_with_permalinks() {
		$this->set_permalink_structure( '/%postname%/' );

		$author = self::factory()->user->create_and_get( array(
			'display_name'  => 'Foo',
			'user_nicename' => 'bar'
		) );

		$GLOBALS['authordata'] = $author;

		$link = get_the_author_posts_link();

		$url = sprintf( 'http://%1$s/author/%2$s/', WP_TESTS_DOMAIN, $author->user_nicename );

		$this->set_permalink_structure( '' );

		$this->assertContains( $url, $link );
		$this->assertContains( 'Posts by Foo', $link );
		$this->assertContains( '>Foo</a>', $link );

		unset( $GLOBALS['authordata'] );
	}

}
