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
		self::$post = $factory->post->create_and_get( array( 'post_title' => 'Post title block Unit Test' ) );

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
	 * The title and its link must refer to the post provided by block context.
	 *
	 * @dataProvider data_should_render_context_post_title_when_global_post_differs
	 *
	 * @param bool $has_global_post Whether a different global post is available.
	 */
	public function test_should_render_context_post_title_when_global_post_differs( $has_global_post ) {
		$GLOBALS['post'] = $has_global_post
			? self::factory()->post->create_and_get( array( 'post_title' => 'Different global post' ) )
			: null;

		$block = new WP_Block(
			array(
				'blockName' => 'core/post-title',
				'attrs'     => array( 'isLink' => true ),
			),
			array( 'postId' => self::$post->ID )
		);

		$rendered = $block->render();

		$this->assertSame(
			self::$post->post_title,
			wp_strip_all_tags( $rendered ),
			'The rendered title should belong to the post provided by block context.'
		);
		$this->assertStringContainsString(
			'href="' . esc_url( get_permalink( self::$post ) ) . '"',
			$rendered,
			'The rendered title should link to the post provided by block context.'
		);
	}

	/**
	 * @return array[] Global post availability.
	 */
	public static function data_should_render_context_post_title_when_global_post_differs() {
		return array(
			'different global post' => array( true ),
			'no global post'        => array( false ),
		);
	}

	/**
	 * An unsaved title in the global post must still appear in a preview.
	 */
	public function test_should_render_unsaved_title_when_context_matches_global_post() {
		$GLOBALS['post']             = clone self::$post;
		$GLOBALS['post']->post_title = 'Unsaved preview title';

		$rendered = do_blocks( '<!-- wp:post-title /-->' );

		$this->assertSame(
			'Unsaved preview title',
			wp_strip_all_tags( $rendered ),
			'The rendered title should reflect unsaved changes when context matches the global post.'
		);
	}
}
