<?php
/**
 * Test `register_block_type_from_metadata`.
 *
 * @package Gutenberg
 */

class Register_Block_Type_From_Metadata_Test extends WP_UnitTestCase {

	function test_does_not_remove_block_asset_path_prefix() {
		$result = remove_block_asset_path_prefix( 'script-handle' );

		$this->assertSame( 'script-handle', $result );
	}

	function test_removes_block_asset_path_prefix() {
		$result = remove_block_asset_path_prefix( 'file:./block.js' );

		$this->assertSame( './block.js', $result );
	}

	function test_generate_block_asset_handle() {
		$block_name = 'unit-tests/my-block';

		$this->assertSame(
			'unit-tests-my-block-editor-script',
			generate_block_asset_handle( $block_name, 'editorScript' )
		);
		$this->assertSame(
			'unit-tests-my-block-script',
			generate_block_asset_handle( $block_name, 'script' )
		);
		$this->assertSame(
			'unit-tests-my-block-editor-style',
			generate_block_asset_handle( $block_name, 'editorStyle' )
		);
		$this->assertSame(
			'unit-tests-my-block-style',
			generate_block_asset_handle( $block_name, 'style' )
		);
	}

	function test_field_not_found_register_block_script_handle() {
		$result = register_block_script_handle( array(), 'script' );

		$this->assertFalse( $result );
	}

	function test_empty_value_register_block_script_handle() {
		$metadata = array( 'script' => '' );
		$result   = register_block_script_handle( $metadata, 'script' );

		$this->assertFalse( $result );
	}

	/**
	 * @expectedIncorrectUsage register_block_script_handle
	 */
	function test_missing_asset_file_register_block_script_handle() {
		$metadata = array(
			'file'   => __FILE__,
			'name'   => 'unit-tests/test-block',
			'script' => 'file:./fixtures/missing-asset.js',
		);
		$result   = register_block_script_handle( $metadata, 'script' );

		$this->assertFalse( $result );
	}

	function test_handle_passed_register_block_script_handle() {
		$metadata = array(
			'editorScript' => 'test-script-handle',
		);
		$result   = register_block_script_handle( $metadata, 'editorScript' );

		$this->assertSame( 'test-script-handle', $result );
	}

	function test_success_register_block_script_handle() {
		$metadata = array(
			'file'   => __FILE__,
			'name'   => 'unit-tests/test-block',
			'script' => 'file:./fixtures/block.js',
		);
		$result   = register_block_script_handle( $metadata, 'script' );

		$this->assertSame( 'unit-tests-test-block-script', $result );
	}

	function test_field_not_found_register_block_style_handle() {
		$result = register_block_style_handle( array(), 'style' );

		$this->assertFalse( $result );
	}

	function test_empty_value_found_register_block_style_handle() {
		$metadata = array( 'style' => '' );
		$result   = register_block_style_handle( $metadata, 'style' );

		$this->assertFalse( $result );
	}

	function test_handle_passed_register_block_style_handle() {
		$metadata = array(
			'style' => 'test-style-handle',
		);
		$result   = register_block_style_handle( $metadata, 'style' );

		$this->assertSame( 'test-style-handle', $result );
	}

	function test_success_register_block_style_handle() {
		$metadata = array(
			'file'  => __FILE__,
			'name'  => 'unit-tests/test-block',
			'style' => 'file:./fixtures/block.css',
		);
		$result   = register_block_style_handle( $metadata, 'style' );

		$this->assertSame( 'unit-tests-test-block-style', $result );
	}

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
		$this->assertSame( 'my-plugin/notice', $result->name );
		$this->assertSame( 'Notice', $result->title );
		$this->assertSame( 'common', $result->category );
		$this->assertEqualSets( array( 'core/group' ), $result->parent );
		$this->assertSame( 'star', $result->icon );
		$this->assertSame( 'Shows warning, error or success notices…', $result->description );
		$this->assertEqualSets( array( 'alert', 'message' ), $result->keywords );
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
				'my-plugin/message' => 'message',
			),
			$result->provides_context
		);
		$this->assertEqualSets( array( 'groupId' ), $result->uses_context );
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
		$this->assertEquals(
			array(
				'attributes' => array(
					'message' => 'This is a notice!',
				),
			),
			$result->example
		);
		$this->assertSame( 'my-plugin-notice-editor-script', $result->editor_script );
		$this->assertSame( 'my-plugin-notice-script', $result->script );
		$this->assertSame( 'my-plugin-notice-editor-style', $result->editor_style );
		$this->assertSame( 'my-plugin-notice-style', $result->style );
	}
}
