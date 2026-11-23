<?php
/**
 * Plugin Name: Gutenberg Test Plugin: Image Format Conversion JXL to JPEG
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-image-format-conversion-jxl-to-jpeg
 */

add_filter(
	'image_editor_output_format',
	static function ( $formats, $filename, $mime_type ) {
		if ( 'image/jxl' === $mime_type ) {
			$formats['image/jxl'] = 'image/jpeg';
		}
		return $formats;
	},
	10,
	3
);
