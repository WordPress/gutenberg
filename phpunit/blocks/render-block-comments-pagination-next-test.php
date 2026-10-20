<?php
/**
 * Comments Pagination Next block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Comments Pagination Next block.
 *
 * @group blocks
 *
 * @covers ::gutenberg_render_block_core_comments_pagination_next
 */
class Tests_Blocks_Render_Comments_Pagination_Next extends WP_UnitTestCase {

	/**
	 * A post with two pages of comments.
	 *
	 * @var int
	 */
	private static $post_id;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$post_id = $factory->post->create( array( 'post_status' => 'publish' ) );
		$factory->comment->create_post_comments( self::$post_id, 4 );
	}

	public function set_up() {
		parent::set_up();

		update_option( 'page_comments', true );
		update_option( 'comments_per_page', 2 );
		update_option( 'default_comments_page', 'oldest' );
	}

	public function test_render_removes_link_attributes_filter() {
		$this->go_to( get_permalink( self::$post_id ) );

		$block    = new WP_Block(
			array( 'blockName' => 'core/comments-pagination-next' ),
			array( 'postId' => self::$post_id )
		);
		$rendered = $block->render();

		$this->assertStringContainsString( 'class="wp-block-comments-pagination-next"', $rendered );
		$this->assertFalse( has_filter( 'next_comments_link_attributes' ) );
	}
}
