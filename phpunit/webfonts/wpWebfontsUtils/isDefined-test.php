<?php
/**
 * WP_Webfonts_Utils::is_defined() tests.
 *
 * @package    WordPress
 * @subpackage Webfonts
 */

require_once __DIR__ . '/../wp-webfonts-testcase.php';

/**
 * @group webfonts
 * @covers WP_Webfonts_Utils::is_defined
 */
class Tests_Webfonts_WpWebfontsUtils_IsDefined extends WP_Webfonts_TestCase {

	/**
	 * @dataProvider data_when_defined
	 *
	 * @param mixed $input Input to test.
	 */
	public function test_should_return_true_when_defined( $input ) {
		$this->assertTrue( WP_Webfonts_Utils::is_defined( $input ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_when_defined() {
		return array(
			'name: non empty string'   => array( 'Some Font Family' ),
			'handle: non empty string' => array( 'some-font-family' ),
		);
	}

	/**
	 * @dataProvider data_when_not_defined
	 *
	 * @param mixed $invalid_input Input to test.
	 */
	public function test_should_return_false_when_not_defined( $invalid_input ) {
		$this->assertFalse( WP_Webfonts_Utils::is_defined( $invalid_input ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_when_not_defined() {
		return array(
			'empty string'               => array( '' ),
			'string 0'                   => array( '0' ),
			'integer'                    => array( 10 ),
			'name wrapped in an array'   => array( array( 'Some Font Family' ) ),
			'handle wrapped in an array' => array( array( 'some-font-family' ) ),
		);
	}
}
