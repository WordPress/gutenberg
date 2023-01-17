<?php
/**
 * WP_Fonts::remove_variation() tests.
 *
 * @package    WordPress
 * @subpackage Fonts API
 */

require_once __DIR__ . '/../wp-fonts-testcase.php';

/**
 * @group  fontsapi
 * @group  remove_fonts
 * @covers WP_Fonts::remove_variation
 */
class Tests_Fonts_WpFonts_RemoveVariation extends WP_Fonts_TestCase {
	private $wp_fonts;
	private $fonts_to_register = array();

	public function set_up() {
		parent::set_up();
		$this->wp_fonts          = new WP_Fonts();
		$this->fonts_to_register = $this->get_registered_local_fonts();
	}

	/**
	 * Sets up the unit test by mocking the WP_Dependencies object using stdClass and
	 * registering each font family directly to the WP_Fonts::$registered property
	 * and its variations to the mocked $deps property.
	 */
	private function setup_unit_test() {
		$this->setup_registration_mocks( $this->fonts_to_register, $this->wp_fonts );
	}

	/**
	 * Sets up the integration test by properly registering each font family and its variations
	 * by using the WP_Fonts::add() and WP_Fonts::add_variation() methods.
	 */
	private function setup_integration_test() {
		foreach ( $this->fonts_to_register as $font_family_handle => $variations ) {
			$this->setup_register( $font_family_handle, $variations, $this->wp_fonts );
		}
	}

	/**
	 * Testing the test setup to ensure it works.
	 *
	 * @dataProvider data_remove_variations
	 *
	 * @param string $font_family_handle Font family for the variation.
	 * @param string $variation_handle   Variation handle to remove.
	 */
	public function test_mocked_setup( $font_family_handle, $variation_handle ) {
		$this->setup_unit_test();

		$this->assertArrayHasKey( $variation_handle, $this->wp_fonts->registered, 'Variation should be in the registered queue before remval' );
		$this->assertContains( $variation_handle, $this->wp_fonts->registered[ $font_family_handle ]->deps, 'Variation should be in its font family deps before removal' );
	}

	/**
	 * Unit test.
	 *
	 * @dataProvider data_should_do_nothing_when_variation_and_font_family_not_registered
	 *
	 * @param string $font_family        Font family name.
	 * @param string $font_family_handle Font family handle.
	 * @param string $variation_handle   Variation handle to remove.
	 */
	public function test_unit_should_do_nothing_when_variation_and_font_family_not_registered( $font_family, $font_family_handle, $variation_handle ) {
		// Set up the test.
		unset( $this->fonts_to_register[ $font_family ] );
		$this->setup_unit_test();
		$registered_queue = $this->wp_fonts->registered;

		// Run the tests.
		$this->wp_fonts->remove_variation( $font_family_handle, $variation_handle );
		$this->assertArrayNotHasKey( $font_family_handle, $this->wp_fonts->registered, 'Font family should not be registered' );
		$this->assertArrayNotHasKey( $variation_handle, $this->wp_fonts->registered, 'Variant should not be registered' );
		$this->assertSame( $registered_queue, $this->wp_fonts->registered, 'Registered queue should not have changed' );
	}

	/**
	 * Integration test.
	 *
	 * @dataProvider data_should_do_nothing_when_variation_and_font_family_not_registered
	 *
	 * @param string $font_family        Font family name.
	 * @param string $font_family_handle Font family handle.
	 * @param string $variation_handle   Variation handle to remove.
	 */
	public function test_should_do_nothing_when_variation_and_font_family_not_registered( $font_family, $font_family_handle, $variation_handle ) {
		// Set up the test.
		unset( $this->fonts_to_register[ $font_family ] );
		$this->setup_integration_test();
		$registered_queue = $this->wp_fonts->get_registered();

		// Run the tests.
		$this->wp_fonts->remove_variation( $font_family_handle, $variation_handle );
		$this->assertArrayNotHasKey( $font_family_handle, $this->wp_fonts->registered, 'Font family should not be registered' );
		$this->assertArrayNotHasKey( $variation_handle, $this->wp_fonts->registered, 'Variant should not be registered' );
		$this->assertSameSets( $registered_queue, $this->wp_fonts->get_registered(), 'Registered queue should not have changed' );
	}

