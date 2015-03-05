<?php
/**
 * @group link
 */
class Tests_Link extends WP_UnitTestCase {

	function tearDown() {
		global $wp_rewrite;
		$wp_rewrite->init();
		parent::tearDown();
	}

	function _get_pagenum_link_cb( $url ) {
		return $url . '/WooHoo';
	}

	/**
	 * @ticket 8847
	 */
	function test_get_pagenum_link_case_insensitivity() {
		$old_req_uri = $_SERVER['REQUEST_URI'];

		global $wp_rewrite;
		$wp_rewrite->set_permalink_structure('/%year%/%monthnum%/%day%/%postname%/');
		$wp_rewrite->flush_rules();

		add_filter( 'home_url', array( $this, '_get_pagenum_link_cb' ) );
		$_SERVER['REQUEST_URI'] = '/woohoo';
		$paged = get_pagenum_link( 2 );

		remove_filter( 'home_url', array( $this, '_get_pagenum_link_cb' ) );
		$this->assertEquals( $paged, home_url( '/WooHoo/page/2/' ) );

		$_SERVER['REQUEST_URI'] = $old_req_uri;
	}

	function test_wp_get_shortlink() {
		global $wp_rewrite;

		$post_id = $this->factory->post->create();
		$post_id2 = $this->factory->post->create();

		$wp_rewrite->init();
		$wp_rewrite->set_permalink_structure( '' );
		$wp_rewrite->flush_rules();

		// Basic case
		$this->assertEquals( get_permalink( $post_id ), wp_get_shortlink( $post_id, 'post' ) );

		unset( $GLOBALS['post'] );

		// Global post is not set
		$this->assertEquals( '', wp_get_shortlink( 0, 'post' ) );
		$this->assertEquals( '', wp_get_shortlink( 0 ) );
		$this->assertEquals( '', wp_get_shortlink() );

		$GLOBALS['post'] = get_post( $post_id );

		// Global post is set
		$this->assertEquals( get_permalink( $post_id ), wp_get_shortlink( 0, 'post' ) );
		$this->assertEquals( get_permalink( $post_id ), wp_get_shortlink( 0 ) );
		$this->assertEquals( get_permalink( $post_id ), wp_get_shortlink() );

		// Not the global post
		$this->assertEquals( get_permalink( $post_id2 ), wp_get_shortlink( $post_id2, 'post' ) );

		unset( $GLOBALS['post'] );

		// Global post is not set, once again
		$this->assertEquals( '', wp_get_shortlink( 0, 'post' ) );
		$this->assertEquals( '', wp_get_shortlink( 0 ) );
		$this->assertEquals( '', wp_get_shortlink() );

		$wp_rewrite->set_permalink_structure( '/%year%/%monthnum%/%day%/%postname%/' );
		$wp_rewrite->flush_rules();

		// With a permalink structure set, get_permalink() will no longer match.
		$this->assertNotEquals( get_permalink( $post_id ), wp_get_shortlink( $post_id, 'post' ) );
		$this->assertEquals( home_url( '?p=' . $post_id ), wp_get_shortlink( $post_id, 'post' ) );

		// Global post and permalink structure are set
		$GLOBALS['post'] = get_post( $post_id );
		$this->assertEquals( home_url( '?p=' . $post_id ), wp_get_shortlink( 0, 'post' ) );
		$this->assertEquals( home_url( '?p=' . $post_id ), wp_get_shortlink( 0 ) );
		$this->assertEquals( home_url( '?p=' . $post_id ), wp_get_shortlink() );
	}

	function test_wp_get_shortlink_with_page() {
		$post_id = $this->factory->post->create( array( 'post_type' => 'page' ) );

		// Basic case
		// Don't test against get_permalink() since it uses ?page_id= for pages.
		$this->assertEquals( home_url( '?p=' . $post_id ), wp_get_shortlink( $post_id, 'post' ) );

		global $wp_rewrite;
		$wp_rewrite->set_permalink_structure( '/%year%/%monthnum%/%day%/%postname%/' );
		$wp_rewrite->flush_rules();

		$this->assertEquals( home_url( '?p=' . $post_id ), wp_get_shortlink( $post_id, 'post' ) );
	}

	/**
	 * @ticket 26871
	 */
	function test_wp_get_shortlink_with_home_page() {
		$post_id = $this->factory->post->create( array( 'post_type' => 'page' ) );
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $post_id );

		$this->assertEquals( home_url( '/' ), wp_get_shortlink( $post_id, 'post' ) );

