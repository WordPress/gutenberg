<?php
/**
 * Blocks API Tests
 *
 * @package Gutenberg
 */

/**
 * Test functions in blocks.php
 */
class Blocks_API extends WP_UnitTestCase {

	public static $post_id;

	public $content = '
<!-- wp:paragraph -->
<p>paragraph</p>
<!-- /wp:paragraph -->

<!-- wp:latest-posts {"postsToShow":3,"displayPostDate":true,"order":"asc","orderBy":"title"} /-->

<!-- wp:spacer -->
<div style="height:100px" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->';

	public $filtered_content = '

<p>paragraph</p>




';

	/**
	 * Dummy block rendering function.
	 *
	 * @return string Block output.
	 */
	function render_dummy_block() {
		return get_the_excerpt( self::$post_id );
	}

	/**
	 * Set up.
	 */
	function setUp() {
		parent::setUp();

		self::$post_id = $this->factory()->post->create(
			array(
				'post_excerpt' => '', // Empty excerpt, so it has to be generated.
				'post_content' => '<!-- wp:core/dummy /-->',
			)
		);

		register_block_type(
			'core/dummy',
			array(
				'render_callback' => array( $this, 'render_dummy_block' ),
			)
		);
	}

	/**
	 * Tear down.
	 */
	function tearDown() {
		parent::tearDown();

		$registry = WP_Block_Type_Registry::get_instance();
		$registry->unregister( 'core/dummy' );

		wp_delete_post( self::$post_id, true );
	}

	/**
	 * Tests excerpt_remove_blocks().
	 *
	 * @covers ::excerpt_remove_blocks
	 */
	function test_excerpt_remove_blocks() {
		// Simple dynamic block..
		$content = '<!-- wp:core/block /-->';
		$this->assertEmpty( excerpt_remove_blocks( $content ) );

		// Dynamic block with options, embedded in other content.
		$this->assertEquals( $this->filtered_content, excerpt_remove_blocks( $this->content ) );
	}

	/**
	 * Tests that dynamic blocks don't cause an out-of-memory error.
	 *
	 * When dynamic blocks happen to generate an excerpt, they can cause an
	 * infinite loop if that block is part of the post's content.
	 *
	 * `wp_trim_excerpt()` applies the `the_content` filter, which has
	 * `do_blocks` attached to it, trying to render the block which again will
	 * attempt to return an excerpt of that post.
	 *
	 * This infinite loop can be avoided by stripping dynamic blocks before
	 * `the_content` gets applied, just like shortcodes.
	 *
	 * @covers ::strip_dynamic_blocks_add_filter, ::strip_dynamic_blocks_remove_filter
	 */
	function test_excerpt_infinite_loop() {
		$query = new WP_Query(
			array(
				'post__in' => array( self::$post_id ),
			)
		);
		$query->the_post();

		$this->assertEmpty( do_blocks( '<!-- wp:core/dummy /-->' ) );
	}
}
