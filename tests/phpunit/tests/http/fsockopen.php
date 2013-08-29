<?php

require_once dirname( __FILE__ ) . '/base.php';

/**
 * @group http
 * @group external-http
 */
class Tests_HTTP_fsockopen extends WP_HTTP_UnitTestCase {
	var $transport = 'fsockopen';
	function setUp() {
		add_filter( 'pre_option_disable_fsockopen', '__return_null' );
		parent::setUp();
	}

	function tearDown() {
		remove_filter( 'pre_option_disable_fsockopen', '__return_null' );
		parent::tearDown();
	}
}
