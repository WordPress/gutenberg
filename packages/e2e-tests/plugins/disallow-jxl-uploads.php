<?php
/**
 * Plugin Name: Gutenberg Test Plugin: Disallow JXL Uploads
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-disallow-jxl-uploads
 */

// Runs after Gutenberg registers JXL, as a network's upload file types would.
add_filter(
	'upload_mimes',
	static function ( $mimes ) {
		unset( $mimes['jxl'] );
		return $mimes;
	},
	20
);
