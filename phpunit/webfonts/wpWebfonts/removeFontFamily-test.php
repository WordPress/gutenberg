<?php
/**
 * WP_Webfonts::remove_font_family() tests.
 *
 * @package    WordPress
 * @subpackage Webfonts
 */

require_once __DIR__ . '/../wp-webfonts-testcase.php';

/**
 * @group webfonts
 * @group remove_webfonts
 * @covers WP_Webfonts::remove_font_family
 */
class Tests_Webfonts_WpWebfonts_RemoveFontFamily extends WP_Webfonts_TestCase {

	/**
	 * @dataProvider data_one_to_many_font_families_and_zero_to_many_variations
	 *
	 * @param string $font_family        Font family to test.
	 * @param array  $inputs             Font family(ies) and variations to pre-register.
	 * @param array  $registered_handles Expected handles after registering.
	 * @param array  $expected           Array of expected handles.
	 */
	public function test_should_dequeue_when_mocks_registered( $font_family, array $inputs, array $registered_handles, array $expected ) {
		$wp_webfonts = new WP_Webfonts();
		$this->setup_registration_mocks( $inputs, $wp_webfonts );
		// Test the before state, just to make sure.
		$this->assertArrayHasKey( $font_family, $wp_webfonts->registered, 'Registered queue should contain the font family before remove' );
		$this->assertSame( $registered_handles, array_keys( $wp_webfonts->registered ), 'Font family and variations should be registered before remove' );

		$wp_webfonts->remove_font_family( $font_family );

		$this->assertArrayNotHasKey( $font_family, $wp_webfonts->registered, 'Registered queue should not contain the font family' );
		$this->assertSame( $expected, array_keys( $wp_webfonts->registered ), 'Registered queue should match after removing font family' );
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
		$wp_webfonts = new WP_Webfonts();
		unset( $inputs[ $font_family ] );
		$this->setup_registration_mocks( $inputs, $wp_webfonts );

		$wp_webfonts->remove_font_family( $font_family );

		$this->assertArrayNotHasKey( $font_family, $wp_webfonts->registered, 'Registered queue should not contain the font family' );
		$this->assertSame( $expected, array_keys( $wp_webfonts->registered ), 'Registered queue should match after removing font family' );
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
		$wp_webfonts = new WP_Webfonts();
		// Register all font families and their variations.
		foreach ( $inputs as $handle => $variations ) {
			$wp_webfonts->add( $handle, false );
			foreach ( $variations as $variation_handle => $variation ) {
				if ( ! is_string( $variation_handle ) ) {
					$variation_handle = '';
				}
				$wp_webfonts->add_variation( $handle, $variation, $variation_handle );
			}
		}
		// Test the before state, just to make sure.
		$this->assertArrayHasKey( $font_family, $wp_webfonts->registered, 'Registered queue should contain the font family before remove' );
		$this->assertSame( $registered_handles, array_keys( $wp_webfonts->registered ), 'Font family and variations should be registered before remove' );

		$wp_webfonts->remove_font_family( $font_family );

		$this->assertArrayNotHasKey( $font_family, $wp_webfonts->registered, 'Registered queue should not contain the font family' );
		$this->assertSame( $expected, array_keys( $wp_webfonts->registered ), 'Registered queue should match after removing font family' );
	}
}
