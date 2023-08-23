<?php
/**
 * Integration tests for Gutenberg_Fonts_API_BC_Layer::migrate_deprecated_structure().
 *
 * @package    Gutenberg
 * @subpackage Fonts API
 */

require_once dirname( __DIR__ ) . '/base.php';

/**
 * @group  fontsapi
 * @group  fontsapi-bclayer
 * @covers Gutenberg_Fonts_API_BC_Layer::is_deprecated_structure
 */
class Tests_Fonts_GutenbergFontsApiBcLayer_IsDeprecatedStructure extends Fonts_BcLayer_TestCase {

	/**
	 * @dataProvider data_deprecated_structure
	 *
	 * @param array $fonts Fonts to test.
	 */
	public function test_should_detect_deprecated_structure( array $fonts ) {
		$this->assertTrue( Gutenberg_Fonts_API_BC_Layer::is_deprecated_structure( $fonts ) );
	}

	/**
	 * @dataProvider data_not_deprecated_structure
	 *
	 * @param array $fonts Fonts to test.
	 */
	public function test_should_not_detect_deprecated_structure( array $fonts ) {
		$this->assertFalse( Gutenberg_Fonts_API_BC_Layer::is_deprecated_structure( $fonts ) );
	}
}
