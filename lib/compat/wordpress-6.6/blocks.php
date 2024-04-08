<?php
/**
 * Temporary compatibility shims for block APIs present in Gutenberg.
 *
 * @package gutenberg
 */

/**
 * Adds support for excerpt to the wp_block post type.
 */

add_post_type_support( 'wp_block', 'excerpt' );
