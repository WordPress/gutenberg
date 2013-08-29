<?php

/**
 * @group formatting
 */
class Tests_Formatting_SanitizeMimeType extends WP_UnitTestCase {
	// 17855
	function test_sanitize_valid_mime_type() {
		$inputs = array(
			'application/atom+xml',
			'application/EDI-X12',
			'application/EDIFACT',
			'application/json',
			'application/javascript',
			'application/octet-stream',
			'application/ogg',
			'application/pdf',
			'application/postscript',
			'application/soap+xml',
			'application/x-woff',
			'application/xhtml+xml',
			'application/xml-dtd',
			'application/xop+xml',
			'application/zip',
			'application/x-gzip',
			'audio/basic',
			'image/jpeg',
			'text/css',
			'text/html',
			'text/plain',
			'video/mpeg',
		);

		foreach ( $inputs as $input ) {
			$this->assertEquals($input, sanitize_mime_type($input));
		}
	}
}