	/**
	 * Data provider for testing removal of variations.
	 *
	 * @return array
	 */
	public function data_should_do_nothing_when_variation_and_font_family_not_registered() {
		return array(
			'Font with 1 variation'         => array(
				'font_family'        => 'merriweather',
				'font_family_handle' => 'merriweather',
				'variation_handle'   => 'merriweather-200-900-normal',
			),
			'Font with multiple variations' => array(
				'font_family'        => 'Source Serif Pro',
				'font_family_handle' => 'source-serif-pro',
				'variation_handle'   => 'Source Serif Pro-300-normal',
			),
		);
	}

	/**
	 * Unit test.
	 *
	 * @dataProvider data_remove_variations
	 *
	 * @param string $font_family_handle Font family for the variation.
	 * @param string $variation_handle   Variation handle to remove.
	 * @param array  $expected           Expected results.
	 */
	public function test_unit_should_only_remove_from_font_family_deps_when_variation_not_in_queue( $font_family_handle, $variation_handle, $expected ) {
		// Set up the test.
		$this->setup_unit_test();
		$this->setup_remove_variation_from_registered( $variation_handle );

		// Run the tests.
		$this->wp_fonts->remove_variation( $font_family_handle, $variation_handle );
		$this->assertArrayNotHasKey( $variation_handle, $this->wp_fonts->registered, 'Variant should not be registered' );
		$this->assertNotContains( $variation_handle, $this->wp_fonts->registered[ $font_family_handle ]->deps, 'Variation should not be its font family deps' );
		$this->assertSameSets( $expected['font_family_deps'], array_values( $this->wp_fonts->registered[ $font_family_handle ]->deps ), 'Only the tested variation handle should be removed from font family deps' );
	}

	/**
	 * Integration test.
	 *
	 * @dataProvider data_remove_variations
	 *
	 * @param string $font_family_handle Font family for the variation.
	 * @param string $variation_handle   Variation handle to remove.
	 * @param array  $expected           Expected results.
	 */
	public function test_should_only_remove_from_font_family_deps_when_variation_not_in_queue( $font_family_handle, $variation_handle, $expected ) {
		// Set up the test.
		$this->setup_integration_test();
		$this->setup_remove_variation_from_registered( $variation_handle );

		// Run the tests.
		$this->wp_fonts->remove_variation( $font_family_handle, $variation_handle );
		$this->assertArrayNotHasKey( $variation_handle, $this->wp_fonts->registered, 'Variant should not be registered' );
		$this->assertNotContains( $variation_handle, $this->wp_fonts->registered[ $font_family_handle ]->deps, 'Variation should not be its font family deps' );
		$this->assertSameSets( $expected['font_family_deps'], array_values( $this->wp_fonts->registered[ $font_family_handle ]->deps ), 'Only the tested variation handle should be removed from font family deps' );
	}

	/**
	 * Unit test.
	 *
	 * @dataProvider data_remove_variations
	 *
	 * @param string $font_family_handle Font family for the variation.
	 * @param string $variation_handle   Variation handle to remove.
	 * @param array  $expected           Expected results.
	 */
	public function test_unit_should_remove_variation_from_registered_queue_though_font_family_not_registered( $font_family_handle, $variation_handle, $expected ) {
		// Set up the test.
		$this->setup_unit_test();
		$this->setup_remove_from_font_family_deps( $font_family_handle, $variation_handle );

		$this->assertArrayNotHasKey( $variation_handle, array_flip( $this->wp_fonts->registered[ $font_family_handle ]->deps ), 'Variation should not be in its font family deps before removal' );

		$this->wp_fonts->remove_variation( $font_family_handle, $variation_handle );

		$this->assertNotContains( $variation_handle, $this->wp_fonts->registered[ $font_family_handle ]->deps, 'Variation should not be its font family deps' );
		$this->assertSameSets( $expected['font_family_deps'], array_values( $this->wp_fonts->registered[ $font_family_handle ]->deps ), 'Only the tested variation handle should be removed from font family deps' );
	}

