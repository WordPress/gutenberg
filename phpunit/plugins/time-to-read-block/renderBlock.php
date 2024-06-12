<?php
/**
 * Time To Read block rendering tests.
 */

/**
 * Tests for the Time To Read block.
 *
 * @group blocks
 */
class Tests_Plugins_Time_To_Read_Block_renderBlock extends WP_UnitTestCase {
	/**
	 * @var array
	 */
	protected static $posts;
	/**
	 * @var WP_Post
	 */
	protected static $no_content_post;
	/**
	 * @var WP_Post
	 */
	protected static $less_than_one_minute_post;
	/**
	 * @var WP_Post
	 */
	protected static $one_minute_post;
	/**
	 * @var WP_Post
	 */
	protected static $two_minutes_post;
	/**
	 * @var array|null
	 */
	private $original_block_supports;

	public static function wpSetUpBeforeClass() {
		$content = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';

		self::$no_content_post = self::factory()->post->create_and_get(
			array(
				'post_type'    => 'post',
				'post_title'   => 'Post without content',
				'post_content' => '',
			)
		);
		self::$posts[]         = self::$no_content_post;

		self::$less_than_one_minute_post = self::factory()->post->create_and_get(
			array(
				'post_type'    => 'post',
				'post_title'   => 'Post that takes less than 1 minute to read',
				'post_content' => $content,
			)
		);
		self::$posts[]                   = self::$less_than_one_minute_post;

		self::$one_minute_post = self::factory()->post->create_and_get(
			array(
				'post_type'    => 'post',
				'post_title'   => 'Post that takes 1 minute to read',
				'post_content' => str_repeat( $content, 2 ),
			)
		);
		self::$posts[]         = self::$one_minute_post;

		self::$two_minutes_post = self::factory()->post->create_and_get(
			array(
				'post_type'    => 'post',
				'post_title'   => 'Post that takes 2 minutes to read',
				'post_content' => str_repeat( $content, 5 ),
			)
		);
		self::$posts[]          = self::$two_minutes_post;
	}

	public static function wpTearDownAfterClass() {
		foreach ( self::$posts as $post_to_delete ) {
			wp_delete_post( $post_to_delete->ID, true );
		}
	}

	public function set_up() {
		parent::set_up();
		$this->original_block_supports      = WP_Block_Supports::$block_to_render;
		WP_Block_Supports::$block_to_render = array(
			'attrs'     => array(),
			'blockName' => 'gutenberg/time-to-read',
		);
	}

	public function tear_down() {
		WP_Block_Supports::$block_to_render = $this->original_block_supports;
		parent::tear_down();
	}

	/**
	 * @covers ::gutenberg_render_block_time_to_read
	 */
	public function test_no_content_post() {
		global $wp_query;

		$wp_query->post  = self::$no_content_post;
		$GLOBALS['post'] = self::$no_content_post;

		$page_id       = self::$no_content_post->ID;
		$attributes    = array();
		$parsed_blocks = parse_blocks( '<!-- wp:gutenberg/time-to-read /-->' );
		$parsed_block  = $parsed_blocks[0];
		$context       = array( 'postId' => $page_id );
		$block         = new WP_Block( $parsed_block, $context );

		$actual   = gutenberg_render_block_time_to_read( $attributes, '', $block );
		$expected = '<div class="wp-block-gutenberg-time-to-read">1 minute</div>';

		$this->assertSame( $expected, $actual );
	}

	/**
	 * @covers ::gutenberg_render_block_time_to_read
	 */
	public function test_less_than_one_minute_post() {
		global $wp_query;

		$wp_query->post  = self::$less_than_one_minute_post;
		$GLOBALS['post'] = self::$less_than_one_minute_post;

		$page_id       = self::$less_than_one_minute_post->ID;
		$attributes    = array();
		$parsed_blocks = parse_blocks( '<!-- wp:gutenberg/time-to-read /-->' );
		$parsed_block  = $parsed_blocks[0];
		$context       = array( 'postId' => $page_id );
		$block         = new WP_Block( $parsed_block, $context );

		$actual   = gutenberg_render_block_time_to_read( $attributes, '', $block );
		$expected = '<div class="wp-block-gutenberg-time-to-read">1 minute</div>';

		$this->assertSame( $expected, $actual );
	}

	/**
	 * @covers ::gutenberg_render_block_time_to_read
	 */
	public function test_one_minute_post() {
		global $wp_query;

		$wp_query->post  = self::$one_minute_post;
		$GLOBALS['post'] = self::$one_minute_post;

		$page_id       = self::$one_minute_post->ID;
		$attributes    = array();
		$parsed_blocks = parse_blocks( '<!-- wp:gutenberg/time-to-read /-->' );
		$parsed_block  = $parsed_blocks[0];
		$context       = array( 'postId' => $page_id );
		$block         = new WP_Block( $parsed_block, $context );

		$actual   = gutenberg_render_block_time_to_read( $attributes, '', $block );
		$expected = '<div class="wp-block-gutenberg-time-to-read">1 minute</div>';

		$this->assertSame( $expected, $actual );
	}

	/**
	 * @covers ::gutenberg_render_block_time_to_read
	 */
	public function test_two_minutes_post() {
		global $wp_query;

		$wp_query->post  = self::$two_minutes_post;
		$GLOBALS['post'] = self::$two_minutes_post;

		$page_id       = self::$two_minutes_post->ID;
		$attributes    = array();
		$parsed_blocks = parse_blocks( '<!-- wp:gutenberg/time-to-read /-->' );
		$parsed_block  = $parsed_blocks[0];
		$context       = array( 'postId' => $page_id );
		$block         = new WP_Block( $parsed_block, $context );

		$actual   = gutenberg_render_block_time_to_read( $attributes, '', $block );
		$expected = '<div class="wp-block-gutenberg-time-to-read">2 minutes</div>';

		$this->assertSame( $expected, $actual );
	}
}
