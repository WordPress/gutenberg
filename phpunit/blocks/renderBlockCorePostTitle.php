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
	 * @var WP_Post
	 */
	protected static $post;

	/**
	 * A second post, used to provide a `postId` context that differs from the global post.
	 *
	 * @var WP_Post
	 */
	protected static $other_post;

	/**
	 * Array of attributes.
	 *
	 * @var array
	 */
	protected static $attributes;

	/**
	 * Block object.
	 *
	 * @var WP_Block
	 */
	protected static $block;

	/**
	 * Setup method.
	 *
	 * @param WP_UnitTest_Factory $factory Helper that lets us create fake data.
	 */
	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$post       = $factory->post->create_and_get( array( 'post_title' => 'Post title block Unit Test' ) );
		self::$other_post = $factory->post->create_and_get( array( 'post_title' => 'Other post provided through context' ) );

		self::$attributes = array(
			'textAlign'  => '',
			'level'      => 2,
			'isLink'     => false,
			'linkTarget' => '',
			'rel'        => '',
		);

		self::$block = new stdClass();

		$block_args = array(
			'blockName'    => 'core/post-title',
			'attrs'        => array(
				'textColor' => 'red',
			),
			'innerBlock'   => array(),
			'innerContent' => array(),
			'innerHTML'    => array(),
		);

		WP_Block_Supports::init();
		WP_Block_Supports::$block_to_render = $block_args;
	}

	/**
	 * Tear down method.
	 */
	public static function wpTearDownAfterClass() {
		wp_delete_post( self::$post->ID, true );
		wp_delete_post( self::$other_post->ID, true );
	}

	/**
	 * Set up method.
	 *
	 * The block object is shared between tests; reset its context so no test depends
	 * on the context another test left behind.
	 */
	public function set_up() {
		parent::set_up();

		unset( self::$block->context );
	}

	/**
	 * Test if the function returns an empty string when the post title is empty.
	 *
	 * @param mixed  $context         Block context.
	 * @param string $failure_message Failure message.
	 *
	 * @dataProvider data_should_render_empty_string_when_title_is_empty
	 */
	public function test_should_render_empty_string_when_title_is_empty( $context, $failure_message ) {
		if ( $context ) {
			self::$block->context = $context;
		}
		$rendered = gutenberg_render_block_core_post_title( self::$attributes, '', self::$block );
		$this->assertSame( '', $rendered, $failure_message );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_should_render_empty_string_when_title_is_empty() {
		return array(
			'empty block context' => array( null, 'Failed asserting that rendering result is an empty string when block context is not set.' ),
			'incorrect post ID'   => array( array( 'postId' => 0 ), 'Failed asserting that rendering result is an empty string when post ID is incorrect.' ),
		);
	}

	/**
	 * Test if the function returns correct titles.
	 */
	public function test_should_render_correct_title() {

		$GLOBALS['post']      = self::$post;
		self::$block->context = array( 'postId' => self::$post->ID );

		$rendered = gutenberg_render_block_core_post_title( self::$attributes, '', self::$block );
		$this->assertNotEmpty(
			$rendered,
			'Failed to assert that $rendered is an non-empty string.'
		);
		$this->assertStringContainsString(
			'Post title block Unit Test',
			$rendered,
			'Failed to assert that $rendered contain the post title string.'
		);
		$this->assertStringContainsString(
			'</h2>',
			$rendered,
			'Failed to assert that $rendered contain a closing html heading tag.'
		);
		$this->assertStringNotContainsString(
			get_permalink( self::$post->ID ),
			$rendered,
			'Failed to assert that $rendered does not contain the post link.'
		);
		$this->assertStringNotContainsString(
			'<a href=',
			$rendered,
			'Failed to assert that $rendered does not contain a html anchor tag.'
		);
		$this->assertStringNotContainsString(
			'has-text-align-left',
			$rendered,
			'Failed to assert that $rendered does not contain the has-text-align-left class.'
		);

		self::$attributes['level'] = '1';
		$rendered                  = gutenberg_render_block_core_post_title( self::$attributes, '', self::$block );
		$this->assertStringContainsString(
			'<h1',
			$rendered,
			'Failed to assert that $rendered contain the HTML heading tag.'
		);
		$this->assertStringContainsString(
			'</h1>',
			$rendered,
			'Failed to assert that $rendered contain a closing HTML heading tag.'
		);

		self::$attributes['textAlign'] = 'left';
		$rendered                      = gutenberg_render_block_core_post_title( self::$attributes, '', self::$block );
		$this->assertStringContainsString(
			'has-text-align-left',
			$rendered,
			'Failed to assert that $rendered contain the has-text-align-left class.'
		);

		self::$attributes['isLink']     = true;
		self::$attributes['linkTarget'] = '_blank';
		self::$attributes['rel']        = 'no-relative';
		$rendered                       = gutenberg_render_block_core_post_title( self::$attributes, '', self::$block );
		$this->assertStringContainsString(
			get_permalink( self::$post->ID ),
			$rendered,
			'Failed to assert that $rendered contain the post link.'
		);
		$this->assertStringContainsString(
			'<a href=',
			$rendered,
			'Failed to assert that $rendered contain html anchor tag.'
		);
		$this->assertStringContainsString(
			'_blank',
			$rendered,
			'Failed to assert that $rendered contain the link target attribute.'
		);
		$this->assertStringContainsString(
			'no-relative',
			$rendered,
			'Failed to assert that $rendered contain the link relation attribute.'
		);
	}

	/**
	 * Test that, inside the loop, the title is read from the global post object so that
	 * unsaved changes applied to it (as `_set_preview()` does when previewing) are rendered.
	 */
	public function test_should_render_unsaved_title_of_global_post_when_context_matches() {
		$preview_post             = clone self::$post;
		$preview_post->post_title = 'Unsaved preview title';

		$GLOBALS['post']      = $preview_post;
		self::$block->context = array( 'postId' => self::$post->ID );

		$attributes = array(
			'textAlign'  => '',
			'level'      => 2,
			'isLink'     => false,
			'linkTarget' => '',
			'rel'        => '',
		);

		$rendered = gutenberg_render_block_core_post_title( $attributes, '', self::$block );
		$this->assertStringContainsString(
			'Unsaved preview title',
			$rendered,
			'Failed to assert that $rendered contains the title of the global post object.'
		);
		$this->assertStringNotContainsString(
			'Post title block Unit Test',
			$rendered,
			'Failed to assert that $rendered does not contain the stored title of the post.'
		);
	}

	/**
	 * Test that, outside the loop, a `postId` context that differs from the global post
	 * renders the title and permalink of the post provided through context.
	 *
	 * @see https://github.com/WordPress/gutenberg/issues/68369
	 */
	public function test_should_render_title_of_post_provided_through_context_outside_loop() {
		$GLOBALS['post']      = self::$post;
		self::$block->context = array( 'postId' => self::$other_post->ID );

		$attributes = array(
			'textAlign'  => '',
			'level'      => 2,
			'isLink'     => true,
			'linkTarget' => '_self',
			'rel'        => '',
		);

		$rendered = gutenberg_render_block_core_post_title( $attributes, '', self::$block );
		$this->assertStringContainsString(
			'Other post provided through context',
			$rendered,
			'Failed to assert that $rendered contains the title of the post provided through context.'
		);
		$this->assertStringNotContainsString(
			'Post title block Unit Test',
			$rendered,
			'Failed to assert that $rendered does not contain the title of the global post.'
		);
		$this->assertStringContainsString(
			get_permalink( self::$other_post->ID ),
			$rendered,
			'Failed to assert that $rendered contains the permalink of the post provided through context.'
		);
	}
}
