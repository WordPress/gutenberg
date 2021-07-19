<?php
/**
 * Plugin Name: Gutenberg Test Plugin, Disable Post Lock
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-disable-post-lock
 */

/**
 * Filters whether to update metadata of a specific type, disabling meta
 * updates for post edit lock keys.
 *
 * @param null|bool $check      Whether to allow updating metadata for the
 *                              given type.
 * @param int       $object_id  Object ID.
 * @param string    $meta_key   Meta key.
 *
 * @return null|bool Whether to allow updating metadata for the given type.
 */
function gutenberg_test_disable_post_lock( $check, $object_id, $meta_key ) {
	if ( '_edit_lock' === $meta_key ) {
		return false;
	}

	return $check;
}
add_filter( 'update_post_metadata', 'gutenberg_test_disable_post_lock', 10, 3 );
