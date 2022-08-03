<?php
/**
 * Register font family tests.
 *
 * @package WordPress
 * @subpackage Webfonts
 */

/**
 * @group  webfonts
 * @covers ::wp_register_font_family
 */
class Tests_Webfonts_WpRegisterFontFamily extends WP_UnitTestCase {
	/**
	 * WP_Webfonts instance reference
	 *
	 * @var WP_Webfonts
	 */
	private $old_wp_webfonts;

	public function set_up() {
		parent::set_up();

		global $wp_webfonts;
		$this->old_wp_webfonts = $wp_webfonts;

		$wp_webfonts = null;
	}

	public function tear_down() {
		global $wp_webfonts;

		$wp_webfonts = $this->old_wp_webfonts;
		parent::tear_down();
	}

	/**
	 * @dataProvider data_font_family_registers
	 *
	 * @param string $font_family Text to test.
	 */
	public function test_font_family_registers( $font_family ) {
		$this->assertTrue( wp_register_font_family( $font_family ) );
	}

	/**
	 * Data Provider
	 *
	 * @return array
	 */
	public function data_font_family_registers() {
		return array(
			'Proper name' => array( 'Lato' ),
			'as a slug'   => array( 'source-serif-pro' ),
		);
	}
}
