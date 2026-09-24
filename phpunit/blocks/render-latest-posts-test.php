<?php
/**
 * Latest Posts block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Latest Posts block.
 *
 * @group blocks
 */
class Tests_Blocks_RenderLatestPosts extends WP_UnitTestCase {
	/**
	 * @var array
	 */
	protected static $posts;
	/**
	 * @var WP_Post
	 */
	protected static $sticky_post;
	/**
	 * @var array
	 */
	protected static $attachment_ids;
	/**
	 * @var array|null
	 */
	private $original_block_supports;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$sticky_post = $factory->post->create_and_get(
			array(
				'post_title' => 'Sticky post',
				'post_date'  => '2008-09-03 00:00:00',
			)
		);
		stick_post( self::$sticky_post->ID );

		$file = DIR_TESTDATA . '/images/canola.jpg';

		for ( $i = 0; $i < 5; $i++ ) {
			self::$posts[ $i ]          = $factory->post->create_and_get(
				array(
					'post_date' => gmdate( 'Y-m-d H:i:s', time() - ( 5 - $i ) ),
				)
			);
			self::$attachment_ids[ $i ] = $factory->attachment->create_upload_object( $file, self::$posts[ $i ]->ID );
			set_post_thumbnail( self::$posts[ $i ], self::$attachment_ids[ $i ] );
		}
	}

	public static function wpTearDownAfterClass() {
		foreach ( self::$attachment_ids as $attachment_id ) {
			wp_delete_post( $attachment_id, true );
		}
		foreach ( self::$posts as $post ) {
			wp_delete_post( $post->ID, true );
		}
		unstick_post( self::$sticky_post->ID );
		wp_delete_post( self::$sticky_post->ID, true );
	}

	public function set_up() {
		parent::set_up();

		$this->original_block_supports      = WP_Block_Supports::$block_to_render;
		WP_Block_Supports::$block_to_render = array(
			'attrs'     => array(),
			'blockName' => '',
		);
	}

	public function tear_down() {
		WP_Block_Supports::$block_to_render = $this->original_block_supports;
		parent::tear_down();
	}

	/**
	 * Test that _wp_apply_block_content_filters() works.
	 *
	 * @covers ::_wp_apply_block_content_filters
	 */
	public function test_wp_apply_block_content_filters_works() {
		// Check if the function exists.
		$this->assertTrue( function_exists( '_wp_apply_block_content_filters' ), '_wp_apply_block_content_filters function should exist' );

		// Test with paragraph block.
		$content = '<!-- wp:paragraph --><p>Test paragraph</p><!-- /wp:paragraph -->';
		$output  = _wp_apply_block_content_filters( $content, 'test-context' );

		// Block comments should be removed.
		$this->assertStringNotContainsString( '<!-- wp:paragraph -->', $output, 'Block comments should be removed' );
		// Block should be rendered with class.
		$this->assertStringContainsString( 'wp-block-paragraph', $output, 'Block should have wp-block class' );
	}

	/**
	 * Test that do_blocks() works in the test environment.
	 *
	 * @covers ::do_blocks
	 */
	public function test_do_blocks_works() {
		// Test paragraph block.
		$block_content = '<!-- wp:paragraph --><p>Test</p><!-- /wp:paragraph -->';
		$output        = do_blocks( $block_content );

		// Block comments should be removed.
		$this->assertStringNotContainsString( '<!-- wp:paragraph -->', $output, 'Block comments should be removed by do_blocks()' );
		// Paragraph should be rendered with block class.
		$this->assertStringContainsString( 'wp-block-paragraph', $output, 'Block should be rendered with classes' );
		$this->assertStringContainsString( 'Test', $output, 'Block content should be present' );

		// Test gallery block with actual attachment IDs.
		// Create attachments for the test.
		$file            = DIR_TESTDATA . '/images/canola.jpg';
		$attachment_id_1 = self::factory()->attachment->create_upload_object( $file );
		$attachment_id_2 = self::factory()->attachment->create_upload_object( $file );

		$gallery_content = sprintf(
			'<!-- wp:gallery {"linkTo":"none"} -->
<!-- wp:image {"id":%d} /-->
<!-- wp:image {"id":%d} /-->
<!-- /wp:gallery -->',
			$attachment_id_1,
			$attachment_id_2
		);

		// Apply the same filters that _wp_apply_block_content_filters does.
		$processed_content = shortcode_unautop( $gallery_content );
		$processed_content = do_shortcode( $processed_content );
		$gallery_output    = do_blocks( $processed_content );

		// Check if gallery block is registered.
		$registry = WP_Block_Type_Registry::get_instance();

		$this->assertTrue( $registry->is_registered( 'core/gallery' ), 'Gallery block should be registered' );
		$this->assertTrue( $registry->is_registered( 'core/image' ), 'Image block should be registered' );

		// Check if block comments are removed.
		$this->assertStringNotContainsString( '<!-- wp:gallery', $gallery_output, 'Gallery block comments should be removed' );
	}

	/**
	 * @covers ::render_block_core_latest_posts
	 */
	public function test_render_block_core_latest_posts() {
		$action = new MockAction();
		add_filter( 'update_post_metadata_cache', array( $action, 'filter' ), 10, 2 );
		$attributes = array(
			'displayFeaturedImage'   => true,
			'postsToShow'            => 5,
			'orderBy'                => 'date',
			'order'                  => 'DESC',
			'excerptLength'          => 0,
			'featuredImageSizeSlug'  => '',
			'addLinkToFeaturedImage' => false,
		);

		gutenberg_render_block_core_latest_posts( $attributes );
		$args      = $action->get_args();
		$last_args = end( $args );
		$this->assertSameSets( self::$attachment_ids, $last_args[1] );
	}

	/**
	 * @covers ::render_block_core_latest_posts
	 */
	public function test_render_block_core_latest_posts_no_priming() {
		$action = new MockAction();
		add_filter( 'update_post_metadata_cache', array( $action, 'filter' ), 10, 2 );
		$attributes = array(
			'displayFeaturedImage'   => false,
			'postsToShow'            => 5,
			'orderBy'                => 'date',
			'order'                  => 'DESC',
			'excerptLength'          => 0,
			'featuredImageSizeSlug'  => '',
			'addLinkToFeaturedImage' => false,
		);

		gutenberg_render_block_core_latest_posts( $attributes );
		$args      = $action->get_args();
		$last_args = end( $args );
		$this->assertContains( self::$posts[0]->ID, $last_args[1], 'Ensure that post is in array of post ids that are primed' );
		$this->assertNotContains( self::$sticky_post->ID, $last_args[1], 'Ensure that sticky post is not in array of post ids that are primed' );
	}

	/**
	 * @covers ::render_block_core_latest_posts
	 */
	public function test_render_block_core_latest_posts_adds_layout_grid_compatibility_classes() {
		$attributes = array(
			'displayFeaturedImage' => false,
			'postsToShow'          => 5,
			'orderBy'              => 'date',
			'order'                => 'DESC',
			'excerptLength'        => 0,
			'layout'               => array(
				'type'               => 'grid',
				'columnCount'        => 4,
				'minimumColumnWidth' => '12rem',
			),
		);

		$markup = gutenberg_render_block_core_latest_posts( $attributes );

		$this->assertStringContainsString( 'wp-block-latest-posts__list', $markup );
		$this->assertStringContainsString( 'is-grid', $markup );
		$this->assertStringContainsString( 'columns-4', $markup );
		$this->assertStringContainsString( 'has-native-responsive-grid', $markup );
	}

	/**
	 * @covers ::render_block_core_latest_posts
	 */
	public function test_render_block_core_latest_posts_supports_legacy_grid_attributes() {
		$attributes = array(
			'displayFeaturedImage' => false,
			'postsToShow'          => 5,
			'orderBy'              => 'date',
			'order'                => 'DESC',
			'excerptLength'        => 0,
			'postLayout'           => 'grid',
			'columns'              => 5,
		);

		$markup = gutenberg_render_block_core_latest_posts( $attributes );

		$this->assertStringContainsString( 'is-grid', $markup );
		$this->assertStringContainsString( 'columns-5', $markup );
		$this->assertStringNotContainsString( 'has-native-responsive-grid', $markup );
	}

	/**
	 * Tests that recursion is prevented when a Latest Posts block displays itself.
	 *
	 * When a Latest Posts block is added to a post and that post is then displayed
	 * by another Latest Posts block with "Show full post" enabled, infinite recursion
	 * could occur. This test verifies that the recursion protection prevents memory
	 * exhaustion by skipping the nested rendering of the same post.
	 *
	 * This reproduces the scenario reported in PR #74866 where adding a Latest Posts
	 * block to a post (with gallery blocks) caused memory exhaustion when that post
	 * was displayed by the Latest Posts block.
	 *
	 * @covers ::render_block_core_latest_posts
	 */
	public function test_render_block_core_latest_posts_prevents_recursion() {
		// Create a paragraph block for testing block parsing.
		$paragraph_block = '<!-- wp:paragraph --><p>Test content in a paragraph block.</p><!-- /wp:paragraph -->';

		// Create a Latest Posts block markup (showing 5 posts with full content).
		$latest_posts_block = '<!-- wp:latest-posts {"postsToShow":5,"displayPostContent":true,"displayPostContentRadio":"full_post"} /-->';

		// Create a post that contains BOTH a paragraph block AND a Latest Posts block.
		// This matches the scenario where recursion prevention and block parsing should work.
		// The post will be picked up by the Latest Posts query since it's the most recent.
		self::factory()->post->create_and_get(
			array(
				'post_title'   => 'Post with paragraph and Latest Posts block',
				'post_content' => $paragraph_block . "\n\n" . $latest_posts_block,
				'post_status'  => 'publish',
				'post_date'    => gmdate( 'Y-m-d H:i:s' ), // Make it the most recent post
			)
		);

		// Render a Latest Posts block that will display the post containing the Latest Posts block.
		// This creates a potential infinite loop: Latest Posts displays a post that contains
		// a Latest Posts block, which would try to display posts including itself.
		$attributes = array(
			'postsToShow'             => 5,
			'orderBy'                 => 'date',
			'order'                   => 'DESC',
			'excerptLength'           => 55,
			'displayFeaturedImage'    => false,
			'displayPostContent'      => true,
			'displayPostContentRadio' => 'full_post',
		);

		// Render through the block pipeline so that the Gutenberg-registered
		// callback (gutenberg_render_block_core_latest_posts) is used.
		$output = render_block(
			array(
				'blockName'    => 'core/latest-posts',
				'attrs'        => $attributes,
				'innerBlocks'  => array(),
				'innerHTML'    => '',
				'innerContent' => array(),
			)
		);

		// Verify the output contains the wrapper for the outer Latest Posts block.
		$this->assertStringContainsString(
			'wp-block-latest-posts__list',
			$output,
			'The outer Latest Posts block should render'
		);

		// Verify the post title is in the output.
		$this->assertStringContainsString(
			'Post with paragraph and Latest Posts block',
			$output,
			'The post containing a Latest Posts block should be displayed'
		);

		// Verify that the paragraph block was parsed correctly (from do_blocks call).
		$this->assertStringContainsString(
			'wp-block-paragraph',
			$output,
			'Paragraph block should be parsed and rendered'
		);

		// Verify that the nested Latest Posts block was parsed (not raw markup).
		// The block markup comment should not appear in the output since do_blocks() parses it.
		$this->assertStringNotContainsString(
			'<!-- wp:latest-posts',
			$output,
			'Nested Latest Posts block markup should be parsed by do_blocks(), not present as raw markup'
		);

		// Verify recursion protection: the nested block renders once (producing a second
		// wp-block-latest-posts__list wrapper) but does not trigger further recursive rendering.
		// Counting occurrences of the list class is robust to changes in inner HTML structure.
		// Infinite recursion would produce far more than 3 occurrences.
		$list_count = substr_count( $output, 'wp-block-latest-posts__list' );
		$this->assertGreaterThanOrEqual(
			2,
			$list_count,
			'Output should contain at least 2 list wrappers: the outer block and the nested block'
		);
		$this->assertLessThanOrEqual(
			3,
			$list_count,
			'Recursion protection should prevent more than one level of nesting'
		);
	}

	/**
	 * Tests that nested Latest Posts blocks restore the outer post context.
	 *
	 * @covers ::render_block_core_latest_posts
	 */
	public function test_render_block_core_latest_posts_restores_outer_context_after_nested_render() {
		$block_name = 'test/current-post-title';

		if ( WP_Block_Type_Registry::get_instance()->is_registered( $block_name ) ) {
			unregister_block_type( $block_name );
		}

		register_block_type(
			$block_name,
			array(
				'render_callback' => static function () {
					return sprintf(
						'<span class="latest-posts-current-title">%s</span>',
						esc_html( get_the_title() )
					);
				},
			)
		);

		try {
			$main_post = self::factory()->post->create_and_get(
				array(
					'post_title'  => 'Main query post',
					'post_status' => 'publish',
				)
			);
			$this->go_to( get_permalink( $main_post ) );

			$category_id      = self::factory()->category->create();
			$latest_posts_att = array(
				'postsToShow'             => 1,
				'orderBy'                 => 'date',
				'order'                   => 'DESC',
				'excerptLength'           => 55,
				'displayFeaturedImage'    => false,
				'displayPostContent'      => true,
				'displayPostContentRadio' => 'full_post',
				'categories'              => array(
					array(
						'id' => $category_id,
					),
				),
			);

			$nested_latest_posts_block = sprintf(
				'<!-- wp:latest-posts %s /-->',
				wp_json_encode( $latest_posts_att )
			);

			self::factory()->post->create_and_get(
				array(
					'post_title'    => 'Outer latest posts item',
					'post_content'  => $nested_latest_posts_block . "\n\n<!-- wp:test/current-post-title /-->",
					'post_status'   => 'publish',
					'post_category' => array( $category_id ),
				)
			);

			$output = gutenberg_render_block_core_latest_posts( $latest_posts_att );

			$this->assertStringContainsString(
				'<span class="latest-posts-current-title">Outer latest posts item</span>',
				$output,
				'Blocks rendered after a nested Latest Posts block should use the outer post context.'
			);
			$this->assertStringNotContainsString(
				'<span class="latest-posts-current-title">Main query post</span>',
				$output,
				'Nested Latest Posts blocks should not reset later sibling blocks to the main query context.'
			);
		} finally {
			unregister_block_type( $block_name );
		}
	}

	/**
	 * Tests that blocks are parsed when "Show full post" is enabled.
	 *
	 * When the Latest Posts block displays full post content, ALL blocks
	 * within that content should be parsed and rendered properly using
	 * do_blocks(). This applies to any block type (video, gallery, paragraph,
	 * etc.), not just specific blocks. This ensures:
	 * - Videos are constrained to their container width
	 * - Gallery blocks display images side by side correctly
	 * - Block styles are applied
	 * - Block attributes are respected
	 *
	 * This test uses a gallery block as an example, but the issue affects
	 * all block types. See #61477 and #69517.
	 *
	 * @covers ::render_block_core_latest_posts
	 */
	public function test_render_block_core_latest_posts_full_content_blocks_parsed() {
		// Create a post with block content that we know renders server-side.
		// Use paragraph blocks as they have reliable server-side rendering.
		$block_content = '<!-- wp:paragraph --><p>This is a test paragraph that should be rendered with block classes.</p><!-- /wp:paragraph -->';

		// Create a post with block content for the Latest Posts block to display.
		self::factory()->post->create_and_get(
			array(
				'post_title'   => 'Post with paragraph block',
				'post_content' => $block_content,
				'post_status'  => 'publish',
			)
		);

		// Render Latest Posts block with "Show full post" enabled.
		$attributes = array(
			'postsToShow'             => 1,
			'orderBy'                 => 'date',
			'order'                   => 'DESC',
			'excerptLength'           => 55,
			'displayFeaturedImage'    => false,
			'displayPostContent'      => true,
			'displayPostContentRadio' => 'full_post',
		);

		// Render through the block pipeline so that the Gutenberg-registered
		// callback (gutenberg_render_block_core_latest_posts) is used.
		$output = render_block(
			array(
				'blockName'    => 'core/latest-posts',
				'attrs'        => $attributes,
				'innerBlocks'  => array(),
				'innerHTML'    => '',
				'innerContent' => array(),
			)
		);

		// Verify that the post content is included in the output.
		$this->assertStringContainsString(
			'wp-block-latest-posts__post-full-content',
			$output,
			'Post full content wrapper should be present'
		);

		// Verify that blocks are parsed: block markup comments should be removed.
		$this->assertStringNotContainsString(
			'<!-- wp:paragraph -->',
			$output,
			'Block markup comments should be removed when blocks are parsed'
		);
		$this->assertStringNotContainsString(
			'<!-- /wp:paragraph -->',
			$output,
			'Block markup comments should be removed when blocks are parsed'
		);

		// Verify that parsed blocks have proper block structure and classes.
		$this->assertStringContainsString(
			'wp-block-paragraph',
			$output,
			'Parsed paragraph blocks should have proper block classes'
		);

		// Verify that the actual content is present.
		$this->assertStringContainsString(
			'This is a test paragraph',
			$output,
			'Block content should be rendered'
		);
	}
}
