<?php
/**
 * Enqueue only webfonts listed in theme.json
 *
 * @package    Gutenberg
 */

/**
 * Integration tests for the theme.json webfonts handler.
 *
 * @group  webfonts
 */
class Test_WebfontsApi_WpThemeJsonWebfontsHandler extends WP_UnitTestCase {

	/**
	 * WP_Webfonts instance reference
	 *
	 * @var WP_Webfonts
	 */
	private $old_wp_webfonts;

	/**
	 * WP_Styles instance reference
	 *
	 * @var WP_Styles
	 */
	private $old_wp_styles;

	/**
	 * Theme root path.
	 *
	 * @var string
	 */
	private $theme_root;

	/**
	 * The old theme root path.
	 *
	 * @var string
	 */
	private $old_theme_dir;

	public function set_up() {
		parent::set_up();
		remove_action( 'plugins_loaded', '_wp_theme_json_webfonts_handler' );

		global $wp_styles;
		$this->old_wp_styles = $wp_styles;
		$wp_styles           = null;

		global $wp_webfonts;
		$this->old_wp_webfonts = $wp_webfonts;
		$wp_webfonts           = null;

		$this->theme_root    = realpath( __DIR__ . '/data/themedir1' );
		$this->old_theme_dir = $GLOBALS['wp_theme_directories'];

		// /themes is necessary as theme.php functions assume /themes is the root if there is only one root.
		$GLOBALS['wp_theme_directories'] = array( WP_CONTENT_DIR . '/themes', $this->theme_root );

		$theme_root_callback = function () {
			return $this->theme_root;
		};

		add_filter( 'theme_root', $theme_root_callback );
		add_filter( 'stylesheet_root', $theme_root_callback );
		add_filter( 'template_root', $theme_root_callback );

		// Clear caches.
		wp_clean_themes_cache();
		unset( $GLOBALS['wp_themes'] );
	}

	public function tear_down() {
		global $wp_webfonts;
		global $wp_styles;

		$wp_webfonts = $this->old_wp_webfonts;
		$wp_styles   = $this->old_wp_styles;

		// Restore the original theme directory setup.
		$GLOBALS['wp_theme_directories'] = $this->old_theme_dir;
		wp_clean_themes_cache();
		unset( $GLOBALS['wp_themes'] );

		parent::tear_down();
	}

	public function test_font_face_styles_are_generated() {
		// Set up the theme.
		switch_theme( 'webfonts-theme' );
		do_action( 'after_setup_theme' );
		WP_Theme_JSON_Resolver::clean_cached_data();
		do_action( 'wp_loaded' );
		do_action( 'wp_enqueue_scripts' );

		$expected = <<<EOF
<style id='wp-webfonts-inline-css' type='text/css'>
@font-face{font-family:"Source Serif Pro";font-style:normal;font-weight:200 900;font-display:fallback;src:local("Source Serif Pro"), url('/wp-content/gutenberg/phpunit/data/themedir1/assets/fonts/SourceSerif4Variable-Roman.ttf.woff2') format('woff2');font-stretch:normal;}@font-face{font-family:"Source Serif Pro";font-style:italic;font-weight:200 900;font-display:fallback;src:local("Source Serif Pro"), url('/wp-content/gutenberg/phpunit/data/themedir1/assets/fonts/SourceSerif4Variable-Italic.ttf.woff2') format('woff2');font-stretch:normal;}
</style>
EOF;

		$this->assertStringContainsString(
			$expected,
			get_echo( 'wp_print_styles' )
		);
	}

	public function test_mime_types_added() {
		$actual = wp_get_mime_types();

		$this->assertArrayHasKey( 'woff2', $actual, 'woff2 mime type is expected to be added' );
		$this->assertArrayHasKey( 'woff', $actual, 'woff mime type is expected to be added' );
		$this->assertArrayHasKey( 'ttf', $actual, 'ttf mime type is expected to be added' );
		$this->assertArrayHasKey( 'otf', $actual, 'otf mime type is expected to be added' );
	}
}
