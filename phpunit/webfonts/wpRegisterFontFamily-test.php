<?php
/**
 * Register font family tests.
 *
 * @package    WordPress
 * @subpackage Webfonts
 */

require_once __DIR__ . '/wp-webfonts-testcase.php';

/**
 * @group  webfonts
 * @covers ::wp_register_font_family
 */
class Tests_Webfonts_WpRegisterFontFamily extends WP_Webfonts_TestCase {

	/**
	 * Unit test for registering a font-family that mocks WP_Webfonts.
	 *
	 * @dataProvider data_font_family
	 *
	 * @param string $font_family     Font family to test.
	 * @param string $expected_handle Expected registered handle.
	 */
	public function test_unit_register( $font_family, $expected_handle ) {
		$mock = $this->set_up_mock( 'add' );
		$mock->expects( $this->once() )
			->method( 'add' )
			->with(
				$this->identicalTo( $expected_handle ),
				$this->identicalTo( false )
			)
			->will( $this->returnValue( $expected_handle ) );

		$this->assertSame( $expected_handle, wp_register_font_family( $font_family ), 'Font family should return true after registering' );
	}

	/**
	 * Integration test for registering a font family.
	 *
	 * @dataProvider data_font_family
	 *
	 * @covers WP_Webfonts::add
	 *
	 * @param string $font_family     Font family to test.
	 * @param string $expected_handle Expected registered handle.
	 */
	public function test_register( $font_family, $expected_handle ) {
		$this->assertSame( $expected_handle, wp_register_font_family( $font_family ), 'Font family should return true after registering' );
		$this->assertSame( array( $expected_handle ), $this->get_registered_handles(), 'After registering, the registry should contain the font family handle' );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_font_family() {
		return array(
			'single word name'   => array(
				'font_family'     => 'Lato',
				'expected_handle' => 'lato',
			),
			'multiple word name' => array(
				'font_family'     => 'Source Sans Pro',
				'expected_handle' => 'source-sans-pro',
			),
			'handle'             => array(
				'font_family'     => 'source-serif-pro',
				'expected_handle' => 'source-serif-pro',
			),
		);
	}

	/**
	 * Unit test for registering a font-family that mocks WP_Webfonts.
	 *
	 * @dataProvider data_invalid_font_family
	 *
	 * @param string $invalid_input Invalid input to test.
	 */
	public function test_unit_register_fails( $invalid_input ) {
		$mock = $this->set_up_mock( 'add' );
		$mock->expects( $this->never() )->method( 'add' );

		$this->assertNull( wp_register_font_family( $invalid_input ), 'Registering an invalid input should return null' );
	}

	/**
	 * Integration test for registering a font family.
	 *
	 * @dataProvider data_invalid_font_family
	 *
	 * @covers WP_Webfonts::add
	 *
	 * @param string $invalid_input Invalid input to test.
	 */
	public function test_register_fails( $invalid_input ) {
		$this->assertNull( wp_register_font_family( $invalid_input ), 'Registering an invalid input should return null' );
		$this->assertEmpty( $this->get_registered(), 'Invalid input should not register' );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_invalid_font_family() {
		return array(
			'non-string'   => array( null ),
			'empty string' => array( '' ),
		);
	}

	/**
	 * Integration test for attempting to re-register a font family.
	 *
	 * @dataProvider data_font_family
	 *
	 * @covers WP_Webfonts::add
	 *
	 * @param string $font_family     Font family to test.
	 * @param string $expected_handle Expected registered handle.
	 */
	public function test_re_register( $font_family, $expected_handle ) {
		// Register the font family.
		wp_register_font_family( $font_family );

		// Attempt to re-register it.
		$this->assertNull( wp_register_font_family( $font_family ), 'Font family should return true after registering' );
		$this->assertSame( array( $expected_handle ), $this->get_registered_handles(), 'The font family should only be registered once' );
	}
}
