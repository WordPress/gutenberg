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
 * @covers Gutenberg_Fonts_API_BC_Layer::migrate_deprecated_structure
 */
class Tests_Fonts_GutenbergFontsApiBcLayer_MigrateDeprecatedStructure extends WP_Fonts_TestCase {
	use BC_Layer_Tests_Datasets;

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
