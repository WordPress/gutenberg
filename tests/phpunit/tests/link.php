<?php
/**
 * @group link
 */
class Tests_Link extends WP_UnitTestCase {

	function tearDown() {
		global $wp_rewrite;
		parent::tearDown();
		$wp_rewrite->init();
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
}