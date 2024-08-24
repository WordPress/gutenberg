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
class Tests_Blocks_RenderBlockCoreTagCloud extends WP_UnitTestCase {
	/**
	 * Array of attributes.
	 *
	 * @var array
	 */
	protected static $attributes;

	/**
	 * An array of category term object.
	 *
	 * @var array
	 */
	protected static $categories;

	/**
	 * Post object.
	 *
	 * @var WP_Post
	 */
	protected static $post;

	/**
	 * An array of tag term object.
	 *
	 * @var array
	 */
	protected static $tags;

	/**
	 * Setup method.
	 *
	 * @param WP_UnitTest_Factory $factory Helper that lets us create fake data.
	 */
	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$categories = $factory->term->create_many(
			3,
			array(
				'taxonomy' => 'category',
			)
		);

		self::$tags = $factory->term->create_many(
			3,
			array(
				'taxonomy' => 'post_tag',
			)
		);

		// Demo post to assign terms.
		self::$post = $factory->post->create_and_get();

		self::$attributes = array(
			'taxonomy'         => 'post_tag',
			'showTagCounts'    => false,
			'numberOfTags'     => 45,
			'smallestFontSize' => '8pt',
			'largestFontSize'  => '22pt',
		);

		$block_args = array(
			'blockName'    => 'core/tag-cloud',
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
		foreach ( self::$categories as $category ) {
			wp_delete_term( $category, 'category' );
		}
		foreach ( self::$tags as $tag ) {
			wp_delete_term( $tag, 'post_tag' );
		}
		wp_delete_post( self::$post->ID, true );
	}

	/**
	 * Test if the function returns an empty string when the terms are not available.
	 */
	public function test_should_render_empty_string_when_no_tags_available() {

		$rendered = gutenberg_render_block_core_tag_cloud( self::$attributes );
		$this->assertStringContainsString(
			'wp-block-tag-cloud',
			$rendered,
			'Failed to assert that $rendered contain the `wp-block-tag-cloud` class.'
		);

		$this->assertStringContainsString(
			'There&#8217;s no content to show here yet',
			$rendered,
			'Failed to assert that $rendered contain message for empty tag block.'
		);
	}

	/**
	 * Test if the function returns tag cloud html.
	 */
	public function test_should_render_tag_cloud() {
		wp_set_object_terms( self::$post->ID, self::$tags, 'post_tag' );

		$rendered = gutenberg_render_block_core_tag_cloud( self::$attributes );
		$this->assertNotEmpty(
			$rendered,
			'Failed to assert that $rendered is an non-empty string.'
		);
		$this->assertStringNotContainsString(
			'There&#8217;s no content to show here yet',
			$rendered,
			'Failed to assert that $rendered does not contain the message for empty tag block.'
		);
		$this->assertStringContainsString(
			'wp-block-tag-cloud',
			$rendered,
			'Failed to assert that $rendered contain the `wp-block-tag-cloud` class.'
		);
		$this->assertStringContainsString(
			'<a',
			$rendered,
			'Failed to assert that $rendered contain a html anchor tag.'
		);
		$this->assertStringContainsString(
			'tag-cloud-link',
			$rendered,
			'Failed to assert that $rendered contain the `tag-cloud-link` class.'
		);
		$this->assertStringContainsString(
			get_term_link( self::$tags[0] ),
			$rendered,
			'Failed to assert that $rendered contain the tag link.'
		);
		$this->assertStringContainsString(
			get_term( self::$tags[0] )->name,
			$rendered,
			'Failed to assert that $rendered contain the tag name.'
		);
		$this->assertStringContainsString(
			'font-size:',
			$rendered,
			'Failed to assert that $rendered contain the `font-size` style for tags.'
		);

		// Test if the tag cloud is rendered with the category taxonomy.
		wp_set_object_terms( self::$post->ID, self::$categories, 'category' );
		self::$attributes['taxonomy'] = 'category';
		$rendered                     = gutenberg_render_block_core_tag_cloud( self::$attributes );

		$this->assertStringContainsString(
			'wp-block-tag-cloud',
			$rendered,
			'Failed to assert that $rendered contain the `wp-block-tag-cloud` class.'
		);
		$this->assertStringContainsString(
			get_term_link( self::$categories[0] ),
			$rendered,
			'Failed to assert that $rendered contain the category link.'
		);
		$this->assertStringContainsString(
			get_term( self::$categories[0] )->name,
			$rendered,
			'Failed to assert that $rendered contain the category name.'
		);
	}
}
