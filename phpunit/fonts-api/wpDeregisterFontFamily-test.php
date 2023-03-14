<?php
/**
 * Unit and integration tests for wp_deregister_font_family().
 *
 * @package    WordPress
 * @subpackage Fonts API
 */

require_once __DIR__ . '/wp-fonts-testcase.php';

/**
 * @group fontsapi
 * @group remove_fonts
 * @covers ::wp_deregister_font_family
 * @covers WP_Fonts::remove_font_family
 */
class Tests_Webfonts_WpDeregisterFontFamily extends WP_Fonts_TestCase {

	/**
	 * Unit test for registering a font-family that mocks WP_Fonts.
	 *
	 * @dataProvider data_font_family_handles
	 *
	 * @param string $font_family_handle Font family handle to test.
	 */
	public function test_unit_should_deregister( $font_family_handle ) {
		$mock = $this->set_up_mock( 'remove_font_family' );
		$mock->expects( $this->once() )
			->method( 'remove_font_family' )
			->with(
				$this->identicalTo( $font_family_handle )
			);

		wp_deregister_font_family( $font_family_handle );
	}

	/**
	 * Integration test for enqueuing before registering a font family and all of its variations.
	 *
	 * @dataProvider data_font_family_handles
	 *
	 * @param string $font_family Font family to test.
	 */
	public function test_should_deregister_before_registration( $font_family ) {
		wp_deregister_font_family( $font_family );

		$this->assertIsArray( $this->get_registered(), 'Registration queue should be an array' );
		$this->assertEmpty( $this->get_registered(), 'Registration queue should be empty after deregistering' );
	}

	/**
	 * Integration test for deregistering a font family and all of its variations.
	 *
	 * @dataProvider data_one_to_many_font_families_and_zero_to_many_variations
	 *
	 * @param string $font_family        Font family to test.
	 * @param array  $inputs             Font family(ies) and variations to pre-register.
	 * @param array  $registered_handles Expected handles after registering.
	 * @param array  $expected           Array of expected handles.
	 */
	public function test_deregister_after_registration( $font_family, array $inputs, array $registered_handles, array $expected ) {
		foreach ( $inputs as $handle => $variations ) {
			$this->setup_register( $handle, $variations );
		}
		// Test the before state, just to make sure.
		$this->assertSame( $registered_handles, $this->get_registered_handles(), 'Font family and variations should be registered before deregistering' );

		wp_deregister_font_family( $font_family );

		// Test after deregistering.
		$this->assertIsArray( $this->get_registered_handles(), 'Registration queue should be an array' );
		$this->assertSame( $expected, $this->get_registered_handles(), 'Registration queue should match after deregistering' );
	}
}
