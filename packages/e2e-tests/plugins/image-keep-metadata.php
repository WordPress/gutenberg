<?php
/**
 * Plugin Name: Gutenberg Test Plugin: Image Keep Metadata
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-image-keep-metadata
 */

add_filter( 'image_strip_meta', '__return_false' );
