<?php
/**
 * Tests for the Comment Template block rendering.
 *
 * @package WordPress
 * @subpackage Blocks
 * @since 6.0.0
 *
 * @group blocks
 */
class Tests_Blocks_RenderCommentTemplateBlock extends WP_UnitTestCase {

	private static $custom_post;
	private static $comment_ids;
	private static $per_page = 5;

	/**
	 * Array of the comments options and their original values.
	 * Used to reset the options after each test.
	 *
	 * @var array
	 */
	private static $original_options;

	public static function set_up_before_class() {
		parent::set_up_before_class();

		// Store the original option values.
		$options = array(
			'comment_order',
			'comments_per_page',
			'default_comments_page',
			'page_comments',
			'previous_default_page',
			'thread_comments_depth',
		);
		foreach ( $options as $option ) {
			static::$original_options[ $option ] = get_option( $option );
		}
	}

	public function tear_down() {
		// Reset the comment options to their original values.
		foreach ( static::$original_options as $option => $original_value ) {
			update_option( $option, $original_value );
		}

		parent::tear_down();
	}

	public function set_up() {
		parent::set_up();

		update_option( 'page_comments', true );
		update_option( 'comments_per_page', self::$per_page );

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
				'comment_author_url'   => 'http://example.com/author-url/',
				'comment_content'      => 'Hello world',
			)
		);
	}

	public function test_rendering_comment_template_sets_comment_id_context() {
		$render_block_callback    = new MockAction();
		add_filter( 'render_block', array( $render_block_callback, 'filter' ), 10, 3 );

		$parsed_blocks = parse_blocks(
			'<!-- wp:comment-template --><!-- wp:comment-author-name /--><!-- /wp:comment-template -->'
		);
		$block = new WP_Block(
			$parsed_blocks[0],
			array(
				'postId' => self::$custom_post->ID,
			)
		);
		$block->render();

		$this->assertSame( 3, $render_block_callback->get_call_count() );

		$args = $render_block_callback->get_args();

		$this->assertSame( 'core/comment-author-name', $args[0][2]->name );
		$this->assertArrayHasKey( 'commentId', $args[0][2]->context );
		$this->assertSame( strval( self::$comment_ids[0] ), $args[0][2]->context['commentId'] );

		$this->assertSame( 'core/comment-template', $args[1][2]->name );
		$this->assertSame( 'core/comment-template', $args[2][2]->name );
	}
}
