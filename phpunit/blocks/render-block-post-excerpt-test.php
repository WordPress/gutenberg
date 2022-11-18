<?php
/**
 * Post Excerpt rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the  Post Excerpt block.
 *
 * @group blocks
 */
class Tests_Blocks_Render_Post_Excerpt extends WP_UnitTestCase {
	/**
	 * Post object with empty data
	 *
	 * @var array
	 */
	protected static $post_empty;

	/**
	 * Post object with data.
	 *
	 * @var array
	 */
	protected static $post;

	/**
	 * Array of Attributes.
	 *
	 * @var int
	 */
	protected static $attributes;

	/**
	 * Setup method.
	 *
	 * @param WP_UnitTest_Factory $factory Helper that lets us create fake data.
	 */
	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$post_empty = $factory->post->create_and_get(
			array(
				'post_title'   => 'Post Expert block Unit Test',
				'post_excerpt' => '',
				'post_content' => '',
			)
		);

		self::$post = $factory->post->create_and_get(
			array(
				'post_title'   => 'Post Expert block Unit Test',
				'post_excerpt' => 'Post Expert content',
			)
		);

		self::$attributes = array(
			'moreText' => '',
		);

		$block = array(
			'blockName'    => 'core/post-excerpt',
			'attrs'        => array(
				'moreText' => '',
			),
			'innerBlock'   => array(),
			'innerContent' => array(),
			'innerHTML'    => array(),
		);

		WP_Block_Supports::init();
		WP_Block_Supports::$block_to_render = $block;

	}

	/**
	 * Tear down method.
	 */
	public static function wpTearDownAfterClass() {
		wp_delete_post( self::$post_empty->ID, true );
		wp_delete_post( self::$post->ID, true );
	}

	/**
	 * Test gutenberg_render_block_core_Post_Excerpt() method
	 * with empty data.
	 *
	 * @covers ::gutenberg_render_block_core_Post_Excerpt
	 */
	public function test_gutenberg_render_block_core_Post_Excerpt_empty() {
		$block = new stdClass();

		// call render method with block context.
		$rendered = gutenberg_render_block_core_Post_Excerpt( self::$attributes, '', $block );
		$this->assertEmpty( $rendered );

		$block->context = array( 'postId' => 0 );
		$rendered       = gutenberg_render_block_core_Post_Excerpt( self::$attributes, '', $block );
		$this->assertEmpty( $rendered );

		$GLOBALS['post'] = self::$post_empty;
		$block->context  = array( 'postId' => self::$post_empty->ID );

		$rendered = gutenberg_render_block_core_post_excerpt( self::$attributes, '', $block );
		$this->assertEmpty( $rendered );

	}

	/**
	 * Test gutenberg_render_block_core_Post_Excerpt() method.
	 *
	 * @covers ::gutenberg_render_block_core_Post_Excerpt
	 */
	public function test_gutenberg_render_block_core_Post_Excerpt() {

		$block           = new stdClass();
		$GLOBALS['post'] = self::$post;
		$block->context  = array( 'postId' => self::$post->ID );

		$rendered = gutenberg_render_block_core_post_excerpt( self::$attributes, '', $block );
		$this->assertNotEmpty( $rendered );
		$this->assertStringContainsString( 'Post Expert content', $rendered );
		$this->assertStringContainsString( '</p', $rendered );
		$this->assertStringContainsString( '</p>', $rendered );
		$this->assertStringContainsString( 'wp-block-post-excerpt__excerpt', $rendered );
		$this->assertStringNotContainsString( 'has-text-align', $rendered );

		self::$attributes['textAlign'] = 'left';

		$rendered = gutenberg_render_block_core_post_excerpt( self::$attributes, '', $block );
		$this->assertStringContainsString( 'has-text-align-left', $rendered );

		self::$attributes = array(
			'moreText' => 'Read More',
		);

		$rendered = gutenberg_render_block_core_post_excerpt( self::$attributes, '', $block );
		$this->assertStringContainsString( 'wp-block-post-excerpt__more-link', $rendered );

		self::$attributes = array(
			'moreText'          => 'Read More',
			'showMoreOnNewLine' => true,
		);
		$this->assertStringContainsString( 'wp-block-post-excerpt__more-link', $rendered );
		$this->assertStringContainsString( get_permalink( self::$post->ID ), $rendered );

	}
}
