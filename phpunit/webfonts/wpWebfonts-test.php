<?php
/**
 * WP_Webfonts tests.
 *
 * @package    WordPress
 * @subpackage Webfonts
 */

require_once __DIR__ . '/wp-webfonts-testcase.php';

class Tests_Webfonts_WpWebfonts extends WP_Webfonts_TestCase {

	/**
	 * @covers WP_Webfonts::get_registered
	 */
	public function test_registry_is_empty() {
		$this->assertEmpty( wp_webfonts()->get_registered() );
	}

	/**
	 * @covers WP_Webfonts::get_enqueued
	 */
	public function test_enqueued_is_empty() {
		$this->assertEmpty( wp_webfonts()->get_enqueued() );
	}

	/**
	 * @covers WP_Webfonts::get_providers
	 */
	public function test_local_provider_is_automatically_registered() {
		$expected = array(
			'local' => array(
				'class' => 'WP_Webfonts_Provider_Local',
				'fonts' => array(),
			),
		);
		$this->assertSame( $expected, wp_webfonts()->get_providers() );
	}

	/**
	 * @dataProvider data_handles
	 *
	 * @covers WP_Webfonts::add
	 *
	 * @param string $handle Handle to register.
	 */
	public function test_add( $handle ) {
		$wp_webfonts = new WP_Webfonts();

		$this->assertTrue( $wp_webfonts->add( $handle, false ), 'Registering a handle should return true' );
		$this->assertCount( 1, $wp_webfonts->registered );
		$this->assertArrayHasKey( $handle, $wp_webfonts->registered, 'Font family handle should be in the registry after registration' );

	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_handles() {
		return array(
			'name: multiple'    => array( 'Source Serif Pro' ),
			'handle: multiple'  => array( 'source-serif-pro' ),
			'name: single'      => array( 'Merriweather' ),
			'handle: single'    => array( 'merriweather' ),
			'handle: variation' => array( 'my-custom-font-200-900-normal' ),
		);
	}

	/**
	 * @dataProvider data_valid_variation
	 *
	 * @covers WP_Webfonts::add_variation
	 * @covers WP_Webfonts::add
	 *
	 * @param string|bool $expected           Expected results.
	 * @param string      $font_family_handle The font family's handle for this variation.
	 * @param array       $variation          An array of variation properties to add.
	 * @param string      $variation_handle   Optional. The variation's handle.
	 */
	public function test_add_variation( $expected, $font_family_handle, array $variation, $variation_handle = '' ) {
		$wp_webfonts = new WP_Webfonts();
		$wp_webfonts->add( $font_family_handle, false );

		$variation_handle = $wp_webfonts->add_variation( $font_family_handle, $variation, $variation_handle );
		$this->assertSame( $expected, $variation_handle, 'Registering a variation should return its handle' );
		$this->assertArrayHasKey( $variation_handle, $wp_webfonts->registered, 'Variation handle should be in the registry after registration' );
		$this->assertSame( $expected, $$this->get_variations( $font_family_handle, $wp_webfonts ), 'Variation should be registered to font family' );
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
	public function test_register_font_family_and_variation( $expected, $font_family_handle, array $variation, $variation_handle = '' ) {
		$wp_webfonts = new WP_Webfonts();

		$variation_handle = $wp_webfonts->add_variation( $font_family_handle, $variation, $variation_handle );
		$this->assertSame( $expected, $variation_handle, 'Variation should return its registered handle' );

		// Extra checks to ensure both are registered.
		$this->assertCount( 2, $wp_webfonts->registered );
		$this->assertArrayHasKey( $font_family_handle, $wp_webfonts->registered, 'Font family handle should be in the registry after registration' );
		$this->assertArrayHasKey( $variation_handle, $wp_webfonts->registered, 'Variation handle should be in the registry after registration' );
		$this->assertSame( array( $variation_handle ), $this->get_variations( $font_family_handle ), 'Variation should be registered to the font family' );

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
