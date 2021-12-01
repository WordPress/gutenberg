<?php
/**
 * Tests server side rendering of core/comment-template
 *
 * @package    Gutenberg
 * @subpackage block-library
 */

/**
 * Tests for rendering a list of comments
 */
class Block_Library_Comment_Template_Test extends WP_UnitTestCase {

	private static $custom_post;
	private static $comment_ids;

	public function setUp() {

		self::$custom_post = self::factory()->post->create_and_get(
			array(
				'post_type'    => 'dogs',
				'post_status'  => 'publish',
				'post_name'    => 'metaldog',
				'post_title'   => 'Metal Dog',
				'post_content' => 'Metal Dog content',
				'post_excerpt' => 'Metal Dog',
			)
		);

		self::$comment_ids = self::factory()->comment->create_post_comments(
			self::$custom_post->ID,
			1,
			array(
				'comment_author'       => 'Test',
				'comment_author_email' => 'test@example.org',
				'comment_content'      => 'Hello world',
			)
		);

	}

	public function tearDown() {
		wp_delete_post( self::$custom_post );
	}

	/**
	 * Test rendering a single comment
	 */
	function test_rendering_comment_template() {
		$parsed_blocks = parse_blocks(
			'<!-- wp:comment-template --><!-- wp:comment-author-name /--><!-- wp:comment-content /--><!-- /wp:comment-template -->'
		);

		$block = new WP_Block(
			$parsed_blocks[0],
			array(
				'postId'       => self::$custom_post->ID,
				'queryPerPage' => 10,
			)
		);

		$this->assertEquals( gutenberg_render_block_core_comment_template( null, null, $block ), '<ol ><li><div class="wp-block-comment-author-name">Test</div><div class="wp-block-comment-content">Hello world</div></li></ol>' );

	}


	/**
	 * Test rendering 3 nested comments:
	 *
	 * └─ comment 1
	 *    └─ comment 2
	 *       └─ comment 3
	 */
	function test_rendering_comment_template_nested() {
		$nested_comment_ids = self::factory()->comment->create_post_comments(
			self::$custom_post->ID,
			1,
			array(
				'comment_parent'       => self::$comment_ids[0],
				'comment_author'       => 'Test',
				'comment_author_email' => 'test@example.org',
				'comment_content'      => 'Hello world',
			)
		);

		self::factory()->comment->create_post_comments(
			self::$custom_post->ID,
			1,
			array(
				'comment_parent'       => $nested_comment_ids[0],
				'comment_author'       => 'Test',
				'comment_author_email' => 'test@example.org',
				'comment_content'      => 'Hello world',
			)
		);

		$parsed_blocks = parse_blocks(
			'<!-- wp:comment-template --><!-- wp:comment-author-name /--><!-- wp:comment-content /--><!-- /wp:comment-template -->'
		);

		$block = new WP_Block(
			$parsed_blocks[0],
			array(
				'postId'       => self::$custom_post->ID,
				'queryPerPage' => 10,
			)
		);

		$output = '<ol ><li><div class="wp-block-comment-author-name">Test</div><div class="wp-block-comment-content">Hello world</div><ol><li><div class="wp-block-comment-author-name">Test</div><div class="wp-block-comment-content">Hello world</div><ol><li><div class="wp-block-comment-author-name">Test</div><div class="wp-block-comment-content">Hello world</div></li></ol></li></ol></li></ol>';

		$this->assertEquals( gutenberg_render_block_core_comment_template( null, null, $block ), $output );

	}

}
