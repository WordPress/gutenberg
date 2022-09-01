<?php
/**
 * Register web font's variation tests.
 *
 * @package    WordPress
 * @subpackage Webfonts
 */

require_once __DIR__ . '/wp-webfonts-testcase.php';

/**
 * @group  webfonts
 * @covers ::wp_register_webfont_variation
 */
class Tests_Webfonts_WpRegisterWebfontVariation extends WP_Webfonts_TestCase {
	use WP_Webfonts_Tests_Datasets;

	/**
	 * @dataProvider data_valid_variation
	 *
	 * @param string|bool $expected           Expected results.
	 * @param string      $font_family_handle The font family's handle for this variation.
	 * @param array       $variation          An array of variation properties to add.
	 * @param string      $variation_handle   Optional. The variation's handle.
	 */
	public function test_should_register_variation( $expected, $font_family_handle, array $variation, $variation_handle = '' ) {
		wp_webfonts()->add( $font_family_handle, false );

		$variation_handle = wp_register_webfont_variation( $font_family_handle, $variation, $variation_handle );
		$this->assertSame( $expected, $variation_handle, 'Variation should return handle' );
		$this->assertSame( array( $variation_handle ), $this->get_variations( $font_family_handle ), 'Variation should be registered to font family' );
	}

	/**
	 * @dataProvider data_valid_variation
	 *
	 * @param string|bool $expected           Expected results.
	 * @param string      $font_family_handle The font family's handle for this variation.
	 * @param array       $variation          An array of variation properties to add.
	 * @param string      $variation_handle   Optional. The variation's handle.
	 */
	public function test_variation_already_registered( $expected, $font_family_handle, array $variation, $variation_handle = '' ) {
		wp_webfonts()->add( $font_family_handle, false );

		// Set up the test.
		$variation_handle = wp_register_webfont_variation( $font_family_handle, $variation, $variation_handle );

		// Run the test.
		$variant_handle_on_reregister = wp_register_webfont_variation( $font_family_handle, $variation, $variation_handle );
		$this->assertSame( $expected, $variant_handle_on_reregister, 'Variation should be registered to font family' );
		$this->assertSame( $variation_handle, $variant_handle_on_reregister, 'Variation should return the previously registered variant handle' );
		$this->assertSame( array( $variation_handle ), $this->get_variations( $font_family_handle ), 'Variation should only be registered once' );
		$expected = array( $font_family_handle, $variation_handle );
		$this->assertSameSets( $expected, $this->get_registered_handles(), 'Register queue should contain the font family and its one variant' );
	}

	/**
	 * @dataProvider data_valid_variation
	 *
	 * @param string|bool $expected           Expected results.
	 * @param string      $font_family_handle The font family's handle for this variation.
	 * @param array       $variation          An array of variation properties to add.
	 * @param string      $variation_handle   Optional. The variation's handle.
	 */
	public function test_register_font_family_and_variation( $expected, $font_family_handle, array $variation, $variation_handle = '' ) {
		$variation_handle = wp_register_webfont_variation( $font_family_handle, $variation, $variation_handle );
		$this->assertSame( $expected, $variation_handle, 'Variation should return its registered handle' );

		// Extra checks to ensure both are registered.
		$expected = array( $font_family_handle, $variation_handle );
		$this->assertSame( $expected, wp_webfonts()->get_registered(), 'Font family and variation should be registered' );
		$this->assertSame( array( $variation_handle ), $this->get_variations( $font_family_handle ), 'Variation should be registered to the font family' );
	}

	/**
	 * @dataProvider data_font_family_handle_undefined
	 *
	 * @param string $font_family_handle The font family's handle for this variation.
	 * @param array  $variation          An array of variation properties to add.
	 */
	public function test_should_not_register_font_family_or_variant( $font_family_handle, array $variation ) {
		$this->expectNotice();
		$this->expectNoticeMessage( 'Font family handle must be a non-empty string.' );

		wp_register_webfont_variation( $font_family_handle, $variation );
		$this->assertEmpty( wp_webfonts()->get_registered(), 'Registered queue should be empty' );
		$this->assertEmpty( $this->get_variations( $font_family_handle ), 'Variation should not be registered to the font family' );
	}

	/**
	 * @dataProvider data_font_family_undefined_in_variation
	 * @dataProvider data_unable_determine_variation_handle
	 *
	 * @param string $font_family_handle The font family's handle for this variation.
	 * @param array  $variation          An array of variation properties to add.
	 * @param string $expected_message   Expected notice message.
	 */
	public function test_should_not_register_variation_when_font_family_not_defined( $font_family_handle, array $variation, $expected_message ) {
		$this->expectNotice();
		$this->expectNoticeMessage( $expected_message );

		$this->assertNull( wp_register_webfont_variation( $font_family_handle, $variation ) );
	}

	/**
	 * @dataProvider data_unable_determine_variation_handle
	 *
	 * @param string $font_family_handle The font family's handle for this variation.
	 * @param array  $variation          An array of variation properties to add.
	 */
	public function test_should_register_font_family_when_variant_fails_to_register( $font_family_handle, array $variation ) {
		$this->expectNotice();
		$this->expectNoticeMessage( 'Variant handle could not be determined as font-weight and/or font-style are require' );

		wp_register_webfont_variation( $font_family_handle, $variation );
		$expected = $font_family_handle;
		$this->assertContains( $expected, wp_webfonts()->get_registered() );
	}

	/**
	 * @dataProvider data_invalid_variation
	 *
	 * @param string $expected_message   Expected notice message.
	 * @param string $font_family_handle The font family's handle for this variation.
	 * @param array  $variation          An array of variation properties to add.
	 */
	public function test_should_not_register_when_variation_fails_validation( $expected_message, $font_family_handle, array $variation ) {
		$this->expectNotice();
		$this->expectNoticeMessage( $expected_message );

		$this->assertNull( wp_register_webfont_variation( $font_family_handle, $variation ) );
	}
}
