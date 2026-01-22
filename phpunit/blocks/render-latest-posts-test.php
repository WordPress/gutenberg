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
class Tests_Blocks_RenderLastPosts extends WP_UnitTestCase {
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
			self::$posts[ $i ]          = $factory->post->create_and_get();
			self::$attachment_ids[ $i ] = $factory->attachment->create_upload_object( $file, self::$posts[ $i ]->ID );
			set_post_thumbnail( self::$posts[ $i ], self::$attachment_ids[ $i ] );
		}
	}

	public static function wpTearDownAfterClass() {
		foreach ( self::$attachment_ids as $attachment_id ) {
			wp_delete_post( $attachment_id, true );
		}
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
	 * @covers ::gutenberg_render_block_core_latest_posts
	 */
	public function test_render_block_core_latest_posts_full_content_blocks_parsed() {
		// Create attachment IDs for gallery block (used as example block type).
		$file            = DIR_TESTDATA . '/images/canola.jpg';
		$attachment_id_1 = self::factory()->attachment->create_upload_object( $file );
		$attachment_id_2 = self::factory()->attachment->create_upload_object( $file );

		// Create a post with a gallery block in its content.
		// Note: Gallery is used as an example, but this issue affects ALL blocks.
		$gallery_block_content = sprintf(
			'<!-- wp:gallery {"linkTo":"none"} -->
<figure class="wp-block-gallery has-nested-images columns-default is-cropped"><!-- wp:image {"id":%d} -->
<figure class="wp-block-image"><img src="test1.jpg" alt=""/></figure>
<!-- /wp:image -->

<!-- wp:image {"id":%d} -->
<figure class="wp-block-image"><img src="test2.jpg" alt=""/></figure>
<!-- /wp:image --></figure>
<!-- /wp:gallery -->',
			$attachment_id_1,
			$attachment_id_2
		);

		// Create a post with gallery block content for the Latest Posts block to display.
		self::factory()->post->create_and_get(
			array(
				'post_title'   => 'Post with gallery block',
				'post_content' => $gallery_block_content,
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

		$output = gutenberg_render_block_core_latest_posts( $attributes );

		// Verify that the post content is included in the output.
		$this->assertStringContainsString(
			'wp-block-latest-posts__post-full-content',
			$output,
			'Post full content wrapper should be present'
		);

		// Verify that blocks are parsed: block markup comments should be removed.
		$this->assertStringNotContainsString(
			'<!-- wp:gallery -->',
			$output,
			'Block markup comments should be removed when blocks are parsed'
		);
		$this->assertStringNotContainsString(
			'<!-- /wp:gallery -->',
			$output,
			'Block markup comments should be removed when blocks are parsed'
		);

		// Verify that parsed blocks have proper block structure and classes.
		$this->assertStringContainsString(
			'wp-block-gallery',
			$output,
			'Parsed gallery blocks should have proper block classes'
		);

		// Verify that gallery images have proper block classes when parsed.
		$this->assertStringContainsString(
			'wp-block-image',
			$output,
			'Gallery images should have proper block classes when blocks are parsed'
		);
	}
}
