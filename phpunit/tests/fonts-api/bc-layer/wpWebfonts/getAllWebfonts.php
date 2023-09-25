<?php
/**
 * Integration tests for WP_Webfonts::get_all_webfonts().
 *
 * @package    Gutenberg
 * @subpackage Fonts API
 */

require_once dirname( __DIR__ ) . '/base.php';

/**
 * @group  fontsapi
 * @group  fontsapi-bclayer
 * @covers WP_Webfonts::get_all_webfonts
 */
class Tests_Fonts_WpWebfonts_GetAllWebfonts extends Fonts_BcLayer_TestCase {
	use BC_Layer_Tests_Datasets;

	/**
	 * @dataProvider data_should_return_registered_webfonts
	 *
	 * @expectedDeprecated wp_webfonts
	 * @expectedDeprecated WP_Webfonts::get_all_webfonts
	 *
	 * @param array $fonts    Fonts to register.
	 * @param array $expected Expected result.
	 */
	public function test_should_return_registered_webfonts( array $fonts, array $expected ) {
		wp_register_fonts( $fonts );

		$this->assertSame( $expected, wp_webfonts()->get_all_webfonts() );
	}
}
