<?php
/**
 * Tests_Block_Template_Utils class
 *
 * @package gutenberg
 */

/**
 * Tests for the Block Templates abstraction layer.
 *
 * @group block-templates
 */
class Tests_Block_Template_Utils_6_1 extends WP_UnitTestCase {
	public function test_get_template_slugs() {
		$templates = gutenberg_get_template_slugs( 'single-post-hello-world' );
		$this->assertSame(
			array(
				'single-post-hello-world',
				// Should *not* fall back to `single-post-hello`!
				'single-post',
				'single',
			),
			$templates
		);
	}
}
