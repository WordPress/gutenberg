<?php

/**
 * Test functions in wp-includes/author.php, author-template.php
 *
 * @group author
 * @group user
 */
class Tests_User_Author extends WP_UnitTestCase {
	protected $old_post_id = 0;
	protected $author_id = 0;
	protected $post_id = 0;

	function setUp() {
		parent::setUp();

		$this->author_id = $this->factory->user->create( array(
			'role' => 'author',
			'user_login' => 'test_author',
			'description' => 'test_author',
		) );
		$user = new WP_User( $this->author_id );

		$post = array(
			'post_author' => $this->author_id,
			'post_status' => 'publish',
			'post_content' => rand_str(),
			'post_title' => rand_str(),
			'post_type' => 'post'
		);

		// insert a post and make sure the ID is ok
		$this->post_id = $this->factory->post->create( $post );

		setup_postdata( get_post( $this->post_id ) );
	}

	function tearDown() {
		wp_reset_postdata();
		parent::tearDown();
	}

	function test_get_the_author() {
		$author_name = get_the_author();
		$user = new WP_User( $this->author_id );

		$this->assertEquals( $user->display_name, $author_name );
		$this->assertEquals( 'test_author', $author_name );
	}

	function test_get_the_author_meta() {
		$this->assertEquals( 'test_author', get_the_author_meta( 'login' ) );
		$this->assertEquals( 'test_author', get_the_author_meta( 'user_login' ) );
		$this->assertEquals( 'test_author', get_the_author_meta( 'display_name' ) );

		$this->assertEquals( 'test_author', get_the_author_meta( 'description' ) );
		$this->assertEquals( 'test_author', get_the_author_meta( 'user_description' ) );
		add_user_meta( $this->author_id, 'user_description', 'user description' );
		$this->assertEquals( 'user description', get_user_meta( $this->author_id, 'user_description', true ) );
		// user_description in meta is ignored. The content of description is returned instead.
		// See #20285
		$this->assertEquals( 'test_author', get_the_author_meta( 'user_description' ) );
		$this->assertEquals( 'test_author', get_the_author_meta( 'description' ) );
		update_user_meta( $this->author_id, 'user_description', '' );
		$this->assertEquals( '', get_user_meta( $this->author_id, 'user_description', true ) );
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
		$GLOBALS['post'] = $this->post_id;
		$this->assertEquals( 1, get_the_author_posts() );
	}

	/**
	 * @ticket 30904
	 */
	function test_get_the_author_posts_with_custom_post_type() {
		register_post_type( 'wptests_pt' );

		$cpt_ids = $this->factory->post->create_many( 2, array(
			'post_author' => $this->author_id,
			'post_type'   => 'wptests_pt',
		) );
		$GLOBALS['post'] = $cpt_ids[0];

		$this->assertEquals( 2, get_the_author_posts() );

		_unregister_post_type( 'wptests_pt' );
	}
}
