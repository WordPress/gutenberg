<?php
/**
 * Blocks registration Tests
 *
 * @package Gutenberg
 */

/**
 * Test register_block
 */
class Registration_Test extends WP_UnitTestCase {
	/**
	 * The block slug should be a string
	 *
	 * @expectedIncorrectUsage register_block
	 */
	function test_invalid_non_string_slugs() {
		register_block( 1, array() );
	}

	/**
	 * The block slug should have a namespace
	 *
	 * @expectedIncorrectUsage register_block
	 */
	function test_invalid_slugs_without_namespace() {
		register_block( 'text', array() );
	}

	/**
	 * Successfull block registration
	 */
	function test_register_block() {
		$settings = array(
			'icon' => 'text',
		);
		$updated_settings = register_block( 'core/text', $settings );
		$this->assertEquals( $updated_settings, array(
			'icon' => 'text',
			'slug' => 'core/text',
		) );
		unregister_block( 'core/text' );
	}
}
