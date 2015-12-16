<?php

/**
 * @group l10n
 * @group i18n
 */
class Tests_L10n extends WP_UnitTestCase {

	function test_load_unload_textdomain() {
		$this->assertFalse( is_textdomain_loaded( 'wp-tests-domain' ) );
		$this->assertFalse( unload_textdomain( 'wp-tests-domain' ) );

		$file = DIR_TESTDATA . '/pomo/simple.mo';
		$this->assertTrue( load_textdomain( 'wp-tests-domain', $file ) );
		$this->assertTrue( is_textdomain_loaded( 'wp-tests-domain' ) );
		$this->assertTrue( unload_textdomain( 'wp-tests-domain' ) );
		$this->assertFalse( is_textdomain_loaded( 'wp-tests-domain' ) );
	}

	/**
	 * @ticket 35073
	 */
	function test_before_last_bar() {
		$this->assertEquals( 'no-bar-at-all', before_last_bar( 'no-bar-at-all' ) );
		$this->assertEquals( 'before-last-bar', before_last_bar( 'before-last-bar|after-bar' ) );
		$this->assertEquals( 'first-before-bar|second-before-bar', before_last_bar( 'first-before-bar|second-before-bar|after-last-bar' ) );
	}

}
