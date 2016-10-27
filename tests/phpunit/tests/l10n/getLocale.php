<?php

/**
 * @group l10n
 * @group i18n
 */
class Tests_L10n_GetLocale extends WP_UnitTestCase {
	public function test_should_respect_locale_global() {
		global $locale;
		$old_locale = $locale;

		$locale = 'foo';

		$found = get_locale();
		$locale = $old_locale;

		$this->assertSame( 'foo', $found );
	}

	public function test_local_option_should_take_precedence_on_multisite() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( __METHOD__ . ' requires Multisite' );
		}

		global $locale;
		$old_locale = $locale;
		$locale = null;

		update_option( 'WPLANG', 'en_GB' );
		update_site_option( 'WPLANG', 'es_ES' );

		$found = get_locale();
		$locale = $old_locale;

		$this->assertSame( 'en_GB', $found );
	}

	public function test_network_option_should_be_fallback_on_multisite() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( __METHOD__ . ' requires Multisite' );
		}

		global $locale;
		$old_locale = $locale;
		$locale = null;

		update_site_option( 'WPLANG', 'es_ES' );

		$found = get_locale();
		$locale = $old_locale;

		$this->assertSame( 'es_ES', $found );
	}

	public function test_option_should_be_respected_on_nonmultisite() {
		if ( is_multisite() ) {
			$this->markTestSkipped( __METHOD__ . ' does not apply to Multisite' );
		}

		global $locale;
		$old_locale = $locale;
		$locale = null;

		update_option( 'WPLANG', 'es_ES' );

		$found = get_locale();
		$locale = $old_locale;

		$this->assertSame( 'es_ES', $found );

	}

	public function test_should_fall_back_on_en_US() {
		global $locale;
		$old_locale = $locale;
		$locale = null;

		$found = get_locale();
		$locale = $old_locale;

		$this->assertSame( 'en_US', $found );
	}

	public function test_should_fall_back_on_locale_when_wpdb_is_unavailable() {
		global $locale, $wpdb;

		$old_locale = $locale;
		$old_wpdb = $wpdb;

		$locale = $expected = "Is this a locale? No. No it isn't.";
		$wpdb = null;

		$found = get_locale();

		$locale = $old_locale;
		$wpdb = $old_wpdb;

		$this->assertSame( $expected, $found );
	}

	public function test_should_fall_back_on_es_US_when_locale_and_wpdb_are_unavailable() {
		global $locale, $wpdb;

		$old_locale = $locale;
		$old_wpdb = $wpdb;

		$locale = null;
		$wpdb = null;

		$found = get_locale();

		$locale = $old_locale;
		$wpdb = $old_wpdb;

		$this->assertSame( 'en_US', $found );
	}

	public function test_should_respect_get_locale_filter() {
		add_filter( 'locale', array( $this, 'filter_get_locale' ) );
		$found = get_locale();
		remove_filter( 'locale', array( $this, 'filter_get_locale' ) );

		$this->assertSame( 'foo', $found );
	}

	public function filter_get_locale() {
		return 'foo';
	}
}
