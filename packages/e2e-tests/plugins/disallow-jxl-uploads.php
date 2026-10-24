<?php
/**
 * Plugin Name: Gutenberg Test Plugin: Disallow JXL Uploads
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-disallow-jxl-uploads
 */

// Runs at the default priority, like core's check_upload_mimes() applying a
// network's upload file types.
add_filter(
	'upload_mimes',
	static function ( $mimes ) {
		unset( $mimes['jxl'] );
		return $mimes;
	}
);
