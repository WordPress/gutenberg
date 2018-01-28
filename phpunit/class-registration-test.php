<?php
/**
 * Block types registration Tests
 *
 * @package Gutenberg
 */

/**
 * Test register_block_type() and unregister_block_type()
 */
class Registration_Test extends WP_UnitTestCase {

	function tearDown() {
		parent::tearDown();

		$registry = WP_Block_Type_Registry::get_instance();

		if ( $registry->is_registered( 'core/dummy' ) ) {
			$registry->unregister( 'core/dummy' );
		}
	}

	function test_register_affects_main_registry() {
		$name     = 'core/dummy';
		$settings = array(
			'icon' => 'text',
		);

		register_block_type( $name, $settings );

		$registry = WP_Block_Type_Registry::get_instance();
		$this->assertTrue( $registry->is_registered( $name ) );
	}

	function test_unregister_affects_main_registry() {
		$name     = 'core/dummy';
		$settings = array(
			'icon' => 'text',
		);

		register_block_type( $name, $settings );
		unregister_block_type( $name );

		$registry = WP_Block_Type_Registry::get_instance();
		$this->assertFalse( $registry->is_registered( $name ) );
	}
}
