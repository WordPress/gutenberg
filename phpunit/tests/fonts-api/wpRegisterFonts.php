<?php
/**
 * Integration tests for wp_register_fonts().
 *
 * @package    WordPress
 * @subpackage Fonts API
 */

require_once __DIR__ . '/base.php';

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
}