	/**
	 * Integration test.
	 *
	 * @dataProvider data_remove_variations
	 *
	 * @param string $font_family_handle Font family for the variation.
	 * @param string $variation_handle   Variation handle to remove.
	 * @param array  $expected           Expected results.
	 */
	public function test_should_remove_variation_from_registered_queue_though_font_family_not_registered( $font_family_handle, $variation_handle, $expected ) {
		// Set up the test.
		$this->setup_integration_test();
		$this->setup_remove_from_font_family_deps( $font_family_handle, $variation_handle );

		$this->assertArrayNotHasKey( $variation_handle, array_flip( $this->wp_fonts->registered[ $font_family_handle ]->deps ), 'Variation should not be in its font family deps before removal' );

		$this->wp_fonts->remove_variation( $font_family_handle, $variation_handle );

		$this->assertNotContains( $variation_handle, $this->wp_fonts->registered[ $font_family_handle ]->deps, 'Variation should not be its font family deps' );
		$this->assertSameSets( $expected['font_family_deps'], array_values( $this->wp_fonts->registered[ $font_family_handle ]->deps ), 'Only the tested variation handle should be removed from font family deps' );
	}

	/**
	 * Unit test.
	 *
	 * @dataProvider data_remove_variations
	 *
	 * @param string $font_family_handle Font family for the variation.
	 * @param string $variation_handle   Variation handle to remove.
	 * @param array  $expected           Expected results.
	 */
	public function test_unit_should_remove_variation_from_queue_and_font_family_deps( $font_family_handle, $variation_handle, $expected ) {
		// Set up the test.
		$this->setup_unit_test();

		$this->assertArrayHasKey( $variation_handle, array_flip( $this->wp_fonts->registered[ $font_family_handle ]->deps ), 'Variation should be in its font family deps before removal' );

		$this->wp_fonts->remove_variation( $font_family_handle, $variation_handle );

		$this->assertArrayNotHasKey( $variation_handle, $this->wp_fonts->registered, 'Variation should be not be in registered queue' );
		$this->assertNotContains( $variation_handle, $this->wp_fonts->registered[ $font_family_handle ]->deps, 'Variation should not be its font family deps' );
		$this->assertSameSets( $expected['font_family_deps'], array_values( $this->wp_fonts->registered[ $font_family_handle ]->deps ), 'Only the tested variation handle should be removed from font family deps' );
	}

	/**
	 * Integration test.
	 *
	 * @dataProvider data_remove_variations
	 *
	 * @param string $font_family_handle Font family for the variation.
	 * @param string $variation_handle   Variation handle to remove.
	 * @param array  $expected           Expected results.
	 */
	public function test_should_remove_variation_from_queue_and_font_family_deps( $font_family_handle, $variation_handle, $expected ) {
		// Set up the test.
		$this->setup_integration_test();

		$this->assertArrayHasKey( $variation_handle, array_flip( $this->wp_fonts->registered[ $font_family_handle ]->deps ), 'Variation should be in its font family deps before removal' );

		$this->wp_fonts->remove_variation( $font_family_handle, $variation_handle );

		$this->assertArrayNotHasKey( $variation_handle, $this->wp_fonts->registered, 'Variation should be not be in registered queue' );
		$this->assertNotContains( $variation_handle, $this->wp_fonts->registered[ $font_family_handle ]->deps, 'Variation should not be its font family deps' );
		$this->assertSameSets( $expected['font_family_deps'], array_values( $this->wp_fonts->registered[ $font_family_handle ]->deps ), 'Only the tested variation handle should be removed from font family deps' );
	}

	/**
	 * Remove the variation handle from the font family's deps.
	 *
	 * @param string $font_family_handle Font family.
	 * @param string $variation_handle   The variation handle to remove.
	 */
	private function setup_remove_from_font_family_deps( $font_family_handle, $variation_handle ) {
		foreach ( $this->wp_fonts->registered[ $font_family_handle ]->deps as $index => $vhandle ) {
			if ( $variation_handle !== $vhandle ) {
				continue;
			}
			unset( $this->wp_fonts->registered[ $font_family_handle ]->deps[ $index ] );
			break;
		}
	}

	/**
	 * Removes the variation from the WP_Fonts::$registered queue.
	 *
	 * @param string $variation_handle The variation handle to remove.
	 */
	private function setup_remove_variation_from_registered( $variation_handle ) {
		unset( $this->wp_fonts->registered[ $variation_handle ] );
	}
}
