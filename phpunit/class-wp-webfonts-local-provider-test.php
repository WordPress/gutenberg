<?php

/**
 * @group  webfonts
 * @covers WP_WebfontsLocal_Provider
 */
class WP_Webfonts_Provider_Local_Test extends WP_UnitTestCase {
	private $provider;
	private $theme_root;
	private $orig_theme_dir;

	public function setUp() {
		parent::setUp();

		$this->provider = new WP_Webfonts_Provider_Local();

		$this->set_up_theme();
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

	function tear_down() {
		// Restore the original theme directory setup.
		$GLOBALS['wp_theme_directories'] = $this->orig_theme_dir;
		wp_clean_themes_cache();
		unset( $GLOBALS['wp_themes'] );

		parent::tear_down();
	}

	/**
	 * @covers WP_Webfonts_Provider_Local::set_webfonts
	 */
	public function test_set_webfonts() {
		$webfonts = array(
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

		$this->provider->set_webfonts( $webfonts );

		$property = $this->get_webfonts_property();
		$this->assertSame( $webfonts, $property->getValue( $this->provider ) );
	}

	/**
	 * @covers WP_Webfonts_Provider_Local::get_css
	 *
	 * @dataProvider data_get_css
	 *
	 * @param array  $webfonts Prepared webfonts (to store in WP_Webfonts_Provider_Local::$webfonts property).
	 * @param string $expected Expected CSS.
	 */
	public function test_get_css( array $webfonts, $expected ) {
		$property = $this->get_webfonts_property();
		$property->setValue( $this->provider, $webfonts );

		$this->assertSame( $expected, $this->provider->get_css() );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_get_css() {
		return array(
			'truetype format' => array(
				'webfonts' => array(
					'open-sans-bold-italic-local' => array(
						'provider'    => 'local',
						'font-family' => 'Open Sans',
						'font-style'  => 'italic',
						'font-weight' => 'bold',
						'src'         => 'http://example.org/assets/fonts/OpenSans-Italic-VariableFont_wdth,wght.ttf',
					),
				),
				'expected' => <<<CSS
@font-face{font-family:"Open Sans";font-style:italic;font-weight:bold;src:local("Open Sans"), url('http://example.org/assets/fonts/OpenSans-Italic-VariableFont_wdth,wght.ttf') format('truetype');}
CSS
			,
			),
			'woff2 format'    => array(
				'webfonts' => array(
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
				'expected' => <<<CSS
@font-face{font-family:"Source Serif Pro";font-style:normal;font-weight:200 900;font-stretch:normal;src:local("Source Serif Pro"), url('http://example.org/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2') format('woff2');}@font-face{font-family:"Source Serif Pro";font-style:italic;font-weight:200 900;font-stretch:normal;src:local("Source Serif Pro"), url('http://example.org/assets/fonts/source-serif-pro/SourceSerif4Variable-Italic.ttf.woff2') format('woff2');}
CSS
			,
			),
		);
	}

	private function get_webfonts_property() {
		$property = new ReflectionProperty( $this->provider, 'webfonts' );
		$property->setAccessible( true );

		return $property;
	}
}
