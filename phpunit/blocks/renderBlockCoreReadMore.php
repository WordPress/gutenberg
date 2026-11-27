<?php
/**
 * Tests for the gutenberg_render_block_core_read_more() function.
 *
 * @package WordPress
 * @subpackage Blocks
 *
 * @covers ::gutenberg_render_block_core_read_more
 * @group blocks
 */
class Tests_Blocks_RenderBlockCoreReadMore extends WP_UnitTestCase {

	/**
	 * Setup method.
	 */
	public static function wpSetUpBeforeClass() {
		WP_Block_Supports::init();
		WP_Block_Supports::$block_to_render = array(
			'blockName' => 'core/read-more',
			'attrs'     => array(),
		);
	}

	/**
	 * The link must name the post for screen readers, without nesting a link
	 * from the post title inside it.
	 */
	public function test_should_add_plain_post_title_for_screen_readers() {
		$post_id        = self::factory()->post->create(
			array(
				'post_title' => 'Hello <a href="https://example.com">linked</a> world',
			)
		);
		$block          = new stdClass();
		$block->context = array( 'postId' => $post_id );

		$rendered = gutenberg_render_block_core_read_more( array( 'linkTarget' => '_self' ), '', $block );

		$this->assertStringContainsString(
			'Read more<span class="screen-reader-text">: Hello linked world</span></a>',
			$rendered,
			'Failed to assert that the link names the post for screen readers.'
		);
		$this->assertSame(
			1,
			substr_count( $rendered, '<a ' ),
			'Failed to assert that the link in the post title is not nested in the Read More link.'
		);
	}
}
