<?php

/**
 * @group formatting
 */
class Tests_Formatting_IsEmail extends WP_UnitTestCase {
	function test_returns_true_if_given_a_valid_email_address() {
		$data = array(
			"bob@example.com",
			"phil@example.info",
			"ace@204.32.222.14",
			"kevin@many.subdomains.make.a.happy.man.edu"
			);
		foreach ( $data as $datum ) {
			$this->assertEquals( $datum, is_email($datum), $datum );
		}
	}

	function test_returns_false_if_given_an_invalid_email_address() {
		$data = array(
			"khaaaaaaaaaaaaaaan!",
			'http://bob.example.com/',
			"sif i'd give u it, spamer!1",
			"com.exampleNOSPAMbob",
			"bob@your mom"
			);
		foreach ($data as $datum) {
			$this->assertFalse(is_email($datum), $datum);
		}
	}
}
