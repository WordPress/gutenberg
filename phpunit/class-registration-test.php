<?php
/**
 * Blocks registration Tests
 *
 * @package Gutenberg
 */

/**
 * Test register_block_type
 */
class Registration_Test extends WP_UnitTestCase {
	function tearDown() {
		$GLOBALS['wp_registered_blocks'] = array();
	}

	/**
	 * Should reject numbers
	 *
	 * @expectedIncorrectUsage register_block_type
	 */
	function test_invalid_non_string_names() {
		$result = register_block_type( 1, array() );
		$this->assertFalse( $result );
	}

	/**
	 * Should reject blocks without a namespace
	 *
	 * @expectedIncorrectUsage register_block_type
	 */
	function test_invalid_names_without_namespace() {
		$result = register_block_type( 'text', array() );
		$this->assertFalse( $result );
	}

	/**
	 * Should reject blocks with invalid characters
	 *
	 * @expectedIncorrectUsage register_block_type
	 */
	function test_invlalid_characters() {
		$result = register_block_type( 'still/_doing_it_wrong', array() );
		$this->assertFalse( $result );
	}

	/**
	 * Should accept valid block names
	 */
	function test_register_block_type() {
		global $wp_registered_blocks;
		$settings = array(
			'icon' => 'text',
		);
		$updated_settings = register_block_type( 'core/text', $settings );
		$this->assertEquals( $updated_settings, array(
			'icon' => 'text',
			'name' => 'core/text',
		) );
		$this->assertEquals( $updated_settings, $wp_registered_blocks['core/text'] );
	}

	/**
	 * Should fail to re-register the same block
	 *
	 * @expectedIncorrectUsage register_block_type
	 */
	function test_register_block_type_twice() {
		$settings = array(
			'icon' => 'text',
		);
		$result = register_block_type( 'core/text', $settings );
		$this->assertNotFalse( $result );
		$result = register_block_type( 'core/text', $settings );
		$this->assertFalse( $result );
	}

	/**
	 * Unregistering should fail if a block is not registered
	 *
	 * @expectedIncorrectUsage unregister_block_type
	 */
	function test_unregister_not_registered_block() {
		$result = unregister_block_type( 'core/unregistered' );
		$this->assertFalse( $result );
	}

	/**
	 * Should unregister existing blocks
	 */
	function test_unregister_block_type() {
		global $wp_registered_blocks;
		$settings = array(
			'icon' => 'text',
		);
		register_block_type( 'core/text', $settings );
		$unregistered_block = unregister_block_type( 'core/text' );
		$this->assertEquals( $unregistered_block, array(
			'icon' => 'text',
			'name' => 'core/text',
		) );
		$this->assertFalse( isset( $wp_registered_blocks['core/text'] ) );
	}
}
