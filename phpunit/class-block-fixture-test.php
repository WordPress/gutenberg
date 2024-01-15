<?php
/**
 * Test block fixtures in PHP.
 *
 * @package Gutenberg
 */

class Block_Fixture_Test extends WP_UnitTestCase {

	public function filter_allowed_html( $tags ) {
		$tags['form']['class']   = true;
		$tags['form']['enctype'] = true;
		return $tags;
	}

	/**
	 * Tests that running the serialised block content through KSES doesn't cause the
	 * HTML to change.
	 *
	 * @dataProvider data_block_fixtures
	 */
	public function test_kses_doesnt_change_fixtures( $block, $filename ) {

		// KSES doesn't allow data: URLs, so we need to replace any of them in fixtures.
		$block = preg_replace( "/src=['\"]data:[^'\"]+['\"]/", 'src="https://wordpress.org/foo.jpg"', $block );
		$block = preg_replace( "/href=['\"]data:[^'\"]+['\"]/", 'href="https://wordpress.org/foo.jpg"', $block );
		$block = preg_replace( '/url\(data:[^)]+\)/', 'url(https://wordpress.org/foo.jpg)', $block );

		add_filter( 'wp_kses_allowed_html', array( $this, 'filter_allowed_html' ) );
		$kses_block = wp_kses_post( $block );
		remove_filter( 'wp_kses_allowed_html', array( $this, 'filter_allowed_html' ) );

		// KSES adds a space at the end of self-closing tags, add it to the original to match.
		$block = preg_replace( '|([^ ])/>|', '$1 />', $block );

		// KSES removes the last semi-colon from style attributes, remove it from the original to match.
		$block = preg_replace( '/style="([^"]*);"/', 'style="$1"', $block );

		$this->assertSame( $block, $kses_block, "Failed to match $filename" );
	}

	public function data_block_fixtures() {
		$data = array();

		foreach ( glob( gutenberg_dir_path() . 'test/integration/fixtures/blocks/*.serialized.html' ) as $path ) {
			$filename = basename( $path );
			$block    = file_get_contents( $path );
			$data[]   = array( $block, $filename );
		}

		return $data;
	}
}
