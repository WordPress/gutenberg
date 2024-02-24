<?php

class Test_Gutenberg_Maybe_Upload_Font_Cap extends WP_UnitTestCase {

	/**
	 * Mock the wp_get_font_dir function to return a valid path.
	 *
	 * @return string[]
	 */
	public function mock_wp_get_font_dir() {
		return array( 'path' => '/valid/font/directory' );
	}

	/**
	 * Mock the wp_is_file_mod_allowed function to return true.
	 *
	 * @param string $context
	 *
	 * @return true|void
	 */
	public function mock_wp_is_file_mod_allowed( $context ) {
		if ( $context === 'can_upload_fonts' ) {
			return true;
		}
	}

	/**
	 * Mock the wp_is_writable function to return true.
	 *
	 * @param string $path
	 *
	 * @return true|void
	 */
	public function mock_wp_is_writable( $path ) {
		if ( $path === '/valid/font/directory' ) {
			return true;
		}
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
		if ( $cap === 'create_posts' && isset( $args[0] ) && $args[0] === 'wp_font_face' ) {
			return array( 'exist' ); // The 'exist' cap is a minimal capability that all users have
		}

		return $caps;
	}

	public function set_up() {
		parent::set_up();
		add_filter( 'wp_get_font_dir', array( $this, 'mock_wp_get_font_dir' ) );
		add_filter( 'wp_is_file_mod_allowed', array( $this, 'mock_wp_is_file_mod_allowed' ) );
		add_filter( 'wp_is_writable', array( $this, 'mock_wp_is_writable' ) );
		add_filter( 'map_meta_cap', array( $this, 'mock_current_user_can' ), 10, 4 );
	}

	public function tear_down() {
		remove_filter( 'wp_get_font_dir', array( $this, 'mock_wp_get_font_dir' ) );
		remove_filter( 'wp_is_file_mod_allowed', array( $this, 'mock_wp_is_file_mod_allowed' ) );
		remove_filter( 'wp_is_writable', array( $this, 'mock_wp_is_writable' ) );
		remove_filter( 'map_meta_cap', array( $this, 'mock_current_user_can' ), 10 );

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
