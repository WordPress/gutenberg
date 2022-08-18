<?php
/**
 * WP_Webfonts::add_variation() tests.
 *
 * @package    WordPress
 * @subpackage Webfonts
 */

require_once __DIR__ . '/../wp-webfonts-testcase.php';

/**
 * @group  webfonts
 * @covers WP_Webfonts::add_variation
 */
class Tests_Webfonts_WpWebfonts_AddVariation extends WP_Webfonts_TestCase {

	/**
	 * @dataProvider data_valid_variation
	 *
	 * @param string|bool $expected           Expected results.
	 * @param string      $font_family_handle The font family's handle for this variation.
	 * @param array       $variation          An array of variation properties to add.
	 * @param string      $variation_handle   Optional. The variation's handle.
	 */
	public function test_should_register_variation_when_font_family_is_registered( $expected, $font_family_handle, array $variation, $variation_handle = '' ) {
		$wp_webfonts = new WP_Webfonts();
		$wp_webfonts->add( $font_family_handle, false );

		$variation_handle = $wp_webfonts->add_variation( $font_family_handle, $variation, $variation_handle );
		$this->assertSame( $expected, $variation_handle, 'Registering a variation should return its handle' );
		$this->assertArrayHasKey( $variation_handle, $wp_webfonts->registered, 'Variation handle should be in the registry after registration' );
		$this->assertSame( array( $expected ), $this->get_variations( $font_family_handle, $wp_webfonts ), 'Variation should be registered to font family' );
	}

	/**
	 * @dataProvider data_valid_variation
	 *
	 * @param string|bool $expected           Expected results.
	 * @param string      $font_family_handle The font family's handle for this variation.
	 * @param array       $variation          An array of variation properties to add.
	 * @param string      $variation_handle   Optional. The variation's handle.
	 */
	public function test_should_not_reregister_font_family( $expected, $font_family_handle, array $variation, $variation_handle = '' ) {
		$wp_webfonts = new WP_Webfonts();
		$wp_webfonts->add( $font_family_handle, false );

		$variation_handle = $wp_webfonts->add_variation( $font_family_handle, $variation, $variation_handle );

		// Font family should appear only once in the registered queue.
		$expected = array( $font_family_handle, $variation_handle );
		$this->assertSame( $expected, array_keys( $wp_webfonts->registered ), 'Font family should not be re-registered after registering a variation' );
	}

	/**
	 * @dataProvider data_valid_variation
	 *
	 * @param string|bool $expected           Expected results.
	 * @param string      $font_family_handle The font family's handle for this variation.
	 * @param array       $variation          An array of variation properties to add.
	 * @param string      $variation_handle   Optional. The variation's handle.
	 */
	public function test_should_not_reregister_variation( $expected, $font_family_handle, array $variation, $variation_handle = '' ) {
		$wp_webfonts = new WP_Webfonts();
		$wp_webfonts->add( $font_family_handle, false );

		// Set up the test.
		$variation_handle = $wp_webfonts->add_variation( $font_family_handle, $variation, $variation_handle );

		// Run the test.
		$variant_handle_on_reregister = $wp_webfonts->add_variation( $font_family_handle, $variation, $variation_handle );
		$this->assertSame( $expected, $variant_handle_on_reregister, 'Variation should be registered to font family' );
		$this->assertSame( $variation_handle, $variant_handle_on_reregister, 'Variation should return the previously registered variant handle' );
		$this->assertSame( array( $variation_handle ), $this->get_variations( $font_family_handle, $wp_webfonts ), 'Variation should only be registered once' );

		$this->assertCount( 2, $wp_webfonts->registered );
		$this->assertArrayHasKey( $variation_handle, $wp_webfonts->registered, 'Variation handle should be in the registry after registration' );
	}

	/**
	 * @dataProvider data_valid_variation
	 *
	 * @param string|bool $expected           Expected results.
	 * @param string      $font_family_handle The font family's handle for this variation.
	 * @param array       $variation          An array of variation properties to add.
	 * @param string      $variation_handle   Optional. The variation's handle.
	 */
	public function test_should_register_font_family_and_variation( $expected, $font_family_handle, array $variation, $variation_handle = '' ) {
		$wp_webfonts = new WP_Webfonts();

		$variation_handle = $wp_webfonts->add_variation( $font_family_handle, $variation, $variation_handle );
		$this->assertSame( $expected, $variation_handle, 'Variation should return its registered handle' );

		// Extra checks to ensure both are registered.
		$this->assertCount( 2, $wp_webfonts->registered );
		$this->assertArrayHasKey( $font_family_handle, $wp_webfonts->registered, 'Font family handle should be in the registry after registration' );
		$this->assertArrayHasKey( $variation_handle, $wp_webfonts->registered, 'Variation handle should be in the registry after registration' );
		$this->assertSame( array( $variation_handle ), $this->get_variations( $font_family_handle, $wp_webfonts ), 'Variation should be registered to the font family' );
	}

	/**
	 * @dataProvider data_font_family_not_define_in_variation
	 *
	 * @param string $font_family_handle The font family's handle for this variation.
	 * @param array  $variation          An array of variation properties to add.
	 */
	public function test_should_not_register_font_family_or_variant( $font_family_handle, array $variation ) {
		$this->expectNotice();
		$this->expectNoticeMessage( 'Font family handle must be a non-empty string.' );

		$wp_webfonts = new WP_Webfonts();
		$wp_webfonts->add_variation( $font_family_handle, $variation );

		$this->assertEmpty( $wp_webfonts->registered, 'Registered queue should be empty' );
		$this->assertEmpty( $this->get_variations( $font_family_handle, $wp_webfonts ), 'Variation should not be registered to the font family' );
	}

	/**
	 * @dataProvider data_font_family_not_define_in_variation
	 * @dataProvider data_unable_determine_variation_handle
	 *
	 * @param string $font_family_handle The font family's handle for this variation.
	 * @param array  $variation          An array of variation properties to add.
	 * @param string $expected_message   Expected notice message.
	 */
	public function test_should_not_register_variation_when_font_family_not_defined( $font_family_handle, array $variation, $expected_message ) {
		$this->expectNotice();
		$this->expectNoticeMessage( $expected_message );

		$wp_webfonts = new WP_Webfonts();
		$this->assertNull( $wp_webfonts->add_variation( $font_family_handle, $variation ) );
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

		$wp_webfonts = new WP_Webfonts();
		$wp_webfonts->add_variation( $font_family_handle, $variation );

		$this->assertCount( 1, $wp_webfonts->registered );
		$this->assertArrayHasKey( $font_family_handle, $wp_webfonts->registered );
	}
}
