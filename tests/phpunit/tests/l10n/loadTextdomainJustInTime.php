<?php

/**
 * @group l10n
 * @group i18n
 */
class Tests_L10n_loadTextdomainJustInTime extends WP_UnitTestCase {

	private $orig_theme_dir;
	private $theme_root;

	function setUp() {
		parent::setUp();

		$this->theme_root = DIR_TESTDATA . '/themedir1';
		$this->orig_theme_dir = $GLOBALS['wp_theme_directories'];

		// /themes is necessary as theme.php functions assume /themes is the root if there is only one root.
		$GLOBALS['wp_theme_directories'] = array( WP_CONTENT_DIR . '/themes', $this->theme_root );
		add_filter( 'theme_root', array( $this, 'filter_theme_root' ) );
		add_filter( 'stylesheet_root', array( $this, 'filter_theme_root' ) );
		add_filter( 'template_root', array( $this, 'filter_theme_root' ) );
		wp_clean_themes_cache();
		unset( $GLOBALS['wp_themes'] );

		unset( $GLOBALS['l10n_unloaded'] );
	}

	function tearDown() {
		$GLOBALS['wp_theme_directories'] = $this->orig_theme_dir;
		remove_filter( 'theme_root', array( $this, 'filter_theme_root' ) );
		remove_filter( 'stylesheet_root', array( $this, 'filter_theme_root' ) );
		remove_filter( 'template_root', array( $this, 'filter_theme_root' ) );
		wp_clean_themes_cache();
		unset( $GLOBALS['wp_themes'] );

		parent::tearDown();
	}

	/**
	 * Replace the normal theme root dir with our pre-made test dir.
	 */
	public function filter_theme_root() {
		return $this->theme_root;
	}

	public function filter_set_locale_to_german() {
		return 'de_DE';
	}

	/**
	 * @ticket 34114
	 */
	public function test_plugin_translation_should_be_translated_without_calling_load_plugin_textdomain() {
		add_filter( 'locale', array( $this, 'filter_set_locale_to_german' ) );

		require_once DIR_TESTDATA . '/plugins/internationalized-plugin.php';

		$is_textdomain_loaded_before = is_textdomain_loaded( 'internationalized-plugin' );
		$expected_output             = i18n_plugin_test();
		$is_textdomain_loaded_after  = is_textdomain_loaded( 'internationalized-plugin' );

		unload_textdomain( 'internationalized-plugin' );
		remove_filter( 'locale', array( $this, 'filter_set_locale_to_german' ) );

		$this->assertFalse( $is_textdomain_loaded_before );
		$this->assertSame( 'Das ist ein Dummy Plugin', $expected_output );
		$this->assertTrue( $is_textdomain_loaded_after );
	}

	/**
	 * @ticket 34114
	 */
	public function test_theme_translation_should_be_translated_without_calling_load_theme_textdomain() {
		add_filter( 'locale', array( $this, 'filter_set_locale_to_german' ) );

		switch_theme( 'internationalized-theme' );

		include_once get_stylesheet_directory() . '/functions.php';

		$is_textdomain_loaded_before = is_textdomain_loaded( 'internationalized-theme' );
		$expected_output             = i18n_theme_test();
		$is_textdomain_loaded_after  = is_textdomain_loaded( 'internationalized-theme' );

		unload_textdomain( 'internationalized-theme' );
		remove_filter( 'locale', array( $this, 'filter_set_locale_to_german' ) );

		$this->assertFalse( $is_textdomain_loaded_before );
		$this->assertSame( 'Das ist ein Dummy Theme', $expected_output );
		$this->assertTrue( $is_textdomain_loaded_after );
	}

	/**
	 * @ticket 34114
	 */
	public function test_get_translations_for_domain_does_not_return_null_if_override_load_textdomain_is_used() {
		add_filter( 'locale', array( $this, 'filter_set_locale_to_german' ) );
		add_filter( 'override_load_textdomain', '__return_true' );
		$translations = get_translations_for_domain( 'internationalized-plugin' );
		remove_filter( 'override_load_textdomain', '__return_true' );
		remove_filter( 'locale', array( $this, 'filter_set_locale_to_german' ) );

		$this->assertTrue( $translations instanceof NOOP_Translations );
	}

	/**
	 * @ticket 37113
	 */
	public function test_should_allow_unloading_of_text_domain() {
		add_filter( 'locale', array( $this, 'filter_set_locale_to_german' ) );

		require_once DIR_TESTDATA . '/plugins/internationalized-plugin.php';

		$expected_output_before      = i18n_plugin_test();
		$is_textdomain_loaded_before = is_textdomain_loaded( 'internationalized-plugin' );

		unload_textdomain( 'internationalized-plugin' );
		remove_filter( 'locale', array( $this, 'filter_set_locale_to_german' ) );

		$expected_output_after      = i18n_plugin_test();
		$is_textdomain_loaded_after = is_textdomain_loaded( 'internationalized-plugin' );

		add_filter( 'locale', array( $this, 'filter_set_locale_to_german' ) );
		load_textdomain( 'internationalized-plugin', WP_LANG_DIR . '/plugins/internationalized-plugin-de_DE.mo' );

		$expected_output_final      = i18n_plugin_test();
		$is_textdomain_loaded_final = is_textdomain_loaded( 'internationalized-plugin' );

		unload_textdomain( 'internationalized-plugin' );
		remove_filter( 'locale', array( $this, 'filter_set_locale_to_german' ) );

		// Text domain loaded just in time.
		$this->assertSame( 'Das ist ein Dummy Plugin', $expected_output_before );
		$this->assertTrue( $is_textdomain_loaded_before );

		// Text domain unloaded.
		$this->assertSame( 'This is a dummy plugin', $expected_output_after );
		$this->assertFalse( $is_textdomain_loaded_after );

		// Text domain loaded manually again.
		$this->assertSame( 'Das ist ein Dummy Plugin', $expected_output_final );
		$this->assertTrue( $is_textdomain_loaded_final );
	}
}
