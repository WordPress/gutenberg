<?php
/**
 * WP_Webfonts::get_registered() tests.
 *
 * @package    WordPress
 * @subpackage Webfonts
 * @subpackage Webfonts
 */

require_once __DIR__ . '/../wp-webfonts-testcase.php';

/**
 * @group  webfonts
 * @covers WP_Webfonts::get_registered
 */
class Tests_Webfonts_WpWebfonts_GetRegistered extends WP_Webfonts_TestCase {

	public function test_should_return_empty_when_none_registered() {
		$wp_webfonts = new WP_Webfonts();
		$this->assertEmpty( $wp_webfonts->get_registered() );
	}

	/**
	 * Unit test for when font families are enqueued.
	 *
	 * @dataProvider data_get_registered
	 *
	 * @param array $inputs Font family(ies) and variations to register.
	 */
	public function test_should_return_queue_when_mocking_registered_property( array $inputs ) {
		$wp_webfonts = new WP_Webfonts();
		$mocks       = $this->setup_registration_mocks( $inputs, $wp_webfonts );
		$expected    = array_keys( $mocks );

		$this->assertSame( $expected, $wp_webfonts->get_registered() );
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
		$wp_webfonts = new WP_Webfonts();

		// Register before testing.
		foreach ( $inputs as $handle => $variations ) {
			$this->setup_register( $handle, $variations, $wp_webfonts );
		}

		$this->assertSame( $expected, $wp_webfonts->get_registered() );
	}
}
