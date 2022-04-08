<?php
/**
 * Enqueue only webfonts listed in theme.json
 *
 * @package    Gutenberg
 */

// Load additional webfont provider used in tests.
require __DIR__ . '/class-wp-webfonts-mock-provider.php';

/**
 * Tests the enqueueing of webfonts listed in theme.json
 *
 * @group  webfonts
 * @covers gutenberg_register_webfonts_from_theme_json
 *         gutenberg_add_registered_webfonts_to_theme_json
 *         gutenberg_enqueue_webfonts_listed_in_theme_json
 */
class Enqueue_Only_Webfonts_Listed_In_Theme_JSON_Test extends WP_UnitTestCase {
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

	/**
	 * Set up the new theme root directory and throw away the WP_Webfonts class.
	 */
	public function setUp() {
		parent::setUp();

		global $wp_styles;

		$this->old_wp_styles = $wp_styles;

		$wp_styles = null;

		global $wp_webfonts;
		$this->old_wp_webfonts = $wp_webfonts;

		$wp_webfonts = null;

		$this->theme_root = realpath( __DIR__ . '/data/themedir1' );

		$this->old_theme_dir = $GLOBALS['wp_theme_directories'];

		// /themes is necessary as theme.php functions assume /themes is the root if there is only one root.
		$GLOBALS['wp_theme_directories'] = array( WP_CONTENT_DIR . '/themes', $this->theme_root );

		$theme_root_callback = function () {
			return $this->theme_root;
		};

		add_filter( 'theme_root', $theme_root_callback );
		add_filter( 'stylesheet_root', $theme_root_callback );
		add_filter( 'template_root', $theme_root_callback );
		$this->queries = array();
		// Clear caches.
		wp_clean_themes_cache();
		unset( $GLOBALS['wp_themes'] );
	}

	/**
	 * Restores the original theme root and WP_Webfonts instance.
	 */
	public function tearDown() {
		global $wp_webfonts;
		global $wp_styles;

		$wp_webfonts = $this->old_wp_webfonts;
		$wp_styles   = $this->old_wp_styles;

		// Restore the original theme directory setup.
		$GLOBALS['wp_theme_directories'] = $this->old_theme_dir;
		wp_clean_themes_cache();
		unset( $GLOBALS['wp_themes'] );

		parent::tearDown();
	}

	/**
	 * Switches to $theme_name, runs the necessary hooks
	 * and generates the styles for it.
	 *
	 * The styles will hold the webfonts that will get loaded
	 * in the front-end, and that's what this test suite is asserting.
	 *
	 * @param string $theme_name The theme name. Themes are located in phpunited/data/themedir1.
	 */
	private function generate_styles_for_theme( $theme_name ) {
		switch_theme( $theme_name );

		if ( file_exists( get_stylesheet_directory() . '/functions.php' ) ) {
			require_once get_stylesheet_directory() . '/functions.php';
		}

		do_action( 'after_setup_theme' );
		WP_Theme_JSON_Resolver_Gutenberg::clean_cached_data();
		do_action( 'wp_loaded' );

		wp_webfonts()->generate_and_enqueue_styles();
	}

	/**
	 * Enqueue an externally registered font family.
	 *
	 * The `enqueue-font-family` theme registers two font families
	 * but only one is listed in theme.json.
	 */
	public function test_enqueue_an_externally_registered_font_family() {
		$this->generate_styles_for_theme( 'enqueue-font-family' );

		$expected = <<<EOF
<style id='webfonts-inline-css' type='text/css'>
@font-face{font-family:Roboto;font-style:normal;font-weight:400;font-display:fallback;font-stretch:normal;src:local(Roboto), url('/wp-content/plugins/gutenberg/phpunit/data/themedir1/enqueue-font-family/assets/fonts/Roboto-regular.ttf') format('truetype');}
</style>
EOF;

		$this->assertContains(
			$expected,
			get_echo( 'wp_print_styles' )
		);
	}

	/**
	 * Enqueue only one of all externally registered font faces.
	 *
	 * The `enqueue-only-one-font-face` theme registers two font faces
	 * for Roboto, but only one is listed in theme.json.
	 */
	public function test_enqueue_only_one_of_all_externally_registered_font_faces() {
		$this->generate_styles_for_theme( 'enqueue-only-one-font-face' );

		$expected = <<<EOF
<style id='webfonts-inline-css' type='text/css'>
@font-face{font-family:Roboto;font-style:bold;font-weight:900;font-display:fallback;font-stretch:normal;src:local(Roboto), url('/wp-content/plugins/gutenberg/phpunit/data/themedir1/enqueue-only-one-font-face/assets/fonts/Roboto-Bold.ttf') format('truetype');}
</style>
EOF;

		$this->assertContains(
			$expected,
			get_echo( 'wp_print_styles' )
		);
	}

	/**
	 * Register (and enqueue) a collection of font faces to the same provider.
	 *
	 * The `register-and-enqueue-to-the-same-provider` theme registers and
	 * enqueue a font family listed in theme.json through the same provider, declared
	 * at top level.
	 */
	public function test_register_and_enqueue_font_faces_to_same_provider() {
		$this->generate_styles_for_theme( 'register-and-enqueue-to-the-same-provider' );

		$expected = <<<EOF
<style id='webfonts-inline-css' type='text/css'>
@font-face{font-family:Roboto;font-style:regular;font-weight:400;font-display:fallback;src:local(Roboto), url('/wp-content/plugins/gutenberg/phpunit/data/themedir1/register-and-enqueue-to-the-same-provider/assets/fonts/Roboto-Regular.ttf') format('truetype');}@font-face{font-family:Roboto;font-style:bold;font-weight:900;font-display:fallback;src:local(Roboto), url('/wp-content/plugins/gutenberg/phpunit/data/themedir1/register-and-enqueue-to-the-same-provider/assets/fonts/Roboto-Bold.ttf') format('truetype');}
</style>
EOF;

		$this->assertContains(
			$expected,
			get_echo( 'wp_print_styles' )
		);
	}

	/**
	 * Register (and enqueue) a collection of font faces through different providers.
	 *
	 * The `register-and-enqueue-through-different-providers` theme registers and
	 * enqueue a font family listed in theme.json through different providers,
	 * declared at font face level.
	 */
	public function test_register_and_enqueue_font_faces_through_different_providers() {
		wp_register_webfont_provider( 'mock', 'WP_Webfonts_Mock_Provider' );
		$this->generate_styles_for_theme( 'register-and-enqueue-through-different-providers' );

		$expected = <<<EOF
<style id='webfonts-inline-css' type='text/css'>
@font-face{font-family:Roboto;font-style:bold;font-weight:900;font-display:fallback;src:local(Roboto), url('/wp-content/plugins/gutenberg/phpunit/data/themedir1/register-and-enqueue-through-different-providers/assets/fonts/Roboto-Bold.ttf') format('truetype');}@font-face{font-family:Roboto;font-style:regular;font-weight:400;font-display:fallback;src:local(Roboto), url('/wp-content/plugins/gutenberg/phpunit/data/themedir1/register-and-enqueue-through-different-providers/assets/fonts/Roboto-Regular.ttf') format('truetype');}
</style>
EOF;

		$this->assertContains(
			$expected,
			get_echo( 'wp_print_styles' )
		);
	}
}