		global $wp_rewrite;
		$wp_rewrite->permalink_structure = '';
		$wp_rewrite->set_permalink_structure( '/%year%/%monthnum%/%day%/%postname%/' );
		$wp_rewrite->flush_rules();

		$this->assertEquals( home_url( '/' ), wp_get_shortlink( $post_id, 'post' ) );
	}

	/**
	 * @ticket 17807
	 */
	function test_get_adjacent_post() {
		// Need some sample posts to test adjacency
		$post_one = $this->factory->post->create_and_get( array(
			'post_title' => 'First',
			'post_date' => '2012-01-01 12:00:00'
		) );

		$post_two = $this->factory->post->create_and_get( array(
			'post_title' => 'Second',
			'post_date' => '2012-02-01 12:00:00'
		) );

		$post_three = $this->factory->post->create_and_get( array(
			'post_title' => 'Third',
			'post_date' => '2012-03-01 12:00:00'
		) );

		$post_four = $this->factory->post->create_and_get( array(
			'post_title' => 'Fourth',
			'post_date' => '2012-04-01 12:00:00'
		) );

		// Assign some terms
		wp_set_object_terms( $post_one->ID, 'wordpress', 'category', false );
		wp_set_object_terms( $post_three->ID, 'wordpress', 'category', false );

		wp_set_object_terms( $post_two->ID, 'plugins', 'post_tag', false );
		wp_set_object_terms( $post_four->ID, 'plugins', 'post_tag', false );

		// Test normal post adjacency
		$this->go_to( get_permalink( $post_two->ID ) );

		$this->assertEquals( $post_one, get_adjacent_post( false, '', true ) );
		$this->assertEquals( $post_three, get_adjacent_post( false, '', false ) );

		$this->assertNotEquals( $post_two, get_adjacent_post( false, '', true ) );
		$this->assertNotEquals( $post_two, get_adjacent_post( false, '', false ) );

		// Test category adjacency
		$this->go_to( get_permalink( $post_one->ID ) );

		$this->assertEquals( '', get_adjacent_post( true, '', true, 'category' ) );
		$this->assertEquals( $post_three, get_adjacent_post( true, '', false, 'category' ) );

		// Test tag adjacency
		$this->go_to( get_permalink( $post_two->ID ) );

		$this->assertEquals( '', get_adjacent_post( true, '', true, 'post_tag' ) );
		$this->assertEquals( $post_four, get_adjacent_post( true, '', false, 'post_tag' ) );

		// Test normal boundary post
		$this->go_to( get_permalink( $post_two->ID ) );

		$this->assertEquals( array( $post_one ), get_boundary_post( false, '', true ) );
		$this->assertEquals( array( $post_four ), get_boundary_post( false, '', false ) );

		// Test category boundary post
		$this->go_to( get_permalink( $post_one->ID ) );

		$this->assertEquals( array( $post_one ), get_boundary_post( true, '', true, 'category' ) );
		$this->assertEquals( array( $post_three ), get_boundary_post( true, '', false, 'category' ) );

		// Test tag boundary post
		$this->go_to( get_permalink( $post_two->ID ) );

		$this->assertEquals( array( $post_two ), get_boundary_post( true, '', true, 'post_tag' ) );
		$this->assertEquals( array( $post_four ), get_boundary_post( true, '', false, 'post_tag' ) );
	}

	/**
	 * @ticket 22112
	 */
	function test_get_adjacent_post_exclude_self_term() {
		// Bump term_taxonomy to mimic shared term offsets.
		global $wpdb;
		$wpdb->insert( $wpdb->term_taxonomy, array( 'taxonomy' => 'foo', 'term_id' => 12345, 'description' => '' ) );

		$include = $this->factory->term->create( array(
			'taxonomy' => 'category',
			'name' => 'Include',
		) );
		$exclude = $this->factory->category->create();

		$one = $this->factory->post->create_and_get( array(
			'post_date' => '2012-01-01 12:00:00',
			'post_category' => array( $include, $exclude ),
		) );

		$two = $this->factory->post->create_and_get( array(
			'post_date' => '2012-01-02 12:00:00',
			'post_category' => array(),
		) );

		$three = $this->factory->post->create_and_get( array(
			'post_date' => '2012-01-03 12:00:00',
			'post_category' => array( $include, $exclude ),
		) );

		$four = $this->factory->post->create_and_get( array(
			'post_date' => '2012-01-04 12:00:00',
			'post_category' => array( $include ),
		) );

		$five = $this->factory->post->create_and_get( array(
			'post_date' => '2012-01-05 12:00:00',
			'post_category' => array( $include, $exclude ),
		) );

		// First post
		$this->go_to( get_permalink( $one ) );
		$this->assertEquals( $two, get_adjacent_post( false, array(), false ) );
		$this->assertEquals( $three, get_adjacent_post( true, array(), false ) );
		$this->assertEquals( $two, get_adjacent_post( false, array( $exclude ), false ) );
		$this->assertEquals( $four, get_adjacent_post( true, array( $exclude ), false ) );
		$this->assertEmpty( get_adjacent_post( false, array(), true ) );

		// Fourth post
		$this->go_to( get_permalink( $four ) );
		$this->assertEquals( $five, get_adjacent_post( false, array(), false ) );
		$this->assertEquals( $five, get_adjacent_post( true, array(), false ) );
		$this->assertEmpty( get_adjacent_post( false, array( $exclude ), false ) );
		$this->assertEmpty( get_adjacent_post( true, array( $exclude ), false ) );

		$this->assertEquals( $three, get_adjacent_post( false, array(), true ) );
		$this->assertEquals( $three, get_adjacent_post( true, array(), true ) );
		$this->assertEquals( $two, get_adjacent_post( false, array( $exclude ), true ) );
		$this->assertEmpty( get_adjacent_post( true, array( $exclude ), true ) );

		// Last post
		$this->go_to( get_permalink( $five ) );
		$this->assertEquals( $four, get_adjacent_post( false, array(), true ) );
		$this->assertEquals( $four, get_adjacent_post( true, array(), true ) );
		$this->assertEquals( $four, get_adjacent_post( false, array( $exclude ), true ) );
		$this->assertEquals( $four, get_adjacent_post( true, array( $exclude ), true ) );
		$this->assertEmpty( get_adjacent_post( false, array(), false ) );
	}

	public function test_wp_make_link_relative_with_http_scheme() {
		$link = 'http://example.com/this-is-a-test-http-url/';
		$relative_link = wp_make_link_relative( $link );
		$this->assertEquals( '/this-is-a-test-http-url/', $relative_link );
	}

	public function test_wp_make_link_relative_with_https_scheme() {
		$link = 'https://example.com/this-is-a-test-https-url/';
		$relative_link = wp_make_link_relative( $link );
		$this->assertEquals( '/this-is-a-test-https-url/', $relative_link );
	}

	/**
	 * @ticket 30373
	 */
	public function test_wp_make_link_relative_with_no_scheme() {
		$link = '//example.com/this-is-a-test-schemeless-url/';
		$relative_link = wp_make_link_relative( $link );
		$this->assertEquals( '/this-is-a-test-schemeless-url/', $relative_link );
	}

	/**
	 * @ticket 30373
	 */
	public function test_wp_make_link_relative_should_retain_URL_param_that_is_also_a_URL() {
		$link = 'https://example.com/this-is-a-test/?redirect=https://example.org/a-different-test-post/';
		$relative_link = wp_make_link_relative( $link );
		$this->assertEquals( '/this-is-a-test/?redirect=https://example.org/a-different-test-post/', $relative_link );
	}

	/**
	 * @ticket 30910
	 */
	public function test_get_permalink_should_not_reveal_post_name_for_post_with_post_status_future() {
		update_option( 'permalink_structure','/%year%/%monthnum%/%day%/%postname%/' );

		flush_rewrite_rules();

		$p = $this->factory->post->create( array(
			'post_status' => 'publish',
			'post_date'   => strftime( '%Y-%m-%d %H:%M:%S', strtotime( '+1 day' ) )
		) );

		$non_pretty_permalink = add_query_arg( 'p', $p, trailingslashit( home_url() ) );

		$this->assertEquals( $non_pretty_permalink, get_permalink( $p ) );
	}

	/**
	 * @ticket 30910
	 */
	public function test_get_permalink_should_not_reveal_post_name_for_cpt_with_post_status_future() {
		update_option( 'permalink_structure','/%year%/%monthnum%/%day%/%postname%/' );

		register_post_type( 'wptests_pt', array( 'public' => true ) );

		flush_rewrite_rules();

		$p = $this->factory->post->create( array(
			'post_status' => 'future',
			'post_type'   => 'wptests_pt',
			'post_date'   => strftime( '%Y-%m-%d %H:%M:%S', strtotime( '+1 day' ) )
		) );

		$non_pretty_permalink = add_query_arg( array(
			'post_type' => 'wptests_pt',
			'p' => $p,
		), trailingslashit( home_url() ) );

		$this->assertEquals( $non_pretty_permalink, get_permalink( $p ) );
	}
}
