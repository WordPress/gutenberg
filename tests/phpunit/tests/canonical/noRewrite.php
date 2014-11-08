<?php

require_once dirname( dirname( __FILE__ ) ) . '/canonical.php';

/**
 * @group canonical
 * @group rewrite
 * @group query
 */
class Tests_Canonical_NoRewrite extends WP_Canonical_UnitTestCase {

	// These test cases are run against the test handler in WP_Canonical
	public static function setUpBeforeClass() {
		self::generate_shared_fixtures();
	}

	public static function tearDownAfterClass() {
		self::delete_shared_fixtures();
	}

	public function setUp() {
		global $wp_rewrite;

		parent::setUp();

		$wp_rewrite->init();
		$wp_rewrite->set_permalink_structure( '' );
		$wp_rewrite->flush_rules();
		$wp_rewrite->init();
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
			array( '/?p=123', '/?p=123' ),

			// This post_type arg should be stripped, because p=1 exists, and does not have post_type= in its query string
			array( '/?post_type=fake-cpt&p=1', '/?p=1' ),

			// Strip an existing but incorrect post_type arg
			array( '/?post_type=page&page_id=1', '/?p=1' ),

			array( '/?p=358 ', array('url' => '/?p=358',  'qv' => array('p' => '358') ) ), // Trailing spaces
			array( '/?p=358%20', array('url' => '/?p=358',  'qv' => array('p' => '358') ) ),

			array( '/?page_id=1', '/?p=1' ), // redirect page_id to p (should cover page_id|p|attachment_id to one another
			array( '/?page_id=1&post_type=revision', '/?p=1' ),

			array( '/?feed=rss2&p=1', '/?feed=rss2&p=1', 21841 ),
			array( '/?feed=rss&p=1', '/?feed=rss2&p=1', 24623 ),

		);
	}
}
