<?php
/**
 * WP_Web_Fonts::add_font_family() tests.
 *
 * @package    WordPress
 * @subpackage Webfonts
 */

require_once __DIR__ . '/../wp-webfonts-testcase.php';

/**
 * @group  webfonts
 * @covers WP_Web_Fonts::add_font_family
 */
class Tests_Webfonts_WpWebfonts_AddFontFamily extends WP_Webfonts_TestCase {

	/**
	 * @dataProvider data_handles
	 *
	 * @param string $font_family Font family to register.
	 * @param string $expected    Expected handle.
	 */
	public function test_should_register( $font_family, $expected ) {
		$wp_webfonts        = new WP_Web_Fonts();
		$font_family_handle = $wp_webfonts->add_font_family( $font_family );

		$this->assertSame( $expected, $font_family_handle, 'Registering a font-family should return its handle' );
		$this->assertCount( 1, $wp_webfonts->registered );
		$this->assertArrayHasKey( $font_family_handle, $wp_webfonts->registered, 'Font family handle should be in the registry after registration' );

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
