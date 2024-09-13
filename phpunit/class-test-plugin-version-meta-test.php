<?php
/**
 * Unit tests covering the version checks in the plugin file.
 *
 * @package Gutenberg
 */
class Test_PluginMetaData_Test extends WP_UnitTestCase {
	/**
	 * Test the minimum WordPress version check.
	 *
	 * Ensures the constant defined as the minimum required version of WordPress
	 * matches the minimum version defined in the plugin header.
	 */
	public function test_minimum_required_wordpress_version() {
		$file_meta = get_file_data( __DIR__ . '/../gutenberg.php', array( 'RequiresWP' => 'Requires at least' ) );
		$this->assertSame( $file_meta['RequiresWP'], GUTENBERG_MINIMUM_WP_VERSION, 'The minimum required WordPress version does not match the plugin header.' );
	}
}
