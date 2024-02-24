<?php
/**
 * Test gutenberg_maybe_grant_upload_font_cap().
 *
 * @package WordPress
 * @subpackage Font Library
 *
 * @group fonts
 * @group font-library
 *
 * @covers gutenberg_maybe_grant_upload_font_cap
 */
class Tests_Fonts_GutenbergMaybeGrantUploadFontCap extends WP_UnitTestCase {
	public function set_up() {
		parent::set_up();
		add_filter( 'font_dir', array( $this, 'mock_wp_get_font_dir' ) );
		add_filter( 'map_meta_cap', array( $this, 'mock_current_user_can' ), 10, 4 );
	}

	public function tear_down() {
		add_filter( 'font_dir', array( $this, 'mock_wp_get_font_dir' ) );
		add_filter( 'file_mod_allowed', array( $this, 'mock_wp_is_file_mod_allowed' ) );
		add_filter( 'file_mod_allowed', array( $this, 'mock_wp_is_file_mod_allowed_return_false' ) );
		add_filter( 'map_meta_cap', array( $this, 'mock_current_user_can' ), 10 );
		parent::tear_down();
	}

	/**
	 * Mock the wp_get_font_dir function to return a valid path.
	 *
	 * @return string[]
	 */
	public function mock_wp_get_font_dir() {
		return array( 'path' => get_temp_dir() );
	}

	/**
	 * Mock the wp_is_file_mod_allowed function to return true.
	 *
	 * @param string $context
	 * @return bool
	 */
	public function mock_wp_is_file_mod_allowed( $context ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return true;
	}

	/**
	 * Mock the wp_is_file_mod_allowed function to return false.
	 *
	 * @param string $context
	 * @return bool
	 */
	public function mock_wp_is_file_mod_allowed_return_false( $context ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return false;
	}

	/**
	 * Mocks the current_user_can function to conditionally modify capabilities.
	 *
	 * @param string[] $caps    Current user's capabilities.
	 * @param string   $cap     Capability being checked.
	 * @param int      $user_id ID of the user being checked.
	 * @param array    $args    Additional arguments for capability check.
	 * @return string[] Modified capabilities array.
	 */
	public function mock_current_user_can( $caps, $cap, $user_id, $args ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( 'edit_theme_options' === $cap ) {
			return array( 'exist' );
		}

		return $caps;
	}

	public function test_should_not_grant_upload_fonts_if_not_in_caps() {
		$caps   = array( 'edit_posts' ); // 'upload_fonts' is not in $caps
		$result = gutenberg_maybe_grant_upload_font_cap( array(), $caps );
		$this->assertArrayNotHasKey( 'upload_fonts', $result, 'upload_fonts capability should not be granted.' );
	}

	public function test_should_grant_upload_fonts_under_correct_conditions() {
		add_filter( 'file_mod_allowed', array( $this, 'mock_wp_is_file_mod_allowed' ) );

		$caps   = array( 'upload_fonts' );
		$result = gutenberg_maybe_grant_upload_font_cap( array(), $caps );

		$this->assertArrayHasKey( 'upload_fonts', $result, 'upload_fonts capability should be granted.' );
		$this->assertTrue( $result['upload_fonts'], 'upload_fonts capability should be true.' );
	}

	public function test_should_not_grant_upload_fonts_if_conditions_not_met() {
		add_filter( 'file_mod_allowed', array( $this, 'mock_wp_is_file_mod_allowed_return_false' ) );

		$result = gutenberg_maybe_grant_upload_font_cap( array(), array( 'upload_fonts' ) );
		$this->assertArrayNotHasKey( 'upload_fonts', $result, 'upload_fonts capability should not be granted under incorrect conditions.' );
	}
}
