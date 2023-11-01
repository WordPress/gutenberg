<?php
/**
 * Plugin Name: Gutenberg Test Plugin, Disable Remote Patterns
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-disable-remote-patterns
 */

add_filter( 'should_load_remote_block_patterns', '__return_false' );
