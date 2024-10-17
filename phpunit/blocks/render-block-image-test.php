<?php
/**
 * Image block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Image block.
 *
 * @group blocks
 */
class Tests_Blocks_Render_Image extends WP_UnitTestCase {
	/**
	 * @covers ::render_block_core_image
	 */
	public function test_should_render_block_core_image_when_src_is_defined() {
		$attributes    = array();
		$content       = '<figure class="wp-block-image"><img src="http://' . WP_TESTS_DOMAIN . '/wp-content/uploads/2021/04/canola.jpg" aria-label="test render"/></figure>';
		$parsed_blocks = parse_blocks(
			'<!-- wp:image -->'
		);
		$parsed_block  = $parsed_blocks[0];
		$block         = new WP_Block( $parsed_block );

		$rendered_block = gutenberg_render_block_core_image( $attributes, $content, $block );
		$this->assertStringContainsString( 'aria-label="test render"', $rendered_block );
	}

	/**
	 * @covers ::render_block_core_image
	 */
	public function test_should_not_render_block_core_image_when_src_is_not_defined() {
		$attributes    = array();
		$content       = '<figure class="wp-block-image"><img /></figure>';
		$parsed_blocks = parse_blocks(
			'<!-- wp:image -->'
		);
		$parsed_block  = $parsed_blocks[0];
		$block         = new WP_Block( $parsed_block );

		$rendered_block = gutenberg_render_block_core_image( $attributes, $content, $block );
		$this->assertEquals( '', $rendered_block );
	}

	/**
	 * @covers ::render_block_core_image
	 */
	public function test_should_not_render_block_core_image_when_src_is_empty_string() {
		$attributes    = array();
		$content       = '<figure class="wp-block-image"><img src=""/></figure>';
		$parsed_blocks = parse_blocks(
			'<!-- wp:image -->'
		);
		$parsed_block  = $parsed_blocks[0];
		$block         = new WP_Block( $parsed_block );

		$rendered_block = gutenberg_render_block_core_image( $attributes, $content, $block );
		$this->assertEquals( '', $rendered_block );
	}
}
