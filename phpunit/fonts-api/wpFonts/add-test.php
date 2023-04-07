<?php
/**
 * WP_Fonts::add() tests.
 *
 * @package    WordPress
 * @subpackage Fonts API
 */

require_once __DIR__ . '/../wp-fonts-testcase.php';

/**
 * @group  fontsapi
 * @covers WP_Fonts::add
 */
class Tests_Fonts_WpFonts_Add extends WP_Fonts_TestCase {

	/**
	 * @dataProvider data_handles
	 *
	 * @param string $handle Handle to register.
	 */
	public function test_add( $handle ) {
		$wp_fonts = new WP_Fonts();

		$this->assertTrue( $wp_fonts->add( $handle, false ), 'Registering a handle should return true' );
		$this->assertCount( 1, $wp_fonts->registered );
		$this->assertArrayHasKey( $handle, $wp_fonts->registered, 'Font family handle should be in the registry after registration' );

	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_handles() {
		return array(
			'name: multiple'    => array( 'Source Serif Pro' ),
			'handle: multiple'  => array( 'source-serif-pro' ),
			'name: single'      => array( 'Merriweather' ),
			'handle: single'    => array( 'merriweather' ),
			'handle: variation' => array( 'my-custom-font-200-900-normal' ),
		);
	}
}
