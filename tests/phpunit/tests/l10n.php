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

	/**
	 * @ticket 21319
	 */
	function test_is_textdomain_loaded_for_no_translations() {
		$this->assertFalse( load_textdomain( 'wp-tests-domain', DIR_TESTDATA . '/non-existent-file' ) );
		$this->assertFalse( is_textdomain_loaded( 'wp-tests-domain' ) );
		$this->assertInstanceOf( 'NOOP_Translations', get_translations_for_domain( 'wp-tests-domain' ) );
		// Ensure that we don't confuse NOOP_Translations to be a loaded text domain.
		$this->assertFalse( is_textdomain_loaded( 'wp-tests-domain' ) );
		$this->assertFalse( unload_textdomain( 'wp-tests-domain' ) );
	}

	/**
	 * @ticket 21319
	 */
	function test_is_textdomain_is_not_loaded_after_gettext_call_with_no_translations() {
		$this->assertFalse( is_textdomain_loaded( 'wp-tests-domain' ) );
		__( 'just some string', 'wp-tests-domain' );
		$this->assertFalse( is_textdomain_loaded( 'wp-tests-domain' ) );
	}
}
