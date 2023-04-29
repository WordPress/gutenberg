<?php
/**
 * Tests functions in get-global-styles-and-settings-test.php.
 *
 * @package Gutenberg
 */

class WP_Get_Global_Styles_And_Settings_Test extends WP_UnitTestCase {

	public function test_wp_theme_use_persistent_cache() {
		$this->assertFalse( wp_theme_use_persistent_cache() );

		add_filter( 'wp_theme_use_persistent_cache', '__return_true' );
		$this->assertTrue( wp_theme_use_persistent_cache() );

		add_filter( 'wp_theme_use_persistent_cache', '__return_false' );
		$this->assertFalse( wp_theme_use_persistent_cache() );
	}
}
