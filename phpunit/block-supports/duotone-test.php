<?php

/**
 * Test the block duotone support.
 *
 * @package Gutenberg
 */

class WP_Block_Supports_Duotone_Test extends WP_UnitTestCase {
	public function test_gutenberg_render_duotone_support_preset() {
		$block         = array(
			'blockName' => 'core/image',
			'attrs'     => array( 'style' => array( 'color' => array( 'duotone' => 'var:preset|duotone|slug' ) ) ),
		);
		$block_content = '<figure class="wp-block-image size-full"><img src="/my-image.jpg" /></figure>';
		$expected      = '<figure class="wp-duotone-slug wp-block-image size-full"><img src="/my-image.jpg" /></figure>';
		$this->assertSame( $expected, gutenberg_render_duotone_support( $block_content, $block ) );
	}

	public function test_gutenberg_render_duotone_support_css() {
		$block         = array(
			'blockName' => 'core/image',
			'attrs'     => array( 'style' => array( 'color' => array( 'duotone' => 'unset' ) ) ),
		);
		$block_content = '<figure class="wp-block-image size-full"><img src="/my-image.jpg" /></figure>';
		$expected      = '/<figure class="wp-duotone-unset-\d+ wp-block-image size-full"><img src="\\/my-image.jpg" \\/><\\/figure>/';
		$this->assertMatchesRegularExpression( $expected, gutenberg_render_duotone_support( $block_content, $block ) );
	}

	public function test_gutenberg_render_duotone_support_custom() {
		$block         = array(
			'blockName' => 'core/image',
			'attrs'     => array( 'style' => array( 'color' => array( 'duotone' => array( '#FFFFFF', '#000000' ) ) ) ),
		);
		$block_content = '<figure class="wp-block-image size-full"><img src="/my-image.jpg" /></figure>';
		$expected      = '/<figure class="wp-duotone-ffffff-000000-\d+ wp-block-image size-full"><img src="\\/my-image.jpg" \\/><\\/figure>/';
		$this->assertMatchesRegularExpression( $expected, gutenberg_render_duotone_support( $block_content, $block ) );
	}

}
