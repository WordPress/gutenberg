<?php
/**
 * Plugin Name: Gutenberg Test Plugin: Disable Cross-Origin Isolation
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-disable-cross-origin-isolation
 */

add_filter( 'gutenberg_use_document_isolation_policy', '__return_false' );
