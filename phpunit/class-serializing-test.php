<?php
/**
 * Block serializer (PHP code target) tests
 *
 * @package Gutenberg
 */

class Serializing_Test extends WP_UnitTestCase {
	protected static $fixtures_dir;

	function serializing_test_filenames() {
		self::$fixtures_dir = dirname( dirname( __FILE__ ) ) . '/blocks/test/fixtures';

		require_once dirname( dirname( __FILE__ ) ) . '/lib/parser.php';

		$fixture_filenames = glob( self::$fixtures_dir . '/*.{json,html}', GLOB_BRACE );
		$fixture_filenames = array_values( array_unique( array_map(
			array( $this, 'clean_fixture_filename' ),
			$fixture_filenames
		) ) );

		return array_map(
			array( $this, 'pass_serializer_fixture_filenames' ),
			$fixture_filenames
		);
	}

	function clean_fixture_filename( $filename ) {
		$filename = basename( $filename );
		$filename = preg_replace( '/\..+$/', '', $filename );
		return $filename;
	}

	function pass_serializer_fixture_filenames( $filename ) {
		return array(
			"$filename.html",
			"$filename.parsed.json",
		);
	}

	/**
	 * @dataProvider serializing_test_filenames
	 */
	function test_serializer_output( $html_filename, $parsed_json_filename ) {
		$html_path        = self::$fixtures_dir . '/' . $html_filename;
		$parsed_json_path = self::$fixtures_dir . '/' . $parsed_json_filename;

		foreach ( array( $html_path, $parsed_json_path ) as $filename ) {
			if ( ! file_exists( $filename ) ) {
				throw new Exception( "Missing fixture file: '$filename'" );
			}
		}

		$parsed        = json_decode( file_get_contents( $parsed_json_path ), true );
		$expected_html = file_get_contents( $html_path );

		$result = gutenberg_serialize_blocks( $parsed );

		$this->assertEquals(
			$expected_html,
			$result,
			"File '$html_filename' does not match expected value"
		);
	}

	function test_serializer_escape() {
		$original_html = '<!-- wp:core/test-block {"stuff":"left \\u0026 right \\u002d\\u002d but \\u003cnot\\u003e"} -->\n<p class="wp-block-test-block">Ribs & Chicken</p>\n<!-- /wp:core/test-block -->';
		$parsed_block  = gutenberg_parse_blocks( $original_html );

		$serialized = gutenberg_serialize_blocks( $parsed_block );

		$this->assertEquals( 'left & right -- but <not>', $parsed_block[0]['attrs']['stuff'] );
		$this->assertEquals( $original_html, $serialized );
	}
}
