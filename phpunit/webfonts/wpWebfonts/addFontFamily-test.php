<?php
/**
 * WP_Webfonts::add_font_family() tests.
 *
 * @package    WordPress
 * @subpackage Webfonts
 */

require_once __DIR__ . '/../wp-webfonts-testcase.php';

/**
 * @group  webfonts
 * @covers WP_Webfonts::add_font_family
 */
class Tests_Webfonts_WpWebfonts_AddFontFamily extends WP_Webfonts_TestCase {

	/**
	 * @dataProvider data_handles
	 *
	 * @param string $handle Handle to register.
	 */
	public function test_should_register( $handle ) {
		$wp_webfonts = new WP_Webfonts();

		$this->assertTrue( $wp_webfonts->add_font_family( $handle ), 'Registering a handle should return true' );
		$this->assertCount( 1, $wp_webfonts->registered );
		$this->assertArrayHasKey( $handle, $wp_webfonts->registered, 'Font family handle should be in the registry after registration' );

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
