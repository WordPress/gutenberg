<?php
/**
 * Plugin Name: Gutenberg Test Plugin: Enable Client-Side Media Processing
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-enable-client-side-media-processing
 */

add_filter( 'wp_client_side_media_processing_enabled', '__return_true' );
