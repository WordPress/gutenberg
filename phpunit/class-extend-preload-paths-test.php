<?php
/**
 * Test `gutenberg_extend_block_editor_preload_paths`.
 *
 * @package Gutenberg
 */

class Extend_Preload_Paths_Test extends WP_UnitTestCase {
	/**
	 * Tests '/wp/v2/blocks' added if missing.
	 */
	function test_localizes_script() {
		$preload_paths = gutenberg_extend_block_editor_preload_paths( array() );

		$this->assertEquals( array( array( '/wp/v2/blocks', 'OPTIONS' ) ), $preload_paths );
	}

	/**
	 * Tests '/wp/v2/blocks' not added if present.
	 */
	function test_replaces_registered_properties() {
		$preload_paths = gutenberg_extend_block_editor_preload_paths( array( array( '/wp/v2/blocks', 'OPTIONS' ) ) );

		$this->assertEquals( array( array( '/wp/v2/blocks', 'OPTIONS' ) ), $preload_paths );
	}
}
