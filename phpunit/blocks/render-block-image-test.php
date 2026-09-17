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
	public function tear_down() {
		if ( get_block_bindings_source( 'test/source' ) ) {
			unregister_block_bindings_source( 'test/source' );
		}

		parent::tear_down();
	}

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

	public function test_should_use_image_id_from_block_bindings_in_classname() {
		register_block_bindings_source(
			'test/source',
			array(
				'label'              => array( 'label' => 'Test Source' ),
				'get_value_callback' => function () {
					return 123;
				},
			)
		);

		$attributes    = array(
			'metadata' => array(
				'bindings' => array(
					'id' => array(
						'source' => 'test/source',
					),
				),
			),
			'id'       => 456,
		);
		$content       = '<figure class="wp-block-image"><img class="wp-image-123" src="canola.jpg"/></figure>';
		$parsed_blocks = parse_blocks(
			'<!-- wp:image -->'
		);
		$parsed_block  = $parsed_blocks[0];
		$block         = new WP_Block( $parsed_block );

		$rendered_block = gutenberg_render_block_core_image( $attributes, $content, $block );
		$this->assertSame( '<figure class="wp-block-image"><img class="wp-image-456" src="canola.jpg"/></figure>', $rendered_block );
	}

	public function test_should_keep_figcaption_if_it_is_not_empty() {
		$content       = '<figure class="wp-block-image"><img src="canola.jpg"/><figcaption class="wp-element-caption">Image caption</figcaption></figure>';
		$parsed_blocks = parse_blocks(
			'<!-- wp:image -->'
		);
		$parsed_block  = $parsed_blocks[0];
		$block         = new WP_Block( $parsed_block );

		$rendered_block = gutenberg_render_block_core_image( array(), $content, $block );
		$this->assertSame( '<figure class="wp-block-image"><img src="canola.jpg"/><figcaption class="wp-element-caption">Image caption</figcaption></figure>', $rendered_block );
	}

	public function test_should_remove_figcaption_when_caption_is_empty() {
		$attributes    = array(
			'caption' => '',
		);
		$content       = '<figure class="wp-block-image"><img src="canola.jpg"/><figcaption class="wp-element-caption"></figcaption></figure>';
		$parsed_blocks = parse_blocks(
			'<!-- wp:image -->'
		);
		$parsed_block  = $parsed_blocks[0];
		$block         = new WP_Block( $parsed_block );

		$rendered_block = gutenberg_render_block_core_image( $attributes, $content, $block );
		$this->assertSame( '<figure class="wp-block-image"><img src="canola.jpg"/></figure>', $rendered_block );
	}

	/**
	 * Ensures `$`/`\` sequences in image attributes (e.g. a price in the alt
	 * text, or a filename containing `$1`) are not interpreted as regular
	 * expression backreferences when the lightbox trigger button is injected.
	 *
	 * The lightbox button is added by the `render_block_core/image` filter, so
	 * the block must be rendered through `WP_Block::render()` for the filter to
	 * run — calling the render callback directly does not exercise this path.
	 *
	 * @covers ::block_core_image_render_lightbox
	 */
	public function test_should_not_treat_dollar_sequences_in_img_as_backreferences_in_lightbox() {
		$content = '<figure class="wp-block-image"><img src="http://' . WP_TESTS_DOMAIN . '/wp-content/uploads/2021/04/price-$1-canola.jpg" alt="Only $1 today"/></figure>';

		$parsed_blocks = parse_blocks( '<!-- wp:image {"lightbox":{"enabled":true}} -->' . $content . '<!-- /wp:image -->' );
		$parsed_block  = $parsed_blocks[0];
		$block         = new WP_Block( $parsed_block );

		$rendered_block = $block->render();

		// The lightbox trigger button should have been injected.
		$this->assertStringContainsString(
			'class="lightbox-trigger"',
			$rendered_block,
			'The lightbox trigger button was not injected, so the regression path was not exercised.'
		);

		// The `$1` sequences must survive unchanged in both alt and src.
		$this->assertStringContainsString(
			'alt="Only $1 today"',
			$rendered_block,
			'The alt text containing "$1" was corrupted by backreference interpretation.'
		);
		$this->assertStringContainsString(
			'price-$1-canola.jpg',
			$rendered_block,
			'The src filename containing "$1" was corrupted by backreference interpretation.'
		);

		remove_all_filters( 'render_block_core/image' );
	}
}
