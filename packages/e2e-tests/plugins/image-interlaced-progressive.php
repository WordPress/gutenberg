<?php
/**
 * Plugin Name: Gutenberg Test Plugin: Image Interlaced Progressive
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-image-interlaced-progressive
 */

add_filter( 'image_save_progressive', '__return_true' );
