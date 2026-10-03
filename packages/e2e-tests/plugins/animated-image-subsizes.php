<?php
/**
 * Plugin Name: Gutenberg Test Animated Image Subsizes
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-animated-image-subsizes
 */

add_filter( 'wp_generate_animated_image_subsizes', '__return_true' );
