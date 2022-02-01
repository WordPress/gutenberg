<?php
/**
 * Tests the Comment Template block.
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
	private static $per_page = 5;

	public function setUp() {
		parent::setUp();

		update_option( 'page_comments', true );
		update_option( 'comments_per_page', self::$per_page );
		update_option( 'comment_order', 'ASC' );

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

	function test_build_comment_query_vars_from_block_with_context() {
		$parsed_blocks = parse_blocks(
			'<!-- wp:comment-template --><!-- wp:comment-author-name /--><!-- wp:comment-content /--><!-- /wp:comment-template -->'
		);

		$block = new WP_Block(
			$parsed_blocks[0],
			array(
				'postId'           => self::$custom_post->ID,
				'comments/perPage' => 77,
			)
		);

		$this->assertEquals(
			build_comment_query_vars_from_block( $block ),
			array(
				'orderby'                   => 'comment_date_gmt',
				'order'                     => 'ASC',
				'status'                    => 'approve',
				'no_found_rows'             => false,
				'update_comment_meta_cache' => false,
				'post_id'                   => self::$custom_post->ID,
				'hierarchical'              => 'threaded',
				'number'                    => 77,
			)
		);
	}

	function test_build_comment_query_vars_from_block_no_context() {
		$parsed_blocks = parse_blocks(
			'<!-- wp:comment-template --><!-- wp:comment-author-name /--><!-- wp:comment-content /--><!-- /wp:comment-template -->'
		);

		$block = new WP_Block( $parsed_blocks[0] );

		$this->assertEquals(
			build_comment_query_vars_from_block( $block ),
			array(
				'orderby'                   => 'comment_date_gmt',
				'order'                     => 'ASC',
				'status'                    => 'approve',
				'no_found_rows'             => false,
				'update_comment_meta_cache' => false,
				'hierarchical'              => 'threaded',
				'number'                    => self::$per_page,
			)
		);
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
				'postId'           => self::$custom_post->ID,
				'comments/perPage' => 10,
			)
		);

		// Here we use the function prefixed with 'gutenberg_*' because it's added
		// in the build step.
		$this->assertEquals(
			gutenberg_render_block_core_comment_template( null, null, $block ),
			'<ol ><li><div class="wp-block-comment-author-name">Test</div><div class="wp-block-comment-content">Hello world</div></li></ol>'
		);
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
				'postId'           => self::$custom_post->ID,
				'comments/perPage' => 10,
			)
		);

		$this->assertEquals(
			gutenberg_render_block_core_comment_template( null, null, $block ),
			'<ol ><li><div class="wp-block-comment-author-name">Test</div><div class="wp-block-comment-content">Hello world</div><ol><li><div class="wp-block-comment-author-name">Test</div><div class="wp-block-comment-content">Hello world</div><ol><li><div class="wp-block-comment-author-name">Test</div><div class="wp-block-comment-content">Hello world</div></li></ol></li></ol></li></ol>'
		);
	}
}
