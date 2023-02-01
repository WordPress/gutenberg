<?php
/**
 * WP_Fonts_Local_Provider tests.
 *
 * @package    WordPress
 * @subpackage Fonts API
 */

require_once __DIR__ . '/wp-fonts-testcase.php';

/**
 * @group fontsapi
 */
class Tests_Fonts_WpFontsProviderLocal extends WP_UnitTestCase {
	private $provider;
	private $theme_root;
	private $orig_theme_dir;

	public function set_up() {
		parent::set_up();

		$this->provider = new WP_Fonts_Provider_Local();

		$this->set_up_theme();
	}

	public function tear_down() {
		// Restore the original theme directory setup.
		$GLOBALS['wp_theme_directories'] = $this->orig_theme_dir;
		wp_clean_themes_cache();
		unset( $GLOBALS['wp_themes'] );

		parent::tear_down();
	}

	/**
	 * @covers WP_Fonts_Provider_Local::set_fonts
	 */
	public function test_set_fonts() {
		$fonts = array(
			'source-serif-pro-200-900-normal-local' => array(
				'provider'     => 'local',
				'font-family'  => 'Source Serif Pro',
				'font-style'   => 'normal',
				'font-weight'  => '200 900',
				'font-stretch' => 'normal',
				'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
			),
			'source-serif-pro-200-900-italic-local' => array(
				'provider'     => 'local',
				'font-family'  => 'Source Serif Pro',
				'font-style'   => 'italic',
				'font-weight'  => '200 900',
				'font-stretch' => 'normal',
				'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Italic.ttf.woff2',
			),
		);

		$this->provider->set_fonts( $fonts );

		$property = $this->get_fonts_property();
		$this->assertSame( $fonts, $property->getValue( $this->provider ) );
	}

	/**
	 * @covers WP_Fonts_Provider_Local::get_css
	 *
	 * @dataProvider data_get_css_print_styles
	 *
	 * @param array  $fonts Prepared fonts (to store in WP_Fonts_Provider_Local::$fonts property).
	 * @param string $expected Expected CSS.
	 */
	public function test_get_css( array $fonts, $expected ) {
		$property = $this->get_fonts_property();
		$property->setValue( $this->provider, $fonts );

		$this->assertSame( $expected['font-face-css'], $this->provider->get_css() );
	}

	/**
	 * @covers WP_Fonts_Provider_Local::print_styles
	 *
	 * @dataProvider data_get_css_print_styles
	 *
	 * @param array  $fonts Prepared fonts (to store in WP_Fonts_Provider_Local::$fonts property).
	 * @param string $expected Expected CSS.
	 */
	public function test_print_styles( array $fonts, $expected ) {
		$property = $this->get_fonts_property();
		$property->setValue( $this->provider, $fonts );

		$expected_output = sprintf( $expected['style-element'], $expected['font-face-css'] );
		$this->expectOutputString( $expected_output );
		$this->provider->print_styles();
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_get_css_print_styles() {
		return array(
			'truetype format' => array(
				'fonts'    => array(
					'open-sans-bold-italic-local' => array(
						'provider'    => 'local',
						'font-family' => 'Open Sans',
						'font-style'  => 'italic',
						'font-weight' => 'bold',
						'src'         => 'http://example.org/assets/fonts/OpenSans-Italic-VariableFont_wdth,wght.ttf',
					),
				),
				'expected' => array(
					'style-element' => "<style id='wp-fonts-local' type='text/css'>\n%s\n</style>\n",
					'font-face-css' => <<<CSS
@font-face{font-family:"Open Sans";font-style:italic;font-weight:bold;src:url('http://example.org/assets/fonts/OpenSans-Italic-VariableFont_wdth,wght.ttf') format('truetype');}
CSS
					,
				),
			),
			'woff2 format'    => array(
				'fonts'    => array(
					'source-serif-pro-200-900-normal-local' => array(
						'provider'     => 'local',
						'font-family'  => 'Source Serif Pro',
						'font-style'   => 'normal',
						'font-weight'  => '200 900',
						'font-stretch' => 'normal',
						'src'          => 'http://example.org/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
					),
					'source-serif-pro-400-900-italic-local' => array(
						'provider'     => 'local',
						'font-family'  => 'Source Serif Pro',
						'font-style'   => 'italic',
						'font-weight'  => '200 900',
						'font-stretch' => 'normal',
						'src'          => 'http://example.org/assets/fonts/source-serif-pro/SourceSerif4Variable-Italic.ttf.woff2',
					),
				),
				'expected' => array(
					'style-element' => "<style id='wp-fonts-local' type='text/css'>\n%s\n</style>\n",
					'font-face-css' => <<<CSS
@font-face{font-family:"Source Serif Pro";font-style:normal;font-weight:200 900;font-stretch:normal;src:url('http://example.org/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2') format('woff2');}@font-face{font-family:"Source Serif Pro";font-style:italic;font-weight:200 900;font-stretch:normal;src:url('http://example.org/assets/fonts/source-serif-pro/SourceSerif4Variable-Italic.ttf.woff2') format('woff2');}
CSS

					,
				),
			),
		);
	}

	/**
	 * Local `src` paths to need to be relative to the theme. This method sets up the
	 * `wp-content/themes/` directory to ensure consistency when running tests.
	 */
	private function set_up_theme() {
		$this->theme_root                = realpath( DIR_TESTDATA . '/themedir1' );
		$this->orig_theme_dir            = $GLOBALS['wp_theme_directories'];
		$GLOBALS['wp_theme_directories'] = array( $this->theme_root );

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

	private function get_fonts_property() {
		$property = new ReflectionProperty( $this->provider, 'fonts' );
		$property->setAccessible( true );

		return $property;
	}
}
