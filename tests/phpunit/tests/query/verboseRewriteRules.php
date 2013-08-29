<?php

require_once dirname( dirname( __FILE__ ) ) . '/query.php';

/**
 * @group query
 * @group rewrite
 */
class Tests_Query_VerbosePageRules extends Tests_Query_Conditionals {
	function setUp() {
		parent::setUp();
		global $wp_rewrite;
		update_option( 'permalink_structure', '/%category%/%year%/%postname%/' );
		create_initial_taxonomies();
		$GLOBALS['wp_rewrite']->init();
		flush_rewrite_rules();
	}
}
