<?php

use PHP_CodeSniffer\Generators\HTML;

/**
 * Tests for hooked blocks rendering.
 *
 * @package WordPress
 * @subpackage Blocks
 * @since 6.4.0
 *
 * @group blocks
 */
class Tests_Blocks_RenderHookedBlocks extends WP_UnitTestCase {
	/**
	 * @ticket 59313
	 */
	public function test_inject_hooked_block_at_first_child_position() {
		$content = <<<HTML
<!-- wp:tests/group-first-child {"layout":{"type":"constrained"}} -->
	<div class="wp-block-group">
		<!-- wp:paragraph -->
			<p>Foo</p>
		<!-- /wp:paragraph -->
	</div>
<!-- /wp:tests/group-first-child -->
HTML;

		$block_type = register_block_type( GUTENBERG_DIR_TESTFIXTURES . '/hooked-block/' );
		$blocks     = parse_blocks( $content );
		$result     = gutenberg_serialize_blocks( $blocks );

		unregister_block_type( $block_type->name );

		$expected_result = <<<HTML
<!-- wp:tests/group-first-child {"layout":{"type":"constrained"}} -->
	<div class="wp-block-group">
		<!-- wp:tests/hooked-block /--><!-- wp:paragraph -->
			<p>Foo</p>
		<!-- /wp:paragraph -->
	</div>
<!-- /wp:tests/group-first-child -->
HTML;
		$this->assertSame( $expected_result, $result );
	}

	/**
	 * @ticket 59313
	 */
	public function test_inject_hooked_block_at_last_child_position() {
		$content = <<<HTML
<!-- wp:tests/group-last-child {"layout":{"type":"constrained"}} -->
	<div class="wp-block-group">
		<!-- wp:paragraph -->
			<p>Foo</p>
		<!-- /wp:paragraph -->
	</div>
<!-- /wp:tests/group-last-child -->
HTML;

		$block_type = register_block_type( GUTENBERG_DIR_TESTFIXTURES . '/hooked-block/' );
		$blocks     = parse_blocks( $content );
		$result     = gutenberg_serialize_blocks( $blocks );

		unregister_block_type( $block_type->name );

		$expected_result = <<<HTML
<!-- wp:tests/group-last-child {"layout":{"type":"constrained"}} -->
	<div class="wp-block-group">
		<!-- wp:paragraph -->
			<p>Foo</p>
		<!-- /wp:paragraph --><!-- wp:tests/hooked-block /-->
	</div>
<!-- /wp:tests/group-last-child -->
HTML;
		$this->assertSame( $expected_result, $result );
	}
}
