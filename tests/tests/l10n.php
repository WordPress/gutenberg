<?php

/**
 * @group l10n
 * @group i18n
 */
class Tests_L10n extends WP_UnitTestCase {

	function test_load_unload_textdomain() {
		$this->assertFalse( is_textdomain_loaded( 'wp-tests-domain' ) );
		$this->assertFalse( unload_textdomain( 'wp-tests-domain' ) );
		$this->assertTrue( load_textdomain( 'wp-tests-domain', DIR_TESTDATA . '/wpcom-themes/p2/languages/es_ES.mo' ) );
		$this->assertTrue( is_textdomain_loaded( 'wp-tests-domain' ) );
		$this->assertTrue( unload_textdomain( 'wp-tests-domain' ) );
		$this->assertFalse( is_textdomain_loaded( 'wp-tests-domain' ) );
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
}