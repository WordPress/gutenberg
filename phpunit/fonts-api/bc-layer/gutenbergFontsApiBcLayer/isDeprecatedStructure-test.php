<?php
/**
 * Integration tests for Gutenberg_Fonts_API_BC_Layer::migrate_deprecated_structure().
 *
 * @package    WordPress
 * @subpackage Fonts API
 */

require_once __DIR__ . '/../../wp-fonts-testcase.php';
require_once __DIR__ . '/../bc-layer-tests-dataset.php';

/**
 * @group  fontsapi
 * @group  fontsapi-bclayer
 * @covers Gutenberg_Fonts_API_BC_Layer::is_deprecated_structure
 */
class Tests_Fonts_GutenbergFontsApiBcLayer_IsDeprecatedStructure extends WP_Fonts_TestCase {
	use BC_Layer_Tests_Datasets;

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
