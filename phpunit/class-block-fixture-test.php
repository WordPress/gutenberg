<?php
/**
 * Test block fixtures in PHP.
 *
 * @package Gutenberg
 */

class Block_Fixture_Test extends WP_UnitTestCase {

	/**
	 * Tests that running the serialised block content through KSES doesn't cause the
	 * HTML to change.
	 *
	 * @dataProvider data_block_fixtures
	 */
	function test_kses_doesnt_change_fixtures( $block, $filename ) {
		// Skip this test while Gutenberg is pinned to WordPress 5.8.1.
		// Once WordPress 5.9 is released, this test can be re-enabled.
		// See: https://github.com/WordPress/gutenberg/pull/35611.
		$this->markTestSkipped( 'This test requires WordPress 5.9. See: https://core.trac.wordpress.org/ticket/54261' );

		// KSES doesn't allow data: URLs, so we need to replace any of them in fixtures.
		$block = preg_replace( "/src=['\"]data:[^'\"]+['\"]/", 'src="https://wordpress.org/foo.jpg"', $block );
		$block = preg_replace( "/href=['\"]data:[^'\"]+['\"]/", 'href="https://wordpress.org/foo.jpg"', $block );
		$block = preg_replace( '/url\(data:[^)]+\)/', 'url(https://wordpress.org/foo.jpg)', $block );

		$kses_block = wp_kses_post( $block );

		// KSES adds a space at the end of self-closing tags, add it to the original to match.
		$block = preg_replace( '|([^ ])/>|', '$1 />', $block );

		// KSES removes the last semi-colon from style attributes, remove it from the original to match.
		$block = preg_replace( '/style="([^"]*);"/', 'style="$1"', $block );

		$this->assertSame( $block, $kses_block, "Failed to match $filename" );
	}

	function data_block_fixtures() {
		$data = array();

		foreach ( glob( gutenberg_dir_path() . 'test/integration/fixtures/blocks/*.serialized.html' ) as $path ) {
			$filename = basename( $path );
			$block    = file_get_contents( $path );
			$data[]   = array( $block, $filename );
		}

		return $data;
	}
}
