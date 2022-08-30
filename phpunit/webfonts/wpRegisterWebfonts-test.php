<?php
/**
 * Integration tests for wp_register_webfonts().
 *
 * @package    WordPress
 * @subpackage Webfonts
 */

require_once __DIR__ . '/wp-webfonts-testcase.php';

/**
 * @group  webfonts
 * @covers ::wp_register_webfonts
 * @covers WP_Webfonts::add
 * @covers WP_Webfonts::add_variation
 */
class Tests_Webfonts_WpRegisterWebfonts extends WP_Webfonts_TestCase {
	use WP_Webfonts_Tests_Datasets;

	/**
	 * @dataProvider data_webfonts
	 *
	 * @param array $webfonts Array of webfonts to test.
	 * @param array $expected Expected results.
	 */
	public function test_should_register( array $webfonts, array $expected ) {
		$actual = wp_register_webfonts( $webfonts );
		$this->assertSame( $expected['wp_register_webfonts'], $actual, 'Font family handle(s) should be returned' );
		$this->assertSame( $expected['get_registered'], $this->get_registered_handles(), 'Web fonts should match registered queue' );
	}

	/**
	 * @dataProvider data_webfonts
	 *
	 * @param array $webfonts Array of webfonts to test.
	 */
	public function test_should_not_enqueue_on_registration( array $webfonts ) {
		wp_register_webfonts( $webfonts );
		$this->assertEmpty( $this->get_enqueued_handles() );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_webfonts() {
		return array(
			'font family keyed with slug' => array(
				'webfonts' => array(
					'source-serif-pro' => array(
						array(
							'provider'     => 'local',
							'font-style'   => 'normal',
							'font-weight'  => '200 900',
							'font-stretch' => 'normal',
							'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
							'font-display' => 'fallback',
						),
					),
				),
				'expected' => array(
					'wp_register_webfonts' => array( 'source-serif-pro' ),
					'get_registered'       => array(
						'source-serif-pro',
						'source-serif-pro-200-900-normal',
					),
				),
			),
			'font family keyed with name' => array(
				'webfonts' => array(
					'Source Serif Pro' => array(
						array(
							'provider'     => 'local',
							'font-style'   => 'normal',
							'font-weight'  => '200 900',
							'font-stretch' => 'normal',
							'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
							'font-display' => 'fallback',
						),
						array(
							'provider'     => 'local',
							'font-style'   => 'italic',
							'font-weight'  => '200 900',
							'font-stretch' => 'normal',
							'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Italic.ttf.woff2',
							'font-display' => 'fallback',
						),
					),
				),
				'expected' => array(
					'wp_register_webfonts' => array( 'source-serif-pro' ),
					'get_registered'       => array(
						'source-serif-pro',
						'source-serif-pro-200-900-normal',
						'source-serif-pro-200-900-italic',
					),
				),
			),
		);
	}

	/**
	 * @dataProvider data_deprecated_structure
	 *
	 * @param array $webfonts Webfonts to test.
	 */
	public function test_should_throw_deprecation_with_deprecated_structure( array $webfonts ) {
		$this->expectDeprecation();
		$this->expectDeprecationMessage(
			'A deprecated web fonts array structure passed to wp_register_webfonts(). ' .
			'Variations must be grouped and keyed by their font family.'
		);

		wp_register_webfonts( $webfonts );
	}

	/**
	 * @dataProvider data_deprecated_structure
	 *
	 * @param array $webfonts Webfonts to test.
	 * @param array $expected Expected results.
	 */
	public function test_should_register_with_deprecated_structure( array $webfonts, array $expected ) {
		$this->suppress_deprecations();

		$actual = wp_register_webfonts( $webfonts );
		$this->assertSame( $expected['wp_register_webfonts'], $actual, 'Font family handle(s) should be returned' );
		$this->assertSame( $expected['get_registered'], $this->get_registered_handles(), 'Web fonts should match registered queue' );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_deprecated_structure() {
		return array(
			'1 web font'                           => array(
				'webfonts' => array(
					array(
						'provider'     => 'local',
						'font-family'  => 'Merriweather',
						'font-style'   => 'normal',
						'font-weight'  => '200 900',
						'font-display' => 'fallback',
						'font-stretch' => 'normal',
						'src'          => 'https://example.com/assets/fonts/merriweather.ttf.woff2',
					),
				),
				'expected' => array(
					'wp_register_webfonts' => array( 'merriweather' => true ),
					'get_registered'       => array( 'merriweather', 'merriweather-200-900-normal' ),
				),
			),
			'2 web font in same font family'       => array(
				'webfonts' => array(
					array(
						'provider'     => 'local',
						'font-family'  => 'Source Serif Pro',
						'font-style'   => 'normal',
						'font-weight'  => '300',
						'font-display' => 'fallback',
						'font-stretch' => 'normal',
						'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
						'font-display' => 'fallback',
					),
					array(
						'provider'     => 'local',
						'font-family'  => 'Source Serif Pro',
						'font-style'   => 'italic',
						'font-weight'  => '900',
						'font-display' => 'fallback',
						'font-stretch' => 'normal',
						'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Italic.ttf.woff2',
						'font-display' => 'fallback',
					),
				),
				'expected' => array(
					'wp_register_webfonts' => array( 'source-serif-pro' => true ),
					'get_registered'       => array(
						'source-serif-pro',
						'source-serif-pro-300-normal',
						'source-serif-pro-900-italic',
					),
				),
			),
			'Web fonts in different font families' => array(
				'webfonts' => array(
					array(
						'provider'     => 'local',
						'font-family'  => 'Source Serif Pro',
						'font-style'   => 'normal',
						'font-weight'  => '300',
						'font-display' => 'fallback',
						'font-stretch' => 'normal',
						'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
						'font-display' => 'fallback',
					),
					array(
						'provider'     => 'local',
						'font-family'  => 'Merriweather',
						'font-style'   => 'normal',
						'font-weight'  => '200 900',
						'font-display' => 'fallback',
						'font-stretch' => 'normal',
						'src'          => 'https://example.com/assets/fonts/merriweather.ttf.woff2',
					),
					array(
						'provider'     => 'local',
						'font-family'  => 'Source Serif Pro',
						'font-style'   => 'italic',
						'font-weight'  => '900',
						'font-display' => 'fallback',
						'font-stretch' => 'normal',
						'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Italic.ttf.woff2',
						'font-display' => 'fallback',
					),
				),
				'expected' => array(
					'wp_register_webfonts' => array(
						'source-serif-pro' => true,
						'merriweather'     => true,
					),
					'get_registered'       => array(
						'source-serif-pro',
						'source-serif-pro-300-normal',
						'merriweather',
						'merriweather-200-900-normal',
						'source-serif-pro-900-italic',
					),
				),
			),
		);
	}

	/**
	 * @dataProvider data_invalid_font_family
	 *
	 * @param array  $webfonts         Web fonts to test.
	 * @param string $expected_message Expected notice message.
	 */
	public function test_should_not_register_with_undefined_font_family( array $webfonts, $expected_message ) {
		$this->suppress_deprecations();

		$this->expectNotice();
		$this->expectNoticeMessage( $expected_message );

		$actual = wp_register_webfonts( $webfonts );
		$this->assertSame( array(), $actual, 'Return value should be an empty array' );
		$this->assertEmpty( $this->get_registered_handles(), 'No Web fonts should have registered' );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_invalid_font_family() {
		return array(
			'non-string'                                  => array(
				'webfonts'         => array(
					array(
						'provider'     => 'local',
						'font-family'  => null,
						'font-style'   => 'normal',
						'font-weight'  => '200 900',
						'font-display' => 'fallback',
						'font-stretch' => 'normal',
						'src'          => 'https://example.com/assets/fonts/merriweather.ttf.woff2',
					),
				),
				'expected_message' => 'Font family not defined in the variation.',
			),
			'empty string in deprecated structure'        => array(
				'webfonts'         => array(
					'0' => array(
						'provider'     => 'local',
						'font-style'   => 'normal',
						'font-weight'  => '300',
						'font-display' => 'fallback',
						'font-stretch' => 'normal',
						'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
						'font-display' => 'fallback',
					),
				),
				'expected_message' => 'Font family not found.',
			),
			'incorrect parameter in deprecated structure' => array(
				'webfonts'         => array(
					array(
						'provider'     => 'local',
						'FontFamily'   => 'Source Serif Pro',
						'font-style'   => 'normal',
						'font-weight'  => '300',
						'font-display' => 'fallback',
						'font-stretch' => 'normal',
						'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
						'font-display' => 'fallback',
					),
					array(
						'provider'     => 'local',
						'font_family'  => 'Merriweather',
						'font-style'   => 'normal',
						'font-weight'  => '200 900',
						'font-display' => 'fallback',
						'font-stretch' => 'normal',
						'src'          => 'https://example.com/assets/fonts/merriweather.ttf.woff2',
					),
					array(
						'provider'     => 'local',
						'font family'  => 'Source Serif Pro',
						'font-style'   => 'italic',
						'font-weight'  => '900',
						'font-display' => 'fallback',
						'font-stretch' => 'normal',
						'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Italic.ttf.woff2',
						'font-display' => 'fallback',
					),
				),
				'expected_message' => 'Font family not found.',
			),
		);
	}
}
