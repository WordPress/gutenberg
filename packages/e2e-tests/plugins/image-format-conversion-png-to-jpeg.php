<?php
/**
 * Plugin Name: Gutenberg Test Plugin: Image Format Conversion PNG to JPEG
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-image-format-conversion-png-to-jpeg
 */

add_filter(
	'image_editor_output_format',
	static function ( $formats, $filename, $mime_type ) {
		if ( 'image/png' === $mime_type ) {
			$formats['image/png'] = 'image/jpeg';
		}
		return $formats;
	},
	10,
	3
);
