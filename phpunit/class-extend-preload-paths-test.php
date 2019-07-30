<?php
/**
 * Test `gutenberg_extend_block_editor_preload_paths`.
 *
 * @package Gutenberg
 */

class Extend_Preload_Paths_Test extends WP_UnitTestCase {
	/**
	 * Post object.
	 *
	 * @var WP_Post
	 */
	protected static $post;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$post = $factory->post->create_and_get();
	}

	/**
	 * Tests paths added if missing.
	 */
	function test_localizes_script() {
		$preload_paths = gutenberg_extend_block_editor_preload_paths( array(), self::$post );

		$expected_blocks_path    = array( '/wp/v2/blocks', 'OPTIONS' );
		$expected_autosaves_path = sprintf( '/wp/v2/%s/%d/autosaves?context=edit', 'posts', self::$post->ID );

		$this->assertEquals( array( $expected_autosaves_path, $expected_blocks_path ), $preload_paths );
	}

	/**
	 * Tests paths not added if present.
	 */
	function test_replaces_registered_properties() {
		$existing_blocks_path    = array( '/wp/v2/blocks', 'OPTIONS' );
		$existing_autosaves_path = sprintf( '/wp/v2/%s/%d/autosaves?context=edit', 'posts', self::$post->ID );
		$existing_preload_paths  = array( $existing_blocks_path, $existing_autosaves_path );

		$preload_paths = gutenberg_extend_block_editor_preload_paths( $existing_preload_paths, self::$post );

		$this->assertEquals( $existing_preload_paths, $preload_paths );
	}
}
