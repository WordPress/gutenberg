<?php
/**
 * Integration tests for wp_register_fonts().
 *
 * @package    WordPress
 * @subpackage Fonts API
 */

require_once __DIR__ . '/wp-fonts-testcase.php';

/**
 * @group  fontsapi
 * @covers ::wp_register_fonts
 * @covers WP_Fonts::add
 * @covers WP_Fonts::add_variation
 */
class Tests_Fonts_WpRegisterFonts extends WP_Fonts_TestCase {

	/**
	 * @dataProvider data_fonts
	 *
	 * @param array $fonts Array of fonts to test.
	 * @param array $expected Expected results.
	 */
	public function test_should_register( array $fonts, array $expected ) {
		$actual = wp_register_fonts( $fonts );
		$this->assertSame( $expected['wp_register_fonts'], $actual, 'Font family handle(s) should be returned' );
		$this->assertSame( $expected['get_registered'], $this->get_registered_handles(), 'Web fonts should match registered queue' );
	}

	/**
	 * @dataProvider data_fonts
	 *
	 * @param array $fonts Array of fonts to test.
	 */
	public function test_should_not_enqueue_on_registration( array $fonts ) {
		wp_register_fonts( $fonts );
		$this->assertEmpty( $this->get_enqueued_handles() );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_fonts() {
		return array(
			'font family keyed with slug' => array(
				'fonts'    => array(
					'source-serif-pro' => array(
						array(
							'provider'     => 'local',
							'font-family'  => 'Source Serif Pro',
							'font-style'   => 'normal',
							'font-weight'  => '200 900',
							'font-stretch' => 'normal',
							'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
							'font-display' => 'fallback',
						),
					),
				),
				'expected' => array(
					'wp_register_fonts' => array( 'source-serif-pro' ),
					'get_registered'    => array(
						'source-serif-pro',
						'source-serif-pro-200-900-normal',
					),
				),
			),
			'font family keyed with name' => array(
				'fonts'    => array(
					'Source Serif Pro' => array(
						array(
							'provider'     => 'local',
							'font-family'  => 'Source Serif Pro',
							'font-style'   => 'normal',
							'font-weight'  => '200 900',
							'font-stretch' => 'normal',
							'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
							'font-display' => 'fallback',
						),
						array(
							'provider'     => 'local',
							'font-family'  => 'Source Serif Pro',
							'font-style'   => 'italic',
							'font-weight'  => '200 900',
							'font-stretch' => 'normal',
							'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Italic.ttf.woff2',
							'font-display' => 'fallback',
						),
					),
				),
				'expected' => array(
					'wp_register_fonts' => array( 'source-serif-pro' ),
					'get_registered'    => array(
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
	 * @expectedDeprecated WP_Webfonts::migrate_deprecated_structure
	 *
	 * @param array $fonts Fonts to test.
	 */
	public function test_should_throw_deprecation_with_deprecated_structure( array $fonts ) {
		wp_register_fonts( $fonts );
	}

	/**
	 * @dataProvider data_deprecated_structure
	 *
	 * @expectedDeprecated WP_Webfonts::migrate_deprecated_structure
	 *
	 * @param array $fonts    Fonts to test.
	 * @param array $expected Expected results.
	 */
	public function test_should_register_with_deprecated_structure( array $fonts, array $expected ) {
		$actual = wp_register_fonts( $fonts );
		$this->assertSame( $expected['wp_register_fonts'], $actual, 'Font family handle(s) should be returned' );
		$this->assertSame( $expected['get_registered'], $this->get_registered_handles(), 'Fonts should match registered queue' );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_deprecated_structure() {
		return array(
			'1 font'                           => array(
				'fonts'    => array(
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
					'wp_register_fonts' => array( 'merriweather' ),
					'get_registered'    => array( 'merriweather', 'merriweather-200-900-normal' ),
				),
			),
			'2 font in same font family'       => array(
				'fonts'    => array(
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
					'wp_register_fonts' => array( 'source-serif-pro' ),
					'get_registered'    => array(
						'source-serif-pro',
						'source-serif-pro-300-normal',
						'source-serif-pro-900-italic',
					),
				),
			),
			'Fonts in different font families' => array(
				'fonts'    => array(
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
					'wp_register_fonts' => array( 'source-serif-pro', 'merriweather' ),
					'get_registered'    => array(
						'source-serif-pro',
						'source-serif-pro-300-normal',
						'source-serif-pro-900-italic',
						'merriweather',
						'merriweather-200-900-normal',
					),
				),
			),
		);
	}

	/**
	 * @dataProvider data_invalid_font_family
	 *
	 * @expectedDeprecated WP_Webfonts::migrate_deprecated_structure
	 *
	 * @param array  $fonts            Fonts to test.
	 * @param string $expected_message Expected notice message.
	 */
	public function test_should_not_register_with_undefined_font_family( array $fonts, $expected_message ) {
		$this->expectNotice();
		$this->expectNoticeMessage( $expected_message );

		$actual = wp_register_fonts( $fonts );
		$this->assertSame( array(), $actual, 'Return value should be an empty array' );
		$this->assertEmpty( $this->get_registered_handles(), 'No fonts should have registered' );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_invalid_font_family() {
		return array(
			'non-string'                                  => array(
				'fonts'            => array(
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
				'fonts'            => array(
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
				'fonts'            => array(
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
