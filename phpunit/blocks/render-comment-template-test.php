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
			'thread_comments',
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
		// Each comment renders from a copy named `core/null`, so block supports only apply to the outer list.
		$this->assertSame( 'core/null', $args[1][2]->name );
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

	public function test_block_gap_layout_applies_to_outer_list_only() {
		// The container class that carries the gap is only added when the theme supports block gap.
		add_filter( 'wp_theme_json_data_theme', array( $this, 'filter_enable_block_gap' ) );
		WP_Theme_JSON_Resolver_Gutenberg::clean_cached_data();

		$parsed_blocks = parse_blocks(
			'<!-- wp:comment-template {"style":{"spacing":{"blockGap":"48px"}}} --><!-- wp:comment-content /--><!-- /wp:comment-template -->'
		);
		$block         = new WP_Block(
			$parsed_blocks[0],
			array(
				'postId' => self::$custom_post->ID,
			)
		);
		$markup        = $block->render();

		remove_filter( 'wp_theme_json_data_theme', array( $this, 'filter_enable_block_gap' ) );
		WP_Theme_JSON_Resolver_Gutenberg::clean_cached_data();

		$processor = new WP_HTML_Tag_Processor( $markup );
		$this->assertTrue( $processor->next_tag( 'ol' ) );
		$this->assertTrue( $processor->has_class( 'is-layout-flow' ), 'Outer list is missing the layout class.' );
		$this->assertTrue( $processor->has_class( 'wp-block-comment-template-is-layout-flow' ) );
		$this->assertMatchesRegularExpression(
			'/\bwp-container-core-comment-template-is-layout-[a-z0-9]+\b/',
			$processor->get_attribute( 'class' ),
			'Outer list is missing the container class that carries the block gap.'
		);
		$this->assertSame( 1, preg_match_all( '/(?<![\w-])is-layout-flow(?![\w-])/', $markup ), 'Layout classes should only be added once.' );
	}

	public function test_block_gap_layout_is_not_added_to_nested_replies() {
		update_option( 'thread_comments', true );
		update_option( 'thread_comments_depth', 5 );

		self::factory()->comment->create(
			array(
				'comment_post_ID'      => self::$custom_post->ID,
				'comment_parent'       => self::$comment_ids[0],
				'comment_author'       => 'Test',
				'comment_author_email' => 'test@example.org',
				'comment_content'      => 'Reply',
				'comment_approved'     => '1',
			)
		);

		$parsed_blocks = parse_blocks(
			'<!-- wp:comment-template {"style":{"spacing":{"blockGap":"48px"}}} --><!-- wp:comment-content /--><!-- /wp:comment-template -->'
		);
		$block         = new WP_Block(
			$parsed_blocks[0],
			array(
				'postId' => self::$custom_post->ID,
			)
		);
		$markup        = $block->render();

		$processor = new WP_HTML_Tag_Processor( $markup );
		$this->assertTrue( $processor->next_tag( 'ol' ) );
		$this->assertTrue( $processor->has_class( 'is-layout-flow' ), 'Outer list is missing the layout class.' );

		$this->assertTrue( $processor->next_tag( 'ol' ), 'Nested reply list was not rendered.' );
		$this->assertNull( $processor->get_attribute( 'class' ), 'Nested reply list should not have layout classes.' );

		$this->assertSame( 1, preg_match_all( '/(?<![\w-])is-layout-flow(?![\w-])/', $markup ), 'Layout classes should only be added once.' );
		$this->assertStringContainsString( 'Reply', $markup );
	}

	public function filter_enable_block_gap( $theme_json ) {
		return $theme_json->update_with(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'spacing' => array(
						'blockGap' => true,
					),
				),
			)
		);
	}
}
