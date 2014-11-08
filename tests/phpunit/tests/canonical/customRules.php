<?php

/**
 * @group canonical
 * @group rewrite
 * @group query
 */
class Tests_Canonical_CustomRules extends WP_Canonical_UnitTestCase {

	function setUp() {
		parent::setUp();
		global $wp_rewrite;
		// Add a custom Rewrite rule to test category redirections.
		$wp_rewrite->add_rule('ccr/(.+?)/sort/(asc|desc)', 'index.php?category_name=$matches[1]&order=$matches[2]', 'top'); // ccr = Custom_Cat_Rule
		$wp_rewrite->flush_rules();
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
			// Custom Rewrite rules leading to Categories
			array( '/ccr/uncategorized/sort/asc/', array( 'url' => '/ccr/uncategorized/sort/asc/', 'qv' => array( 'category_name' => 'uncategorized', 'order' => 'asc' ) ) ),
			array( '/ccr/uncategorized/sort/desc/', array( 'url' => '/ccr/uncategorized/sort/desc/', 'qv' => array( 'category_name' => 'uncategorized', 'order' => 'desc' ) ) ),
		);
	}
}
