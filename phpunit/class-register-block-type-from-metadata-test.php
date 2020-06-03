<?php
/**
 * Test `register_block_type_from_metadata`.
 *
 * @package Gutenberg
 */

class Register_Block_Type_From_Metadata_Test extends WP_UnitTestCase {

	function test_does_not_remove_block_asset_path_prefix() {
		$result = gutenberg_remove_block_asset_path_prefix( 'script-handle' );

		$this->assertSame( 'script-handle', $result );
	}

	function test_removes_block_asset_path_prefix() {
		$result = gutenberg_remove_block_asset_path_prefix( 'file://./block.js' );

		$this->assertSame( './block.js', $result );
	}

	function test_generate_block_asset_handle() {
		$block_name = 'my-namespace/my-block';

		$this->assertSame(
			'my-namespace-my-block-editor-script',
			gutenberg_generate_block_asset_handle( $block_name, 'editorScript' )
		);
		$this->assertSame(
			'my-namespace-my-block-script',
			gutenberg_generate_block_asset_handle( $block_name, 'script' )
		);
		$this->assertSame(
			'my-namespace-my-block-editor-style',
			gutenberg_generate_block_asset_handle( $block_name, 'editorStyle' )
		);
		$this->assertSame(
			'my-namespace-my-block-style',
			gutenberg_generate_block_asset_handle( $block_name, 'style' )
		);
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
		$this->assertEquals( array( 'core/group' ), $result->parent );
		$this->assertSame( 'star', $result->icon );
		$this->assertSame( 'Shows warning, error or success notices…', $result->description );
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
		$this->assertSame( 'my-plugin-notice-editor-script', $result->editor_script );
		$this->assertSame( 'my-plugin-notice-script', $result->script );
		$this->assertSame( 'my-plugin-notice-editor-style', $result->editor_style );
		$this->assertSame( 'my-plugin-notice-style', $result->style );
	}
}
