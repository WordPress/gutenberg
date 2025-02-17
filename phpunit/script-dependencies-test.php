<?php

/**
 * @group script-dependencies
 */
class Test_Script_Dependencies extends WP_UnitTestCase {
	public $bundled_scripts = array( 'wp-upload-media' );

	/**
	 * Tests for accidental `wp-polyfill` script dependents.
	 */
	public function test_polyfill_dependents() {
		$scripts            = wp_scripts();
		$registered_scripts = $scripts->registered;
		$dependents         = array();

		// Iterate over all registered scripts, finding dependents of the `wp-polyfill` script.
		// Based on private `WP_Scripts::get_dependents` method.
		foreach ( $registered_scripts as $registered_handle => $args ) {
			// Ignore bundled packages, they don't load separate polyfills.
			if ( in_array( $registered_handle, $this->bundled_scripts, true ) ) {
				continue;
			}

			if ( in_array( 'wp-polyfill', $args->deps, true ) ) {
				$dependents[] = $registered_handle;
			}
		}

		// This list should get smaller over time as we remove `wp-polyfill` dependencies.
		// If the list update is intentional, please add a comment explaining why.
		$expected = array(
			'react',
			'wp-blob',
			'wp-block-editor',
			'wp-block-library',
			'wp-blocks',
			'wp-edit-site',
			'wp-core-data',
			'wp-editor',
			'wp-router',
			'wp-url',
			'wp-widgets',
		);

		$this->assertEqualSets( $expected, $dependents );
	}
}
