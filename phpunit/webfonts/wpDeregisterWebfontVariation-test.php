<?php
/**
 * Unit and integration tests for wp_deregister_webfont_variation().
 *
 * @package    WordPress
 * @subpackage Webfonts
 */

require_once __DIR__ . '/wp-webfonts-testcase.php';

/**
 * @group  webfonts
 * @covers ::wp_deregister_webfont_variation
 * @covers WP_Webfonts::remove_variation
 */
class Tests_Webfonts_WpDeregisterWebfontVariation extends WP_Webfonts_TestCase {

	/**
	 * Unit test for deregistering a font-family's variation using mock of WP_Webfonts.
	 *
	 * @dataProvider data_font_family_and_variation_handle
	 *
	 * @param string $font_family_handle Font family to test.
	 * @param string $variation_handle   Variation's handle to test.
	 */
	public function test_should_deregister_when_mocked( $font_family_handle, $variation_handle ) {
		$mock = $this->set_up_mock( 'remove_variation' );
		$mock->expects( $this->once() )
			->method( 'remove_variation' )
			->with(
				$this->identicalTo( $font_family_handle, $variation_handle )
			);

		wp_deregister_webfont_variation( $font_family_handle, $variation_handle );
	}

	/**
	 * Integration test for enqueuing before registering a font family and all of its variations.
	 *
	 * @dataProvider data_font_family_and_variation_handle
	 *
	 * @param string $font_family_handle Font family to test.
	 * @param string $variation_handle   Variation's handle to test.
	 */
	public function test_should_do_nothing_when_not_registered( $font_family_handle, $variation_handle ) {
		wp_deregister_webfont_variation( $font_family_handle, $variation_handle );

		$this->assertIsArray( $this->get_registered(), 'Registration queue should be an array' );
		$this->assertEmpty( $this->get_registered(), 'Registration queue should be empty after deregistering' );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_font_family_and_variation_handle() {
		return array(
			'single words name'   => array(
				'font_family'      => 'Lato',
				'variation_handle' => 'Lato 400 normal',
			),
			'multiple words name' => array(
				'font_family'     => 'Source Sans Pro',
				'expected_handle' => 'Source Sans Pro 400 normal',
			),
			'handles'             => array(
				'font_family'     => 'source-serif-pro',
				'expected_handle' => 'source-serif-pro-400-normal',
			),
		);
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
