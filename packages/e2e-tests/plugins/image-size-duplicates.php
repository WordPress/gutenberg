<?php
/**
 * Plugin Name: Gutenberg Test Plugin: Duplicate Image Sizes
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * Registers two image sizes with identical dimensions and crop settings so
 * client-side media processing groups them into a single sideload request.
 *
 * @package gutenberg-test-image-size-duplicates
 */

add_action(
	'after_setup_theme',
	static function () {
		add_image_size( 'duplicate-size-one', 400, 400, false );
		add_image_size( 'duplicate-size-two', 400, 400, false );
	}
);
