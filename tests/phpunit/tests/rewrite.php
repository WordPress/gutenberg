<?php

/**
 * A set of unit tests for functions in wp-includes/rewrite.php
 *
 * @group rewrite
 */
class Tests_Rewrite extends WP_UnitTestCase {
	private $home_url;

	function setUp() {
		parent::setUp();

		$this->set_permalink_structure( '/%year%/%monthnum%/%day%/%postname%/' );
		create_initial_taxonomies();

		$this->home_url = get_option( 'home' );
	}

	function tearDown() {
		global $wp_rewrite;
		$wp_rewrite->init();

		update_option( 'home', $this->home_url );
		parent::tearDown();
	}

	/**
	 * @ticket 16840
	 */
	public function test_add_rule() {
		global $wp_rewrite;

		$pattern  = 'path/to/rewrite/([^/]+)/?$';
		$redirect = 'index.php?test_var1=$matches[1]&test_var2=1';

		$wp_rewrite->add_rule( $pattern, $redirect );

		$wp_rewrite->flush_rules();

		$rewrite_rules = $wp_rewrite->rewrite_rules();

		$this->assertSame( $redirect, $rewrite_rules[ $pattern ] );
	}

	/**
	 * @ticket 16840
	 */
	public function test_add_rule_redirect_array() {
		global $wp_rewrite;

		$pattern  = 'path/to/rewrite/([^/]+)/?$';
		$redirect = 'index.php?test_var1=$matches[1]&test_var2=1';

		$wp_rewrite->add_rule( $pattern, array(
			'test_var1' => '$matches[1]',
			'test_var2' => '1'
		) );

		$wp_rewrite->flush_rules();

		$rewrite_rules = $wp_rewrite->rewrite_rules();

		$this->assertSame( $redirect, $rewrite_rules[ $pattern ] );
	}

	/**
	 * @ticket 16840
	 */
	public function test_add_rule_top() {
		global $wp_rewrite;

		$pattern  = 'path/to/rewrite/([^/]+)/?$';
		$redirect = 'index.php?test_var1=$matches[1]&test_var2=1';

		$wp_rewrite->add_rule( $pattern, $redirect, 'top' );

		$wp_rewrite->flush_rules();

		$extra_rules_top = $wp_rewrite->extra_rules_top;

		$this->assertContains( $redirect, $extra_rules_top[ $pattern ] );
	}

	function test_url_to_postid() {

		$id = self::factory()->post->create();
		$this->assertEquals( $id, url_to_postid( get_permalink( $id ) ) );

		$id = self::factory()->post->create( array( 'post_type' => 'page' ) );
		$this->assertEquals( $id, url_to_postid( get_permalink( $id ) ) );
	}

	function test_url_to_postid_set_url_scheme_https_to_http() {
		$post_id = self::factory()->post->create();
		$permalink = get_permalink( $post_id );
		$this->assertEquals( $post_id, url_to_postid( set_url_scheme( $permalink, 'https' ) ) );

		$post_id = self::factory()->post->create( array( 'post_type' => 'page' ) );
		$permalink = get_permalink( $post_id );
		$this->assertEquals( $post_id, url_to_postid( set_url_scheme( $permalink, 'https' ) ) );
	}

	function test_url_to_postid_set_url_scheme_http_to_https() {
		$_SERVER['HTTPS'] = 'on';

		$post_id        = self::factory()->post->create();
		$post_permalink = get_permalink( $post_id );
		$post_url_to_id = url_to_postid( set_url_scheme( $post_permalink, 'http' ) );

		$page_id        = self::factory()->post->create( array( 'post_type' => 'page' ) );
		$page_permalink = get_permalink( $page_id );
		$page_url_to_id = url_to_postid( set_url_scheme( $page_permalink, 'http' ) );

		$this->assertEquals( $post_id, $post_url_to_id );
		$this->assertEquals( $page_id, $page_url_to_id );
	}

	/**
	 * @ticket 35531
	 * @group multisite
	 * @group ms-required
	 */
	function test_url_to_postid_of_http_site_when_current_site_uses_https() {
		$this->skipWithoutMultisite();

		$_SERVER['HTTPS'] = 'on';

		$network_home = home_url();
		$this->blog_id_35531 = self::factory()->blog->create();

		add_filter( 'home_url', array( $this, '_filter_http_home_url' ), 10, 4 );

		switch_to_blog( $this->blog_id_35531 );

		$post_id       = self::factory()->post->create();
		$permalink     = get_permalink( $post_id );
		$url_to_postid = url_to_postid( $permalink );

		restore_current_blog();

		// Cleanup.
		remove_filter( 'home_url', array( $this, '_filter_http_home_url' ), 10 );

		// Test the tests:
		$this->assertSame( 'http', parse_url( $permalink, PHP_URL_SCHEME ) );
		$this->assertSame( 'https', parse_url( $network_home, PHP_URL_SCHEME ) );

		// Test that the url_to_postid() call matched:
		$this->assertEquals( $post_id, $url_to_postid );
	}

	/**
	 * Enforce an `http` scheme for our target site.
	 *
	 * @param string      $url         The complete home URL including scheme and path.
	 * @param string      $path        Path relative to the home URL. Blank string if no path is specified.
	 * @param string|null $orig_scheme Scheme to give the home URL context.
	 * @param int|null    $blog_id     Site ID, or null for the current site.
	 * @return string                  The complete home URL including scheme and path.
	 */
	function _filter_http_home_url( $url, $path, $orig_scheme, $_blog_id ) {
		global $blog_id;

		if ( $this->blog_id_35531 === $blog_id ) {
			return set_url_scheme( $url, 'http' );
		}

		return $url;
	}

