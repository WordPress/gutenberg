<?php

class Test_Gutenberg_Maybe_Upload_Font_Cap extends WP_UnitTestCase {

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
	 *
	 * @return bool
	 */
	public function mock_wp_is_file_mod_allowed( $context ) {
		return true;
	}

	/**
	 * Mock current_user_can for 'wp_font_face' post type's 'create_posts' capability to return true.
	 *
	 * @param string[] $caps
	 * @param string $cap
	 * @param int $user_id
	 * @param array $args
	 *
	 * @return string[]
	 */
	public function mock_current_user_can( $caps, $cap, $user_id, $args ) {
		if ( $cap === 'edit_theme_options' ) {
			return array( 'exist' );
		}

		return $caps;
	}

	public function set_up() {
		parent::set_up();
		add_filter( 'font_dir', array( $this, 'mock_wp_get_font_dir' ) );
		add_filter( 'file_mod_allowed', array( $this, 'mock_wp_is_file_mod_allowed' ) );
		add_filter( 'map_meta_cap', array( $this, 'mock_current_user_can' ), 10, 4 );
	}

	public function tear_down() {
		add_filter( 'font_dir', array( $this, 'mock_wp_get_font_dir' ) );
		add_filter( 'file_mod_allowed', array( $this, 'mock_wp_is_file_mod_allowed' ) );
		add_filter( 'map_meta_cap', array( $this, 'mock_current_user_can' ), 10 );

		parent::tear_down();
	}

	public function test_not_granting_upload_fonts_if_not_in_caps() {
		$caps   = array( 'edit_posts' ); // 'upload_fonts' is not in $caps
		$result = gutenberg_maybe_grant_upload_font_cap( array(), $caps );
		$this->assertArrayNotHasKey( 'upload_fonts', $result, 'upload_fonts should not be granted' );
	}

	public function test_granting_upload_fonts_under_correct_conditions() {
		// Mock necessary functions and conditions here
		$allcaps = array();
		$caps    = array( 'upload_fonts' );

		$result = gutenberg_maybe_grant_upload_font_cap( $allcaps, $caps );

		$this->assertArrayHasKey( 'upload_fonts', $result, 'upload_fonts should be granted' );
		$this->assertTrue( $result['upload_fonts'], 'upload_fonts capability should be true' );
	}
}
