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
				'https://unpkg.com/react@16.4.1/umd/react.development.js',
				'react-handle',
				'react-handle.HASH.js',
			),
			array(
				'https://unpkg.com/react-dom@16.4.1/umd/react-dom.development.js',
				'react-dom-handle',
				'react-dom-handle.HASH.js',
			),
			array(
				'https://fiddle.azurewebsites.net/tinymce/nightly/tinymce.js',
				'tinymce-handle',
				'tinymce-handle.HASH.js',
			),
			array(
				'https://fiddle.azurewebsites.net/tinymce/nightly/plugins/lists/plugin.js',
				'tinymce-plugin-handle',
				'tinymce-plugin-lists.HASH.js',
			),
			// Production mode scripts.
			array(
				'https://unpkg.com/react@16.4.1/umd/react.production.min.js',
				'react-handle',
				'react-handle.min.HASH.js',
			),
			array(
				'https://unpkg.com/react-dom@16.4.1/umd/react-dom.production.min.js',
				'react-dom-handle',
				'react-dom-handle.min.HASH.js',
			),
			array(
				'https://fiddle.azurewebsites.net/tinymce/nightly/tinymce.min.js',
				'tinymce-handle',
				'tinymce-handle.min.HASH.js',
			),
			array(
				'https://fiddle.azurewebsites.net/tinymce/nightly/plugins/lists/plugin.min.js',
				'tinymce-plugin-handle',
				'tinymce-plugin-lists.min.HASH.js',
			),
			// Other cases.
			array(
				'http://localhost/something.js?querystring',
				'something-handle',
				'something-handle.HASH.js',
			),
			array(
				'http://localhost/something.min.js?querystring',
				'something-handle',
				'something-handle.min.HASH.js',
			),
			array(
				'http://localhost/idkwhatthisis',
				'idkwhatthisis-handle',
				'idkwhatthisis-handle.HASH.js',
			),
			array(
				'http://localhost/idkwhatthatis',
				// Test with unspecified `handle` param.
				null,
				'idkwhatthatis.HASH.js',
			),
		);
	}

	/**
	 * @dataProvider vendor_script_filename_cases
	 */
	function test_gutenberg_vendor_script_filename( $url, $handle, $expected_filename_pattern ) {
		$hash                    = substr( md5( $url ), 0, 8 );
		$actual_filename         = null === $handle ?
			gutenberg_vendor_script_filename( $url ) :
			gutenberg_vendor_script_filename( $url, $handle );
		$actual_filename_pattern = str_replace( $hash, 'HASH', $actual_filename );
		$this->assertEquals(
			$expected_filename_pattern,
			$actual_filename_pattern,
			'Cacheable filename for ' . $url
		);
	}
}