	function test_url_to_postid_custom_post_type() {
		delete_option( 'rewrite_rules' );

		$post_type = rand_str( 12 );
		register_post_type( $post_type, array( 'public' => true ) );

		$id = self::factory()->post->create( array( 'post_type' => $post_type ) );
		$this->assertEquals( $id, url_to_postid( get_permalink( $id ) ) );

		_unregister_post_type( $post_type );
	}

	function test_url_to_postid_hierarchical() {

		$parent_id = self::factory()->post->create( array( 'post_title' => 'Parent', 'post_type' => 'page' ) );
		$child_id = self::factory()->post->create( array( 'post_title' => 'Child', 'post_type' => 'page', 'post_parent' => $parent_id ) );

		$this->assertEquals( $parent_id, url_to_postid( get_permalink( $parent_id ) ) );
		$this->assertEquals( $child_id, url_to_postid( get_permalink( $child_id ) ) );
	}

	function test_url_to_postid_hierarchical_with_matching_leaves() {

		$parent_id = self::factory()->post->create( array(
			'post_name' => 'parent',
			'post_type' => 'page',
		) );
		$child_id_1 = self::factory()->post->create( array(
			'post_name'   => 'child1',
			'post_type'   => 'page',
			'post_parent' => $parent_id,
		) );
		$child_id_2 = self::factory()->post->create( array(
			'post_name'   => 'child2',
			'post_type'   => 'page',
			'post_parent' => $parent_id,
		) );
		$grandchild_id_1 = self::factory()->post->create( array(
			'post_name'   => 'grandchild',
			'post_type'   => 'page',
			'post_parent' => $child_id_1,
		) );
		$grandchild_id_2 = self::factory()->post->create( array(
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

		$id = self::factory()->post->create( array( 'post_title' => 'Hi', 'post_type' => 'page', 'post_name' => 'examp' ) );
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

	/**
	 * @ticket 30018
	 */
	function test_parse_request_home_path_non_public_type() {
		register_post_type( 'foo', array( 'public' => false ) );

		$url = add_query_arg( 'foo', '1', home_url() );

		$this->go_to( $url );

		_unregister_post_type( 'foo' );

		$this->assertEquals( array(), $GLOBALS['wp']->query_vars );
	}

	function test_url_to_postid_dupe_path() {
		update_option( 'home', home_url('/example/') );

		$id = self::factory()->post->create( array( 'post_title' => 'Hi', 'post_type' => 'page', 'post_name' => 'example' ) );

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

		self::factory()->post->create( array( 'post_title' => 'Collision', 'post_type' => 'page', 'post_name' => 'collision' ) );

		// This url should NOT return a post ID
		$badurl = site_url( '/example-collision' );
		$this->assertEquals( 0, url_to_postid( $badurl ) );
	}

	/**
	 * Reveals bug introduced in WP 3.0
	 * @group ms-required
	 */
	function test_url_to_postid_ms_home_url_collision() {
		$this->skipWithoutMultisite();

		$blog_id = self::factory()->blog->create( array( 'path' => '/example' ) );
		switch_to_blog( $blog_id );

		self::factory()->post->create( array( 'post_title' => 'Collision ', 'post_type' => 'page' ) );

		// This url should NOT return a post ID
		$badurl = network_home_url( '/example-collision' );
		$this->assertEquals( 0, url_to_postid( $badurl ) );

		restore_current_blog();
	}

	/**
	 * @ticket 21970
	 */
	function test_url_to_postid_with_post_slug_that_clashes_with_a_trashed_page() {
		$this->set_permalink_structure( '/%postname%/' );

		$page_id = self::factory()->post->create( array( 'post_type' => 'page', 'post_status' => 'trash' ) );
		$post_id = self::factory()->post->create( array( 'post_title' => get_post( $page_id )->post_title ) );

		$this->assertEquals( $post_id, url_to_postid( get_permalink( $post_id ) ) );
	}

	/**
	 * @ticket 34971
	 */
	function test_url_to_postid_static_front_page() {
		$post_id = self::factory()->post->create( array( 'post_type' => 'page' ) );

		$this->assertSame( 0, url_to_postid( home_url() ) );

		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $post_id );

		$this->assertSame( $post_id, url_to_postid( set_url_scheme( home_url(), 'http' ) ) );
		$this->assertSame( $post_id, url_to_postid( set_url_scheme( home_url(), 'https' ) ) );
		$this->assertSame( $post_id, url_to_postid( str_replace( array( 'http://', 'https://' ), 'http://www.', home_url() ) ) );
		$this->assertSame( $post_id, url_to_postid( home_url() . '#random' ) );
		$this->assertSame( $post_id, url_to_postid( home_url() . '?random' ) );

		update_option( 'show_on_front', 'posts' );
	}

	/**
	 * @ticket 21970
	 */
	function test_parse_request_with_post_slug_that_clashes_with_a_trashed_page() {
		$this->set_permalink_structure( '/%postname%/' );

		$page_id = self::factory()->post->create( array( 'post_type' => 'page', 'post_status' => 'trash' ) );
		$post_id = self::factory()->post->create( array( 'post_title' => get_post( $page_id )->post_title ) );

		$this->go_to( get_permalink( $post_id ) );

		$this->assertTrue( is_single() );
		$this->assertFalse( is_404() );
	}

	/**
	 * @ticket 29107
	 */
	public function test_flush_rules_does_not_delete_option() {
		$this->set_permalink_structure( '' );

		$rewrite_rules = get_option( 'rewrite_rules' );
		$this->assertSame( '', $rewrite_rules );

		$this->set_permalink_structure( '/%year%/%monthnum%/%day%/%postname%/' );

		$rewrite_rules = get_option( 'rewrite_rules' );
		$this->assertInternalType( 'array', $rewrite_rules );
		$this->assertNotEmpty( $rewrite_rules );
	}
}
