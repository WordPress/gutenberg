<?php
/**
 * Plugin Name: Gutenberg Test Plugin, Disable Post Revisions
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-disable-post-revisions
 */

add_filter( 'wp_revisions_to_keep', '__return_zero' );
