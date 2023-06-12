<?php
/**
 * Tests that the environment is configured as expected.
 *
 * @package Gutenberg
 */

class Phpunit_Environment_Setup_Test extends WP_UnitTestCase {
	/**
	 * We trigger the multisite environment by passing the WP_MULTISITE
	 * environment variable. We have run into issues where this is not correctly
	 * added to wp-config by the setup code. We need to know when tests are not
	 * actually running in a multisite environment when they should be.
	 */
	public function test_is_multisite_if_defined() {
		$is_multisite_in_env = ( '1' === getenv( 'WP_MULTISITE' ) );

		$this->assertEquals( $is_multisite_in_env, is_multisite(), 'Despite WP_MULTISITE being set in the environment, the tests were not run in multisite mode. There is likely an issue with the phpunit setup.' );
	}

}
