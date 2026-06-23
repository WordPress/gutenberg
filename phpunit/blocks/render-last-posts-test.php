<?php
/**
 * Last post block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Last post block.
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
	 * @covers ::block_core_latest_posts_get_full_post_content
	 */
	public function test_render_block_core_latest_posts_renders_full_post_content_blocks() {
		$category_id = $this->factory()->category->create();
		$embed_url   = 'https://example.com/watch/latest-posts-embed';

		$this->factory()->post->create(
			array(
				'post_category' => array( $category_id ),
				'post_content'  => '<!-- wp:embed {"url":"' . $embed_url . '","type":"video","providerNameSlug":"youtube","responsive":true} -->' . "\n" .
					'<figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube"><div class="wp-block-embed__wrapper">' . "\n" .
					$embed_url . "\n" .
					'</div></figure>' . "\n" .
					'<!-- /wp:embed -->',
				'post_status'   => 'publish',
				'post_title'    => 'Post with rendered embed',
			)
		);

		wp_embed_register_handler(
			'gutenberg_test_latest_posts_embed',
			'#https://example\.com/watch/([^\s<]+)#i',
			static function ( $matches ) {
				return sprintf(
					'<iframe title="Embedded test" src="https://example.com/embed/%s"></iframe>',
					esc_attr( $matches[1] )
				);
			},
			1
		);

		$attributes = array(
			'addLinkToFeaturedImage'  => false,
			'categories'              => array(
				array(
					'id' => $category_id,
				),
			),
			'displayFeaturedImage'    => false,
			'displayPostContent'      => true,
			'displayPostContentRadio' => 'full_post',
			'excerptLength'           => 0,
			'featuredImageSizeSlug'   => '',
			'order'                   => 'DESC',
			'orderBy'                 => 'date',
			'postsToShow'             => 1,
		);

		$markup = gutenberg_render_block_core_latest_posts( $attributes );

		wp_embed_unregister_handler( 'gutenberg_test_latest_posts_embed', 1 );

		$this->assertStringContainsString( '<iframe title="Embedded test"', $markup );
		$this->assertStringNotContainsString( $embed_url, $markup );
	}

	/**
	 * @covers ::render_block_core_latest_posts
	 * @covers ::block_core_latest_posts_get_full_post_content
	 */
	public function test_render_block_core_latest_posts_keeps_password_protected_full_content_hidden() {
		$category_id = $this->factory()->category->create();

		$this->factory()->post->create(
			array(
				'post_category' => array( $category_id ),
				'post_content'  => 'Protected latest posts content.',
				'post_password' => 'password',
				'post_status'   => 'publish',
				'post_title'    => 'Password protected post',
			)
		);

		$attributes = array(
			'addLinkToFeaturedImage'  => false,
			'categories'              => array(
				array(
					'id' => $category_id,
				),
			),
			'displayFeaturedImage'    => false,
			'displayPostContent'      => true,
			'displayPostContentRadio' => 'full_post',
			'excerptLength'           => 0,
			'featuredImageSizeSlug'   => '',
			'order'                   => 'DESC',
			'orderBy'                 => 'date',
			'postsToShow'             => 1,
		);

		$markup = gutenberg_render_block_core_latest_posts( $attributes );

		$this->assertStringContainsString( 'This content is password protected.', $markup );
		$this->assertStringNotContainsString( 'Protected latest posts content.', $markup );
	}

	/**
	 * @covers ::render_block_core_latest_posts
	 */
	public function test_render_block_core_latest_posts_restores_global_post() {
		$category_id      = $this->factory()->category->create();
		$original_post_id = $this->factory()->post->create();
		$GLOBALS['post']  = get_post( $original_post_id );

		$this->factory()->post->create(
			array(
				'post_category' => array( $category_id ),
				'post_content'  => 'Latest post content.',
				'post_status'   => 'publish',
				'post_title'    => 'Latest post',
			)
		);

		$attributes = array(
			'addLinkToFeaturedImage'  => false,
			'categories'              => array(
				array(
					'id' => $category_id,
				),
			),
			'displayFeaturedImage'    => false,
			'displayPostContent'      => true,
			'displayPostContentRadio' => 'full_post',
			'excerptLength'           => 0,
			'featuredImageSizeSlug'   => '',
			'order'                   => 'DESC',
			'orderBy'                 => 'date',
			'postsToShow'             => 1,
		);

		gutenberg_render_block_core_latest_posts( $attributes );

		$this->assertSame( $original_post_id, $GLOBALS['post']->ID );
	}
}
