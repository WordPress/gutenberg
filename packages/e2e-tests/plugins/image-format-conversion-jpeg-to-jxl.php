<?php
/**
 * Plugin Name: Gutenberg Test Plugin: Image Format Conversion JPEG to JXL
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-image-format-conversion-jpeg-to-jxl
 */

add_filter(
	'image_editor_output_format',
	static function ( $formats, $filename, $mime_type ) {
		if ( 'image/jpeg' === $mime_type ) {
			$formats['image/jpeg'] = 'image/jxl';
		}
		return $formats;
	},
	10,
	3
);
