<?php
/**
 * Integration tests for Gutenberg_Fonts_API_BC_Layer::migrate_deprecated_structure().
 *
 * @package    Gutenberg
 * @subpackage Fonts API
 */

require_once __DIR__ . '/../fonts-bc-layer-testcase.php';

/**
 * @group  fontsapi
 * @group  fontsapi-bclayer
 * @covers Gutenberg_Fonts_API_BC_Layer::migrate_deprecated_structure
 */
class Tests_Fonts_GutenbergFontsApiBcLayer_MigrateDeprecatedStructure extends Fonts_BcLayer_TestCase {

	/**
	 * @dataProvider data_deprecated_structure
	 *
	 * @expectedDeprecated Gutenberg_Fonts_API_BC_Layer::migrate_deprecated_structure
	 *
	 * @param array $fonts    Fonts to test.
	 * @param array $expected Expected results.
	 */
	public function test_should_migrate_dprecated_structure_and_throw_deprecation( array $fonts, array $expected ) {
		$this->assertSameSets( $expected['migration'], Gutenberg_Fonts_API_BC_Layer::migrate_deprecated_structure( $fonts ) );
	}

	/**
	 * @dataProvider data_not_deprecated_structure
	 *
	 * @param array $fonts Fonts to test.
	 */
	public function test_should_return_fonts_and_not_throw_deprecation( array $fonts ) {
		$this->assertSameSets( $fonts, Gutenberg_Fonts_API_BC_Layer::migrate_deprecated_structure( $fonts ) );
	}
}
