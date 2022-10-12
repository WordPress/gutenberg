<?php
/**
 * Comments block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Comments block.
 *
 * @group blocks
 */
class Tests_Blocks_RenderComments extends WP_UnitTestCase {
	/**
	 * @var WP_Post
	 */
	protected static $post_with_comments_disabled;

	public static function wpSetUpBeforeClass() {
		$args                              = array(
			'comment_status' => 'closed',
		);
		self::$post_with_comments_disabled = self::factory()->post->create_and_get( $args );
	}

	public static function wpTearDownAfterClass() {
		wp_delete_post( self::$post_with_comments_disabled->ID, true );
	}

	/**
	 * @covers ::render_block_core_comments
	 */
	public function test_render_block_core_comments_empty_output_if_comments_disabled() {
		$attributes    = array();
		$parsed_blocks = parse_blocks(
			'<!-- wp:comments --><div class="wp-block-comments"><!-- wp:comments-title /--></div><!-- /wp:comments -->'
		);
		$parsed_block  = $parsed_blocks[0];
		$context       = array( 'postId' => self::$post_with_comments_disabled->ID );
		$block         = new WP_Block( $parsed_block, $context );

		$rendered = gutenberg_render_block_core_comments( $attributes, '', $block );
		$this->assertEmpty( $rendered );
	}
}
