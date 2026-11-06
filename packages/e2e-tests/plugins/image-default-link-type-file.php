<?php
/**
 * Plugin Name: Gutenberg Test Plugin, Image Default Link Type File
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-image-default-link-type-file
 */

add_filter(
	'pre_option_image_default_link_type',
	static function () {
		return 'file';
	}
);
