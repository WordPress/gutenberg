<?php
/**
 * Test for the block.json's icon field being a file path.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Test that block icons can be resolved from an SVG file.
 *
 * @group blocks
 */
class Block_Json_Icon_Filename_Test extends WP_UnitTestCase {
	/**
	 * Tear down each test method.
	 */
	public function tear_down() {
		$registry = WP_Block_Type_Registry::get_instance();

		foreach ( array( 'my-plugin/icon-file', 'my-plugin/icon-object', 'my-plugin/icon-missing', 'my-plugin/notice' ) as $block_name ) {
			if ( $registry->is_registered( $block_name ) ) {
				$registry->unregister( $block_name );
			}
		}

		parent::tear_down();
	}

	/**
	 * Tests that a `file:` icon is replaced with the contents of the SVG file.
	 *
	 * @covers ::register_block_type_from_metadata
	 */
	public function test_file_icon_is_resolved_to_svg_contents() {
		$result = register_block_type_from_metadata( GUTENBERG_DIR_TESTFIXTURES . 'icon-file' );

		$this->assertInstanceOf( 'WP_Block_Type', $result, 'The block was not registered' );
		$this->assertStringStartsWith( '<svg', $result->icon, 'The icon was not replaced with the SVG contents.' );
		$this->assertStringContainsString( 'M5 5h14v14H5z', $result->icon, 'The icon does not contain the path from the SVG file.' );
	}

	/**
	 * Tests that a `file:` icon in object form is resolved while its colors are preserved.
	 *
	 * @covers ::register_block_type_from_metadata
	 */
	public function test_file_icon_in_object_form_is_resolved_and_keeps_colors() {
		$result = register_block_type_from_metadata( GUTENBERG_DIR_TESTFIXTURES . 'icon-object' );

		$this->assertInstanceOf( 'WP_Block_Type', $result, 'The block was not registered' );
		$this->assertIsArray( $result->icon, 'The icon is no longer an array.' );
		$this->assertStringStartsWith( '<svg', $result->icon['src'], 'The icon src was not replaced with the SVG contents.' );
		$this->assertSame( '#ff0000', $result->icon['background'], 'The icon background color was not preserved.' );
		$this->assertSame( '#ffffff', $result->icon['foreground'], 'The icon foreground color was not preserved.' );
	}

	/**
	 * Tests that an icon that is not a file path is left alone.
	 *
	 * @covers ::register_block_type_from_metadata
	 */
	public function test_dashicon_slug_is_left_untouched() {
		$result = register_block_type_from_metadata( GUTENBERG_DIR_TESTFIXTURES );

		$this->assertInstanceOf( 'WP_Block_Type', $result, 'The block was not registered' );
		$this->assertSame( 'star', $result->icon, 'The dashicon slug was modified.' );
	}

	/**
	 * Tests that a `file:` icon pointing at a missing file is left alone.
	 *
	 * @covers ::register_block_type_from_metadata
	 * @expectedIncorrectUsage gutenberg_resolve_block_icon_path
	 */
	public function test_missing_icon_file_is_left_untouched() {
		$result = register_block_type_from_metadata( GUTENBERG_DIR_TESTFIXTURES . 'icon-missing' );

		$this->assertInstanceOf( 'WP_Block_Type', $result, 'The block was not registered' );
		$this->assertSame( 'file:./does-not-exist.svg', $result->icon, 'The unresolvable icon path was modified.' );
	}
}
