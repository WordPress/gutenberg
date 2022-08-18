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

	public function test_registry_is_empty() {
		$wp_webfonts = new WP_Webfonts();
		$this->assertEmpty( $wp_webfonts->get_registered() );
	}

	/**
	 * @dataProvider data_get_registered
	 */
	public function test_get_registered( $inputs ) {
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
}
