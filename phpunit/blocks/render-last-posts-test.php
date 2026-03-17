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
}
