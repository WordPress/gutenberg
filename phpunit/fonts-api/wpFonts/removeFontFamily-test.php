<?php
/**
 * WP_Fonts::remove_font_family() tests.
 *
 * @package    WordPress
 * @subpackage Fonts API
 */

require_once __DIR__ . '/../wp-fonts-testcase.php';

/**
 * @group fontsapi
 * @group remove_fonts
 * @covers WP_Fonts::remove_font_family
 */
class Tests_Fonts_WpFonts_RemoveFontFamily extends WP_Fonts_TestCase {

	/**
	 * @dataProvider data_one_to_many_font_families_and_zero_to_many_variations
	 *
	 * @param string $font_family        Font family to test.
	 * @param array  $inputs             Font family(ies) and variations to pre-register.
	 * @param array  $registered_handles Expected handles after registering.
	 * @param array  $expected           Array of expected handles.
	 */
	public function test_should_dequeue_when_mocks_registered( $font_family, array $inputs, array $registered_handles, array $expected ) {
		$wp_fonts = new WP_Fonts();
		$this->setup_registration_mocks( $inputs, $wp_fonts );
		// Test the before state, just to make sure.
		$this->assertArrayHasKey( $font_family, $wp_fonts->registered, 'Registered queue should contain the font family before remove' );
		$this->assertSame( $registered_handles, array_keys( $wp_fonts->registered ), 'Font family and variations should be registered before remove' );

		$wp_fonts->remove_font_family( $font_family );

		$this->assertArrayNotHasKey( $font_family, $wp_fonts->registered, 'Registered queue should not contain the font family' );
		$this->assertSame( $expected, array_keys( $wp_fonts->registered ), 'Registered queue should match after removing font family' );
	}

	/**
	 * @dataProvider data_one_to_many_font_families_and_zero_to_many_variations
	 *
	 * @param string $font_family        Font family to test.
	 * @param array  $inputs             Font family(ies) and variations to pre-register.
	 * @param array  $registered_handles Not used.
	 * @param array  $expected           Array of expected handles.
	 */
	public function test_should_bail_out_when_not_registered( $font_family, array $inputs, array $registered_handles, array $expected ) {
		$wp_fonts = new WP_Fonts();
		unset( $inputs[ $font_family ] );
		$this->setup_registration_mocks( $inputs, $wp_fonts );

		$wp_fonts->remove_font_family( $font_family );

		$this->assertArrayNotHasKey( $font_family, $wp_fonts->registered, 'Registered queue should not contain the font family' );
		$this->assertSame( $expected, array_keys( $wp_fonts->registered ), 'Registered queue should match after removing font family' );
	}

	/**
	 * Integration test for removing a font family and all of its variation when font family is registered.
	 *
	 * @dataProvider data_one_to_many_font_families_and_zero_to_many_variations
	 *
	 * @param string $font_family        Font family to test.
	 * @param array  $inputs             Font family(ies) and variations to pre-register.
	 * @param array  $registered_handles Expected handles after registering.
	 * @param array  $expected           Array of expected handles.
	 */
	public function test_should_deregister_when_registered( $font_family, array $inputs, array $registered_handles, array $expected ) {
		$wp_fonts = new WP_Fonts();
		// Register all font families and their variations.
		foreach ( $inputs as $input_font_family => $variations ) {
			$handle = $wp_fonts->add_font_family( $input_font_family );
			foreach ( $variations as $variation_handle => $variation ) {
				if ( ! is_string( $variation_handle ) ) {
					$variation_handle = '';
				}
				$wp_fonts->add_variation( $handle, $variation, $variation_handle );
			}
		}
		// Test the before state, just to make sure.
		$this->assertArrayHasKey( $font_family, $wp_fonts->registered, 'Registered queue should contain the font family before remove' );
		$this->assertSame( $registered_handles, array_keys( $wp_fonts->registered ), 'Font family and variations should be registered before remove' );

		$wp_fonts->remove_font_family( $font_family );

		$this->assertArrayNotHasKey( $font_family, $wp_fonts->registered, 'Registered queue should not contain the font family' );
		$this->assertSame( $expected, array_keys( $wp_fonts->registered ), 'Registered queue should match after removing font family' );
	}
}
