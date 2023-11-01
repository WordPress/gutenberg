<?php
/**
 * Integration tests for wp_register_webfonts().
 *
 * @package    Gutenberg
 * @subpackage Fonts API
 */

require_once __DIR__ . '/base.php';

/**
 * @group  fontsapi
 * @group  fontsapi-bclayer
 * @covers ::wp_register_webfonts
 */
class Tests_Fonts_WpRegisterWebfonts extends Fonts_BcLayer_TestCase {

	/**
	 * @dataProvider data_deprecated_structure
	 *
	 * @expectedDeprecated Gutenberg_Fonts_API_BC_Layer::migrate_deprecated_structure
	 * @expectedDeprecated wp_register_webfonts
	 *
	 * @param array $fonts Fonts to test.
	 */
	public function test_should_throw_deprecations( array $fonts ) {
		wp_register_webfonts( $fonts );
	}

	/**
	 * @dataProvider data_deprecated_structure
	 *
	 * @expectedDeprecated Gutenberg_Fonts_API_BC_Layer::migrate_deprecated_structure
	 * @expectedDeprecated wp_register_webfonts
	 *
	 * @param array $fonts    Fonts to test.
	 * @param array $expected Expected results.
	 */
	public function test_should_register_with_deprecated_structure( array $fonts, array $expected ) {
		$actual = wp_register_webfonts( $fonts );
		$this->assertSame( $expected['wp_register_webfonts'], $actual, 'Font family handle(s) should be returned' );
		$this->assertSame( $expected['get_registered'], $this->get_registered_handles(), 'Fonts should match registered queue' );
	}

	/**
	 * @dataProvider data_deprecated_structure_with_invalid_font_family
	 *
	 * @expectedDeprecated Gutenberg_Fonts_API_BC_Layer::migrate_deprecated_structure
	 * @expectedDeprecated wp_register_webfonts
	 *
	 * @param array  $fonts            Fonts to test.
	 * @param string $expected_message Expected notice message.
	 */
	public function test_should_not_register_with_undefined_font_family( array $fonts, $expected_message ) {
		$this->expectNotice();
		$this->expectNoticeMessage( $expected_message );

		$actual = wp_register_webfonts( $fonts );
		$this->assertSame( array(), $actual, 'Return value should be an empty array' );
		$this->assertEmpty( $this->get_registered_handles(), 'No fonts should have registered' );
	}
}
