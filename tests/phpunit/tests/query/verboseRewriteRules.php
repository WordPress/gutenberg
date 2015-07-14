<?php

require_once dirname( __FILE__ ) . '/conditionals.php';

/**
 * @group query
 * @group rewrite
 */
class Tests_Query_VerbosePageRules extends Tests_Query_Conditionals {
	function setUp() {
		global $wp_rewrite;

		parent::setUp();
		
		$wp_rewrite->init();
		$wp_rewrite->set_permalink_structure( '/%category%/%year%/%postname%/' );

		create_initial_taxonomies();

		$wp_rewrite->flush_rules();
	}
}
