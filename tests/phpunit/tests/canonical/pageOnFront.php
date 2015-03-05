<?php

/**
 * @group canonical
 * @group rewrite
 * @group query
 */
class Tests_Canonical_PageOnFront extends WP_Canonical_UnitTestCase {
	public static function setUpBeforeClass() {
		self::generate_shared_fixtures();
	}

	public static function tearDownAfterClass() {
		self::delete_shared_fixtures();
	}

	function setUp() {
		parent::setUp();
		global $wp_rewrite;
		update_option( 'show_on_front', 'page' );
		update_option( 'page_for_posts', $this->factory->post->create( array( 'post_title' => 'blog-page', 'post_type' => 'page' ) ) );
		update_option( 'page_on_front', $this->factory->post->create( array( 'post_title' => 'front-page', 'post_type' => 'page' ) ) );
		$wp_rewrite->init();
		$wp_rewrite->flush_rules();
	}

	function tearDown() {
		global $wp_rewrite;
		$wp_rewrite->init();
		parent::tearDown();
	}

	/**
	 * @dataProvider data
	 */
	function test( $test_url, $expected, $ticket = 0, $expected_doing_it_wrong = array() ) {
		$this->assertCanonical( $test_url, $expected, $ticket, $expected_doing_it_wrong );
	}

	function data() {
		/* Format:
		 * [0]: $test_url,
		 * [1]: expected results: Any of the following can be used
		 *      array( 'url': expected redirection location, 'qv': expected query vars to be set via the rewrite AND $_GET );
		 *      array( expected query vars to be set, same as 'qv' above )
		 *      (string) expected redirect location
		 * [3]: (optional) The ticket the test refers to, Can be skipped if unknown.
		 */
		 return array(
			 // Check against an odd redirect
			 array( '/page/2/', '/page/2/', 20385 ),
			 // The page designated as the front page should redirect to the front of the site
			 array( '/front-page/', '/' ),
			 array( '/blog-page/?paged=2', '/blog-page/page/2/' ),
		 );
	}
}
