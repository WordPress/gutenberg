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
<!-- wp:paragraph -->
<p>paragraph</p>
<!-- /wp:paragraph -->



<!-- wp:spacer -->
<div style="height:100px" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->';

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
	 * Tests strip_dynamic_blocks().
	 *
	 * @covers ::strip_dynamic_blocks
	 */
	function test_strip_dynamic_blocks() {
		$this->setExpectedDeprecated( 'strip_dynamic_blocks' );
		$this->setExpectedDeprecated( 'get_dynamic_blocks_regex' );

		// Simple dynamic block..
		$content = '<!-- wp:core/block /-->';
		$this->assertEmpty( strip_dynamic_blocks( $content ) );

		// Dynamic block with options, embedded in other content.
		$this->assertEquals( $this->filtered_content, strip_dynamic_blocks( $this->content ) );
	}
}
