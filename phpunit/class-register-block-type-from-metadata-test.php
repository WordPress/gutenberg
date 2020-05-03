<?php
/**
 * Test `register_block_type_from_metadata`.
 *
 * @package Gutenberg
 */

class Register_Block_Type_From_Metadata_Test extends WP_UnitTestCase {
	/**
	 * Tests that the function returns false when the `block.json` is not found
	 * in the WordPress core.
	 */
	function test_metadata_not_found_in_wordpress_core() {
		$result = register_block_type_from_metadata( 'unknown' );

		$this->assertFalse( $result );
	}

	/**
	 * Tests that the function returns false when the `block.json` is not found
	 * in the current directory.
	 */
	function test_metadata_not_found_in_the_current_directory() {
		$result = register_block_type_from_metadata( __DIR__ );

		$this->assertFalse( $result );
	}

	/**
	 * Tests that the function returns the registered block when the `block.json`
	 * is found in the fixtures directory.
	 */
	function test_block_registers_with_metadata_fixture() {
		$result = register_block_type_from_metadata(
			__DIR__ . '/fixtures',
			array(
				'foo' => 'bar',
			)
		);

		$this->assertInstanceOf( 'WP_Block_Type', $result );
		$this->assertEquals( 'test/block-name', $result->name );
		$this->assertEquals( 'bar', $result->foo );
	}
}
