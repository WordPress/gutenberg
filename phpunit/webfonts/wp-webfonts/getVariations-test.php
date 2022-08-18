<?php
/**
 * WP_Webfonts::get_variations() tests.
 *
 * @package    WordPress
 * @subpackage Webfonts
 */

require_once __DIR__ . '/../wp-webfonts-testcase.php';

/**
 * @group  webfonts
 * @covers WP_Webfonts::get_variations
 */
class Tests_Webfonts_WpWebfonts_GetVariations extends WP_Webfonts_TestCase {

	/**
	 * @dataProvider data_get_variations_when_font_family_not_registered
	 * @dataProvider data_get_variations
	 *
	 * @param mixed $handle Handle input.
	 */
	public function test_get_variations_when_font_family_not_registered( $handle, array $inputs = array() ) {
		$wp_webfonts = new WP_Webfonts();
		unset( $inputs[ $handle ] ); // don't set up the font family under test.
		$this->setup_registration_mocks( $inputs, $wp_webfonts );

		$actual = $wp_webfonts->get_variations( $handle );
		$this->assertIsArray( $actual, 'WP_Webfonts::get_variations() should return an array' );
		$this->assertEmpty( $actual, 'WP_Webfonts::get_variations() should return an empty array' );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_get_variations_when_font_family_not_registered() {
		return array(
			'Integer font family'            => array( 0 ),
			'Font family not registered'     => array( 'font-not-registered' ),
			'Other font families registered' => array(
				'handle' => 'font-family-4',
				'inputs' => array(
					'font-family-1' => array( 'variation-1', 'variation-2' ),
					'font-family-2' => array( 'variation-21', 'variation-22' ),
					'font-family-3' => array( 'variation-31', 'variation-32' ),
				),
			),
		);
	}

	/**
	 * @dataProvider data_get_variations
	 *
	 * @param string $font_family The font family to test.
	 * @param array  $inputs      Array of array( font-family => variations ).
	 * @param array  $expected    Expected result.
	 */
	public function test_get_variations( $font_family, array $inputs, array $expected ) {
		$wp_webfonts = new WP_Webfonts();
		$this->setup_registration_mocks( $inputs, $wp_webfonts );

		$actual = $wp_webfonts->get_variations( $font_family );
		$this->assertIsArray( $actual, 'WP_Webfonts::get_variations() should return an array' );
		$this->assertSame( $expected, $actual, 'WP_Webfonts::get_variations() should return the expected array of variations' );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_get_variations() {
		return array(
			'no variations'                          => array(
				'font_family' => 'lato',
				'inputs'      => array(
					'lato' => array(),
				),
				'expected'    => array(),
			),
			'with 1 variation'                       => array(
				'font_family' => 'Source Serif Pro',
				'inputs'      => array(
					'Source Serif Pro' => array( 'variation-1' ),
				),
				'expected'    => array( 'variation-1' ),
			),
			'with 2 variations'                      => array(
				'font_family' => 'my-cool-font',
				'inputs'      => array(
					'my-cool-font' => array( 'cool-1', 'cool-2' ),
				),
				'expected'    => array( 'cool-1', 'cool-2' ),
			),
			'when multiple font families registered' => array(
				'font_family' => 'font-family-2',
				'inputs'      => array(
					'font-family-1' => array( 'variation-1', 'variation-2' ),
					'font-family-2' => array( 'variation-21', 'variation-22' ),
					'font-family-3' => array( 'variation-1', 'variation-2' ),
				),
				'expected'    => array( 'variation-21', 'variation-22' ),
			),
		);
	}
}
