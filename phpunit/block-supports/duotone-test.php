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
			'attrs'     => array( 'style' => array( 'color' => array( 'duotone' => 'var:preset|duotone|blue-orange' ) ) ),
		);
		$block_content = '<figure class="wp-block-image size-full"><img src="/my-image.jpg" /></figure>';
		$expected      = '<figure class="wp-duotone-blue-orange wp-block-image size-full"><img src="/my-image.jpg" /></figure>';
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

	public function data_gutenberg_get_slug_from_attr() {
		return array(
			'pipe-slug'   => array( 'var:preset|duotone|blue-orange', 'blue-orange' ),
			'css-var'   => array( 'var(--wp--preset--duotone--blue-orange)', 'blue-orange' ),
			'css-var-weird-chars'   => array( 'var(--wp--preset--duotone--.)', '.' ),
			'css-var-missing-end-parenthesis'   => array( 'var(--wp--preset--duotone--blue-orange', '' ),
			'invalid'   => array( 'not a valid attribute', '' ),
			'css-var-no-value'   => array( 'var(--wp--preset--duotone--)', '' ),
			'pipe-slug-no-value'   => array( 'var:preset|duotone|', '' ),
			'css-var-spaces'   => array( 'var(--wp--preset--duotone--    ', '' ),
			'pipe-slug-spaces'   => array( 'var:preset|duotone|  ', '' ),
		);
	}

	/**
	 * @dataProvider data_gutenberg_get_slug_from_attr
	 */
	public function test_gutenberg_get_slug_from_attr( $data_attr, $expected ) {
		$this->assertSame( $expected, WP_Duotone::gutenberg_get_slug_from_attr( $data_attr ) );
	}
}
