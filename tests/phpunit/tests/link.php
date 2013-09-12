<?php
/**
 * @group link
 */
class Tests_Link extends WP_UnitTestCase {

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
		$post_id = $this->factory->post->create();
		$post_id2 = $this->factory->post->create();

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

		global $wp_rewrite;
		$wp_rewrite->permalink_structure = '';
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

		$wp_rewrite->set_permalink_structure( '' );
		$wp_rewrite->flush_rules();
	}

	function test_wp_get_shortlink_with_page() {
		$post_id = $this->factory->post->create( array( 'post_type' => 'page' ) );

		// Basic case
		// Don't test against get_permalink() since it uses ?page_id= for pages.
		$this->assertEquals( home_url( '?p=' . $post_id ), wp_get_shortlink( $post_id, 'post' ) );

		global $wp_rewrite;
		$wp_rewrite->permalink_structure = '';
		$wp_rewrite->set_permalink_structure( '/%year%/%monthnum%/%day%/%postname%/' );
		$wp_rewrite->flush_rules();

		$this->assertEquals( home_url( '?p=' . $post_id ), wp_get_shortlink( $post_id, 'post' ) );

		$wp_rewrite->set_permalink_structure( '' );
		$wp_rewrite->flush_rules();
	}

}