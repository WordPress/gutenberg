<?php

/**
 * Plugin Name: Gutenberg Test Plugin, Nonce
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-plugin-nonce
 */

add_filter( 'nonce_life', function () {
	return 5;
} );
