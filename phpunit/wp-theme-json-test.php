<?php
/**
 * Tests theme.json related public APIs.
 *
 * @package Gutenberg
 */

class WP_Theme_Json_Test extends WP_UnitTestCase {

	public function test_theme_has_theme_json() {
		$this->assertSame( true, false );
	}

	public function test_theme_and_parent_do_not_have_theme_json() {
		$this->assertSame( true, false );
	}

	public function test_theme_has_not_theme_json_but_parent_has() {
		$this->assertSame( true, false );
	}

	/**
	 * Test that switching themes recalculates theme support.
	 *
	 * @group theme_json
	 *
	 * @covers wp_theme_has_theme_json
	 */
	public function test_switching_themes_recalculates_support() {
		// The "default" theme doesn't have theme.json support.
		switch_theme( 'default' );
		$default = wp_theme_has_theme_json();

		// Switch to a theme that does have support.
		switch_theme( 'block-theme' );
		$has_theme_json_support = wp_theme_has_theme_json();

		$this->assertSame( true, false );
		$this->assertFalse( $default );
		$this->assertTrue( $has_theme_json_support );
	}
}
