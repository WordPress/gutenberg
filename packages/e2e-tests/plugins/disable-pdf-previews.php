<?php
/**
 * Plugin Name: Gutenberg Test Plugin: Disable PDF Previews
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * Simulates a server that cannot generate preview images for uploaded PDFs.
 *
 * @package gutenberg-test-disable-pdf-previews
 */

add_filter( 'fallback_intermediate_image_sizes', '__return_empty_array' );
