<?php
/**
 * Tests functions in get-global-styles-and-settings-test.php.
 *
 * @package Gutenberg
 */

class WP_Get_Global_Styles_And_Settings_Test extends WP_UnitTestCase {

	public function test_wp_theme_use_cache() {
		$expected_default = ! in_array( wp_get_environment_type(), array( 'local', 'development' ), true );

		$this->assertSame( $expected_default, wp_theme_use_cache() );

		add_filter( 'wp_theme_use_cache', '__return_true' );
		$this->assertTrue( wp_theme_use_cache() );

		add_filter( 'wp_theme_use_cache', '__return_false' );
		$this->assertFalse( wp_theme_use_cache() );
	}
}
