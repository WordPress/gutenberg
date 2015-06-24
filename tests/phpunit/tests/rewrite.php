<?php

/**
 * A set of unit tests for functions in wp-includes/rewrite.php
 *
 * @group rewrite
 */
class Tests_Rewrite extends WP_UnitTestCase {
	private $home_url;

	function setUp() {
		global $wp_rewrite;
		parent::setUp();

		// Need rewrite rules in place to use url_to_postid
		$wp_rewrite->init();
		$wp_rewrite->set_permalink_structure( '/%year%/%monthnum%/%day%/%postname%/' );

		create_initial_taxonomies();

		$wp_rewrite->flush_rules();

		$this->home_url = get_option( 'home' );
	}

	function tearDown() {
		global $wp_rewrite;
		$wp_rewrite->init();

		update_option( 'home', $this->home_url );
		parent::tearDown();
	}

	function test_url_to_postid() {

		$id = $this->factory->post->create();
		$this->assertEquals( $id, url_to_postid( get_permalink( $id ) ) );

		$id = $this->factory->post->create( array( 'post_type' => 'page' ) );
		$this->assertEquals( $id, url_to_postid( get_permalink( $id ) ) );
	}

	function test_url_to_postid_custom_post_type() {
		delete_option( 'rewrite_rules' );

		$post_type = rand_str( 12 );
		register_post_type( $post_type, array( 'public' => true ) );

		$id = $this->factory->post->create( array( 'post_type' => $post_type ) );
		$this->assertEquals( $id, url_to_postid( get_permalink( $id ) ) );

		_unregister_post_type( $post_type );
	}

	function test_url_to_postid_hierarchical() {

		$parent_id = $this->factory->post->create( array( 'post_title' => 'Parent', 'post_type' => 'page' ) );
		$child_id = $this->factory->post->create( array( 'post_title' => 'Child', 'post_type' => 'page', 'post_parent' => $parent_id ) );

		$this->assertEquals( $parent_id, url_to_postid( get_permalink( $parent_id ) ) );
		$this->assertEquals( $child_id, url_to_postid( get_permalink( $child_id ) ) );
	}

	function test_url_to_postid_hierarchical_with_matching_leaves() {

		$parent_id = $this->factory->post->create( array(
			'post_name' => 'parent',
			'post_type' => 'page',
		) );
		$child_id_1 = $this->factory->post->create( array(
			'post_name'   => 'child1',
			'post_type'   => 'page',
			'post_parent' => $parent_id,
		) );
		$child_id_2 = $this->factory->post->create( array(
			'post_name'   => 'child2',
			'post_type'   => 'page',
			'post_parent' => $parent_id,
		) );
		$grandchild_id_1 = $this->factory->post->create( array(
			'post_name'   => 'grandchild',
			'post_type'   => 'page',
			'post_parent' => $child_id_1,
		) );
		$grandchild_id_2 = $this->factory->post->create( array(
			'post_name'   => 'grandchild',
			'post_type'   => 'page',
			'post_parent' => $child_id_2,
		) );

		$this->assertEquals( home_url( 'parent/child1/grandchild/' ), get_permalink( $grandchild_id_1 ) );
		$this->assertEquals( home_url( 'parent/child2/grandchild/' ), get_permalink( $grandchild_id_2 ) );
		$this->assertEquals( $grandchild_id_1, url_to_postid( get_permalink( $grandchild_id_1 ) ) );
		$this->assertEquals( $grandchild_id_2, url_to_postid( get_permalink( $grandchild_id_2 ) ) );
	}

	function test_url_to_postid_home_has_path() {

		update_option( 'home', home_url( '/example/' ) );

		$id = $this->factory->post->create( array( 'post_title' => 'Hi', 'post_type' => 'page', 'post_name' => 'examp' ) );
		$this->assertEquals( $id, url_to_postid( get_permalink( $id ) ) );
		$this->assertEquals( $id, url_to_postid( site_url('/example/examp' ) ) );
		$this->assertEquals( $id, url_to_postid( '/example/examp/' ) );
		$this->assertEquals( $id, url_to_postid( '/example/examp' ) );

		$this->assertEquals( 0, url_to_postid( site_url( '/example/ex' ) ) );
		$this->assertEquals( 0, url_to_postid( '/example/ex' ) );
		$this->assertEquals( 0, url_to_postid( '/example/ex/' ) );
		$this->assertEquals( 0, url_to_postid( '/example-page/example/' ) );
		$this->assertEquals( 0, url_to_postid( '/example-page/ex/' ) );
	}

