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
	protected static $post;
	protected static $sticky_post;
	protected static $attachment_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$sticky_post = $factory->post->create_and_get(
			array(
				'post_title' => 'Sticky post',
				'post_date'  => '2008-09-03 00:00:00',
			)
		);
		$factory->post->create_many( 2 );
		self::$post = $factory->post->create_and_get();

		stick_post( self::$sticky_post->ID );

		$file                = DIR_TESTDATA . '/images/canola.jpg';
		self::$attachment_id = $factory->attachment->create_upload_object( $file, self::$post->ID );
		set_post_thumbnail( self::$post, self::$attachment_id );
	}

	public static function tear_down_after_class() {
		wp_delete_post( self::$attachment_id, true );
		parent::tear_down_after_class();
	}

	/**
	 * @covers render_block_core_latest_posts
	 */
	public function test_render_block_core_latest_posts() {
		$a = new MockAction();
		add_filter( 'update_post_metadata_cache', array( $a, 'filter' ), 10, 2 );
		$attributes = array(
			'displayFeaturedImage' => true,
			'postsToShow'          => 3,
			'orderBy'              => 'date',
			'order'                => 'DESC',
		);

		render_block_core_latest_posts( $attributes );
		$args      = $a->get_args();
		$last_args = end( $args );
		$this->assertContains( self::$attachment_id, $last_args[1] );
	}

	/**
	 * @covers render_block_core_latest_posts
	 */
	public function test_render_block_core_latest_posts_no_priming() {
		$a = new MockAction();
		add_filter( 'update_post_metadata_cache', array( $a, 'filter' ), 10, 2 );
		$attributes = array(
			'displayFeaturedImage' => false,
			'postsToShow'          => 3,
			'orderBy'              => 'date',
			'order'                => 'DESC',
		);

		render_block_core_latest_posts( $attributes );
		$args      = $a->get_args();
		$last_args = end( $args );
		$this->assertContains( self::$post->ID, $last_args );
		$this->assertNotContains( self::$sticky_post->ID, $last_args[1] );
	}
}
