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

	/**
	 * @ticket 35284
	 */
	function test_wp_get_installed_translations_for_core() {
		$installed_translations = wp_get_installed_translations( 'core' );
		$this->assertInternalType( 'array', $installed_translations );
		$textdomains_expected = array( 'admin', 'admin-network', 'continents-cities', 'default' );
		$this->assertEqualSets( $textdomains_expected, array_keys( $installed_translations ) );

		$this->assertNotEmpty( $installed_translations['default']['en_GB'] );
		$data_en_GB = $installed_translations['default']['en_GB'];
		$this->assertEquals( '2016-01-14 21:14:29+0000', $data_en_GB['PO-Revision-Date'] );
		$this->assertEquals( 'Development (4.4.x)', $data_en_GB['Project-Id-Version'] );
		$this->assertEquals( 'GlotPress/1.0-alpha-1100', $data_en_GB['X-Generator'] );

		$this->assertNotEmpty( $installed_translations['admin']['es_ES'] );
		$data_es_ES = $installed_translations['admin']['es_ES'];
		$this->assertEquals( '2015-12-22 20:26:46+0000', $data_es_ES['PO-Revision-Date'] );
		$this->assertEquals( 'Administration', $data_es_ES['Project-Id-Version'] );
		$this->assertEquals( 'GlotPress/1.0-alpha-1100', $data_es_ES['X-Generator'] );
	}

	/**
	 * @ticket 35294
	 */
	function test_wp_dropdown_languages() {
		$args = array(
			'id'           => 'foo',
			'name'         => 'bar',
			'languages'    => array( 'de_DE' ),
			'translations' => $this->wp_dropdown_languages_filter(),
			'selected'     => 'de_DE',
			'echo'         => false,
		);
		$actual = wp_dropdown_languages( $args );

		$this->assertContains( 'id="foo"', $actual );
		$this->assertContains( 'name="bar"', $actual );
		$this->assertContains( '<option value="" lang="en" data-installed="1">English (United States)</option>', $actual );
		$this->assertContains( '<option value="de_DE" lang="de" selected=\'selected\' data-installed="1">Deutsch</option>', $actual );
		$this->assertContains( '<option value="it_IT" lang="it">Italiano</option>', $actual );
	}

	/**
	 * We don't want to call the API when testing.
	 *
	 * @return array
	 */
	function wp_dropdown_languages_filter() {
		return array(
			'de_DE' => array(
				'language'    => 'de_DE',
				'native_name' => 'Deutsch',
				'iso'         => array( 'de' ),
			),
			'it_IT' => array(
				'language'    => 'it_IT',
				'native_name' => 'Italiano',
				'iso'         => array( 'it', 'ita' ),
			),
		);
	}

}
