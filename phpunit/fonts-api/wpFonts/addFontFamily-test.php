<?php
/**
 * WP_Fonts::add_font_family() tests.
 *
 * @package    WordPress
 * @subpackage Fonts API
 */

require_once __DIR__ . '/../wp-fonts-testcase.php';

/**
 * @group  fontsapi
 * @covers WP_Fonts::add_font_family
 */
class Tests_Fonts_WpFonts_AddFontFamily extends WP_Fonts_TestCase {

	/**
	 * @dataProvider data_handles
	 *
	 * @param string $font_family Font family to register.
	 * @param string $expected    Expected handle.
	 */
	public function test_should_register( $font_family, $expected ) {
		$wp_fonts           = new WP_Fonts();
		$font_family_handle = $wp_fonts->add_font_family( $font_family );

		$this->assertSame( $expected, $font_family_handle, 'Registering a font-family should return its handle' );
		$this->assertCount( 1, $wp_fonts->registered );
		$this->assertArrayHasKey( $font_family_handle, $wp_fonts->registered, 'Font family handle should be in the registry after registration' );

	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_handles() {
		return array(
			'name: multiple'               => array(
				'font_family' => 'Source Serif Pro',
				'expected'    => 'source-serif-pro',
			),
			'handle: multiple'             => array(
				'font_family' => 'source-serif-pro',
				'expected'    => 'source-serif-pro',
			),
			'name: single'                 => array(
				'font_family' => 'Merriweather',
				'expected'    => 'merriweather',
			),
			'handle: single'               => array(
				'font_family' => 'merriweather',
				'expected'    => 'merriweather',
			),
			'handle: variation'            => array(
				'font_family' => 'my-custom-font-200-900-normal',
				'expected'    => 'my-custom-font-200-900-normal',
			),
			'name: multiple font-families' => array(
				'font_family' => 'Source Serif Pro, Merriweather',
				'expected'    => 'source-serif-pro',
			),
		);
	}
}
