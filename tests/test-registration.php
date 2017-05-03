<?php

class RegistrationTest extends WP_UnitTestCase {
	/**
	 * @expectedIncorrectUsage register_block
	 */
	function test_invalid_non_string_slugs() {
		register_block( 1, array() );
	}

	/**
	 * @expectedIncorrectUsage register_block
	 */
	function test_invalid_slugs_without_namespace() {
		register_block( 'text', array() );
	}

	function test_register_block() {
		$settings = array( 'icon' => 'text' );
		$updated_settings = register_block( 'core/text', $settings );
		$this->assertEquals( $updated_settings, array(
			'icon' => 'text',
			'slug' => 'core/text'
		) );
		unregister_block( 'core/text' );
	}
}