	/**
	 * @ticket 30438
	 */
	function test_parse_request_home_path() {
		$home_url = home_url( '/path/' );
		update_option( 'home', $home_url );

		$this->go_to( $home_url );
		$this->assertEquals( array(), $GLOBALS['wp']->query_vars );

		$this->go_to( $home_url . 'page' );
		$this->assertEquals( array( 'page' => '', 'pagename' => 'page' ), $GLOBALS['wp']->query_vars );
	}

	/**
	 * @ticket 30438
	 */
	function test_parse_request_home_path_with_regex_character() {
		$home_url = home_url( '/ma.ch/' );
		$not_a_home_url = home_url( '/match/' );
		update_option( 'home', $home_url );

		$this->go_to( $home_url );
		$this->assertEquals( array(), $GLOBALS['wp']->query_vars );

		$this->go_to( $home_url . 'page' );
		$this->assertEquals( array( 'page' => '', 'pagename' => 'page' ), $GLOBALS['wp']->query_vars );

		$this->go_to( $not_a_home_url . 'page' );
		$this->assertNotEquals( array( 'page' => '', 'pagename' => 'page' ), $GLOBALS['wp']->query_vars );
		$this->assertEquals( array( 'page' => '', 'pagename' => 'match/page' ), $GLOBALS['wp']->query_vars );
	}

	function test_url_to_postid_dupe_path() {
		update_option( 'home', home_url('/example/') );

		$id = $this->factory->post->create( array( 'post_title' => 'Hi', 'post_type' => 'page', 'post_name' => 'example' ) );

		$this->assertEquals( $id, url_to_postid( get_permalink( $id ) ) );
		$this->assertEquals( $id, url_to_postid( site_url( '/example/example/' ) ) );
		$this->assertEquals( $id, url_to_postid( '/example/example/' ) );
		$this->assertEquals( $id, url_to_postid( '/example/example' ) );
	}

	/**
	 * Reveals bug introduced in WP 3.0
	 */
	function test_url_to_postid_home_url_collision() {
		update_option( 'home', home_url( '/example' ) );

		$this->factory->post->create( array( 'post_title' => 'Collision', 'post_type' => 'page', 'post_name' => 'collision' ) );

		// This url should NOT return a post ID
		$badurl = site_url( '/example-collision' );
		$this->assertEquals( 0, url_to_postid( $badurl ) );
	}

	/**
	 * Reveals bug introduced in WP 3.0
	 *
	 * Run tests using multisite `phpunit -c multisite`
	 */
	function test_url_to_postid_ms_home_url_collision() {

		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'test_url_to_postid_ms_home_url_collision requires multisite' );
			return false;
		}

		$blog_id = $this->factory->blog->create( array( 'path' => '/example' ) );
		switch_to_blog( $blog_id );

		$this->factory->post->create( array( 'post_title' => 'Collision ', 'post_type' => 'page' ) );

		// This url should NOT return a post ID
		$badurl = network_home_url( '/example-collision' );
		$this->assertEquals( 0, url_to_postid( $badurl ) );

		restore_current_blog();
	}

	/**
	 * @ticket 25143
	 */
	public function test_is_home_should_be_false_when_visiting_custom_endpoint_without_a_registered_query_var_and_page_on_front_is_set() {

		$page_id = $this->factory->post->create( array( 'post_type' => 'page' ) );
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $page_id );

		add_rewrite_endpoint( 'test', EP_ALL, false );
		flush_rewrite_rules();

		$this->go_to( home_url( '/test/1' ) );

		$this->assertQueryTrue( 'is_front_page', 'is_page', 'is_singular' );
		$this->assertFalse( is_home() );
	}
}
