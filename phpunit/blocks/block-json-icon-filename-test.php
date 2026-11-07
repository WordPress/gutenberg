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

		foreach ( array( 'my-plugin/icon-file', 'my-plugin/icon-object', 'my-plugin/icon-missing', 'my-plugin/icon-invalid', 'my-plugin/notice' ) as $block_name ) {
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
		$this->assertStringContainsString( 'viewBox="0 0 24 24"', $result->icon, 'The icon lost its viewBox.' );
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
	/**
	 * Tests that sanitizing an icon keeps the case of SVG names and removes unsafe markup.
	 *
	 * @covers ::gutenberg_sanitize_svg_icon
	 */
	public function test_sanitized_icon_keeps_svg_name_case() {
		$icon = gutenberg_sanitize_svg_icon( '<svg viewBox="0 0 8 8" onload="x()"><script>x()</script><linearGradient id="a" gradientUnits="userSpaceOnUse"><stop offset="0" /></linearGradient><path d="M0 0" fill="url(#a)" /></svg>' );

		$this->assertStringContainsString( 'viewBox="0 0 8 8"', $icon, 'The viewBox attribute lost its case.' );
		$this->assertStringContainsString( '<linearGradient ', $icon, 'The opening gradient tag lost its case.' );
		$this->assertStringContainsString( '</linearGradient>', $icon, 'The closing gradient tag lost its case.' );
		$this->assertStringContainsString( 'gradientUnits="userSpaceOnUse"', $icon, 'The gradientUnits attribute lost its case.' );
		$this->assertStringNotContainsString( 'onload', $icon, 'The event handler was not removed.' );
		$this->assertStringNotContainsString( '<script', $icon, 'The script element was not removed.' );
	}
	/**
	 * Tests that comments, doctypes and the contents of script and style elements are removed.
	 *
	 * @covers ::gutenberg_sanitize_svg_icon
	 */
	public function test_sanitized_icon_removes_non_svg_markup() {
		$icon = gutenberg_sanitize_svg_icon( '<?xml version="1.0"?><!-- Generator --><!DOCTYPE svg [<!ENTITY a "b">]><svg viewBox="0 0 8 8"><style>.a{fill:red}</style><script>x()</script><path d="M0 0" /></svg>' );

		$this->assertStringStartsWith( '<svg', $icon, 'The icon does not start with the svg element.' );
		$this->assertStringNotContainsString( 'Generator', $icon, 'The comment was not removed.' );
		$this->assertStringNotContainsString( 'fill:red', $icon, 'The style contents were not removed.' );
		$this->assertStringNotContainsString( 'x()', $icon, 'The script contents were not removed.' );
	}

	/**
	 * Tests that common presentation attributes survive sanitizing.
	 *
	 * @covers ::gutenberg_sanitize_svg_icon
	 */
	public function test_sanitized_icon_keeps_presentation_attributes() {
		$icon = gutenberg_sanitize_svg_icon( '<svg><g clip-path="url(#a)"><path d="M0 0" stroke-dasharray="2" stroke-miterlimit="10" /></g><filter id="f"><feGaussianBlur stdDeviation="1" /></filter></svg>' );

		$this->assertStringContainsString( 'clip-path="url(#a)"', $icon, 'The clip-path attribute was removed.' );
		$this->assertStringContainsString( 'stroke-dasharray="2"', $icon, 'The stroke-dasharray attribute was removed.' );
		$this->assertStringContainsString( 'stroke-miterlimit="10"', $icon, 'The stroke-miterlimit attribute was removed.' );
		$this->assertStringContainsString( 'stdDeviation="1"', $icon, 'The stdDeviation attribute was removed or lost its case.' );
	}

	/**
	 * Tests that a `file:` icon pointing at a file that is not an SVG is left alone.
	 *
	 * @covers ::gutenberg_resolve_block_icon_path
	 * @expectedIncorrectUsage gutenberg_resolve_block_icon_path
	 */
	public function test_invalid_icon_file_is_left_untouched() {
		$result = register_block_type_from_metadata( GUTENBERG_DIR_TESTFIXTURES . 'icon-invalid' );

		$this->assertInstanceOf( 'WP_Block_Type', $result, 'The block was not registered' );
		$this->assertSame( 'file:./icon.svg', $result->icon, 'The invalid icon was modified.' );
	}

	/**
	 * Tests that an object icon whose src is not a string is left alone.
	 *
	 * @covers ::gutenberg_resolve_block_icon_path
	 */
	public function test_non_string_icon_src_is_left_untouched() {
		$metadata = array(
			'file' => __FILE__,
			'icon' => array( 'src' => array( 'invalid' ) ),
		);

		$this->assertSame( $metadata, gutenberg_resolve_block_icon_path( $metadata ) );
	}
}
