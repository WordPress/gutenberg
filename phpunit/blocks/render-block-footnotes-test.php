<?php
/**
 * Tests for the Footnotes block rendering.
 *
 * @package Gutenberg
 * @subpackage Blocks
 * @since 6.4.0
 *
 * @group blocks
 */
class Blocks_RenderFootnotes_Test extends WP_UnitTestCase {
	/**
	 * Test post.
	 *
	 * @var WP_Post
	 */
	private static $post;

	/**
	 * Setup method.
	 */
	public static function wpSetUpBeforeClass() {
		self::$post = self::factory()->post->create_and_get(
			array(
				'post_type'    => 'post',
				'post_status'  => 'publish',
				'post_name'    => 'butterfly',
				'post_title'   => 'Butterfly',
				'post_content' => '<!-- wp:paragraph --><p>Butterflies are pretty cool<sup data-fn="b100" class="fn"><a href="#b100" id="b100-link">1</a></sup></p><!-- /wp:paragraph --><!-- wp:footnotes /-->',
				'meta_input'   => array(
					'footnotes' => '[{\"content\":\"Because I said so\",\"id\":\"b100\"}]',
				),
			)
		);

		/*
		 * Needed for the tests to pass.
		 * render_block_core_footnotes() calls get_block_wrapper_attributes(),
		 * which calls WP_Block_Supports::get_instance()->apply_block_supports().
		 * The latter ends up looking for `self::$block_to_render['blockName']`.
		 */

		WP_Block_Supports::init();
		WP_Block_Supports::$block_to_render = array(
			'blockName' => 'core/footnotes',
		);
	}

	/**
	 * @covers ::gutenberg_render_block_core_footnotes
	 */
	public function test_rendering_footnotes_block() {
		$block                    = new WP_Block( parse_blocks( self::$post->post_content )[1] );
		$block->context['postId'] = self::$post->ID;
		$rendered                 = gutenberg_render_block_core_footnotes( array(), '', $block );
		$expected                 = '<ol class="wp-block-footnotes"><li id="b100">Because I said so <a href="#b100-link">↩︎</a></li></ol>';

		$this->assertSame(
			$expected,
			$rendered
		);
	}

	/**
	 * @covers ::block_core_footnotes_get_post_metadata
	 */
	public function test_rendering_footnotes_block_with_double_quotations() {
		$post_args = array(
			'ID'         => self::$post->ID,
			'meta_input' => array(
				'footnotes' => '[{\"content\":\"Because I said "so"!!!\",\"id\":\"b100\"}]',
			),
		);

		wp_update_post( $post_args, true, false );

		$updated_post             = get_post( self::$post->ID );
		$block                    = new WP_Block( parse_blocks( $updated_post->post_content )[1] );
		$block->context['postId'] = self::$post->ID;

		/*
		 * gutenberg_render_block_core_footnotes calls get_post_meta()
		 * The filter block_core_footnotes_get_post_metadata() transforms
		 * malformed JSON into valid JSON where there are quotations.
		 */
		$rendered = gutenberg_render_block_core_footnotes( array(), '', $block );
		$expected = '<ol class="wp-block-footnotes"><li id="b100">Because I said "so"!!! <a href="#b100-link">↩︎</a></li></ol>';

		$this->assertSame(
			$expected,
			$rendered
		);
	}

	/**
	 * @covers ::block_core_footnotes_get_post_metadata
	 */
	public function test_rendering_footnotes_block_with_single_quotations() {
		$post_args = array(
			'ID'         => self::$post->ID,
			'meta_input' => array(
				'footnotes' => "[{\"content\":\"And the bee said: \"I didn't know\"\",\"id\":\"b200\"}]",
			),
		);

		wp_update_post( $post_args, true, false );

		$updated_post             = get_post( self::$post->ID );
		$block                    = new WP_Block( parse_blocks( $updated_post->post_content )[1] );
		$block->context['postId'] = self::$post->ID;
		$rendered                 = gutenberg_render_block_core_footnotes( array(), '', $block );
		$expected                 = '<ol class="wp-block-footnotes"><li id="b200">And the bee said: "I didn\'t know" <a href="#b200-link">↩︎</a></li></ol>';

		$this->assertSame(
			$expected,
			$rendered
		);
	}
}
