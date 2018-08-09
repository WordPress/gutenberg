<?php
/**
 * gutenberg_render_block tests
 *
 * @package Gutenberg
 */

class Render_Test extends WP_UnitTestCase {
	protected static $fixtures_dir;

	/**
	 * @test
	 * @dataProvider inner_block_files
	 */
	public function it_renders_inner_blocks( $blocks_file, $rendered_file ) {
		self::$fixtures_dir = dirname( dirname( __FILE__ ) ) . '/core-blocks/test/fixtures';

		require_once dirname( dirname( __FILE__ ) ) . '/lib/blocks.php';

		$blocks = json_decode( self::strip_r( file_get_contents( self::$fixtures_dir . $blocks_file ) ), true );
		$expected = self::strip_r( file_get_contents( self::$fixtures_dir . $rendered_file ) );

		$content = '';
		foreach ( $blocks as $block ) {
			$content .= gutenberg_render_block( $block );
		}

		$this->assertEquals( $expected, $content );

	}

	function strip_r( $input ) {
		return str_replace( "\r", '', $input );
	}

	public function inner_block_files() {
		return array(
			array( '/core__column.parsed.json', '/core__column.rendered.html' ),
			array( '/core__columns.parsed.json', '/core__columns.rendered.html' ),
		);
	}

}
