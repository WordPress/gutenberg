<?php
/**
 * Tests for the gutenberg_render_block_core_post_excerpt() function.
 *
 * @package WordPress
 * @subpackage Blocks
 *
 * @covers ::gutenberg_render_block_core_post_excerpt
 * @group blocks
 */
class Tests_Blocks_RenderBlockCorePostExcerpt extends WP_UnitTestCase {

	/**
	 * Post object with data.
	 *
	 * @var array
	 */
	protected static $post;

	/**
	 * Post object with data.
	 *
	 * @var array
	 */
	protected static $second_post;

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

		self::$post = $factory->post->create_and_get(
			array(
				'post_title'   => 'Post Expert block Unit Test',
				'post_excerpt' => 'Post Expert content',
			)
		);

		$post_id = wp_insert_post(
			array(
				'post_content' => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.
				Sed tincidunt vitae ex eu cursus. Morbi vel facilisis sapien, quis tincidunt augue. Ut ac dui at magna efficitur tristique et vel sapien.
				Duis fringilla dui a lorem cursus, id viverra ipsum aliquet. Vestibulum id vulputate mi, rhoncus vestibulum lectus.
				Suspendisse varius sagittis posuere. Aenean cursus eros nisi, at interdum ligula lobortis vel.
				Donec sit amet augue eu libero tristique feugiat nec tincidunt nisi. Phasellus eleifend ipsum sit amet ante finibus, vestibulum malesuada neque dapibus.
				Integer vehicula libero pellentesque velit tempor, eu semper sem sagittis. Suspendisse tempus, nunc non molestie faucibus, dui tellus rutrum mi, eu sollicitudin turpis ipsum nec erat.
				Interdum et malesuada fames ac ante ipsum primis in faucibus. Donec maximus purus ac diam tristique efficitur.',
			)
		);

		self::$second_post = get_post( $post_id );

		self::$attributes = array(
			'moreText'      => '',
			'excerptLength' => 55,
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
		wp_delete_post( self::$post->ID, true );
		wp_delete_post( self::$second_post->ID, true );
	}

	/**
	 * Test gutenberg_render_block_core_post_excerpt() method
	 * with empty data.
	 */
	public function test_should_render_empty_string_when_excerpt_is_empty() {
		$block = new stdClass();

		// call render method with block context.
		$rendered = gutenberg_render_block_core_post_excerpt( self::$attributes, '', $block );
		$this->assertSame( '', $rendered, 'Failed to assert that $rendered is an empty string.' );
	}

	/**
	 * Builds a minimal block instance pointing at the test post.
	 *
	 * @return stdClass Block instance with the post context set.
	 */
	private function get_block_for_test_post() {
		$block          = new stdClass();
		$block->context = array( 'postId' => self::$post->ID );
		return $block;
	}

	/**
	 * A single space must separate the excerpt and the more link when both are
	 * present and rendered on the same line.
	 *
	 * @covers ::gutenberg_render_block_core_post_excerpt
	 */
	public function test_should_add_single_space_between_excerpt_and_more_link() {
		$attributes = array(
			'moreText'          => 'Read More',
			'showMoreOnNewLine' => false,
			'excerptLength'     => 55,
		);

		$rendered = gutenberg_render_block_core_post_excerpt( $attributes, '', $this->get_block_for_test_post() );

		$this->assertStringContainsString(
			'Post Expert content <a class="wp-block-post-excerpt__more-link"',
			$rendered,
			'Failed to assert that a single space separates the excerpt and the more link.'
		);
	}

	/**
	 * No trailing space must be left after the excerpt when the more text is
	 * empty and rendered on the same line.
	 *
	 * @covers ::gutenberg_render_block_core_post_excerpt
	 */
	public function test_should_not_add_trailing_space_when_more_text_is_empty() {
		$attributes = array(
			'moreText'          => '',
			'showMoreOnNewLine' => false,
			'excerptLength'     => 55,
		);

		$rendered = gutenberg_render_block_core_post_excerpt( $attributes, '', $this->get_block_for_test_post() );

		$this->assertStringContainsString(
			'Post Expert content</p>',
			$rendered,
			'Failed to assert that no trailing space is added when the more text is empty.'
		);
	}

	/**
	 * With the default (unset) showMoreOnNewLine attribute and an empty more
	 * text, the excerpt paragraph must simply be closed without a trailing
	 * space. This is the same branch fixed for the Post Template block.
	 *
	 * @covers ::gutenberg_render_block_core_post_excerpt
	 */
	public function test_should_close_paragraph_when_more_text_empty_and_show_more_on_new_line_default() {
		$attributes = array(
			'moreText'      => '',
			'excerptLength' => 55,
		);

		$rendered = gutenberg_render_block_core_post_excerpt( $attributes, '', $this->get_block_for_test_post() );

		$this->assertStringContainsString(
			'Post Expert content</p>',
			$rendered,
			'Failed to assert that the paragraph is closed without a trailing space when showMoreOnNewLine is unset.'
		);
	}

