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
	 * Tests strip_dynamic_blocks().
	 *
	 * @covers ::strip_dynamic_blocks
	 */
	function test_strip_dynamic_blocks() {
		// Simple dynamic block..
		$content = '<!-- wp:core/block /-->';
		$this->assertEmpty( strip_dynamic_blocks( $content ) );

		// Dynamic block with options, embedded in other content.
		$this->assertEquals( $this->filtered_content, strip_dynamic_blocks( $this->content ) );
	}
}
