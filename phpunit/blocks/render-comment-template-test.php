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

	public function test_rendering_comment_template_sets_comment_id_context() {.
		$render_block_callback = static function( $block_content, $block ) {
			// Insert a Comment Author Name block (which requires `commentId`
			// block context to work) after the Comment Content block.
			if ( 'core/comment-content' !== $block['blockName'] ) {
				return $block_content;
			}
			$inserted_block_markup = '<!-- wp:comment-author-name /-->';
			$inserted_blocks       = parse_blocks( $inserted_block_markup );
			$inserted_content      = render_block( $inserted_blocks[0] );
			return $inserted_content . $block_content;
		};

		add_filter( 'render_block', $render_block_callback, 10, 3 );
		$parsed_blocks = parse_blocks(
			'<!-- wp:comment-template --><!-- wp:comment-content /--><!-- /wp:comment-template -->'
		);
		$block         = new WP_Block(
			$parsed_blocks[0],
			array(
				'postId' => self::$custom_post->ID,
			)
		);
		$markup        = $block->render();
		remove_filter( 'render_block', $render_block_callback );

		$this->assertSame(
			str_replace( array( "\n", "\t" ), '', '<ol class="wp-block-comment-template"><li id="comment-' . self::$comment_ids[0] . '" class="comment even thread-even depth-1"><div class="wp-block-comment-author-name"><a rel="external nofollow ugc" href="http://example.com/author-url/" target="_self" >Test</a></div><div class="wp-block-comment-content"><p>Hello world</p></div></li></ol>' ),
			str_replace( array( "\n", "\t" ), '', $markup )
		);
	}
}