	/**
	 * No leading space must precede the more link when the excerpt is empty.
	 *
	 * @covers ::gutenberg_render_block_core_post_excerpt
	 */
	public function test_should_not_add_leading_space_before_more_link_when_excerpt_is_empty() {
		// The test post has an excerpt, so force an empty one for this scenario.
		$force_empty_excerpt = static function () {
			return '';
		};
		add_filter( 'get_the_excerpt', $force_empty_excerpt );

		try {
			$attributes = array(
				'moreText'          => 'Read More',
				'showMoreOnNewLine' => false,
				'excerptLength'     => 55,
			);

			$rendered = gutenberg_render_block_core_post_excerpt( $attributes, '', $this->get_block_for_test_post() );

			$this->assertStringContainsString(
				'wp-block-post-excerpt__excerpt"><a class="wp-block-post-excerpt__more-link"',
				$rendered,
				'Failed to assert that no leading space precedes the more link when the excerpt is empty.'
			);
		} finally {
			remove_filter( 'get_the_excerpt', $force_empty_excerpt );
		}
	}

	/**
	 * An empty excerpt with no more text must render an empty paragraph.
	 *
	 * @covers ::gutenberg_render_block_core_post_excerpt
	 */
	public function test_should_render_empty_paragraph_when_excerpt_and_more_text_are_empty() {
		// The test post has an excerpt, so force an empty one for this scenario.
		$force_empty_excerpt = static function () {
			return '';
		};
		add_filter( 'get_the_excerpt', $force_empty_excerpt );

		try {
			$attributes = array(
				'moreText'          => '',
				'showMoreOnNewLine' => false,
				'excerptLength'     => 55,
			);

			$rendered = gutenberg_render_block_core_post_excerpt( $attributes, '', $this->get_block_for_test_post() );

			$this->assertStringContainsString(
				'<p class="wp-block-post-excerpt__excerpt"></p>',
				$rendered,
				'Failed to assert that an empty excerpt with no more text renders an empty paragraph.'
			);
		} finally {
			remove_filter( 'get_the_excerpt', $force_empty_excerpt );
		}
	}

	/**
	 * Test gutenberg_render_block_core_post_excerpt() method.
	 */
	public function test_should_render_correct_excerpt() {

		$block           = new stdClass();
		$GLOBALS['post'] = self::$post;
		$block->context  = array( 'postId' => self::$post->ID );

		$rendered = gutenberg_render_block_core_post_excerpt( self::$attributes, '', $block );
		$this->assertNotEmpty( $rendered, 'Failed to assert that $rendered is not empty.' );
		$this->assertStringContainsString(
			'Post Expert content',
			$rendered,
			'Failed to assert that $rendered contain the expected string.'
		);
		$this->assertStringContainsString(
			'</p',
			$rendered,
			'Failed to assert that $rendered contains a closing html paragraph tag.'
		);
		$this->assertStringContainsString(
			'wp-block-post-excerpt__excerpt',
			$rendered,
			'Failed to assert that $rendered contain the "wp-block-post-excerpt__excerpt" string.'
		);
		$this->assertStringNotContainsString(
			'has-text-align',
			$rendered,
			'Failed to assert that $rendered  does not contain the has-text-align class.'
		);

		self::$attributes['textAlign'] = 'left';

		$rendered = gutenberg_render_block_core_post_excerpt( self::$attributes, '', $block );
		$this->assertStringContainsString(
			'has-text-align-left',
			$rendered,
			'Failed to assert that $rendered contains the "has-text-align-left" class.'
		);

		self::$attributes = array(
			'moreText'      => 'Read More',
			'excerptLength' => 55,
		);

		$rendered = gutenberg_render_block_core_post_excerpt( self::$attributes, '', $block );
		$this->assertStringContainsString(
			'wp-block-post-excerpt__more-link',
			$rendered,
			'Failed to assert that $rendered contains the expected string.'
		);

		self::$attributes = array(
			'moreText'          => 'Read More',
			'showMoreOnNewLine' => true,
		);
		$this->assertStringContainsString(
			'wp-block-post-excerpt__more-link',
			$rendered,
			'Failed to assert that $rendered contains the expected string.'
		);
		$this->assertStringContainsString(
			get_permalink( self::$post->ID ),
			$rendered,
			'Failed to assert that $rendered contain expected post the expected post URL.'
		);
	}

	/**
	 * Test if the theme excerpt is overridden by the post-excerpt.
	 *
	 * @return void
	 */
	public function test_should_remove_theme_read_more_link_on_long_posts() {
		$add_theme_read_more = static function () {
			return 'foobar';
		};

		add_filter( 'excerpt_more', $add_theme_read_more );

		$block = (object) array(
			'blockName'    => 'core/post-excerpt',
			'attrs'        => array(
				'moreText'      => 'Read More',
				'excerptLength' => 55,
			),
			'innerBlock'   => array(),
			'innerContent' => array(),
			'innerHTML'    => array(),
			'context'      => array( 'postId' => self::$second_post->ID ),
		);

		$GLOBALS['post'] = get_post( self::$second_post->ID );

		$rendered = gutenberg_render_block_core_post_excerpt( $block->attrs, '', $block );
		remove_filter( 'excerpt_more', $add_theme_read_more );

		$this->assertStringNotContainsString(
			'foobar',
			$rendered,
			'Failed to assert that $rendered contains the expected string.'
		);
	}
}
