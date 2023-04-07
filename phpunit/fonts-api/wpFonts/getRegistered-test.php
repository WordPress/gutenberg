<?php
/**
 * WP_Fonts::get_registered() tests.
 *
 * @package    WordPress
 * @subpackage Fonts API
 * @subpackage Fonts API
 */

require_once __DIR__ . '/../wp-fonts-testcase.php';

/**
 * @group  fontsapi
 * @covers WP_Fonts::get_registered
 */
class Tests_Fonts_WpFonts_GetRegistered extends WP_Fonts_TestCase {

	public function test_should_return_empty_when_none_registered() {
		$wp_fonts = new WP_Fonts();
		$this->assertEmpty( $wp_fonts->get_registered() );
	}

	/**
	 * Unit test for when font families are enqueued.
	 *
	 * @dataProvider data_get_registered
	 *
	 * @param array $inputs Font family(ies) and variations to register.
	 */
	public function test_should_return_queue_when_mocking_registered_property( array $inputs ) {
		$wp_fonts = new WP_Fonts();
		$mocks    = $this->setup_registration_mocks( $inputs, $wp_fonts );
		$expected = array_keys( $mocks );

		$this->assertSame( $expected, $wp_fonts->get_registered() );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_get_registered() {
		return array(
			'no variations'                          => array(
				'inputs' => array(
					'lato' => array(),
				),
			),
			'with 1 variation'                       => array(
				'inputs' => array(
					'Source Serif Pro' => array( 'variation-1' ),
				),
			),
			'with 2 variations'                      => array(
				'inputs' => array(
					'my-cool-font' => array( 'cool-1', 'cool-2' ),
				),
			),
			'when multiple font families registered' => array(
				'inputs' => array(
					'font-family-1' => array( 'variation-11', 'variation-12' ),
					'font-family-2' => array( 'variation-21', 'variation-22' ),
					'font-family-3' => array( 'variation-31', 'variation-32' ),
				),
			),
		);
	}

	/**
	 * Full integration test that registers varying number of font families and variations
	 * to validate if "get_registered()" internals is property wired to the registered queue.
	 *
	 * @dataProvider data_one_to_many_font_families_and_zero_to_many_variations
	 *
	 * @param string $font_family Not used.
	 * @param array  $inputs      Font family(ies) and variations to register.
	 * @param array  $expected    Expected results.
	 */
	public function test_should_return_queue_when_items_are_registered( $font_family, array $inputs, array $expected ) {
		$wp_fonts = new WP_Fonts();

		// Register before testing.
		foreach ( $inputs as $handle => $variations ) {
			$this->setup_register( $handle, $variations, $wp_fonts );
		}

		$this->assertSame( $expected, $wp_fonts->get_registered() );
	}
}
