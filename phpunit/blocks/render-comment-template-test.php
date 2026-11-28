<?php
/**
 * Tests for the Comment Template block rendering.
 *
 * @package WordPress
 * @subpackage Blocks
 * @since 6.3.0
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
		$parsed_comment_author_name_block = parse_blocks( '<!-- wp:comment-author-name /-->' )[0];
		$comment_author_name_block        = new WP_Block(
			$parsed_comment_author_name_block,
			array(
				'commentId' => self::$comment_ids[0],
			)
		);
		$comment_author_name_block_markup = $comment_author_name_block->render();
		$this->assertNotEmpty(
			$comment_author_name_block_markup,
			'Comment Author Name block rendered markup is empty.'
		);

		$render_block_callback = static function ( $block_content, $block ) use ( $parsed_comment_author_name_block ) {
			// Insert a Comment Author Name block (which requires `commentId`
			// block context to work) after the Comment Content block.
			if ( 'core/comment-content' !== $block['blockName'] ) {
				return $block_content;
			}

			$inserted_content = render_block( $parsed_comment_author_name_block );
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

		$this->assertStringContainsString(
			$comment_author_name_block_markup,
			$markup,
			"Rendered markup doesn't contain Comment Author Name block."
		);
	}

	public function test_inner_block_inserted_by_render_block_data_is_retained() {
		$render_block_callback = new MockAction();
		add_filter( 'render_block', array( $render_block_callback, 'filter' ), 10, 3 );

		$render_block_data_callback = static function ( $parsed_block ) {
			// Add a Social Links block to a Comment Template block's inner blocks.
			if ( 'core/comment-template' === $parsed_block['blockName'] ) {
				$inserted_block_markup = <<<END
<!-- wp:social-links -->
<ul class="wp-block-social-links"><!-- wp:social-link {"url":"https://wordpress.org","service":"wordpress"} /--></ul>
<!-- /wp:social-links -->'
END;

				$inserted_blocks = parse_blocks( $inserted_block_markup );

				$parsed_block['innerBlocks'][] = $inserted_blocks[0];
			}
			return $parsed_block;
		};

		add_filter( 'render_block_data', $render_block_data_callback, 10, 1 );
		$parsed_blocks = parse_blocks(
			'<!-- wp:comments --><!-- wp:comment-template --><!-- wp:comment-content /--><!-- /wp:comment-template --><!-- /wp:comments -->'
		);
		$block         = new WP_Block(
			$parsed_blocks[0],
			array(
				'postId' => self::$custom_post->ID,
			)
		);
		$block->render();
		remove_filter( 'render_block_data', $render_block_data_callback );

		$this->assertSame( 5, $render_block_callback->get_call_count() );

		$args = $render_block_callback->get_args();
		$this->assertSame( 'core/comment-content', $args[0][2]->name );
		$this->assertSame( 'core/comment-template', $args[1][2]->name );
		$this->assertCount( 2, $args[1][2]->inner_blocks, "Inner block inserted by render_block_data filter wasn't retained." );
		$this->assertInstanceOf(
			'WP_Block',
			$args[1][2]->inner_blocks[1],
			"Inner block inserted by render_block_data isn't a WP_Block class instance."
		);
		$this->assertSame(
			'core/social-links',
			$args[1][2]->inner_blocks[1]->name,
			"Inner block inserted by render_block_data isn't named as expected."
		);
	}

	/**
	 * Tests that comment blocks expose the comment pages count for the main post.
	 *
	 * @see https://github.com/WordPress/gutenberg/issues/48323
	 *
	 * @dataProvider data_blocks_exposing_comment_pages_count
	 *
	 * @param string $block_markup Markup of the block to render.
	 */
	public function test_rendering_block_sets_comment_pages_count( $block_markup ) {
		$post_id = self::factory()->post->create();
		// 11 comments at 5 per page: 3 pages.
		self::factory()->comment->create_post_comments( $post_id, 11 );
		$this->go_to( get_permalink( $post_id ) );

		$this->assertSame( 0, get_comment_pages_count(), 'The comment pages count should start empty.' );

		$this->render_block_for_post( $block_markup, $post_id );

		$this->assertSame( 3, get_comment_pages_count() );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_blocks_exposing_comment_pages_count() {
		return array(
			'comment template'            => array( '<!-- wp:comment-template --><!-- wp:comment-content /--><!-- /wp:comment-template -->' ),
			'comments pagination'         => array( '<!-- wp:comments-pagination --><!-- wp:comments-pagination-numbers /--><!-- /wp:comments-pagination -->' ),
			'comments pagination next'    => array( '<!-- wp:comments-pagination-next /-->' ),
			'comments pagination numbers' => array( '<!-- wp:comments-pagination-numbers /-->' ),
		);
	}

	/**
	 * Tests that comment blocks for a post other than the main post don't set the count.
	 *
	 * @dataProvider data_blocks_exposing_comment_pages_count
	 *
	 * @param string $block_markup Markup of the block to render.
	 */
	public function test_rendering_block_for_other_post_does_not_set_comment_pages_count( $block_markup ) {
		$main_post_id  = self::factory()->post->create();
		$other_post_id = self::factory()->post->create();
		self::factory()->comment->create_post_comments( $other_post_id, 11 );
		$this->go_to( get_permalink( $main_post_id ) );

		$this->render_block_for_post( $block_markup, $other_post_id );

		$this->assertSame( 0, get_comment_pages_count() );
	}

	/**
	 * Tests that the Comment Template block sets one comment page without pagination.
	 */
	public function test_rendering_comment_template_without_pagination_sets_one_comment_page() {
		update_option( 'page_comments', false );

		$post_id = self::factory()->post->create();
		self::factory()->comment->create_post_comments( $post_id, 11 );
		$this->go_to( get_permalink( $post_id ) );

		$this->render_block_for_post( '<!-- wp:comment-template --><!-- wp:comment-content /--><!-- /wp:comment-template -->', $post_id );

		$this->assertSame( 1, get_comment_pages_count() );
	}

	/**
	 * Renders a block with the given post ID as context.
	 *
	 * @param string $block_markup Markup of the block to render.
	 * @param int    $post_id      Post ID.
	 */
	private function render_block_for_post( $block_markup, $post_id ) {
		$block = new WP_Block(
			parse_blocks( $block_markup )[0],
			array(
				'postId' => $post_id,
			)
		);
		$block->render();
	}
}
