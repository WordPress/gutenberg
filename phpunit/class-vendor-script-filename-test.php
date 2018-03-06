<?php
/**
 * Test gutenberg_vendor_script_filename()
 *
 * @package Gutenberg
 */

class Vendor_Script_Filename_Test extends WP_UnitTestCase {
	function vendor_script_filename_cases() {
		return array(
			// Development mode scripts.
			array(
				'https://unpkg.com/react@next/umd/react.development.js',
				'react.HASH.js',
			),
			array(
				'https://unpkg.com/react-dom@next/umd/react-dom.development.js',
				'react-dom.HASH.js',
			),
			array(
				'https://unpkg.com/react-dom@next/umd/react-dom-server.development.js',
				'react-dom-server.HASH.js',
			),
			array(
				'https://fiddle.azurewebsites.net/tinymce/nightly/tinymce.js',
				'tinymce.HASH.js',
			),
			array(
				'https://fiddle.azurewebsites.net/tinymce/nightly/plugins/lists/plugin.js',
				'tinymce-plugin-lists.HASH.js',
			),
			// Production mode scripts.
			array(
				'https://unpkg.com/react@next/umd/react.production.min.js',
				'react.min.HASH.js',
			),
			array(
				'https://unpkg.com/react-dom@next/umd/react-dom.production.min.js',
				'react-dom.min.HASH.js',
			),
			array(
				'https://unpkg.com/react-dom@next/umd/react-dom-server.production.min.js',
				'react-dom-server.min.HASH.js',
			),
			array(
				'https://fiddle.azurewebsites.net/tinymce/nightly/tinymce.min.js',
				'tinymce.min.HASH.js',
			),
			array(
				'https://fiddle.azurewebsites.net/tinymce/nightly/plugins/lists/plugin.min.js',
				'tinymce-plugin-lists.min.HASH.js',
			),
			// Other cases.
			array(
				'http://localhost/something.js?querystring',
				'something.HASH.js',
			),
			array(
				'http://localhost/something.min.js?querystring',
				'something.min.HASH.js',
			),
			array(
				'http://localhost/idkwhatthisis',
				'idkwhatthisis.HASH.js',
			),
		);
	}

	/**
	 * @dataProvider vendor_script_filename_cases
	 */
	function test_gutenberg_vendor_script_filename( $url, $expected_filename_pattern ) {
		$hash                    = substr( md5( $url ), 0, 8 );
		$actual_filename         = gutenberg_vendor_script_filename( $url );
		$actual_filename_pattern = str_replace( $hash, 'HASH', $actual_filename );
		$this->assertEquals(
			$expected_filename_pattern,
			$actual_filename_pattern,
			'Cacheable filename for ' . $url
		);
	}
}
