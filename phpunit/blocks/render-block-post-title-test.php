<?php
/**
 * Post Title rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the  Post Title block.
 *
 * @group blocks
 */
class Tests_Blocks_Render_Post_Title extends WP_UnitTestCase {
	/**
	 * Post object.
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
	 */
	public static function wpSetUpBeforeClass() {
		self::$post = self::factory()->post->create_and_get( array( 'post_title' => 'Post title block Unit Test' ) );

		self::$attributes = array(
			'textAlign'  => '',
			'level'      => 0,
			'isLink'     => false,
			'linkTarget' => '',
			'rel'        => '',
		);

		$block = array(
			'blockName'    => 'core/post-title',
			'attrs'        => array(
				'textColor' => 'red',
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
		wp_delete_post( self::$post->ID, true );
	}

	/**
	 * Test render_block_core_post_title() method.
	 *
	 * @covers ::render_block_core_post_title
	 */
	public function test_render_block_core_post_title_without_post() {
		$block = new stdClass();

		// call render method with block context.
		$rendered = render_block_core_post_title( self::$attributes, '', $block );
		$this->assertEmpty( $rendered );

		$block->context = array( 'postId' => 0 );
		$rendered       = render_block_core_post_title( self::$attributes, '', $block );
		$this->assertEmpty( $rendered );
	}

	/**
	 * Test render_block_core_post_title() method.
	 *
	 * @covers ::render_block_core_post_title
	 */
	public function test_render_block_core_post_title() {

		$block           = new stdClass();
		$GLOBALS['post'] = self::$post;
		$block->context  = array( 'postId' => self::$post->ID );

		$rendered = render_block_core_post_title( self::$attributes, '', $block );
		$this->assertNotNull( $rendered );
		$this->assertStringContainsString( 'Post title block Unit Test', $rendered );
		$this->assertStringContainsString( '</p', $rendered );
		$this->assertStringContainsString( '</p>', $rendered );
		$this->assertStringNotContainsString( get_permalink( self::$post->ID ), $rendered );
		$this->assertStringNotContainsString( '<a href=', $rendered );
		$this->assertStringNotContainsString( 'has-text-align', $rendered );

		self::$attributes['level'] = '1';
		$rendered                  = render_block_core_post_title( self::$attributes, '', $block );
		$this->assertStringContainsString( '<h1', $rendered );
		$this->assertStringContainsString( '</h1>', $rendered );

		self::$attributes['textAlign'] = 'left';
		$rendered                      = render_block_core_post_title( self::$attributes, '', $block );
		$this->assertStringContainsString( 'has-text-align-left', $rendered );

		self::$attributes['isLink']     = true;
		self::$attributes['linkTarget'] = '_blank';
		self::$attributes['rel']        = 'no-relative';
		$rendered                       = render_block_core_post_title( self::$attributes, '', $block );
		$this->assertStringContainsString( get_permalink( self::$post->ID ), $rendered );
		$this->assertStringContainsString( '<a href=', $rendered );
		$this->assertStringContainsString( '_blank', $rendered );
		$this->assertStringContainsString( 'no-relative', $rendered );

	}
}
