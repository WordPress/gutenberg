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
			__DIR__ . '/fixtures'
		);

		$this->assertInstanceOf( 'WP_Block_Type', $result );
		$this->assertEquals( 'my-plugin/notice', $result->name );
		$this->assertEquals( 'Notice', $result->title );
		$this->assertEquals( 'common', $result->category );
		$this->assertEquals( array( 'core/group' ), $result->parent );
		$this->assertEquals( 'star', $result->icon );
		$this->assertEquals( 'Shows warning, error or success notices…', $result->description );
		$this->assertEquals( array( 'alert', 'message' ), $result->keywords );
		$this->assertEquals(
			array(
				'message' => array(
					'type'     => 'string',
					'source'   => 'html',
					'selector' => '.message',
				),
			),
			$result->attributes
		);
		$this->assertEquals(
			array(
				'align'             => true,
				'lightBlockWrapper' => true,
			),
			$result->supports
		);
		$this->assertEquals(
			array(
				array(
					'name'      => 'default',
					'label'     => 'Default',
					'isDefault' => true,
				),
				array(
					'name'  => 'other',
					'label' => 'Other',
				),
			),
			$result->styles
		);
	}
}
