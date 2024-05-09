<?php
/**
 * Tests for the gutenberg_render_block_core_post_title() function.
 *
 * @package WordPress
 * @subpackage Blocks
 *
 * @covers ::gutenberg_render_block_core_post_title
 * @group blocks
 */
class Tests_Blocks_RenderBlockCorePostTitle extends WP_UnitTestCase {
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
	 *
	 * @param WP_UnitTest_Factory $factory Helper that lets us create fake data.
	 */
	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$post = $factory->post->create_and_get( array( 'post_title' => 'Post title block Unit Test' ) );

		self::$attributes = array(
			'textAlign'  => '',
			'level'      => 2,
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
	 * Test gutenberg_render_block_core_post_title() method.
	 */
	public function test_gutenberg_render_block_core_post_title_without_post() {
		$block = new stdClass();

		// call render method with block context.
		$rendered = gutenberg_render_block_core_post_title( self::$attributes, '', $block );
		$this->assertEmpty( $rendered );

		$block->context = array( 'postId' => 0 );
		$rendered       = gutenberg_render_block_core_post_title( self::$attributes, '', $block );
		$this->assertEmpty( $rendered );
	}

	/**
	 * Test gutenberg_render_block_core_post_title() method.
	 */
	public function test_gutenberg_render_block_core_post_title() {

		$block           = new stdClass();
		$GLOBALS['post'] = self::$post;
		$block->context  = array( 'postId' => self::$post->ID );

		$rendered = gutenberg_render_block_core_post_title( self::$attributes, '', $block );
		$this->assertNotNull(
			$rendered,
			'Passed $rendered is null.'
		);
		$this->assertStringContainsString(
			'Post title block Unit Test',
			$rendered,
			'Passed $rendered does not contain the post title string.'
		);
		$this->assertStringContainsString(
			'</h2>',
			$rendered,
			'Passed $rendered does not contain a closing html heading tag.'
		);
		$this->assertStringNotContainsString(
			get_permalink( self::$post->ID ),
			$rendered,
			'Passed $rendered contain the post link.'
		);
		$this->assertStringNotContainsString(
			'<a href=',
			$rendered,
			'Passed $rendered contain a html anchor tag.'
		);
		$this->assertStringNotContainsString(
			'has-text-align-left',
			$rendered,
			'Passed $rendered contain the has-text-align-left class.'
		);

		self::$attributes['level'] = '1';
		$rendered                  = gutenberg_render_block_core_post_title( self::$attributes, '', $block );
		$this->assertStringContainsString(
			'<h1',
			$rendered,
			'Passed $rendered does not contain HTML heading tag.'
		);
		$this->assertStringContainsString(
			'</h1>',
			$rendered,
			'Passed $rendered does not contain a closing HTML heading tag.'
		);

		self::$attributes['textAlign'] = 'left';
		$rendered                      = gutenberg_render_block_core_post_title( self::$attributes, '', $block );
		$this->assertStringContainsString(
			'has-text-align-left',
			$rendered,
			'Passed $rendered does not contain the has-text-align-left class.'
		);

		self::$attributes['isLink']     = true;
		self::$attributes['linkTarget'] = '_blank';
		self::$attributes['rel']        = 'no-relative';
		$rendered                       = gutenberg_render_block_core_post_title( self::$attributes, '', $block );
		$this->assertStringContainsString(
			get_permalink( self::$post->ID ),
			$rendered,
			'Passed $rendered does not contain post link.'
		);
		$this->assertStringContainsString(
			'<a href=',
			$rendered,
			'Passed $rendered does not contain html anchor tag.'
		);
		$this->assertStringContainsString(
			'_blank',
			$rendered,
			'Passed $rendered does not contain the link target attribute.'
		);
		$this->assertStringContainsString(
			'no-relative',
			$rendered,
			'Passed $rendered does not contain the link relation attribute.'
		);
	}
}
