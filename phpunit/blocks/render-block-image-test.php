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
	 * Lightbox trigger button must carry a static aria-label for pre-hydration accessibility.
	 *
	 * The button uses data-wp-bind--aria-label for its runtime label (set by the Interactivity
	 * API after JS hydration). Before hydration — and in no-JS environments — the button needs
	 * a static fallback so screen readers can announce it. Without the fix, the button has no
	 * accessible name, violating WCAG 4.1.2.
	 *
	 * Delete-the-fix test: remove the static aria-label from block_core_image_render_lightbox()
	 * in packages/block-library/src/image/index.php and this assertion fails because the
	 * button output no longer contains aria-label="Enlarge".
	 *
	 * @covers ::block_core_image_render_lightbox
	 */
	public function test_lightbox_trigger_button_has_static_aria_label() {
		$content = '<figure class="wp-block-image"><img src="http://' . WP_TESTS_DOMAIN . '/wp-content/uploads/2021/04/canola.jpg" /></figure>';

		$parsed_blocks = parse_blocks( '<!-- wp:image -->' );
		$parsed_block  = $parsed_blocks[0];
		$block         = new WP_Block( $parsed_block );

		$result = block_core_image_render_lightbox( $content, $parsed_block, $block );

		$this->assertStringContainsString(
			'aria-label="Enlarge"',
			$result,
			'Lightbox trigger button must have a static aria-label before JS hydration (WCAG 4.1.2).'
		);
		$this->assertStringContainsString(
			'data-wp-bind--aria-label="state.thisImage.triggerButtonAriaLabel"',
			$result,
			'Interactivity API directive must remain so the runtime label still overrides the static fallback.'
		);
	}
}
